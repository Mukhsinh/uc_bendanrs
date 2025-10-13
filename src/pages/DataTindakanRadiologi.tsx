import TindakanRadiologiFormTable from "@/components/TindakanRadiologiFormTable";

const DataTindakanRadiologi = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Tindakan Radiologi</h1>
        <p className="text-muted-foreground">
          Kelola data tindakan radiologi rumah sakit
        </p>
      </div>
      <TindakanRadiologiFormTable />
    </div>
  );
};

export default DataTindakanRadiologi;
