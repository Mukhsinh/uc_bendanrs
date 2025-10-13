import { toast } from "sonner";

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
}

// Success notifications
export const showSuccess = (message: string, options?: NotificationOptions) => {
  return toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    position: "top-center",
    className: "toast-success",
  });
};

// Error notifications
export const showError = (message: string, options?: NotificationOptions) => {
  return toast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    position: "top-center",
    className: "toast-error",
  });
};

// Loading notifications
export const showLoading = (message: string, options?: NotificationOptions) => {
  return toast.loading(message, {
    description: options?.description,
    position: "top-center",
    className: "toast-loading",
  });
};

// Info notifications
export const showInfo = (message: string, options?: NotificationOptions) => {
  return toast.info(message, {
    description: options?.description,
    duration: options?.duration || 3000,
    position: "top-center",
    className: "toast-info",
  });
};

// Warning notifications
export const showWarning = (message: string, options?: NotificationOptions) => {
  return toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    position: "top-center",
    className: "toast-warning",
  });
};

// Dismiss specific toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Update existing toast
export const updateToast = (toastId: string, message: string, type: "success" | "error" | "info" | "warning" | "loading" = "success") => {
  toast[type](message, { id: toastId });
};

// Common notification messages
export const NotificationMessages = {
  // Success messages
  DATA_SAVED: "Data berhasil disimpan",
  DATA_UPDATED: "Data berhasil diperbarui",
  DATA_DELETED: "Data berhasil dihapus",
  DATA_IMPORTED: "Data berhasil diimpor",
  DATA_EXPORTED: "Data berhasil diekspor",
  FILE_UPLOADED: "File berhasil diunggah",
  
  // Error messages
  SAVE_ERROR: "Terjadi kesalahan saat menyimpan data",
  UPDATE_ERROR: "Terjadi kesalahan saat memperbarui data",
  DELETE_ERROR: "Terjadi kesalahan saat menghapus data",
  IMPORT_ERROR: "Terjadi kesalahan saat mengimpor data",
  EXPORT_ERROR: "Terjadi kesalahan saat mengekspor data",
  UPLOAD_ERROR: "Terjadi kesalahan saat mengunggah file",
  LOAD_ERROR: "Terjadi kesalahan saat memuat data",
  VALIDATION_ERROR: "Data yang diisi tidak valid",
  
  // Loading messages
  SAVING: "Menyimpan data...",
  UPDATING: "Memperbarui data...",
  DELETING: "Menghapus data...",
  IMPORTING: "Mengimpor data...",
  EXPORTING: "Mengekspor data...",
  UPLOADING: "Mengunggah file...",
  LOADING: "Memuat data...",
  PROCESSING: "Memproses data...",
  
  // Info messages
  NO_DATA: "Tidak ada data untuk ditampilkan",
  SELECT_DATA: "Pilih data yang akan diproses",
  CONFIRM_DELETE: "Apakah Anda yakin ingin menghapus data ini?",
};
