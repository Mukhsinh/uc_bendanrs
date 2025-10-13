-- Repair biaya preference RPCs and remove dependency on any trigger referencing NEW.tahun
-- Run this in Supabase SQL editor. Safe to re-run (uses IF EXISTS / OR REPLACE).

-- 0) Ensure helper extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ensure biaya_preference table exists and is sane
CREATE TABLE IF NOT EXISTS public.biaya_preference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  biaya_type TEXT NOT NULL CHECK (biaya_type IN ('total_biaya','total_biaya_tanpa_jp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- unique per user
CREATE UNIQUE INDEX IF NOT EXISTS ux_biaya_preference_user ON public.biaya_preference(user_id);

-- generic updated_at trigger function (does not touch any tahun column)
CREATE OR REPLACE FUNCTION public._tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- attach trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'biaya_preference' AND t.tgname = 'tg_biaya_preference_updated_at'
  ) THEN
    CREATE TRIGGER tg_biaya_preference_updated_at
      BEFORE INSERT OR UPDATE ON public.biaya_preference
      FOR EACH ROW EXECUTE FUNCTION public._tg_set_updated_at();
  END IF;
END $$;

-- 2) Safe helper to compute biaya_tahunan by preference using existing view if present
--    Falls back to computing directly from data_biaya
CREATE OR REPLACE FUNCTION public._select_biaya_tahunan_by_pref(
  p_user_id UUID,
  p_tahun INT,
  p_biaya_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  tahun INT,
  unit_kerja_id UUID,
  kode_unit_kerja TEXT,
  nama_unit_kerja TEXT,
  biaya_tahunan NUMERIC
) AS $$
BEGIN
  -- If explicit override provided, compute directly from data_biaya using override
  IF p_biaya_type IN ('total_biaya','total_biaya_tanpa_jp') THEN
    RETURN QUERY
    SELECT db.user_id,
           db.tahun,
           db.unit_kerja_id,
           db.kode_unit_kerja,
           db.nama_unit_kerja,
           CASE WHEN p_biaya_type = 'total_biaya'
                THEN COALESCE(db.total_biaya,0)
                ELSE COALESCE(db.total_biaya_tanpa_jp,0)
           END AS biaya_tahunan
    FROM public.data_biaya db
    WHERE (p_user_id IS NULL OR db.user_id = p_user_id)
      AND (p_tahun IS NULL OR db.tahun = p_tahun);
  ELSE
    -- No explicit override: use view if it exists, otherwise compute from preference
    IF EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema='public' AND table_name='v_biaya_tahunan_preferensi'
    ) THEN
      RETURN QUERY
      SELECT v.user_id, v.tahun, v.unit_kerja_id, v.kode_unit_kerja, v.nama_unit_kerja, v.biaya_tahunan
      FROM public.v_biaya_tahunan_preferensi v
      WHERE (p_user_id IS NULL OR v.user_id = p_user_id)
        AND (p_tahun IS NULL OR v.tahun = p_tahun);
    ELSE
      -- Compute from data_biaya + latest preference
      RETURN QUERY
      WITH pref AS (
        SELECT bp.user_id, bp.biaya_type,
               ROW_NUMBER() OVER (PARTITION BY bp.user_id ORDER BY bp.updated_at DESC NULLS LAST, bp.created_at DESC NULLS LAST) rn
        FROM public.biaya_preference bp
      )
      SELECT db.user_id,
             db.tahun,
             db.unit_kerja_id,
             db.kode_unit_kerja,
             db.nama_unit_kerja,
             CASE WHEN COALESCE(p.biaya_type,'total_biaya') = 'total_biaya'
                  THEN COALESCE(db.total_biaya,0)
                  ELSE COALESCE(db.total_biaya_tanpa_jp,0)
             END AS biaya_tahunan
      FROM public.data_biaya db
      LEFT JOIN pref p ON p.user_id = db.user_id AND p.rn = 1
      WHERE (p_user_id IS NULL OR db.user_id = p_user_id)
        AND (p_tahun IS NULL OR db.tahun = p_tahun);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3) Re-create RPC: update_distribusi_biaya_pertama_biaya_tahunan
