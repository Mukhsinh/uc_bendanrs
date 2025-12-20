-- ============================================================================
-- Migration: Add BDRS to Produk Layanan
-- Created: 2025-12-20
-- Description: Menambahkan kolom bdrs dan jp_bdrs ke tabel produk_layanan,
--              dan update total_jp untuk include jp_bdrs
-- ============================================================================

-- Tambahkan kolom bdrs (JSONB array untuk menyimpan data BDRS)
ALTER TABLE public.produk_layanan
ADD COLUMN IF NOT EXISTS bdrs JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.produk_layanan.bdrs IS 'Array data BDRS yang dipilih untuk produk layanan ini';

-- Tambahkan kolom jp_bdrs (NUMERIC untuk menyimpan Jasa Pelayanan BDRS)
ALTER TABLE public.produk_layanan
ADD COLUMN IF NOT EXISTS jp_bdrs NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.produk_layanan.jp_bdrs IS 'Total jasa pelayanan dari BDRS';

-- Update kolom total_jp (GENERATED) untuk include jp_bdrs
-- Drop dan recreate kolom total_jp dengan include jp_bdrs
DO $$
BEGIN
    -- Drop kolom total_jp yang lama jika ada
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'produk_layanan' 
        AND column_name = 'total_jp'
    ) THEN
        ALTER TABLE public.produk_layanan DROP COLUMN total_jp;
    END IF;
    
    -- Tambahkan kembali kolom total_jp dengan include jp_bdrs
    ALTER TABLE public.produk_layanan
    ADD COLUMN total_jp NUMERIC GENERATED ALWAYS AS (
        COALESCE(jp_tindakan, 0) + 
        COALESCE(jp_ibs, 0) + 
        COALESCE(jp_laboratorium, 0) + 
        COALESCE(jp_radiologi, 0) + 
        COALESCE(jp_laboratorium_eksternal, 0) + 
        COALESCE(jp_radiologi_eksternal, 0) + 
        COALESCE(jp_farmasi, 0) + 
        COALESCE(jp_kamar_akomodasi, 0) + 
        COALESCE(jp_visite, 0) + 
        COALESCE(jp_konsultasi, 0) + 
        COALESCE(jp_bdrs, 0)
    ) STORED;
END $$;

COMMENT ON COLUMN public.produk_layanan.total_jp IS 'Total jasa pelayanan dari semua layanan termasuk BDRS (auto-calculated)';

