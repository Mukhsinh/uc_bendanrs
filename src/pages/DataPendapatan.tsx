"use client";

import PendapatanFormTable from "@/components/PendapatanFormTable";
import PendapatanChart from "@/components/PendapatanChart";

const DataPendapatan = () => {
  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4 space-y-6">
      <PendapatanChart />
      <PendapatanFormTable />
    </div>
  );
};

export default DataPendapatan;