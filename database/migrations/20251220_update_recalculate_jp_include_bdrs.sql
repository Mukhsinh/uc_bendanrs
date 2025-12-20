-- ============================================================================
-- Migration: Update Recalculate JP to Include BDRS
-- Created: 2025-12-20
-- Description: Update fungsi recalculate_jp_produk_layanan untuk include jp_bdrs
-- ============================================================================

-- Drop function jika sudah ada
DROP FUNCTION IF EXISTS public.recalculate_jp_produk_layanan(INTEGER, UUID);
DROP FUNCTION IF EXISTS public.recalculate_jp_produk_layanan_rpc(INTEGER, UUID);

-- ============================================================================
-- Fungsi untuk recalculate JP pada produk_layanan (updated dengan BDRS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_jp_produk_layanan(
    p_tahun INTEGER DEFAULT NULL,
    p_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMPTZ := clock_timestamp();
    v_affected_rows INTEGER := 0;
    v_total_processed INTEGER := 0;
    v_record RECORD;
    
    -- Variabel untuk perhitungan JP
    v_jp_tindakan DECIMAL(15,2);
    v_jp_ibs DECIMAL(15,2);
    v_jp_laboratorium DECIMAL(15,2);
    v_jp_radiologi DECIMAL(15,2);
    v_jp_farmasi DECIMAL(15,2);
    v_jp_kamar_akomodasi DECIMAL(15,2);
    v_jp_visite DECIMAL(15,2);
    v_jp_konsultasi DECIMAL(15,2);
    v_jp_bdrs DECIMAL(15,2);
    v_total_farmasi DECIMAL(15,2);
    v_item JSONB;
    v_kode_tindakan TEXT;
    v_qty DECIMAL(15,2);
    v_jp_per_item DECIMAL(15,2);
    v_tindakan_name TEXT;
BEGIN
    -- Loop melalui semua record produk_layanan yang sesuai filter
    FOR v_record IN 
        SELECT id, tahun, tindakan, ibs, laboratorium, radiologi, farmasi, 
               kamar_akomodasi, visite, konsultasi, bdrs, jp_farmasi_prosentase
        FROM produk_layanan
        WHERE (p_tahun IS NULL OR tahun = p_tahun)
          AND (p_id IS NULL OR id = p_id)
    LOOP
        v_total_processed := v_total_processed + 1;
        
        -- Reset variabel JP
        v_jp_tindakan := 0;
        v_jp_ibs := 0;
        v_jp_laboratorium := 0;
        v_jp_radiologi := 0;
        v_jp_farmasi := 0;
        v_jp_kamar_akomodasi := 0;
        v_jp_visite := 0;
        v_jp_konsultasi := 0;
        v_jp_bdrs := 0;
        v_total_farmasi := 0;

        -- Hitung JP Tindakan dari skenario tarif
        IF v_record.tindakan IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.tindakan)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                SELECT COALESCE(SUM(st.jasa_pelayanan * v_qty), 0)
                INTO v_jp_per_item
                FROM public.skenario_tarif st
                WHERE st.kode_tindakan = v_kode_tindakan
                AND st.tahun = v_record.tahun;
                
                v_jp_tindakan := v_jp_tindakan + v_jp_per_item;
            END LOOP;
        END IF;

        -- Hitung JP IBS dari skenario tarif
        IF v_record.ibs IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.ibs)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                SELECT COALESCE(SUM(st.jasa_pelayanan * v_qty), 0)
                INTO v_jp_per_item
                FROM public.skenario_tarif st
                WHERE st.kode_tindakan = v_kode_tindakan
                AND st.tahun = v_record.tahun;
                
                v_jp_ibs := v_jp_ibs + v_jp_per_item;
            END LOOP;
        END IF;

        -- Hitung JP Laboratorium dari skenario tarif
        IF v_record.laboratorium IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.laboratorium)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                -- Ambil jasa_pelayanan dari skenario_tarif dengan filter sumber_tabel
                SELECT COALESCE(
                    (SELECT st.jasa_pelayanan 
                     FROM public.skenario_tarif st
                     WHERE st.kode_tindakan = v_kode_tindakan
                     AND st.tahun = v_record.tahun
                     AND st.sumber_tabel = 'kalkulasi_biaya_laboratorium'
                     LIMIT 1) * v_qty,
                    0
                )
                INTO v_jp_per_item;
                
                v_jp_laboratorium := v_jp_laboratorium + v_jp_per_item;
            END LOOP;
        END IF;

        -- Hitung JP Radiologi dari skenario tarif
        IF v_record.radiologi IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.radiologi)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                -- Ambil jasa_pelayanan dari skenario_tarif dengan filter sumber_tabel
                SELECT COALESCE(
                    (SELECT st.jasa_pelayanan 
                     FROM public.skenario_tarif st
                     WHERE st.kode_tindakan = v_kode_tindakan
                     AND st.tahun = v_record.tahun
                     AND st.sumber_tabel = 'kalkulasi_biaya_radiologi'
                     LIMIT 1) * v_qty,
                    0
                )
                INTO v_jp_per_item;
                
                v_jp_radiologi := v_jp_radiologi + v_jp_per_item;
            END LOOP;
        END IF;

        -- Hitung JP BDRS dari skenario tarif
        IF v_record.bdrs IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.bdrs)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                -- Ambil jasa_pelayanan dari skenario_tarif dengan filter sumber_tabel = 'kalkulasi_bdrs'
                SELECT COALESCE(
                    (SELECT st.jasa_pelayanan 
                     FROM public.skenario_tarif st
                     WHERE st.kode_tindakan = v_kode_tindakan
                     AND st.tahun = v_record.tahun
                     AND st.sumber_tabel = 'kalkulasi_bdrs'
                     LIMIT 1) * v_qty,
                    0
                )
                INTO v_jp_per_item;
                
                v_jp_bdrs := v_jp_bdrs + v_jp_per_item;
            END LOOP;
        END IF;

        -- Hitung total farmasi untuk JP Farmasi
        IF v_record.farmasi IS NOT NULL THEN
            SELECT COALESCE(SUM((item->>'subtotal')::DECIMAL(15,2)), 0)
            INTO v_total_farmasi
            FROM jsonb_array_elements(v_record.farmasi) AS item;
            
            -- JP Farmasi = prosentase * total farmasi
            v_jp_farmasi := (COALESCE(v_record.jp_farmasi_prosentase, 0) / 100) * v_total_farmasi;
        END IF;

        -- Hitung JP Kamar Akomodasi dari skenario tarif
        IF v_record.kamar_akomodasi IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.kamar_akomodasi)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                SELECT COALESCE(SUM(st.jasa_pelayanan * v_qty), 0)
                INTO v_jp_per_item
                FROM public.skenario_tarif st
                WHERE st.kode_tindakan = v_kode_tindakan
                AND st.tahun = v_record.tahun;
                
                v_jp_kamar_akomodasi := v_jp_kamar_akomodasi + v_jp_per_item;
            END LOOP;
        END IF;

        -- Hitung JP Visite dari skenario_tarif_visit
        IF v_record.visite IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.visite)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_tindakan_name := NULLIF(TRIM(v_item->>'nama_tindakan'), '');
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                -- Prioritaskan nama_tindakan langsung dari array, fallback ke CASE mapping
                IF v_tindakan_name IS NULL OR v_tindakan_name = '' THEN
                    -- Fallback: Mapping kode_tindakan ke nama tindakan
                    CASE v_kode_tindakan
                        WHEN 'VISIT.UMUM' THEN
                            v_tindakan_name := 'Visit Dokter Umum';
                        WHEN 'VISIT.SPESIALIS' THEN
                            v_tindakan_name := 'Visit Dokter Spesialis';
                        WHEN 'VISIT.SUBSPESIALIS' THEN
                            v_tindakan_name := 'Visit Dokter Subspesialis';
                        ELSE
                            v_tindakan_name := NULL;
                    END CASE;
                END IF;
                
                IF v_tindakan_name IS NOT NULL THEN
                    SELECT COALESCE(
                        (COALESCE(stv.jasa_pelayanan_medis, 0) + COALESCE(stv.jasa_pelayanan_non_medis, 0)) * v_qty,
                        0
                    )
                    INTO v_jp_per_item
                    FROM public.skenario_tarif_visit stv
                    WHERE stv.tindakan = v_tindakan_name
                    AND stv.tahun = v_record.tahun
                    LIMIT 1;
                    
                    v_jp_visite := v_jp_visite + v_jp_per_item;
                END IF;
            END LOOP;
        END IF;

        -- Hitung JP Konsultasi dari skenario_tarif_visit
        IF v_record.konsultasi IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_record.konsultasi)
            LOOP
                v_kode_tindakan := v_item->>'kode_tindakan';
                v_tindakan_name := NULLIF(TRIM(v_item->>'nama_tindakan'), '');
                v_qty := COALESCE((v_item->>'qty')::DECIMAL(15,2), 1);
                
                -- Prioritaskan nama_tindakan langsung dari array, fallback ke CASE mapping
                IF v_tindakan_name IS NULL OR v_tindakan_name = '' THEN
                    -- Fallback: Mapping kode_tindakan ke nama tindakan
                    CASE v_kode_tindakan
                        WHEN 'KONSUL.SPESIALIS' THEN
                            v_tindakan_name := 'Konsultasi Dokter Spesialis';
                        WHEN 'KONSUL.SUBSPESIALIS' THEN
                            v_tindakan_name := 'Konsultasi Dokter Subspesialis';
                        ELSE
                            v_tindakan_name := NULL;
                    END CASE;
                END IF;
                
                IF v_tindakan_name IS NOT NULL THEN
                    SELECT COALESCE(
                        (COALESCE(stv.jasa_pelayanan_medis, 0) + COALESCE(stv.jasa_pelayanan_non_medis, 0)) * v_qty,
                        0
                    )
                    INTO v_jp_per_item
                    FROM public.skenario_tarif_visit stv
                    WHERE stv.tindakan = v_tindakan_name
                    AND stv.tahun = v_record.tahun
                    LIMIT 1;
                    
                    v_jp_konsultasi := v_jp_konsultasi + v_jp_per_item;
                END IF;
            END LOOP;
        END IF;

        -- Update record dengan JP yang sudah dihitung
        UPDATE produk_layanan
        SET 
            jp_tindakan = v_jp_tindakan,
            jp_ibs = v_jp_ibs,
            jp_laboratorium = v_jp_laboratorium,
            jp_radiologi = v_jp_radiologi,
            jp_farmasi = v_jp_farmasi,
            jp_kamar_akomodasi = v_jp_kamar_akomodasi,
            jp_visite = v_jp_visite,
            jp_konsultasi = v_jp_konsultasi,
            jp_bdrs = v_jp_bdrs
        WHERE id = v_record.id;
        
        v_affected_rows := v_affected_rows + 1;
    END LOOP;

    -- Return hasil
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Recalculate JP selesai',
        'total_processed', v_total_processed,
        'affected_rows', v_affected_rows,
        'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)),
        'filters', jsonb_build_object(
            'tahun', p_tahun,
            'id', p_id
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'total_processed', v_total_processed,
            'affected_rows', v_affected_rows,
            'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time))
        );
END;
$$;

-- ============================================================================
-- RPC Function untuk dipanggil dari frontend
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_jp_produk_layanan_rpc(
    p_tahun INTEGER DEFAULT NULL,
    p_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.recalculate_jp_produk_layanan(p_tahun, p_id);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.recalculate_jp_produk_layanan(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_jp_produk_layanan_rpc(INTEGER, UUID) TO authenticated;

