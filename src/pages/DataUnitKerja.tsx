"use client";

import React from "react";
import UnitKerjaFormTable from "@/components/UnitKerjaFormTable"; // Import the new component

const DataUnitKerja = () => {
  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4">
      <UnitKerjaFormTable />
    </div>
  );
};

export default DataUnitKerja;