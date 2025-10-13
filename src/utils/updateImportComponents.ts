// Utility function to update import components with progress loading
// This is a helper script to standardize import functionality across all components

export const getImportProgressTemplate = (componentName: string, entityName: string) => {
  return `
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";

// Add to component state:
const { uploadProgress, startUpload, updateProgress, completeUpload, showError } = useUploadProgress();

// Add to JSX:
<ImportProgressModal progress={uploadProgress} />

// Update handleImportData function:
const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Reset file input
  event.target.value = '';
  
  file.text().then((text) => {
    (Papa as any).parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        try {
          const rows: any[] = [];
          let missingCount = 0;
          
          // Parse your data here
          for (const row of results.data) {
            // Add your parsing logic
            // Count missing data
            if (!row.requiredField) {
              missingCount++;
              continue;
            }
            rows.push({ /* your data structure */ });
          }
          
          if (rows.length === 0) { 
            toast.warning("Tidak ada data valid untuk diimpor.");
            return; 
          }
          
          // Start upload progress
          startUpload(rows.length, 'Sedang mengimpor data ${entityName.toLowerCase()}...');
          
          // Process rows one by one
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              const { error } = await supabase
                .from("${entityName.toLowerCase()}")
                .insert([row]);
              
              if (error) {
                errorCount++;
                errors.push(\`\${row.identifier}: \${error.message}\`);
              } else {
                successCount++;
              }
              
              // Update progress
              updateProgress(i + 1, successCount, errorCount, \`Mengimpor data \${i + 1} dari \${rows.length}...\`);
              
            } catch (err: any) {
              errorCount++;
              errors.push(\`\${row.identifier}: \${err.message}\`);
            }
          }
          
          await fetchAll();
          
          // Show final status
          completeUpload(successCount, errorCount, missingCount);
          
        } catch (err: any) {
          console.error(err);
          showError('Gagal memproses file');
        }
      },
      error: (error: Papa.ParseError) => {
        showError('Gagal membaca file CSV');
      },
    });
  });
};
`;
};

export const componentsToUpdate = [
  { name: 'TindakanLaboratoriumFormTable', entity: 'tindakan_lab', identifier: 'nama' },
  { name: 'DaftarTindakanFormTable', entity: 'daftar_tindakan', identifier: 'nama_tindakan' },
  { name: 'MenuGiziFormTable', entity: 'menu_gizi', identifier: 'nama_menu' },
  { name: 'KlinikFormTable', entity: 'klinik', identifier: 'nama_klinik' },
  { name: 'DataKamarFormTable', entity: 'data_kamar', identifier: 'nama_kamar' },
  { name: 'DataDiklatFormTable', entity: 'data_diklat', identifier: 'nama_diklat' },
  { name: 'TindakanCathlabFormTable', entity: 'tindakan_cathlab', identifier: 'nama_tindakan' },
  { name: 'TindakanBDRSFormTable', entity: 'tindakan_bdrs', identifier: 'nama_tindakan' },
  { name: 'PendapatanFormTable', entity: 'pendapatan', identifier: 'nama_pendapatan' },
  { name: 'DataKegiatanFormTable', entity: 'data_kegiatan', identifier: 'nama_unit_kerja' },
  { name: 'UnitKerjaFormTable', entity: 'unit_kerja', identifier: 'nama' },
  { name: 'BiayaFormTable', entity: 'biaya', identifier: 'nama_biaya' },
  { name: 'BarangFormTable', entity: 'barang', identifier: 'nama_barang' },
];
