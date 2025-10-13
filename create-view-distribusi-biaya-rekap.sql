-- View: v_biaya_tahunan_preferensi
-- Menyediakan nilai biaya_tahunan per unit kerja sesuai preferensi user (total_biaya vs total_biaya_tanpa_jp)
-- Filter di sisi aplikasi dengan WHERE user_id = :user_id AND tahun = :tahun

CREATE OR REPLACE VIEW v_biaya_tahunan_preferensi AS
WITH pref AS (
  SELECT bp.user_id,
         bp.biaya_type,
         ROW_NUMBER() OVER (PARTITION BY bp.user_id ORDER BY bp.updated_at DESC NULLS LAST, bp.created_at DESC NULLS LAST) AS rn
  FROM biaya_preference bp
)
SELECT
  db.user_id,
  db.tahun,
  db.unit_kerja_id,
  uk.kode       AS kode_unit_kerja,
  uk.nama       AS nama_unit_kerja,
  CASE WHEN COALESCE(p.biaya_type, 'total_biaya') = 'total_biaya'
       THEN COALESCE(db.total_biaya, 0)
       ELSE COALESCE(db.total_biaya_tanpa_jp, 0)
  END           AS biaya_tahunan
FROM data_biaya db
LEFT JOIN unit_kerja uk ON uk.id = db.unit_kerja_id
LEFT JOIN pref p
  ON p.user_id = db.user_id
 AND p.rn = 1;

-- Contoh penggunaan:
-- SELECT * FROM v_biaya_tahunan_preferensi WHERE user_id = '...' AND tahun = 2024;


