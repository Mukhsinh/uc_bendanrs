-- Check if Data_Kegiatan table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'Data_Kegiatan';

-- If table exists, show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Data_Kegiatan' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
