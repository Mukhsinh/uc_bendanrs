-- Add 'Jenis' column to Data_Kegiatan (note: table name appears quoted with capital letters in code for schema sync, but here we assume lowercase public.data_kegiatan)

ALTER TABLE IF EXISTS public.data_kegiatan
ADD COLUMN IF NOT EXISTS jenis text
  CHECK (jenis IN ('Rawat Jalan', 'Rawat Inap', 'Operatif'));

-- If you are using the quoted name "Data_Kegiatan", run this instead:
-- ALTER TABLE IF EXISTS public."Data_Kegiatan"
-- ADD COLUMN IF NOT EXISTS "Jenis" text
--   CHECK ("Jenis" IN ('Rawat Jalan', 'Rawat Inap', 'Operatif'));


