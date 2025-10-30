-- Optimasi timeout untuk database operations
-- Menambahkan konfigurasi timeout yang lebih baik untuk operasi rekalkulasi

-- 1. Set timeout yang lebih panjang untuk session
ALTER SYSTEM SET statement_timeout = '600000'; -- 10 menit
ALTER SYSTEM SET idle_in_transaction_session_timeout = '1800000'; -- 30 menit

-- 2. Reload konfigurasi
SELECT pg_reload_conf();

-- 3. Verifikasi konfigurasi timeout
SELECT 
  name, 
  setting, 
  unit, 
  context
FROM pg_settings 
WHERE name IN ('statement_timeout', 'idle_in_transaction_session_timeout');

-- 4. Buat fungsi helper untuk set timeout per session
CREATE OR REPLACE FUNCTION set_session_timeout(timeout_seconds integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('statement_timeout', timeout_seconds::text, true);
  RAISE NOTICE 'Session timeout set to % seconds', timeout_seconds;
END;
$$;

-- 5. Buat fungsi untuk check timeout status
CREATE OR REPLACE FUNCTION check_timeout_status()
RETURNS TABLE(
  setting_name text,
  current_value text,
  unit text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name::text,
    s.setting::text,
    s.unit::text
  FROM pg_settings s
  WHERE s.name IN ('statement_timeout', 'idle_in_transaction_session_timeout');
END;
$$;

-- 6. Test fungsi timeout
SELECT * FROM check_timeout_status();

-- 7. Set timeout untuk operasi rekalkulasi (10 menit)
SELECT set_session_timeout(600);

-- 8. Verifikasi timeout telah diset
SELECT * FROM check_timeout_status();
