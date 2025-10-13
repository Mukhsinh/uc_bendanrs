import TindakanOperatifFormTable from "@/components/TindakanOperatifFormTable";

const DataTindakanOperatif = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Tindakan Operatif</h1>
        <p className="text-muted-foreground">Kelola data tindakan operatif rumah sakit</p>
      </div>
      <TindakanOperatifFormTable />
    </div>
  );
};

export default DataTindakanOperatif;


