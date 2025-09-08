import { useEffect, useState } from "react";

const Health = () => {
  const [healthData, setHealthData] = useState({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });

  useEffect(() => {
    // Update timestamp when component mounts
    setHealthData(prev => ({
      ...prev,
      timestamp: new Date().toISOString()
    }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Application Health Check</h1>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <p className="text-lg mb-2">Status: <span className="text-green-500 font-semibold">{healthData.status}</span></p>
          <p className="text-sm text-muted-foreground">Last checked: {new Date(healthData.timestamp).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Version: {healthData.version}</p>
        </div>
      </div>
    </div>
  );
};

export default Health;