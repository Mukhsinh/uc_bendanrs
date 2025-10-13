"use client";

import DataKegiatanFormTable from "@/components/DataKegiatanFormTable";

const DataKegiatan = () => {
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Data Kegiatan</h1>
        <DataKegiatanFormTable />
      </div>
    </div>
  );
};

export default DataKegiatan;