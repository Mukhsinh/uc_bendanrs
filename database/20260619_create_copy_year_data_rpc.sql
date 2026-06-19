-- Function to copy all transaction and calculation data from one year to another for a specific tenant
CREATE OR REPLACE FUNCTION copy_year_data(
  from_year INT,
  to_year INT,
  p_tenant_id UUID
) RETURNS void AS $$
DECLARE
  tables TEXT[] := ARRAY[
    'data_kegiatan',
    'data_biaya',
    'data_pendapatan',
    'kalkulasi_biaya_bdrs',
    'kalkulasi_biaya_laboratorium',
    'kalkulasi_biaya_radiologi',
    'kalkulasi_biaya_operatif',
    'kalkulasi_biaya_cathlab',
    'kalkulasi_biaya_ibs',
    'kalkulasi_biaya_gizi',
    'kalkulasi_biaya_kelas_akomodasi',
    'distribusi_biaya_pertama',
    'distribusi_biaya_kedua',
    'distribusi_biaya_rekap',
    'rekapitulasi_unit_cost',
    'produk_layanan',
    'skenario_tarif',
    'skenario_tarif_akomodasi',
    'rincian_budgeting_bhp',
    'rupiah_budgeting_bhp'
  ];
  t TEXT;
  cols TEXT;
BEGIN
  -- Iterate through each table and copy the data
  FOREACH t IN ARRAY tables LOOP
    -- Check if table exists (to avoid errors if some tables are missing)
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = t AND table_schema = 'public'
    ) THEN
      -- Delete existing data for the target year and tenant
      EXECUTE format('DELETE FROM %I WHERE tahun = %L AND tenant_id = %L', t, to_year, p_tenant_id);
      
      -- Get columns excluding 'id', 'created_at', 'updated_at' if they exist, and 'tahun'
      SELECT string_agg(quote_ident(column_name), ', ')
      INTO cols
      FROM information_schema.columns
      WHERE table_name = t 
        AND table_schema = 'public'
        AND column_name NOT IN ('id', 'created_at', 'updated_at', 'tahun');

      -- Construct and execute the copy command
      EXECUTE format(
        'INSERT INTO %I (%s, tahun) SELECT %s, %L FROM %I WHERE tahun = %L AND tenant_id = %L',
        t, cols, cols, to_year, t, from_year, p_tenant_id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
