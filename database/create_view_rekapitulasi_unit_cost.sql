-- View: view_rekapitulasi_unit_cost
-- Mengkonsolidasi 7 tabel kalkulasi tanpa memicu refresh manual dan tetap mengambil nilai asli.

CREATE VIEW public.view_rekapitulasi_unit_cost AS
WITH laboratorium AS (
  SELECT
    kl.id,
    kl.user_id,
    kl.tahun,
    COALESCE(uk.jenis, 0)::smallint AS kode_jenis,
    kl.kode_unit_kerja,
    COALESCE(uk.nama, kl.kode_unit_kerja) AS nama_unit_kerja,
    NULL::text AS kode_operator,
    NULL::text AS nama_operator,
    kl.kode AS kode_tindakan,
    kl.jenis_pemeriksaan AS nama_tindakan,
    COALESCE(kl.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
    COALESCE(kl.unit_cost_per_pemeriksaan, 0)::bigint AS unit_cost_per_tindakan,
    'kalkulasi_biaya_laboratorium'::text AS sumber_tabel,
    COALESCE(kl.jumlah, 0)::numeric AS jumlah,
    COALESCE(kl.waktu_pemeriksaan, 0)::numeric AS waktu_pemeriksaan,
    kl.created_at,
    kl.updated_at
  FROM public.kalkulasi_biaya_laboratorium kl
  LEFT JOIN public.unit_kerja uk ON uk.kode = kl.kode_unit_kerja
),
radiologi AS (
  SELECT
    kr.id,
    kr.user_id,
    kr.tahun,
    COALESCE(uk.jenis, 0)::smallint AS kode_jenis,
    kr.kode_unit_kerja,
    COALESCE(kr.nama_unit_kerja, uk.nama, kr.kode_unit_kerja) AS nama_unit_kerja,
    NULL::text AS kode_operator,
    NULL::text AS nama_operator,
    kr.kode AS kode_tindakan,
    kr.jenis_pemeriksaan AS nama_tindakan,
    COALESCE(kr.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
    COALESCE(kr.unit_cost_per_pemeriksaan, 0)::bigint AS unit_cost_per_tindakan,
    'kalkulasi_biaya_radiologi'::text AS sumber_tabel,
    COALESCE(kr.jumlah, 0)::numeric AS jumlah,
    COALESCE(kr.waktu_pemeriksaan, 0)::numeric AS waktu_pemeriksaan,
    kr.created_at,
    kr.updated_at
  FROM public.kalkulasi_biaya_radiologi kr
  LEFT JOIN public.unit_kerja uk ON uk.kode = kr.kode_unit_kerja
),
bdrs AS (
  SELECT
    kb.id,
    kb.user_id,
    kb.tahun,
    COALESCE(uk.jenis, 0)::smallint AS kode_jenis,
    kb.kode_unit_kerja,
    COALESCE(kb.nama_unit_kerja, uk.nama, kb.kode_unit_kerja) AS nama_unit_kerja,
    NULL::text AS kode_operator,
    NULL::text AS nama_operator,
    kb.kode AS kode_tindakan,
    kb.jenis_pemeriksaan AS nama_tindakan,
    COALESCE(kb.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
    COALESCE(kb.unit_cost_per_pemeriksaan, 0)::bigint AS unit_cost_per_tindakan,
    'kalkulasi_bdrs'::text AS sumber_tabel,
    COALESCE(kb.jumlah, 0)::numeric AS jumlah,
    COALESCE(kb.waktu_pemeriksaan, 0)::numeric AS waktu_pemeriksaan,
    kb.created_at,
    kb.updated_at
  FROM public.kalkulasi_bdrs kb
  LEFT JOIN public.unit_kerja uk ON uk.kode = kb.kode_unit_kerja
),
tindakan_inap AS (
  SELECT
    kti.id,
    kti.user_id,
    kti.tahun,
    kti.kode_jenis,
    kti.kode_unit_kerja,
    COALESCE(kti.nama_unit_kerja, kti.kode_unit_kerja) AS nama_unit_kerja,
    NULL::text AS kode_operator,
    NULL::text AS nama_operator,
    kti.kode_jenis_tindakan AS kode_tindakan,
    kti.jenis_tindakan AS nama_tindakan,
    COALESCE(kti.biaya_bahan_tindakan, 0)::bigint AS biaya_bahan,
    (
      COALESCE(kti.biaya_bahan_tindakan,0) +
      COALESCE(kti.biaya_bhp,0) +
      COALESCE(kti.biaya_gaji_tunjangan,0) +
      COALESCE(kti.biaya_makan_karyawan,0) +
      COALESCE(kti.biaya_rumah_tangga,0) +
      COALESCE(kti.biaya_cetak,0) +
      COALESCE(kti.biaya_atk,0) +
      COALESCE(kti.biaya_listrik,0) +
      COALESCE(kti.biaya_air,0) +
      COALESCE(kti.biaya_telp,0) +
      COALESCE(kti.biaya_pemeliharaan_bangunan,0) +
      COALESCE(kti.biaya_pemeliharaan_alat_medis,0) +
      COALESCE(kti.biaya_pemeliharaan_alat_non_medis,0) +
      COALESCE(kti.biaya_operasional_lainnya,0) +
      COALESCE(kti.biaya_penyusutan_gedung,0) +
      COALESCE(kti.biaya_penyusutan_jaringan,0) +
      COALESCE(kti.biaya_penyusutan_alat_medis,0) +
      COALESCE(kti.biaya_penyusutan_alat_non_medis,0) +
      COALESCE(kti.biaya_pendidikan_pelatihan,0) +
      COALESCE(kti.biaya_laundry,0) +
      COALESCE(kti.biaya_sterilisasi,0) +
      COALESCE(kti.biaya_tidak_langsung_terdistribusi,0)
    )::bigint AS unit_cost_per_tindakan,
    'kalkulasi_tindakan_inap'::text AS sumber_tabel,
    COALESCE(kti.jumlah, 0)::numeric AS jumlah,
    COALESCE(kti.waktu, 0)::numeric AS waktu_pemeriksaan,
    kti.created_at,
    kti.updated_at
  FROM public.kalkulasi_tindakan_inap kti
),
tindakan_rawat_jalan AS (
  SELECT
    ktrj.id,
    ktrj.user_id,
    ktrj.tahun,
    ktrj.kode_jenis,
    ktrj.kode_unit_kerja,
    COALESCE(ktrj.nama_unit_kerja, ktrj.kode_unit_kerja) AS nama_unit_kerja,
    NULL::text AS kode_operator,
    NULL::text AS nama_operator,
    ktrj.kode_jenis_tindakan AS kode_tindakan,
    ktrj.jenis_tindakan AS nama_tindakan,
    COALESCE(ktrj.biaya_bahan_tindakan, 0)::bigint AS biaya_bahan,
    (
      COALESCE(ktrj.biaya_bahan_tindakan,0) +
      COALESCE(ktrj.biaya_gaji_tunjangan,0) +
      COALESCE(ktrj.biaya_makan_karyawan,0) +
      COALESCE(ktrj.biaya_rumah_tangga,0) +
      COALESCE(ktrj.biaya_cetak,0) +
      COALESCE(ktrj.biaya_atk,0) +
      COALESCE(ktrj.biaya_listrik,0) +
      COALESCE(ktrj.biaya_air,0) +
      COALESCE(ktrj.biaya_telp,0) +
      COALESCE(ktrj.biaya_pemeliharaan_bangunan,0) +
      COALESCE(ktrj.biaya_pemeliharaan_alat_medis,0) +
      COALESCE(ktrj.biaya_pemeliharaan_alat_non_medis,0) +
      COALESCE(ktrj.biaya_operasional_lainnya,0) +
      COALESCE(ktrj.biaya_penyusutan_gedung,0) +
      COALESCE(ktrj.biaya_penyusutan_jaringan,0) +
      COALESCE(ktrj.biaya_penyusutan_alat_medis,0) +
      COALESCE(ktrj.biaya_penyusutan_alat_non_medis,0) +
      COALESCE(ktrj.biaya_pendidikan_pelatihan,0) +
      COALESCE(ktrj.biaya_laundry,0) +
      COALESCE(ktrj.biaya_sterilisasi,0) +
      COALESCE(ktrj.biaya_tidak_langsung_terdistribusi,0)
    )::bigint AS unit_cost_per_tindakan,
    'kalkulasi_tindakan_rawat_jalan'::text AS sumber_tabel,
    COALESCE(ktrj.jumlah, 0)::numeric AS jumlah,
    COALESCE(ktrj.waktu, 0)::numeric AS waktu_pemeriksaan,
    ktrj.created_at,
    ktrj.updated_at
  FROM public.kalkulasi_tindakan_rawat_jalan ktrj
),
operatif AS (
  SELECT
    ko.id,
    ko.user_id,
    ko.tahun,
    ko.kode_jenis,
    ko.kode_unit_kerja,
    COALESCE(ko.nama_unit_kerja, ko.kode_unit_kerja) AS nama_unit_kerja,
    COALESCE(ko.kode_operator_spesialistik, NULL)::text AS kode_operator,
    COALESCE(ko.nama_operator_spesialistik, NULL)::text AS nama_operator,
    ko.kode AS kode_tindakan,
    ko.jenis_pemeriksaan AS nama_tindakan,
    COALESCE(ko.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
    COALESCE(ko.unit_cost_per_tindakan, 0)::bigint AS unit_cost_per_tindakan,
    'kalkulasi_biaya_operatif'::text AS sumber_tabel,
    COALESCE(ko.jumlah, 0)::numeric AS jumlah,
    COALESCE(ko.waktu_pemeriksaan, 0)::numeric AS waktu_pemeriksaan,
    ko.created_at,
    ko.updated_at
  FROM public.kalkulasi_biaya_operatif ko
),
cathlab AS (
  SELECT
    kc.id,
    kc.user_id,
    kc.tahun,
    COALESCE(uk.jenis, 0)::smallint AS kode_jenis,
    kc.kode_unit_kerja,
    COALESCE(kc.nama_unit_kerja, uk.nama, kc.kode_unit_kerja) AS nama_unit_kerja,
    NULL::text AS kode_operator,
    NULL::text AS nama_operator,
    kc.kode AS kode_tindakan,
    kc.jenis_pemeriksaan AS nama_tindakan,
    COALESCE(kc.biaya_bahan_pemeriksaan_numeric, 0)::bigint AS biaya_bahan,
    COALESCE(kc.unit_cost_per_tindakan, 0)::bigint AS unit_cost_per_tindakan,
    'kalkulasi_biaya_cathlab'::text AS sumber_tabel,
    COALESCE(kc.jumlah, 0)::numeric AS jumlah,
    COALESCE(kc.waktu_pemeriksaan, 0)::numeric AS waktu_pemeriksaan,
    kc.created_at,
    kc.updated_at
  FROM public.kalkulasi_biaya_cathlab kc
  LEFT JOIN public.unit_kerja uk ON uk.kode = kc.kode_unit_kerja
)
SELECT
  v.id,
  v.user_id,
  v.tahun,
  v.kode_jenis,
  CASE
    WHEN v.kode_jenis = 1 THEN 'Rawat Jalan'
    WHEN v.kode_jenis = 2 THEN 'Rawat Inap'
    WHEN v.kode_jenis = 3 THEN 'Operatif'
    WHEN v.kode_jenis = 4 THEN 'Non Layanan'
    ELSE 'Tidak Diketahui'
  END AS nama_jenis,
  v.kode_unit_kerja,
  v.nama_unit_kerja,
  v.kode_operator,
  v.nama_operator,
  v.kode_tindakan,
  v.nama_tindakan,
  v.biaya_bahan,
  v.unit_cost_per_tindakan,
  v.sumber_tabel,
  CASE
    WHEN v.sumber_tabel = 'kalkulasi_biaya_laboratorium' THEN 'Laboratorium'
    WHEN v.sumber_tabel = 'kalkulasi_biaya_radiologi' THEN 'Radiologi'
    WHEN v.sumber_tabel = 'kalkulasi_bdrs' THEN 'BDRS'
    WHEN v.sumber_tabel = 'kalkulasi_tindakan_inap' THEN 'Tindakan Rawat Inap'
    WHEN v.sumber_tabel = 'kalkulasi_tindakan_rawat_jalan' THEN 'Tindakan Rawat Jalan'
    WHEN v.sumber_tabel = 'kalkulasi_biaya_operatif' THEN 'Tindakan Operatif'
    WHEN v.sumber_tabel = 'kalkulasi_biaya_cathlab' THEN 'Cathlab'
    ELSE v.sumber_tabel
  END AS nama_sumber_tabel,
  v.jumlah,
  v.waktu_pemeriksaan,
  v.created_at,
  v.updated_at
FROM (
  SELECT * FROM laboratorium
  UNION ALL SELECT * FROM radiologi
  UNION ALL SELECT * FROM bdrs
  UNION ALL SELECT * FROM tindakan_inap
  UNION ALL SELECT * FROM tindakan_rawat_jalan
  UNION ALL SELECT * FROM operatif
  UNION ALL SELECT * FROM cathlab
) AS v;

GRANT SELECT ON public.view_rekapitulasi_unit_cost TO anon, authenticated;

