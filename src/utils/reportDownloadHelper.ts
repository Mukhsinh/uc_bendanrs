/**
 * Helper untuk menangani result dari downloadReport
 * Mencegah unhandled promise rejection saat user membatalkan unduhan
 */

/**
 * Wrapper untuk downloadReport yang menangani result dengan benar
 * @param downloadFn - Fungsi async yang memanggil downloadReport
 * @param onError - Optional callback untuk menangani error
 * @returns true jika berhasil, false jika dibatalkan
 */
export const safeDownloadReport = async (
  downloadFn: () => Promise<{ cancelled?: boolean }>,
  onError?: (error: Error) => void
): Promise<boolean> => {
  try {
    const result = await downloadFn();
    
    // Cek apakah dibatalkan
    if (result?.cancelled) {
      console.log('Unduhan dibatalkan oleh user');
      return false;
    }
    
    return true;
  } catch (error) {
    // Error lainnya - tangani atau lempar ulang
    if (onError && error instanceof Error) {
      onError(error);
    } else {
      // Jika tidak ada handler, log error tapi jangan throw
      console.error('Error saat mengunduh laporan:', error);
    }
    return false;
  }
};

/**
 * Check apakah result adalah pembatalan user
 */
export const isCancelled = (result: { cancelled?: boolean } | undefined): boolean => {
  return result?.cancelled === true;
};
