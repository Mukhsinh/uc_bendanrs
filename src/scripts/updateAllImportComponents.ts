// Script to update all import components with progress loading
// This script provides the exact changes needed for each component

import fs from 'fs';
import path from 'path';

const componentsToUpdate = [
  'DaftarTindakanFormTable.tsx',
  'MenuGiziFormTable.tsx', 
  'KlinikFormTable.tsx',
  'DataKamarFormTable.tsx',
  'DataDiklatFormTable.tsx',
  'TindakanCathlabFormTable.tsx',
  'TindakanBDRSFormTable.tsx',
  'PendapatanFormTable.tsx',
  'DataKegiatanFormTable.tsx',
  'UnitKerjaFormTable.tsx',
  'BiayaFormTable.tsx',
  'BarangFormTable.tsx'
];

const importStatements = `
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";`;

const stateAddition = `
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError } = useUploadProgress();`;

const modalAddition = `
      {/* Upload Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
      `;

export const getUpdatedImportFunction = (entityName: string, identifier: string) => {
  return `
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
            
            // Parse your data here - customize this part for each component
            for (const row of results.data) {
              // Add your specific parsing logic here
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
                  errors.push(\`\${row.${identifier}}: \${error.message}\`);
                } else {
                  successCount++;
                }
                
                // Update progress
                updateProgress(i + 1, successCount, errorCount, \`Mengimpor data \${i + 1} dari \${rows.length}...\`);
                
              } catch (err: any) {
                errorCount++;
                errors.push(\`\${row.${identifier}}: \${err.message}\`);
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
  };`;
};

// Manual update instructions for each component
export const updateInstructions = {
  'DaftarTindakanFormTable.tsx': {
    entity: 'daftar_tindakan',
    identifier: 'nama_tindakan',
    message: 'Sedang mengimpor data daftar tindakan...'
  },
  'MenuGiziFormTable.tsx': {
    entity: 'menu_gizi', 
    identifier: 'nama_menu',
    message: 'Sedang mengimpor data menu gizi...'
  },
  'KlinikFormTable.tsx': {
    entity: 'klinik',
    identifier: 'nama_klinik', 
    message: 'Sedang mengimpor data klinik...'
  },
  'DataKamarFormTable.tsx': {
    entity: 'data_kamar',
    identifier: 'nama_kamar',
    message: 'Sedang mengimpor data kamar...'
  },
  'DataDiklatFormTable.tsx': {
    entity: 'data_diklat',
    identifier: 'nama_diklat',
    message: 'Sedang mengimpor data diklat...'
  },
  'TindakanCathlabFormTable.tsx': {
    entity: 'tindakan_cathlab',
    identifier: 'nama_tindakan',
    message: 'Sedang mengimpor data tindakan cathlab...'
  },
  'TindakanBDRSFormTable.tsx': {
    entity: 'tindakan_bdrs',
    identifier: 'nama_tindakan', 
    message: 'Sedang mengimpor data tindakan BDRS...'
  },
  'PendapatanFormTable.tsx': {
    entity: 'pendapatan',
    identifier: 'nama_pendapatan',
    message: 'Sedang mengimpor data pendapatan...'
  },
  'DataKegiatanFormTable.tsx': {
    entity: 'data_kegiatan',
    identifier: 'nama_unit_kerja',
    message: 'Sedang mengimpor data kegiatan...'
  },
  'UnitKerjaFormTable.tsx': {
    entity: 'unit_kerja',
    identifier: 'nama',
    message: 'Sedang mengimpor data unit kerja...'
  },
  'BiayaFormTable.tsx': {
    entity: 'biaya',
    identifier: 'nama_biaya',
    message: 'Sedang mengimpor data biaya...'
  },
  'BarangFormTable.tsx': {
    entity: 'barang',
    identifier: 'nama_barang',
    message: 'Sedang mengimpor barang farmasi...'
  }
};

console.log('Update instructions for all import components:');
console.log('1. Add import statements after lucide-react import');
console.log('2. Add useUploadProgress hook after state declarations');  
console.log('3. Add ImportProgressModal to JSX');
console.log('4. Update handleImportData function with progress tracking');
console.log('5. Customize parsing logic for each component');
