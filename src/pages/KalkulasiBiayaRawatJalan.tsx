import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KalkulasiBiayaRawatJalan: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya Rawat Jalan</h1>
        <p className="text-muted-foreground">
          Hitung biaya perawatan pasien rawat jalan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalkulasi Biaya Rawat Jalan</CardTitle>
          <CardDescription>
            Halaman ini akan menampilkan form untuk menghitung biaya rawat jalan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur ini sedang dalam pengembangan. Silakan kembali lagi nanti.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KalkulasiBiayaRawatJalan;



