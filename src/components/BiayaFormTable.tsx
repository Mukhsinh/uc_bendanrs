"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFormOperations } from "@/hooks/use-form-operations";
import { showError } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { testSupabaseConnection, testAuthStatus } from "@/test-supabase";
import { logCreate, logUpdate, logDelete, logView, logExport } from "@/utils/auditTrail";

interface Biaya {
  id: string;
  user_id: string;
  tahun: number;
  unit_kerja_id: string | null;
  unit_kerja?: {
    id: string;
    kode: string;
    nama: string;
    kategori: string;
  };
  biaya_gaji_tunjangan: number | null;
  biaya_jasa_pelayanan: number | null;
  biaya_obat: number | null;
  biaya_bhp: number | null;
  biaya_makan_karyawan: number | null;
  biaya_makan_pasien: number | null;
  biaya_rumah_tangga: number | null;
  biaya_cetak: number | null;
  biaya_atk: number | null;
  biaya_listrik: number | null;
  biaya_air: number | null;
  biaya_telp: number | null;
  biaya_pemeliharaan_bangunan: number | null;
  biaya_pemeliharaan_alat_medis: number | null;
  biaya_pemeliharaan_alat_non_medis: number | null;
  biaya_operasional_lainnya: number | null;
  biaya_penyusutan_gedung: number | null;
  biaya_penyusutan_jaringan: number | null;
  biaya_penyusutan_alat_medis: number | null;
  biaya_penyusutan_alat_non_medis: number | null;
  biaya_pendidikan_pelatihan: number | null;
  // Computed fields (automatically calculated by database)
  biaya_bahan: number | null;
  biaya_pegawai: number | null;
  biaya_daya: number | null;
  biaya_pemeliharaan: number | null;
  biaya_penyusutan: number | null;
  total_biaya: number | null;
  total_biaya_tanpa_jp: number | null;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  tahun: z.coerce.number().min(1900, { message: "Tahun harus valid." }),
  unit_kerja_id: z.string().optional().nullable(),
  biaya_gaji_tunjangan: z.coerce.number().min(0).optional(),
  biaya_jasa_pelayanan: z.coerce.number().min(0).optional(),
  biaya_obat: z.coerce.number().min(0).optional(),
  biaya_bhp: z.coerce.number().min(0).optional(),
  biaya_makan_karyawan: z.coerce.number().min(0).optional(),
  biaya_makan_pasien: z.coerce.number().min(0).optional(),
  biaya_rumah_tangga: z.coerce.number().min(0).optional(),
  biaya_cetak: z.coerce.number().min(0).optional(),
  biaya_atk: z.coerce.number().min(0).optional(),
  biaya_listrik: z.coerce.number().min(0).optional(),
  biaya_air: z.coerce.number().min(0).optional(),
  biaya_telp: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_bangunan: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_alat_medis: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_alat_non_medis: z.coerce.number().min(0).optional(),
  biaya_operasional_lainnya: z.coerce.number().min(0).optional(),
  biaya_penyusutan_gedung: z.coerce.number().min(0).optional(),
  biaya_penyusutan_jaringan: z.coerce.number().min(0).optional(),
  biaya_penyusutan_alat_medis: z.coerce.number().min(0).optional(),
  biaya_penyusutan_alat_non_medis: z.coerce.number().min(0).optional(),
  biaya_pendidikan_pelatihan: z.coerce.number().min(0).optional(),
});

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

