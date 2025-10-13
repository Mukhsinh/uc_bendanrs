import TindakanBDRSFormTable from "@/components/TindakanBDRSFormTable";

const DataTindakanBDRS = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Tindakan BDRS</h1>
        <p className="text-muted-foreground">Kelola data tindakan BDRS rumah sakit</p>
      </div>
      <TindakanBDRSFormTable />
    </div>
  );
};

export default DataTindakanBDRS;


