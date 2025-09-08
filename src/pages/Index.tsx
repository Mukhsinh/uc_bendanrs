"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import SupabaseTest from "@/components/SupabaseTest";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Data Unit Kerja page when the component mounts
    navigate("/data-master/unit-kerja");
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">APLIKASI UNIT COST RS</h1>
        <p className="text-xl text-muted-foreground">
          Mengarahkan ke Data Unit Kerja...
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <SupabaseTest />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;