// Debug Panel Component for Admin Users
interface DebugPanelProps {
  userId: string;
  onRetryFetch: () => void;
  biayaListLength: number;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ userId, onRetryFetch, biayaListLength }) => {
  const [isDebugMode, setIsDebugMode] = useState(
    localStorage.getItem('biaya_debug_mode') === 'true'
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select(`
            role_akses_aplikasi!inner (
              role_name
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .in('role_akses_aplikasi.role_name', ['Admin', 'Super Admin'])
          .eq('role_akses_aplikasi.is_active', true);

        setIsAdmin(userRoles && userRoles.length > 0);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [userId]);

  const toggleDebugMode = () => {
    const newMode = !isDebugMode;
    setIsDebugMode(newMode);
    localStorage.setItem('biaya_debug_mode', newMode.toString());
    
    if (newMode) {
      toast.info('Debug mode activated. Check console for detailed logs.');
    } else {
      toast.info('Debug mode deactivated.');
    }
  };

  const handleForceRefresh = async () => {
    toast.info('Force refreshing data...');
    localStorage.removeItem('biaya_cache');
    window.location.reload();
  };

  const testRpcFunction = async () => {
    try {
      toast.info('Testing RPC function...');
      const { data, error } = await supabase.rpc('get_data_biaya_for_user', {
        input_user_id: userId
      });
      
      if (error) {
        toast.error(`RPC Test Failed: ${error.message}`);
        console.error('RPC Test Error:', error);
      } else {
        toast.success(`RPC Test Success: ${data?.length || 0} records`);
        console.log('RPC Test Result:', data);
      }
    } catch (error) {
      toast.error('RPC Test Failed: Network error');
      console.error('RPC Test Network Error:', error);
    }
  };

  const runComprehensiveTest = async () => {
    try {
      toast.info('Running comprehensive system test...');
      console.log('=== COMPREHENSIVE SYSTEM TEST START ===');
      
      const testResults = {
        sessionCheck: false,
        roleCheck: false,
        rpcTest: false,
        tableAccess: false,
        unitKerjaAccess: false
      };

      // Test 1: Session validation
      console.log('[TEST] 1. Testing session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      testResults.sessionCheck = !sessionError && !!session?.user;
      console.log('[TEST] Session result:', testResults.sessionCheck);

      // Test 2: Role check
      console.log('[TEST] 2. Testing user roles...');
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role_akses_aplikasi(role_name)')
        .eq('user_id', userId)
        .eq('is_active', true);
      testResults.roleCheck = !roleError && roles && roles.length > 0;
      console.log('[TEST] Role result:', testResults.roleCheck, roles);

      // Test 3: RPC function test
      console.log('[TEST] 3. Testing RPC function...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_data_biaya_for_user', {
        input_user_id: userId
      });
      testResults.rpcTest = !rpcError;
      console.log('[TEST] RPC result:', testResults.rpcTest, 'Records:', rpcData?.length || 0);

      // Test 4: Direct table access
      console.log('[TEST] 4. Testing direct table access...');
      const { data: tableData, error: tableError } = await supabase
        .from('data_biaya')
        .select('id')
        .limit(1);
      testResults.tableAccess = !tableError;
      console.log('[TEST] Table access result:', testResults.tableAccess);

      // Test 5: Unit kerja access
      console.log('[TEST] 5. Testing unit kerja access...');
      const { data: unitData, error: unitError } = await supabase
        .from('unit_kerja')
        .select('id')
        .limit(1);
      testResults.unitKerjaAccess = !unitError;
      console.log('[TEST] Unit kerja access result:', testResults.unitKerjaAccess);

      // Summary
      const passedTests = Object.values(testResults).filter(Boolean).length;
      const totalTests = Object.keys(testResults).length;
      
      console.log('=== COMPREHENSIVE TEST RESULTS ===');
      console.log('Test Results:', testResults);
      console.log(`Passed: ${passedTests}/${totalTests}`);
      console.log('=== COMPREHENSIVE SYSTEM TEST END ===');

      if (passedTests === totalTests) {
        toast.success(`All tests passed! (${passedTests}/${totalTests})`);
      } else {
        toast.warning(`Some tests failed: ${passedTests}/${totalTests} passed. Check console for details.`);
      }

    } catch (error) {
      console.error('[TEST] Comprehensive test error:', error);
      toast.error('Comprehensive test failed. Check console for details.');
    }
  };

  if (!isAdmin) {
    return null; // Only show for admin users
  }

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-yellow-800">🛠️ Admin Debug Tools</span>
          <span className="text-xs text-yellow-600">
            Data: {biayaListLength} records | Mode: {isDebugMode ? 'Debug ON' : 'Debug OFF'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-yellow-700 hover:text-yellow-900"
        >
          {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleDebugMode}
              className={isDebugMode ? 'bg-green-100 text-green-700' : ''}
            >
              {isDebugMode ? '🟢' : '🔴'} Debug Mode
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onRetryFetch}
              className="text-blue-700"
            >
              🔄 Retry Fetch
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={testRpcFunction}
              className="text-purple-700"
            >
              🧪 Test RPC
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceRefresh}
              className="text-red-700"
            >
              🔄 Force Refresh
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={runComprehensiveTest}
              className="text-indigo-700"
            >
              🧪 Full Test
            </Button>
          </div>
          
          <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
            <strong>Debug Info:</strong> User ID: {userId.slice(0, 8)}... | 
            Current Records: {biayaListLength} | 
            Debug Logs: {isDebugMode ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      )}
    </div>
  );
};

const BiayaFormTable: React.FC = () => {
  const [biayaList, setBiayaList] = useState<Biaya[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewingItem, setViewingItem] = useState<Biaya | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Filter and sort logic
  const filteredBiayaList = useMemo(() => {
    return biayaList
      .filter(biaya => {
        const yearMatch = biaya.tahun === selectedYear;
        const unitMatch = selectedUnitId === "all" || biaya.unit_kerja?.id === selectedUnitId;
        return yearMatch && unitMatch;
      })
      .sort((a, b) => {
        // Sort by unit kerja kode ascending
        const aKode = a.unit_kerja?.kode || '';
        const bKode = b.unit_kerja?.kode || '';
        return aKode.localeCompare(bKode);
      });
  }, [biayaList, selectedYear, selectedUnitId]);
  
  // Debug: Log biayaList changes
  useEffect(() => {
    console.log('biayaList state updated:', biayaList.length, 'records');
    if (biayaList.length > 0) {
      console.log('First record:', biayaList[0]);
    }
  }, [biayaList]);
  
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingBiaya, setEditingBiaya] = useState<Biaya | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [biayaPreference, setBiayaPreference] = useState<'total_biaya' | 'total_biaya_tanpa_jp'>('total_biaya');
  const [updatingPreference, setUpdatingPreference] = useState(false);
  
  // Use upload progress hook
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  
  // Use form operations hook
  const { loading, saving, saveData, deleteData } = useFormOperations({
    entityName: "Biaya",
    onSuccess: () => {
      setEditingBiaya(null);
      setIsDialogOpen(false);
      form.reset();
    }
  });
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun: new Date().getFullYear(),
      unit_kerja_id: null,
      biaya_gaji_tunjangan: 0,
      biaya_jasa_pelayanan: 0,
      biaya_obat: 0,
      biaya_bhp: 0,
      biaya_makan_karyawan: 0,
      biaya_makan_pasien: 0,
      biaya_rumah_tangga: 0,
      biaya_cetak: 0,
      biaya_atk: 0,
      biaya_listrik: 0,
      biaya_air: 0,
      biaya_telp: 0,
      biaya_pemeliharaan_bangunan: 0,
      biaya_pemeliharaan_alat_medis: 0,
      biaya_pemeliharaan_alat_non_medis: 0,
      biaya_operasional_lainnya: 0,
      biaya_penyusutan_gedung: 0,
      biaya_penyusutan_jaringan: 0,
      biaya_penyusutan_alat_medis: 0,
      biaya_penyusutan_alat_non_medis: 0,
      biaya_pendidikan_pelatihan: 0,
    },
  });

  // Enhanced initialization with better error handling and timing
  useEffect(() => {
    let initializationTimeout: NodeJS.Timeout;
    let mounted = true;

    const fetchUser = async () => {
      try {
        console.log('=== BIAYA FORM TABLE INITIALIZATION ===');
        
        // Add small delay to ensure auth is properly initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Run comprehensive tests (but don't fail if they error)
        try {
          await testSupabaseConnection();
          await testAuthStatus();
        } catch (testError) {
          console.warn('Test functions failed, but continuing initialization:', testError);
        }
        
        console.log('[INIT] Checking Supabase auth session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return; // Component unmounted, stop execution
        
        if (sessionError) {
          console.error('[INIT] Session error:', sessionError);
          toast.error('Error mendapatkan sesi: ' + sessionError.message);
          return;
        }
        
        console.log('[INIT] Current session:', session);
        console.log('[INIT] Session user:', session?.user);
        
        if (session?.user) {
          console.log('[INIT] User ID:', session.user.id);
          console.log('[INIT] User email:', session.user.email);
          
          if (!mounted) return;
          setUserId(session.user.id);
          
          // Execute data fetching operations in parallel where possible
          const fetchPromises = [
            fetchBiaya(session.user.id),
            fetchUnitKerja(),
            loadBiayaPreference(session.user.id)
          ];
          
          try {
            await Promise.allSettled(fetchPromises);
          } catch (error) {
            console.error('[INIT] Error in parallel data fetching:', error);
          }
        } else {
          console.log('[INIT] No active session found');
          console.log('[INIT] This means user needs to login first');
          // Don't show error immediately, let the loading state handle it
        }
        
        console.log('=== END BIAYA FORM TABLE INITIALIZATION ===');
      } catch (error) {
        console.error('[INIT] Error in initialization:', error);
        if (mounted) {
          toast.error('Terjadi kesalahan saat memuat halaman. Silakan refresh halaman.');
        }
      }
    };

    // Set timeout for initialization to prevent hanging
    initializationTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[INIT] Initialization timeout, stopping...');
        toast.warning('Initialization taking too long, please refresh the page.');
      }
    }, 15000); // 15 second timeout

    fetchUser().finally(() => {
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (editingBiaya) {
      form.reset({
        tahun: editingBiaya.tahun,
        unit_kerja_id: editingBiaya.unit_kerja_id || null,
        biaya_gaji_tunjangan: editingBiaya.biaya_gaji_tunjangan || 0,
        biaya_jasa_pelayanan: editingBiaya.biaya_jasa_pelayanan || 0,
        biaya_obat: editingBiaya.biaya_obat || 0,
        biaya_bhp: editingBiaya.biaya_bhp || 0,
        biaya_makan_karyawan: editingBiaya.biaya_makan_karyawan || 0,
        biaya_makan_pasien: editingBiaya.biaya_makan_pasien || 0,
        biaya_rumah_tangga: editingBiaya.biaya_rumah_tangga || 0,
        biaya_cetak: editingBiaya.biaya_cetak || 0,
        biaya_atk: editingBiaya.biaya_atk || 0,
        biaya_listrik: editingBiaya.biaya_listrik || 0,
        biaya_air: editingBiaya.biaya_air || 0,
        biaya_telp: editingBiaya.biaya_telp || 0,
        biaya_pemeliharaan_bangunan: editingBiaya.biaya_pemeliharaan_bangunan || 0,
        biaya_pemeliharaan_alat_medis: editingBiaya.biaya_pemeliharaan_alat_medis || 0,
        biaya_pemeliharaan_alat_non_medis: editingBiaya.biaya_pemeliharaan_alat_non_medis || 0,
        biaya_operasional_lainnya: editingBiaya.biaya_operasional_lainnya || 0,
        biaya_penyusutan_gedung: editingBiaya.biaya_penyusutan_gedung || 0,
        biaya_penyusutan_jaringan: editingBiaya.biaya_penyusutan_jaringan || 0,
        biaya_penyusutan_alat_medis: editingBiaya.biaya_penyusutan_alat_medis || 0,
        biaya_penyusutan_alat_non_medis: editingBiaya.biaya_penyusutan_alat_non_medis || 0,
        biaya_pendidikan_pelatihan: editingBiaya.biaya_pendidikan_pelatihan || 0,
      });
    } else {
      form.reset({
        tahun: new Date().getFullYear(),
        unit_kerja_id: null,
        biaya_gaji_tunjangan: 0,
        biaya_jasa_pelayanan: 0,
        biaya_obat: 0,
        biaya_bhp: 0,
        biaya_makan_karyawan: 0,
        biaya_makan_pasien: 0,
        biaya_rumah_tangga: 0,
        biaya_cetak: 0,
        biaya_atk: 0,
        biaya_listrik: 0,
        biaya_air: 0,
        biaya_telp: 0,
        biaya_pemeliharaan_bangunan: 0,
        biaya_pemeliharaan_alat_medis: 0,
        biaya_pemeliharaan_alat_non_medis: 0,
        biaya_operasional_lainnya: 0,
        biaya_penyusutan_gedung: 0,
        biaya_penyusutan_jaringan: 0,
        biaya_penyusutan_alat_medis: 0,
        biaya_penyusutan_alat_non_medis: 0,
        biaya_pendidikan_pelatihan: 0,
      });
    }
  }, [editingBiaya, form]);

  // Enhanced fetchBiaya with retry mechanism and fallback for admin users
  const fetchBiaya = async (currentUserId: string, retryCount = 0) => {
    const maxRetries = 3;
    const isDebugMode = localStorage.getItem('biaya_debug_mode') === 'true';
    
    console.log(`[FETCH-BIAYA] Starting fetchBiaya for user: ${currentUserId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    if (isDebugMode) {
      console.log('[DEBUG] Current timestamp:', new Date().toISOString());
      console.log('[DEBUG] User session state:', {
        userId: currentUserId,
        hasSession: !!currentUserId,
        retryAttempt: retryCount + 1
      });
    }
    
    try {
      // Primary method: Use RPC function to get biaya data (handles RLS and user roles)
      console.log('[FETCH-BIAYA] Attempting RPC call get_data_biaya_for_user...');
      const { data: biayaResponse, error: biayaError } = await supabase.rpc('get_data_biaya_for_user', {
        input_user_id: currentUserId
      });

      if (biayaError) {
        console.error('[FETCH-BIAYA] RPC Error:', biayaError);
        console.error('[FETCH-BIAYA] Error details:', {
          message: biayaError.message,
          details: biayaError.details,
          hint: biayaError.hint,
          code: biayaError.code,
          timestamp: new Date().toISOString()
        });

        // Check if this is a retryable error
        const isRetryableError = biayaError.code === 'PGRST301' || 
                                biayaError.code === 'PGRST202' || 
                                biayaError.message?.includes('timeout') ||
                                biayaError.message?.includes('network');

        if (isRetryableError && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`[FETCH-BIAYA] Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          toast.info(`Mencoba ulang memuat data... (${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchBiaya(currentUserId, retryCount + 1);
        }

        // Try fallback method for admin users
        console.log('[FETCH-BIAYA] Attempting fallback method for admin users...');
        const fallbackResult = await tryFallbackDataAccess(currentUserId);
        if (fallbackResult.success) {
          console.log('[FETCH-BIAYA] Fallback method successful');
          return processBiayaData(fallbackResult.data, currentUserId);
        }

        // Final error handling
        toast.error(`Gagal memuat data biaya: ${biayaError.message}. Silakan refresh halaman atau hubungi administrator.`);
        console.error('[FETCH-BIAYA] All methods failed, setting empty list');
        setBiayaList([]);
        return;
      }

      console.log('[FETCH-BIAYA] RPC call successful, processing data...');
      return processBiayaData(biayaResponse || [], currentUserId);

    } catch (error) {
      console.error('[FETCH-BIAYA] Unexpected error:', error);
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[FETCH-BIAYA] Retrying after unexpected error in ${delay}ms...`);
        toast.info(`Mencoba ulang... (${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchBiaya(currentUserId, retryCount + 1);
      }

      toast.error('Terjadi kesalahan sistem. Silakan refresh halaman atau hubungi administrator.');
      setBiayaList([]);
    }
  };

  // Fallback method for admin users using direct table access
  const tryFallbackDataAccess = async (currentUserId: string) => {
    try {
      console.log('[FALLBACK] Checking if user is admin for fallback access...');
      
      // Check if user is admin
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          is_active,
          role_akses_aplikasi!inner (
            role_name,
            is_active
          )
        `)
        .eq('user_id', currentUserId)
        .eq('is_active', true)
        .in('role_akses_aplikasi.role_name', ['Admin', 'Super Admin'])
        .eq('role_akses_aplikasi.is_active', true);

      if (roleError || !userRoles || userRoles.length === 0) {
        console.log('[FALLBACK] User is not admin, fallback not available');
        return { success: false, error: 'Not admin user' };
      }

      console.log('[FALLBACK] User is admin, attempting direct table access...');
      
      // For admin users, try to get all data directly
      const { data: allBiayaData, error: directError } = await supabase
        .from('data_biaya')
        .select('*')
        .order('tahun', { ascending: false });

      if (directError) {
        console.error('[FALLBACK] Direct table access failed:', directError);
        return { success: false, error: directError };
      }

      console.log('[FALLBACK] Direct table access successful, got', allBiayaData?.length || 0, 'records');
      return { success: true, data: allBiayaData || [] };

    } catch (error) {
      console.error('[FALLBACK] Fallback method error:', error);
      return { success: false, error };
    }
  };

  // Separate function to process biaya data
  const processBiayaData = async (biayaData: any[], currentUserId: string) => {
    console.log('[PROCESS-DATA] Processing', biayaData.length, 'biaya records for user:', currentUserId);

    if (biayaData.length === 0) {
      console.log('[PROCESS-DATA] No biaya data found');
      setBiayaList([]);
      toast.info('Tidak ada data biaya. Silakan tambahkan data baru.');
      return;
    }

    console.log('[PROCESS-DATA] Raw biaya data sample:', biayaData[0]);

    // Get unique unit_kerja_ids
    const unitKerjaIds = [...new Set(biayaData.map(item => item.unit_kerja_id).filter(Boolean))];
    console.log('[PROCESS-DATA] Unit kerja IDs found:', unitKerjaIds.length);
    
    // Fetch unit kerja data if there are any unit_kerja_ids
    let unitKerjaMap = new Map();
    if (unitKerjaIds.length > 0) {
      try {
        const { data: unitKerjaData, error: unitKerjaError } = await supabase
          .from('unit_kerja')
          .select('id, kode, nama, kategori')
          .in('id', unitKerjaIds);

        if (unitKerjaError) {
          console.error('[PROCESS-DATA] Error fetching unit kerja data:', unitKerjaError);
          toast.warning('Sebagian data unit kerja tidak dapat dimuat, tetapi data biaya akan tetap ditampilkan.');
        } else {
          unitKerjaMap = new Map(unitKerjaData?.map(uk => [uk.id, uk]) || []);
          console.log('[PROCESS-DATA] Unit kerja map created with', unitKerjaMap.size, 'entries');
        }
      } catch (error) {
        console.error('[PROCESS-DATA] Unexpected error fetching unit kerja:', error);
        toast.warning('Data unit kerja tidak dapat dimuat, tetapi data biaya akan tetap ditampilkan.');
      }
    }

    // Combine the data
    const combinedData = biayaData.map(biaya => ({
      ...biaya,
      unit_kerja: biaya.unit_kerja_id ? unitKerjaMap.get(biaya.unit_kerja_id) : null
    }));

    console.log('[PROCESS-DATA] Final combined data:', combinedData.length, 'records');
    console.log('[PROCESS-DATA] Successfully setting biaya list');
    
    setBiayaList(combinedData);
    toast.success(`Data biaya berhasil dimuat: ${combinedData.length} record`);
  };

  const fetchUnitKerja = async () => {
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('id, kode, nama, kategori')
      .order('nama', { ascending: true });

    if (error) {
      toast.error("Gagal memuat data unit kerja.");
      console.error(error);
    } else {
      setUnitKerjaList(data || []);
    }
  };

  const loadBiayaPreference = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_biaya_preference', {
        p_user_id: currentUserId
      });
      if (error) {
        console.error('Error loading biaya preference:', error);
        return;
      }
      if (data && data.success && data.current_preference) {
        setBiayaPreference(data.current_preference === 'total_biaya_tanpa_jp' ? 'total_biaya_tanpa_jp' : 'total_biaya');
      }
    } catch (err) {
      console.error('Unexpected error loading biaya preference:', err);
    }
  };

  const handleSetBiayaPreference = async (type: 'total_biaya' | 'total_biaya_tanpa_jp') => {
    if (!userId) {
      showError('User tidak ditemukan. Silakan login kembali.');
      return;
    }
    try {
      setUpdatingPreference(true);
      const { data, error } = await supabase.rpc('set_biaya_preference_and_update', {
        p_user_id: userId,
        p_biaya_type: type
      });
      if (error) throw error;
      if (data && data.success) {
        setBiayaPreference(type);
        // Update eksplisit untuk tahun aktif agar kolom biaya_tahunan di distribusi_biaya_pertama ikut berubah
        const activeYear = biayaList[0]?.tahun ?? new Date().getFullYear();
        await supabase.rpc('update_distribusi_biaya_pertama_biaya_tahunan', {
          biaya_type: type,
          p_user_id: userId,
          p_tahun: activeYear
        });
        toast.success(`Biaya tahunan berhasil diupdate menggunakan ${type === 'total_biaya' ? 'Total Biaya' : 'Total Biaya Tanpa JP'}`);
      } else {
        toast.error(data?.message || 'Gagal memperbarui preferensi biaya.');
      }
    } catch (err: any) {
      console.error('Error updating biaya preference:', err);
      toast.error('Gagal memperbarui preferensi biaya: ' + (err?.message || 'Unknown error'));
    } finally {
      setUpdatingPreference(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleView = (biaya: Biaya) => {
    setViewingItem(biaya);
    setIsViewDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      showError("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    await saveData(async () => {
      if (editingBiaya) {
        const { error } = await supabase
          .from('data_biaya')
          .update({ 
            ...values, 
            user_id: userId,
            unit_kerja_id: values.unit_kerja_id || null
          })
          .eq('id', editingBiaya.id);

        if (error) throw error;

        // Log audit trail untuk operasi update
        await logUpdate("data_biaya", editingBiaya.id, editingBiaya, {
          tahun: values.tahun,
          unit_kerja_id: values.unit_kerja_id,
          biaya_gaji_tunjangan: values.biaya_gaji_tunjangan,
          biaya_jasa_pelayanan: values.biaya_jasa_pelayanan,
          biaya_obat: values.biaya_obat,
          biaya_bhp: values.biaya_bhp,
          biaya_makan_karyawan: values.biaya_makan_karyawan,
          biaya_makan_pasien: values.biaya_makan_pasien,
          biaya_rumah_tangga: values.biaya_rumah_tangga,
          biaya_cetak: values.biaya_cetak,
          biaya_atk: values.biaya_atk,
          biaya_listrik: values.biaya_listrik,
          biaya_air: values.biaya_air,
          biaya_telp: values.biaya_telp,
          biaya_pemeliharaan_bangunan: values.biaya_pemeliharaan_bangunan,
          biaya_pemeliharaan_alat_medis: values.biaya_pemeliharaan_alat_medis,
          biaya_pemeliharaan_alat_non_medis: values.biaya_pemeliharaan_alat_non_medis,
          biaya_operasional_lainnya: values.biaya_operasional_lainnya,
          biaya_penyusutan_gedung: values.biaya_penyusutan_gedung,
          biaya_penyusutan_jaringan: values.biaya_penyusutan_jaringan,
          biaya_penyusutan_alat_medis: values.biaya_penyusutan_alat_medis,
          biaya_penyusutan_alat_non_medis: values.biaya_penyusutan_alat_non_medis,
          biaya_pendidikan_pelatihan: values.biaya_pendidikan_pelatihan
        });
      } else {
        // Check if tahun already exists for this unit kerja
        const { data: existingData, error: checkError } = await supabase
          .from('data_biaya')
          .select('id')
          .eq('tahun', values.tahun)
          .eq('unit_kerja_id', values.unit_kerja_id || null)
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          throw new Error("Data biaya untuk tahun dan unit kerja ini sudah ada.");
        }

        const { data: insertedData, error } = await supabase
          .from('data_biaya')
          .insert([{ 
            ...values, 
            user_id: userId,
            unit_kerja_id: values.unit_kerja_id || null
          }])
          .select();

        if (error) throw error;

        // Log audit trail untuk operasi create
        if (insertedData && insertedData.length > 0) {
          await logCreate("data_biaya", insertedData[0].id, {
            tahun: values.tahun,
            unit_kerja_id: values.unit_kerja_id,
            biaya_gaji_tunjangan: values.biaya_gaji_tunjangan,
            biaya_jasa_pelayanan: values.biaya_jasa_pelayanan,
            biaya_obat: values.biaya_obat,
            biaya_bhp: values.biaya_bhp,
            biaya_makan_karyawan: values.biaya_makan_karyawan,
            biaya_makan_pasien: values.biaya_makan_pasien,
            biaya_rumah_tangga: values.biaya_rumah_tangga,
            biaya_cetak: values.biaya_cetak,
            biaya_atk: values.biaya_atk,
            biaya_listrik: values.biaya_listrik,
            biaya_air: values.biaya_air,
            biaya_telp: values.biaya_telp,
            biaya_pemeliharaan_bangunan: values.biaya_pemeliharaan_bangunan,
            biaya_pemeliharaan_alat_medis: values.biaya_pemeliharaan_alat_medis,
            biaya_pemeliharaan_alat_non_medis: values.biaya_pemeliharaan_alat_non_medis,
            biaya_operasional_lainnya: values.biaya_operasional_lainnya,
            biaya_penyusutan_gedung: values.biaya_penyusutan_gedung,
            biaya_penyusutan_jaringan: values.biaya_penyusutan_jaringan,
            biaya_penyusutan_alat_medis: values.biaya_penyusutan_alat_medis,
            biaya_penyusutan_alat_non_medis: values.biaya_penyusutan_alat_non_medis,
            biaya_pendidikan_pelatihan: values.biaya_pendidikan_pelatihan
          });
        }
      }
      
      await fetchBiaya(userId);
    }, {
      loadingMessage: editingBiaya ? "Memperbarui data biaya..." : "Menyimpan data biaya...",
      successMessage: editingBiaya ? "Data biaya berhasil diperbarui" : "Data biaya berhasil ditambahkan"
    });
  };

  const handleEdit = (biaya: Biaya) => {
    setEditingBiaya(biaya);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteData(async () => {
      // Get the data before deleting for audit trail
      const { data: deletedData, error: fetchError } = await supabase
        .from('data_biaya')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('data_biaya')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log audit trail untuk operasi delete
      if (deletedData) {
        await logDelete("data_biaya", id, {
          tahun: deletedData.tahun,
          unit_kerja_id: deletedData.unit_kerja_id,
          biaya_gaji_tunjangan: deletedData.biaya_gaji_tunjangan,
          biaya_jasa_pelayanan: deletedData.biaya_jasa_pelayanan,
          biaya_obat: deletedData.biaya_obat,
          biaya_bhp: deletedData.biaya_bhp,
          biaya_makan_karyawan: deletedData.biaya_makan_karyawan,
          biaya_makan_pasien: deletedData.biaya_makan_pasien,
          biaya_rumah_tangga: deletedData.biaya_rumah_tangga,
          biaya_cetak: deletedData.biaya_cetak,
          biaya_atk: deletedData.biaya_atk,
          biaya_listrik: deletedData.biaya_listrik,
          biaya_air: deletedData.biaya_air,
          biaya_telp: deletedData.biaya_telp,
          biaya_pemeliharaan_bangunan: deletedData.biaya_pemeliharaan_bangunan,
          biaya_pemeliharaan_alat_medis: deletedData.biaya_pemeliharaan_alat_medis,
          biaya_pemeliharaan_alat_non_medis: deletedData.biaya_pemeliharaan_alat_non_medis,
          biaya_operasional_lainnya: deletedData.biaya_operasional_lainnya,
          biaya_penyusutan_gedung: deletedData.biaya_penyusutan_gedung,
          biaya_penyusutan_jaringan: deletedData.biaya_penyusutan_jaringan,
          biaya_penyusutan_alat_medis: deletedData.biaya_penyusutan_alat_medis,
          biaya_penyusutan_alat_non_medis: deletedData.biaya_penyusutan_alat_non_medis,
          biaya_pendidikan_pelatihan: deletedData.biaya_pendidikan_pelatihan
        });
      }

      if (userId) await fetchBiaya(userId);
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      file.text().then((text) => {
        // Reset file input
        event.target.value = '';
        
        if (!text || text.trim().length === 0) {
          showUploadError("File CSV kosong atau tidak dapat dibaca.");
          return;
        }
        (Papa as any).parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header ? header.trim() : "",
          transform: (value: string) => value ? value.trim() : "",
          complete: async (results: Papa.ParseResult<any>) => {
            try {
              // Validate results
              if (!results || !results.data) {
                showUploadError("File CSV tidak valid atau kosong.");
                return;
              }

              const allRows = results.data;
              const totalRows = allRows.length;
              
              if (totalRows === 0) {
                showUploadError("Tidak ada data dalam file CSV.");
                return;
              }
              
              // Start upload progress
              startUpload(totalRows, "Sedang mengimpor data biaya...");
              
              const importedData: any[] = [];
              const duplicateYears: number[] = [];
              let processedCount = 0;
              let successCount = 0;
              let errorCount = 0;
              
              for (const row of results.data) {
                processedCount++;
                updateProgress(processedCount, successCount, errorCount);
                
                // Skip empty rows
                if (!row || Object.keys(row).length === 0) {
                  continue;
                }
                
                // Debug logging for troubleshooting
                if (processedCount <= 3) {
                  console.log(`Processing row ${processedCount}:`, row);
                }
                
                const tahun = parseInt(row["Tahun"] || "0");
                const kodeUnitKerja = row["Kode Unit Kerja"] ? row["Kode Unit Kerja"].toString().trim() : "";
                
                if (isNaN(tahun) || tahun <= 0) {
                  errorCount++;
                  continue;
                }
                
                // Find unit kerja by kode
                let unitKerjaId = null;
                if (kodeUnitKerja) {
                  const unitKerja = unitKerjaList.find(uk => uk.kode === kodeUnitKerja);
                  if (unitKerja) {
                    unitKerjaId = unitKerja.id;
                  }
                }
                
                // Skip duplicate check per row - will be handled after processing all data
                
                // Check if tahun and unit_kerja_id combination already exists in this import batch
                const isDuplicateInBatch = importedData.some(item => 
                  item.tahun === tahun && item.unit_kerja_id === unitKerjaId
                );
                if (isDuplicateInBatch) {
                  duplicateYears.push(tahun);
                  errorCount++;
                  continue;
                }
                
                // Helper function to safely parse float values
                const safeParseFloat = (value: any): number => {
                  if (value === null || value === undefined || value === "") return 0;
                  const parsed = parseFloat(value.toString());
                  return isNaN(parsed) ? 0 : parsed;
                };

                importedData.push({
                  tahun,
                  unit_kerja_id: unitKerjaId,
                  biaya_gaji_tunjangan: safeParseFloat(row["Biaya Gaji dan Tunjangan"]),
                  biaya_jasa_pelayanan: safeParseFloat(row["Biaya Jasa Pelayanan"]),
                  biaya_pendidikan_pelatihan: safeParseFloat(row["Biaya Pendidikan dan Pelatihan"]),
                  biaya_obat: safeParseFloat(row["Biaya Obat"]),
                  biaya_bhp: safeParseFloat(row["Biaya BHP"]),
                  biaya_makan_karyawan: safeParseFloat(row["Biaya Bahan Makanan Karyawan"]),
                  biaya_makan_pasien: safeParseFloat(row["Biaya Bahan Makanan Pasien"]),
                  biaya_rumah_tangga: safeParseFloat(row["Biaya Alat Rumah Tangga"]),
                  biaya_cetak: safeParseFloat(row["Biaya Cetak"]),
                  biaya_atk: safeParseFloat(row["Biaya Alat Tulis Kantor"]),
                  biaya_listrik: safeParseFloat(row["Biaya Listrik"]),
                  biaya_air: safeParseFloat(row["Biaya Air"]),
                  biaya_telp: safeParseFloat(row["Biaya Telepon"]),
                  biaya_pemeliharaan_bangunan: safeParseFloat(row["Biaya Pemeliharaan Gedung dan Bangunan"]),
                  biaya_pemeliharaan_alat_medis: safeParseFloat(row["Biaya Pemeliharaan Alat Medis"]),
                  biaya_pemeliharaan_alat_non_medis: safeParseFloat(row["Biaya Pemeliharaan Alat Non Medis"]),
                  biaya_operasional_lainnya: safeParseFloat(row["Biaya Operasional Lainnya"]),
                  biaya_penyusutan_gedung: safeParseFloat(row["Biaya Penyusutan Gedung dan Bangunan"]),
                  biaya_penyusutan_jaringan: safeParseFloat(row["Biaya Penyusutan Jaringan"]),
                  biaya_penyusutan_alat_medis: safeParseFloat(row["Biaya Penyusutan Alat Medis"]),
                  biaya_penyusutan_alat_non_medis: safeParseFloat(row["Biaya Penyusutan Alat Non Medis"]),
                  user_id: userId,
                });
                successCount++;
              }
              
              // Remove duplicate check here since we handle it after bulk check
              
              if (importedData.length === 0) {
                showUploadError("Tidak ada data valid untuk diimpor.");
                return;
              }

              // Bulk check for existing data to avoid duplicates
              const tahunList = [...new Set(importedData.map(item => item.tahun))];
              const unitKerjaIdList = [...new Set(importedData.map(item => item.unit_kerja_id).filter(id => id))];
              
              const { data: existingData, error: checkError } = await supabase
                .from('data_biaya')
                .select('tahun, unit_kerja_id')
                .in('tahun', tahunList)
                .in('unit_kerja_id', unitKerjaIdList);
              
              if (checkError) {
                showUploadError(`Gagal memeriksa data yang sudah ada: ${checkError.message}`);
                return;
              }
              
              // Filter out duplicates
              const existingCombinations = new Set(
                existingData?.map(item => `${item.tahun}-${item.unit_kerja_id}`) || []
              );
              
              const filteredData = importedData.filter(item => {
                const combination = `${item.tahun}-${item.unit_kerja_id}`;
                if (existingCombinations.has(combination)) {
                  duplicateYears.push(item.tahun);
                  return false;
                }
                return true;
              });
              
              if (filteredData.length === 0) {
                showUploadError(`Semua data untuk tahun berikut sudah ada: ${[...new Set(duplicateYears)].join(", ")}`);
                return;
              }

              // Insert data to database in batches to avoid timeout
              const batchSize = 50; // Process 50 records at a time
              let totalInserted = 0;
              
              for (let i = 0; i < filteredData.length; i += batchSize) {
                const batch = filteredData.slice(i, i + batchSize);
                
                const { error } = await supabase
                  .from('data_biaya')
                  .insert(batch);

                if (error) throw error;
                
                totalInserted += batch.length;
                
                // Update progress for batch processing
                updateProgress(processedCount, totalInserted, errorCount);
                
                // Small delay between batches to prevent overwhelming the database
                if (i + batchSize < filteredData.length) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }
              
              // Complete upload with final counts
              const finalDuplicateCount = [...new Set(duplicateYears)].length;
              completeUpload(filteredData.length, errorCount, finalDuplicateCount);
              
              // Refresh data
              if (userId) await fetchBiaya(userId);
            } catch (error: any) {
              console.error(error);
              showUploadError(`Gagal mengimpor data: ${error.message}`);
            }
          },
          error: (error: Papa.ParseError) => {
            console.error("Papa Parse Error:", error);
            showUploadError(`Gagal mengimpor data: ${error.message || "Format file CSV tidak valid"}`);
          }
        });
      }).catch((error) => {
        console.error("File reading error:", error);
        showUploadError("Gagal membaca file CSV. Pastikan file tidak rusak dan formatnya benar.");
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      let dataToUse = unitKerjaList;
      
      // If no data loaded, fetch it
      if (dataToUse.length === 0) {
        toast.info("Memuat data unit kerja...");
        const { data, error } = await supabase
          .from('unit_kerja')
          .select('id, kode, nama, kategori')
          .order('nama', { ascending: true });

        if (error) {
          toast.error("Gagal memuat data unit kerja.");
          return;
        }
        
        dataToUse = data || [];
        setUnitKerjaList(dataToUse);
      }

      // Create template with unit kerja data
      const templateData = dataToUse.map(unitKerja => ({
        "Kode Unit Kerja": unitKerja.kode,
        "Nama Unit Kerja": unitKerja.nama,
        "Kategori Unit Kerja": unitKerja.kategori,
        "Tahun": new Date().getFullYear(),
        "Biaya Obat": 0,
        "Biaya BHP": 0,
        "Biaya Bahan Makanan Karyawan": 0,
        "Biaya Bahan Makanan Pasien": 0,
        "Biaya Alat Rumah Tangga": 0,
        "Biaya Alat Tulis Kantor": 0,
        "Biaya Cetak": 0,
        "Biaya Gaji dan Tunjangan": 0,
        "Biaya Jasa Pelayanan": 0,
        "Biaya Pendidikan dan Pelatihan": 0,
        "Biaya Air": 0,
        "Biaya Listrik": 0,
        "Biaya Telepon": 0,
        "Biaya Pemeliharaan Gedung dan Bangunan": 0,
        "Biaya Pemeliharaan Alat Medis": 0,
        "Biaya Pemeliharaan Alat Non Medis": 0,
        "Biaya Penyusutan Gedung dan Bangunan": 0,
        "Biaya Penyusutan Jaringan": 0,
        "Biaya Penyusutan Alat Medis": 0,
        "Biaya Penyusutan Alat Non Medis": 0,
        "Biaya Operasional Lainnya": 0
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Data Biaya");
      XLSX.writeFile(wb, `template_data_biaya_${new Date().getFullYear()}_dengan_data_master.xlsx`);
      toast.success(`Template impor data berhasil diunduh dengan ${dataToUse.length} unit kerja.`);
      
    } catch (error) {
      console.error("Error in handleDownloadTemplate:", error);
      toast.error("Gagal mengunduh template.");
    }
  };

  const handleDownloadReport = () => {
    if (biayaList.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan.");
      return;
    }

    const dataToExport = biayaList.map(item => ({
      "Tahun": item.tahun,
      "Unit Kerja": item.unit_kerja ? `${item.unit_kerja.kode} - ${item.unit_kerja.nama}` : "Semua Unit Kerja",
      "Kategori Unit Kerja": item.unit_kerja?.kategori || "",
      // Computed totals
      "Total Biaya Bahan": item.biaya_bahan || 0,
      "Total Biaya Pegawai": item.biaya_pegawai || 0,
      "Total Biaya Daya": item.biaya_daya || 0,
      "Total Biaya Pemeliharaan": item.biaya_pemeliharaan || 0,
      "Total Biaya Penyusutan": item.biaya_penyusutan || 0,
      "Total Biaya Operasional Lainnya": item.biaya_operasional_lainnya || 0,
      "Total Biaya Keseluruhan": item.total_biaya || 0,
      "Total Biaya Tanpa Jasa Pelayanan": item.total_biaya_tanpa_jp || 0,
      // Detailed breakdown
      "Biaya Obat": item.biaya_obat || 0,
      "Biaya BHP": item.biaya_bhp || 0,
      "Biaya Bahan Makanan Karyawan": item.biaya_makan_karyawan || 0,
      "Biaya Bahan Makanan Pasien": item.biaya_makan_pasien || 0,
      "Biaya Alat Rumah Tangga": item.biaya_rumah_tangga || 0,
      "Biaya Alat Tulis Kantor": item.biaya_atk || 0,
      "Biaya Cetak": item.biaya_cetak || 0,
      "Biaya Gaji dan Tunjangan": item.biaya_gaji_tunjangan || 0,
      "Biaya Jasa Pelayanan": item.biaya_jasa_pelayanan || 0,
      "Biaya Pendidikan dan Pelatihan": item.biaya_pendidikan_pelatihan || 0,
      "Biaya Air": item.biaya_air || 0,
      "Biaya Listrik": item.biaya_listrik || 0,
      "Biaya Telepon": item.biaya_telp || 0,
      "Biaya Pemeliharaan Gedung dan Bangunan": item.biaya_pemeliharaan_bangunan || 0,
      "Biaya Pemeliharaan Alat Medis": item.biaya_pemeliharaan_alat_medis || 0,
      "Biaya Pemeliharaan Alat Non Medis": item.biaya_pemeliharaan_alat_non_medis || 0,
      "Biaya Penyusutan Gedung dan Bangunan": item.biaya_penyusutan_gedung || 0,
      "Biaya Penyusutan Jaringan": item.biaya_penyusutan_jaringan || 0,
      "Biaya Penyusutan Alat Medis": item.biaya_penyusutan_alat_medis || 0,
      "Biaya Penyusutan Alat Non Medis": item.biaya_penyusutan_alat_non_medis || 0,
      "Biaya Operasional Lainnya": item.biaya_operasional_lainnya || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Biaya");
    XLSX.writeFile(wb, "laporan_biaya.xlsx");
    toast.info("Laporan berhasil diunduh.");
  };

  // Format currency for display
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'Rp0';
    return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  };

  // Show loading state if no user session yet
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-muted-foreground">Memuat data biaya...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user session
  if (!userId) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Sesi Tidak Ditemukan</h3>
            <p className="text-muted-foreground mb-4">
              Silakan login terlebih dahulu untuk mengakses data biaya.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manajemen Data Biaya
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* KPI badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div className="p-4 rounded-md bg-slate-50 border">
              <div className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">🏢</span> Total Unit Kerja
              </div>
              <div className="text-xl font-bold">{new Set(filteredBiayaList.map(b => b.unit_kerja?.nama)).size}</div>
            </div>
            <div className="p-4 rounded-md bg-sky-50 border">
              <div className="text-sm text-sky-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">💊</span> Total Biaya Bahan
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_bahan || 0), 0).toLocaleString()}</div>
              <div className="text-base text-sky-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_bahan || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
            <div className="p-4 rounded-md bg-blue-50 border">
              <div className="text-sm text-blue-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">👥</span> Total Biaya Pegawai
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_gaji_tunjangan || 0), 0).toLocaleString()}</div>
              <div className="text-base text-blue-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_gaji_tunjangan || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
            <div className="p-4 rounded-md bg-indigo-50 border">
              <div className="text-sm text-indigo-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">🏥</span> Jasa Pelayanan
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_jasa_pelayanan || 0), 0).toLocaleString()}</div>
              <div className="text-base text-indigo-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_jasa_pelayanan || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
            <div className="p-4 rounded-md bg-emerald-50 border">
              <div className="text-sm text-emerald-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">⚡</span> Total Biaya Daya
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_daya || 0), 0).toLocaleString()}</div>
              <div className="text-base text-emerald-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_daya || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
            <div className="p-4 rounded-md bg-teal-50 border">
              <div className="text-sm text-teal-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">🔧</span> Total Biaya Pemeliharaan
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_pemeliharaan || 0), 0).toLocaleString()}</div>
              <div className="text-base text-teal-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_pemeliharaan || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
            <div className="p-4 rounded-md bg-rose-50 border">
              <div className="text-sm text-rose-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">📉</span> Total Biaya Penyusutan
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_penyusutan || 0), 0).toLocaleString()}</div>
              <div className="text-base text-rose-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_penyusutan || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
            <div className="p-4 rounded-md bg-purple-50 border">
              <div className="text-sm text-purple-600 flex items-center gap-2 font-medium">
                <span className="text-2xl">📋</span> Biaya Operasional Lainnya
              </div>
              <div className="text-xl font-bold">{filteredBiayaList.reduce((s, b) => s + (b.biaya_operasional_lainnya || 0), 0).toLocaleString()}</div>
              <div className="text-base text-purple-500 font-bold">
                {((filteredBiayaList.reduce((s, b) => s + (b.biaya_operasional_lainnya || 0), 0) / Math.max(filteredBiayaList.reduce((s, b) => s + (b.total_biaya || 0), 0), 1)) * 100).toFixed(1)}% dari Total Biaya
              </div>
            </div>
          </div>
          
          {/* Debug Panel for Admin Users */}
          {userId && (
            <DebugPanel 
              userId={userId} 
              onRetryFetch={() => fetchBiaya(userId)} 
              biayaListLength={biayaList.length}
            />
          )}
          
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-year">Tahun</Label>
              <Input 
                id="filter-year" 
                className="w-24" 
                type="number" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-unit">Unit Kerja</Label>
              <Select value={selectedUnitId} onValueChange={(value) => setSelectedUnitId(value === "all" ? "all" : value)}>
                <SelectTrigger id="filter-unit" className="w-72">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {unitKerjaList.map(uk => (
                    <SelectItem key={uk.id} value={uk.id}>{uk.kode} - {uk.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" onClick={() => { setSelectedUnitId("all"); setSelectedYear(new Date().getFullYear()); }}>
              Reset
            </Button>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
            </Button>
            <label htmlFor="import-file" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
              <Upload className="mr-2 h-4 w-4" /> Impor Data
              <Input id="import-file" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
            </label>
            <Button onClick={handleDownloadReport} variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
            </Button>

        {/* Toggle Pilihan Jenis Biaya Tahunan */}
        <div className="flex items-center gap-1">
          <Button
            variant={biayaPreference === 'total_biaya' ? undefined : 'outline'}
            size="sm"
            disabled={updatingPreference}
            onClick={() => handleSetBiayaPreference('total_biaya')}
          >
            {updatingPreference && biayaPreference === 'total_biaya' ? 'Memproses...' : 'Total Biaya'}
          </Button>
          <Button
            variant={biayaPreference === 'total_biaya_tanpa_jp' ? undefined : 'outline'}
            size="sm"
            disabled={updatingPreference}
            onClick={() => handleSetBiayaPreference('total_biaya_tanpa_jp')}
          >
            {updatingPreference && biayaPreference === 'total_biaya_tanpa_jp' ? 'Memproses...' : 'Total Biaya Tanpa JP'}
          </Button>
        </div>

        {/* Tombol Tambah Data Biaya */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBiaya(null)}>Tambah Data Biaya</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBiaya ? "Edit Data Biaya" : "Tambah Data Biaya"}</DialogTitle>
              <DialogDescription>
                {editingBiaya ? "Perbarui detail biaya tahunan." : "Tambahkan data biaya tahunan baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="tahun"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Contoh: 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit_kerja_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Kerja</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "null" ? null : value)} value={field.value === "" || !field.value ? "null" : field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Unit Kerja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Semua Unit Kerja</SelectItem>
                            {unitKerjaList.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.kode} - {unit.nama} ({unit.kategori})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Biaya Bahan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_obat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Obat</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_bhp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya BHP</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_makan_karyawan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Bahan Makanan Karyawan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_makan_pasien"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Bahan Makanan Pasien</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_rumah_tangga"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Alat Rumah Tangga</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_atk"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Alat Tulis Kantor</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_cetak"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Cetak</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Biaya Pegawai</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_gaji_tunjangan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Gaji dan Tunjangan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_jasa_pelayanan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Jasa Pelayanan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pendidikan_pelatihan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pendidikan dan Pelatihan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Biaya Daya</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_air"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Air</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_listrik"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Listrik</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_telp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Telepon</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Biaya Pemeliharaan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_bangunan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Gedung dan Bangunan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_alat_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Alat Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_alat_non_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Alat Non Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                      <AccordionTrigger>Biaya Penyusutan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_gedung"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Gedung dan Bangunan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_jaringan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Jaringan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_alat_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Alat Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_alat_non_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Alat Non Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                      <AccordionTrigger>Biaya Operasional Lainnya</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_operasional_lainnya"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Operasional Lainnya</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <DialogFooter>
                    <LoadingButton 
                      type="submit" 
                      loading={saving}
                      loadingText={editingBiaya ? "Menyimpan perubahan..." : "Menyimpan..."}
                    >
                      {editingBiaya ? "Simpan Perubahan" : "Tambah"}
                    </LoadingButton>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Data Biaya</DialogTitle>
              <DialogDescription>
                Lihat detail lengkap data biaya untuk {viewingItem?.unit_kerja ? `${viewingItem.unit_kerja.kode} - ${viewingItem.unit_kerja.nama}` : 'Semua Unit Kerja'} tahun {viewingItem?.tahun}
              </DialogDescription>
            </DialogHeader>
            {viewingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Biaya Bahan</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total: {formatCurrency(viewingItem.biaya_bahan)}</div>
                      <div>Obat: {formatCurrency(viewingItem.biaya_obat)}</div>
                      <div>BHP: {formatCurrency(viewingItem.biaya_bhp)}</div>
                      <div>Makan Karyawan: {formatCurrency(viewingItem.biaya_makan_karyawan)}</div>
                      <div>Makan Pasien: {formatCurrency(viewingItem.biaya_makan_pasien)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Biaya Pegawai</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total: {formatCurrency(viewingItem.biaya_pegawai)}</div>
                      <div>Gaji & Tunjangan: {formatCurrency(viewingItem.biaya_gaji_tunjangan)}</div>
                      <div>Jasa Pelayanan: {formatCurrency(viewingItem.biaya_jasa_pelayanan)}</div>
                      <div>Pendidikan & Pelatihan: {formatCurrency(viewingItem.biaya_pendidikan_pelatihan)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-2">Biaya Daya</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total: {formatCurrency(viewingItem.biaya_daya)}</div>
                      <div>Listrik: {formatCurrency(viewingItem.biaya_listrik)}</div>
                      <div>Air: {formatCurrency(viewingItem.biaya_air)}</div>
                      <div>Telepon: {formatCurrency(viewingItem.biaya_telp)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-teal-600 mb-2">Biaya Pemeliharaan</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total: {formatCurrency(viewingItem.biaya_pemeliharaan)}</div>
                      <div>Bangunan: {formatCurrency(viewingItem.biaya_pemeliharaan_bangunan)}</div>
                      <div>Alat Medis: {formatCurrency(viewingItem.biaya_pemeliharaan_alat_medis)}</div>
                      <div>Alat Non Medis: {formatCurrency(viewingItem.biaya_pemeliharaan_alat_non_medis)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-rose-600 mb-2">Biaya Penyusutan</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total: {formatCurrency(viewingItem.biaya_penyusutan)}</div>
                      <div>Gedung: {formatCurrency(viewingItem.biaya_penyusutan_gedung)}</div>
                      <div>Jaringan: {formatCurrency(viewingItem.biaya_penyusutan_jaringan)}</div>
                      <div>Alat Medis: {formatCurrency(viewingItem.biaya_penyusutan_alat_medis)}</div>
                      <div>Alat Non Medis: {formatCurrency(viewingItem.biaya_penyusutan_alat_non_medis)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 mb-2">Biaya Operasional Lainnya</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total: {formatCurrency(viewingItem.biaya_operasional_lainnya)}</div>
                      <div>Rumah Tangga: {formatCurrency(viewingItem.biaya_rumah_tangga)}</div>
                      <div>Cetak: {formatCurrency(viewingItem.biaya_cetak)}</div>
                      <div>ATK: {formatCurrency(viewingItem.biaya_atk)}</div>
                      <div>Operasional Lainnya: {formatCurrency(viewingItem.biaya_operasional_lainnya)}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <h4 className="font-bold text-primary text-lg">Total Biaya</h4>
                      <div className="text-2xl font-bold text-primary">{formatCurrency(viewingItem.total_biaya)}</div>
                    </div>
                    <div className="text-center p-4 bg-orange-100 rounded-lg">
                      <h4 className="font-bold text-orange-600 text-lg">Total Biaya Tanpa JP</h4>
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(viewingItem.total_biaya_tanpa_jp)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      

      

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Tahun</TableHead>
              <TableHead className="w-40">Unit Kerja</TableHead>
              <TableHead className="w-32">Total Biaya</TableHead>
              <TableHead className="w-32">Total Biaya Tanpa JP</TableHead>
              <TableHead className="w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBiayaList.length > 0 ? (
              filteredBiayaList.map((biaya) => (
                <>
                <TableRow key={biaya.id}>
                  <TableCell className="font-medium w-20">{biaya.tahun}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(biaya.id)}
                        className="h-5 w-5 p-0 flex-shrink-0"
                      >
                        {expandedRows.has(biaya.id) ? '▼' : '▶'}
                      </Button>
                      {biaya.unit_kerja ? (
                        <div className="font-medium min-w-0 flex-1">
                          <div className="truncate text-sm">
                            {biaya.unit_kerja.kode} - {biaya.unit_kerja.nama}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {biaya.unit_kerja.kategori}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic truncate text-sm">
                          Semua Unit Kerja
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="font-bold text-lg text-green-600">
                      {Math.round(biaya.total_biaya).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Keseluruhan
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="font-bold text-lg text-blue-600">
                      {Math.round(biaya.total_biaya_tanpa_jp).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tanpa Jasa Pelayanan
                    </div>
                  </TableCell>
                  <TableCell className="text-right w-20">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(biaya)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(biaya)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(biaya.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRows.has(biaya.id) && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="p-4 bg-gray-50 rounded-md">
                        <h4 className="font-semibold mb-3 text-gray-700">Detail Biaya</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <h5 className="font-medium text-green-600">Biaya Bahan</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_bahan)}</div>
                              <div>Obat: {formatCurrency(biaya.biaya_obat)}</div>
                              <div>BHP: {formatCurrency(biaya.biaya_bhp)}</div>
                              <div>Makan Karyawan: {formatCurrency(biaya.biaya_makan_karyawan)}</div>
                              <div>Makan Pasien: {formatCurrency(biaya.biaya_makan_pasien)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-blue-600">Biaya Pegawai</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_pegawai)}</div>
                              <div>Gaji & Tunjangan: {formatCurrency(biaya.biaya_gaji_tunjangan)}</div>
                              <div>Pendidikan & Pelatihan: {formatCurrency(biaya.biaya_pendidikan_pelatihan)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-indigo-600">Jasa Pelayanan</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_jasa_pelayanan)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-emerald-600">Biaya Daya</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_daya)}</div>
                              <div>Listrik: {formatCurrency(biaya.biaya_listrik)}</div>
                              <div>Air: {formatCurrency(biaya.biaya_air)}</div>
                              <div>Telepon: {formatCurrency(biaya.biaya_telp)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-teal-600">Biaya Pemeliharaan</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_pemeliharaan)}</div>
                              <div>Bangunan: {formatCurrency(biaya.biaya_pemeliharaan_bangunan)}</div>
                              <div>Alat Medis: {formatCurrency(biaya.biaya_pemeliharaan_alat_medis)}</div>
                              <div>Alat Non Medis: {formatCurrency(biaya.biaya_pemeliharaan_alat_non_medis)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-rose-600">Biaya Penyusutan</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_penyusutan)}</div>
                              <div>Gedung: {formatCurrency(biaya.biaya_penyusutan_gedung)}</div>
                              <div>Jaringan: {formatCurrency(biaya.biaya_penyusutan_jaringan)}</div>
                              <div>Alat Medis: {formatCurrency(biaya.biaya_penyusutan_alat_medis)}</div>
                              <div>Alat Non Medis: {formatCurrency(biaya.biaya_penyusutan_alat_non_medis)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-purple-600">Biaya Operasional Lainnya</h5>
                            <div className="text-sm space-y-1">
                              <div>Total: {formatCurrency(biaya.biaya_operasional_lainnya)}</div>
                              <div>Rumah Tangga: {formatCurrency(biaya.biaya_rumah_tangga)}</div>
                              <div>Cetak: {formatCurrency(biaya.biaya_cetak)}</div>
                              <div>ATK: {formatCurrency(biaya.biaya_atk)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data biaya.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
        </CardContent>
      </Card>
      
      {/* Import Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
    </div>
  );
};

export default BiayaFormTable;