import { useState, useCallback } from "react";
import { 
  showSuccess, 
  showError, 
  showLoading, 
  showInfo,
  NotificationMessages,
  dismissToast,
  type NotificationOptions 
} from "@/utils/notifications";

interface UseFormOperationsOptions {
  entityName: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useFormOperations = (options: UseFormOperationsOptions) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationType: "save" | "delete" | "import" | "export" | "load",
    customOptions?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showLoadingToast?: boolean;
    }
  ): Promise<T | null> => {
    const loadingMessage = customOptions?.loadingMessage || NotificationMessages[operationType.toUpperCase() as keyof typeof NotificationMessages];
    const successMessage = customOptions?.successMessage || `${options.entityName} berhasil ${operationType === "save" ? "disimpan" : operationType === "delete" ? "dihapus" : operationType === "import" ? "diimpor" : operationType === "export" ? "diekspor" : "dimuat"}`;
    const errorMessage = customOptions?.errorMessage || `Terjadi kesalahan saat ${operationType === "save" ? "menyimpan" : operationType === "delete" ? "menghapus" : operationType === "import" ? "mengimpor" : operationType === "export" ? "mengekspor" : "memuat"} ${options.entityName.toLowerCase()}`;

    let loadingToastId: string | undefined;

    try {
      // Set loading state
      switch (operationType) {
        case "save":
          setSaving(true);
          break;
        case "delete":
          setDeleting(true);
          break;
        case "import":
          setImporting(true);
          break;
        case "export":
          setExporting(true);
          break;
        default:
          setLoading(true);
      }

      // Show loading toast if requested
      if (customOptions?.showLoadingToast !== false) {
        loadingToastId = showLoading(loadingMessage) as string;
      }

      // Execute operation
      const result = await operation();

      // Dismiss loading toast
      if (loadingToastId) {
        dismissToast(loadingToastId);
      }

      // Show success message
      showSuccess(successMessage);

      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess();
      }

      return result;
    } catch (error: any) {
      // Dismiss loading toast
      if (loadingToastId) {
        dismissToast(loadingToastId);
      }

      // Show error message
      const errorMsg = error?.message || errorMessage;
      showError(errorMsg);

      // Call error callback
      if (options?.onError) {
        options.onError(error);
      }

      console.error(`Error in ${operationType} operation:`, error);
      return null;
    } finally {
      // Reset loading state
      switch (operationType) {
        case "save":
          setSaving(false);
          break;
        case "delete":
          setDeleting(false);
          break;
        case "import":
          setImporting(false);
          break;
        case "export":
          setExporting(false);
          break;
        default:
          setLoading(false);
      }
    }
  }, [options.entityName, options.onSuccess, options.onError]);

  // Convenience methods
  const saveData = useCallback(<T>(operation: () => Promise<T>, customOptions?: any) => {
    return executeOperation(operation, "save", customOptions);
  }, [executeOperation]);

  const deleteData = useCallback(<T>(operation: () => Promise<T>, customOptions?: any) => {
    return executeOperation(operation, "delete", customOptions);
  }, [executeOperation]);

  const importData = useCallback(<T>(operation: () => Promise<T>, customOptions?: any) => {
    return executeOperation(operation, "import", customOptions);
  }, [executeOperation]);

  const exportData = useCallback(<T>(operation: () => Promise<T>, customOptions?: any) => {
    return executeOperation(operation, "export", customOptions);
  }, [executeOperation]);

  const loadData = useCallback(<T>(operation: () => Promise<T>, customOptions?: any) => {
    return executeOperation(operation, "load", customOptions);
  }, [executeOperation]);

  return {
    // Loading states
    loading,
    saving,
    deleting,
    importing,
    exporting,
    
    // Operation methods
    executeOperation,
    saveData,
    deleteData,
    importData,
    exportData,
    loadData,
  };
};

export default useFormOperations;
