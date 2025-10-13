-- Add computed column total_pendapatan to public.data_pendapatan
-- This column is the sum of pendapatan_umum and pendapatan_bpjs

alter table if exists public.data_pendapatan
  add column if not exists total_pendapatan numeric
  generated always as (
    coalesce(pendapatan_umum, 0) + coalesce(pendapatan_bpjs, 0)
  ) stored;

-- Optional index if you plan to filter/order by total_pendapatan frequently
-- create index if not exists idx_data_pendapatan_total_pendapatan
--   on public.data_pendapatan using btree (total_pendapatan);