--    Updates target table if it exists; otherwise returns computed rows without failing
CREATE OR REPLACE FUNCTION public.update_distribusi_biaya_pertama_biaya_tahunan(
  biaya_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_tahun INT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  updated_rows BIGINT := 0;
  msg TEXT := 'OK';
BEGIN
  -- validate biaya_type
  IF biaya_type NOT IN ('total_biaya','total_biaya_tanpa_jp') THEN
    RETURN json_build_object('success', false, 'message', 'biaya_type harus total_biaya atau total_biaya_tanpa_jp');
  END IF;

  -- Try to update distribusi_biaya_pertama if it exists and has expected columns
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='distribusi_biaya_pertama'
  ) THEN
    -- probe columns safely
    PERFORM 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='unit_kerja_id';
    IF FOUND THEN
      -- 1) Prefer strict join by unit_kerja_id if present
      WITH src AS (
        SELECT s.*
        FROM public._select_biaya_tahunan_by_pref(p_user_id, p_tahun, biaya_type) s
      ), upd AS (
        UPDATE public.distribusi_biaya_pertama d
        SET biaya_tahunan = s.biaya_tahunan,
            updated_at = now()
        FROM src s
        WHERE d.unit_kerja_id = s.unit_kerja_id
          AND (p_tahun IS NULL OR d.tahun = s.tahun)
        RETURNING 1
      )
      SELECT COUNT(*) INTO updated_rows FROM upd;
    ELSE
      -- 2) Fallback: join by separate kode and nama columns, if both exist
      PERFORM 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='kode_unit_kerja';
      IF FOUND THEN
        PERFORM 1 FROM information_schema.columns 
          WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='nama_unit_kerja';
      END IF;
      IF FOUND THEN
        WITH src AS (
          SELECT s.*
          FROM public._select_biaya_tahunan_by_pref(p_user_id, p_tahun, biaya_type) s
        ), upd AS (
          UPDATE public.distribusi_biaya_pertama d
          SET biaya_tahunan = s.biaya_tahunan,
              updated_at = now()
          FROM src s
          WHERE COALESCE(TRIM(d.kode_unit_kerja),'') = COALESCE(TRIM(s.kode_unit_kerja),'')
            AND COALESCE(TRIM(d.nama_unit_kerja),'') = COALESCE(TRIM(s.nama_unit_kerja),'')
            AND (p_tahun IS NULL OR d.tahun = s.tahun)
          RETURNING 1
        )
        SELECT COUNT(*) INTO updated_rows FROM upd;
      ELSE
        -- 3) Final fallback: composite string in unit_kerja_pusat_biaya if exists
        PERFORM 1 FROM information_schema.columns 
          WHERE table_schema='public' AND table_name='distribusi_biaya_pertama' AND column_name='unit_kerja_pusat_biaya';
        IF FOUND THEN
          WITH src AS (
            SELECT s.*,
                   COALESCE(TRIM(s.kode_unit_kerja),'') || ' - ' || COALESCE(TRIM(s.nama_unit_kerja),'') AS uk_join
            FROM public._select_biaya_tahunan_by_pref(p_user_id, p_tahun, biaya_type) s
          ), upd AS (
            UPDATE public.distribusi_biaya_pertama d
            SET biaya_tahunan = s.biaya_tahunan,
                updated_at = now()
            FROM src s
            WHERE COALESCE(TRIM(d.unit_kerja_pusat_biaya),'') = s.uk_join
              AND (p_tahun IS NULL OR d.tahun = s.tahun)
            RETURNING 1
          ), upd2 AS (
            -- 3b) Parse-based fallback: split 'KODE - NAMA' then TRIM
            UPDATE public.distribusi_biaya_pertama d
            SET biaya_tahunan = s.biaya_tahunan,
                updated_at = now()
            FROM (
              SELECT s2.* FROM public._select_biaya_tahunan_by_pref(p_user_id, p_tahun, biaya_type) s2
            ) s
            WHERE COALESCE(TRIM(SPLIT_PART(d.unit_kerja_pusat_biaya,' - ',1)),'') = COALESCE(TRIM(s.kode_unit_kerja),'')
              AND COALESCE(TRIM(SPLIT_PART(d.unit_kerja_pusat_biaya,' - ',2)),'') = COALESCE(TRIM(s.nama_unit_kerja),'')
              AND (p_tahun IS NULL OR d.tahun = s.tahun)
            RETURNING 1
          )
          SELECT (SELECT COUNT(*) FROM upd) + (SELECT COUNT(*) FROM upd2) INTO updated_rows;
        ELSE
          msg := 'distribusi_biaya_pertama tidak memiliki kolom penghubung yang dikenal; lewati update';
        END IF;
      END IF;
    END IF;
  ELSE
    msg := 'distribusi_biaya_pertama tidak ditemukan; hanya menghitung nilai';
  END IF;

  RETURN json_build_object('success', true, 'updated_rows', COALESCE(updated_rows,0), 'message', msg);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4) Re-create RPC: set_biaya_preference_and_update
CREATE OR REPLACE FUNCTION public.set_biaya_preference_and_update(
  p_user_id UUID,
  p_biaya_type TEXT
)
RETURNS JSON AS $$
DECLARE
  res JSON;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'p_user_id diperlukan');
  END IF;
  IF p_biaya_type NOT IN ('total_biaya','total_biaya_tanpa_jp') THEN
    RETURN json_build_object('success', false, 'message', 'p_biaya_type harus total_biaya atau total_biaya_tanpa_jp');
  END IF;

  INSERT INTO public.biaya_preference(user_id, biaya_type)
  VALUES (p_user_id, p_biaya_type)
  ON CONFLICT (user_id)
  DO UPDATE SET biaya_type = EXCLUDED.biaya_type, updated_at = now();

  res := public.update_distribusi_biaya_pertama_biaya_tahunan(p_biaya_type, p_user_id, NULL);
  RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 5) Helper RPC: get_biaya_preference
--    Returns the latest preference for a user, defaulting to 'total_biaya' when none
CREATE OR REPLACE FUNCTION public.get_biaya_preference(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_type TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'p_user_id diperlukan');
  END IF;

  SELECT bp.biaya_type
  INTO v_type
  FROM public.biaya_preference bp
  WHERE bp.user_id = p_user_id
  ORDER BY bp.updated_at DESC NULLS LAST, bp.created_at DESC NULLS LAST
  LIMIT 1;

  v_type := COALESCE(v_type, 'total_biaya');

  RETURN json_build_object(
    'success', true,
    'current_preference', v_type
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


