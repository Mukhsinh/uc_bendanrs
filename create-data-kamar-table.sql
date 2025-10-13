-- Create enum type for kelas kamar
CREATE TYPE IF NOT EXISTS kamar_kelas AS ENUM ('SVIP', 'VIP', 'I', 'II', 'III');

-- Create Data_Kamar table
CREATE TABLE IF NOT EXISTS "Data_Kamar" (
  id SERIAL PRIMARY KEY,
  "Kode_Kamar" VARCHAR(10) NOT NULL UNIQUE CHECK ("Kode_Kamar" LIKE 'RI__'),
  "Nama_Kamar" VARCHAR(255) NOT NULL,
  "Kelas" kamar_kelas NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_kamar_kelas ON "Data_Kamar"("Kelas");
CREATE INDEX IF NOT EXISTS idx_data_kamar_created_at ON "Data_Kamar"(created_at);


