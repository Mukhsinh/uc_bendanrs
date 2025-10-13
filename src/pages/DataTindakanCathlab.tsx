import TindakanCathlabFormTable from "@/components/TindakanCathlabFormTable";

const DataTindakanCathlab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Tindakan Cathlab</h1>
        <p className="text-muted-foreground">
          Kelola data tindakan cathlab rumah sakit
        </p>
      </div>
      <TindakanCathlabFormTable />
    </div>
  );
};

export default DataTindakanCathlab;


