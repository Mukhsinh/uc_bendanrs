import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KalkulasiBiayaDiklat: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya Diklat</h1>
        <p className="text-muted-foreground">
          Hitung biaya pendidikan dan pelatihan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalkulasi Biaya Diklat</CardTitle>
          <CardDescription>
            Halaman ini akan menampilkan form untuk menghitung biaya diklat
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

export default KalkulasiBiayaDiklat;



