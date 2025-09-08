"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Data Unit Kerja page when the component mounts
    navigate("/data-master/unit-kerja");
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Loading Unit Cost App...</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Redirecting to Data Unit Kerja.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;