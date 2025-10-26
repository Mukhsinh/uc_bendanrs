import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Shield, Trash2, Edit, Eye, Crown, UserCog, Users, Settings, Eye as EyeIcon, X, List, BarChart3, Briefcase, Heart, Activity, ToggleLeft, ToggleRight, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandingSettings from "@/components/ManajemenAkses/BrandingSettings";

interface Role {
  id: string;
  role_name: string;
  description: string;
  is_active: boolean;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  role_name: string;
  role_description: string;
  role_is_active: boolean;
  assigned_at: string;
  assigned_by_email: string;
}

interface Permission {
  permission_name: string;
  permission_type: string;
  is_granted: boolean;
}

interface MenuAccess {
  role_name: string;
  role_description: string;
  total_menus: number;
  view_access: number;
  create_access: number;
  edit_access: number;
  delete_access: number;
  menu_list: string;
}

interface RoleMenuDetail {
  menu_name: string;
  menu_url: string;
  menu_description: string;
  menu_icon: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  permissions: string;
}

export default function ManajemenAkses() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "edit" | "view">("view");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [menuAccess, setMenuAccess] = useState<MenuAccess[]>([]);
  const [selectedRoleMenu, setSelectedRoleMenu] = useState<RoleMenuDetail[]>([]);
  const [selectedRoleForMenu, setSelectedRoleForMenu] = useState<string>("");
  const [triggerStatus, setTriggerStatus] = useState<boolean>(true);
  const [triggerLoading, setTriggerLoading] = useState<boolean>(false);
  
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
    fetchUsers();
    fetchRoles();
    fetchMenuAccess();
    checkTriggerStatus();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Check if superadmin
        const { data, error } = await supabase.rpc('is_superadmin', { check_user_id: user.id });
        if (!error && data) {
          setIsSuperadmin(true);
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use RPC function instead of direct table access
      const { data, error } = await supabase.rpc('get_all_users_with_roles');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("role_akses_aplikasi")
        .select("*")
        .eq("is_active", true)
        .order("role_name");

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const fetchMenuAccess = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_roles_menu_summary');

      if (error) throw error;
      setMenuAccess(data || []);
    } catch (error: any) {
      console.error("Error fetching menu access:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const fetchRoleMenuDetail = async (roleName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_role_menu_access', {
        role_name_param: roleName
      });

      if (error) throw error;
      setSelectedRoleMenu(data || []);
      setSelectedRoleForMenu(roleName);
    } catch (error: any) {
      console.error("Error fetching role menu detail:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_permissions', {
        check_user_id: userId
      });

      if (error) throw error;
      setUserPermissions(data || []);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      setUserPermissions([]);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email dan password harus diisi",
      });
      return;
    }

    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pilih role untuk user baru",
      });
      return;
    }

    setProcessing(true);
    try {
      // Create user dan assign role sekaligus menggunakan RPC function
      const { data: createResult, error: createError } = await supabase.rpc('create_user_with_role', {
        email_param: newUserEmail,
        password_param: newUserPassword,
        full_name_param: newUserFullName || newUserEmail.split('@')[0],
        role_name_param: selectedRole
      });

      if (createError) throw createError;

      // Check if creation was successful
      if (createResult && createResult.success) {
        toast({
          title: "Berhasil",
          description: createResult.message || `User ${newUserEmail} berhasil dibuat dengan role ${selectedRole}`,
        });

        setDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        throw new Error(createResult?.error || "Gagal membuat user");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pilih user dan role terlebih dahulu",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('assign_role_to_user', {
        user_id_param: selectedUser.id,
        role_name_param: selectedRole
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${selectedRole} berhasil di-assign ke ${selectedUser.email}`,
      });

      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivateUser = async (userId: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan user ${email}?`)) {
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('deactivate_user', {
        user_id_param: userId
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `User ${email} berhasil dinonaktifkan`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN user ${email}?\n\nTindakan ini TIDAK DAPAT DIBATALKAN!`)) {
      return;
    }

    setProcessing(true);
    try {
      // Delete user using RPC function
      const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_user_safely', {
        user_id_param: userId
      });

      if (deleteError) throw deleteError;

      // Check if deletion was successful
      if (deleteResult && deleteResult.success) {
        toast({
          title: "Berhasil",
          description: deleteResult.message || `User ${email} berhasil dihapus permanen dari sistem`,
        });

        fetchUsers();
      } else {
        throw new Error(deleteResult?.error || "Gagal menghapus user");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const openCreateDialog = () => {
    setDialogType("create");
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setDialogType("edit");
    setSelectedUser(user);
    setSelectedRole(user.role_name);
    setDialogOpen(true);
  };

  const openViewDialog = async (user: User) => {
    setDialogType("view");
    setSelectedUser(user);
    await fetchUserPermissions(user.id);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedRole("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserFullName("");
    setUserPermissions([]);
  };

  const checkTriggerStatus = async () => {
    try {
      // Simulasi cek status trigger - dalam implementasi nyata akan menggunakan RPC function
      setTriggerStatus(true); // Default enabled
    } catch (error) {
      console.error("Error checking trigger status:", error);
    }
  };

  const toggleTriggers = async () => {
    setTriggerLoading(true);
    try {
      if (triggerStatus) {
        // Disable triggers
        const { data, error } = await supabase.rpc('disable_data_kegiatan_triggers');
        if (error) throw error;
        
        setTriggerStatus(false);
        toast({
          title: "Berhasil",
          description: "Trigger otomatis telah dinonaktifkan",
        });
      } else {
        // Enable triggers
        const { data, error } = await supabase.rpc('reenable_data_kegiatan_triggers');
        if (error) throw error;
        
        setTriggerStatus(true);
        toast({
          title: "Berhasil",
          description: "Trigger otomatis telah diaktifkan",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Gagal mengubah status trigger",
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "Super Admin":
        return "default";
      case "Admin":
        return "secondary";
      case "Manager":
        return "outline";
      case "Operator":
      case "Operator Penunjang":
      case "Operator Keperawatan":
      case "Operator Pelayanan":
        return "outline";
      case "Viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case "Super Admin":
        return "bg-gradient-to-r from-purple-600 to-purple-800 text-white border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Admin":
        return "bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Manager":
        return "bg-gradient-to-r from-green-600 to-green-800 text-white border-green-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Operator":
        return "bg-gradient-to-r from-orange-600 to-orange-800 text-white border-orange-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Operator Penunjang":
        return "bg-gradient-to-r from-teal-600 to-teal-800 text-white border-teal-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Operator Keperawatan":
        return "bg-gradient-to-r from-cyan-600 to-cyan-800 text-white border-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Operator Pelayanan":
        return "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white border-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300";
      case "Viewer":
        return "bg-gradient-to-r from-gray-600 to-gray-800 text-white border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-gray-500 shadow-md hover:shadow-lg transition-all duration-300";
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "Super Admin":
        return <Crown className="w-3 h-3 mr-1" />;
      case "Admin":
        return <UserCog className="w-3 h-3 mr-1" />;
      case "Manager":
        return <Users className="w-3 h-3 mr-1" />;
      case "Operator":
        return <Settings className="w-3 h-3 mr-1" />;
      case "Operator Penunjang":
        return <Briefcase className="w-3 h-3 mr-1" />;
      case "Operator Keperawatan":
        return <Heart className="w-3 h-3 mr-1" />;
      case "Operator Pelayanan":
        return <Activity className="w-3 h-3 mr-1" />;
      case "Viewer":
        return <EyeIcon className="w-3 h-3 mr-1" />;
      default:
        return <Shield className="w-3 h-3 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!isSuperadmin && currentUser) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Anda tidak memiliki akses ke halaman Manajemen Akses. Hanya Superadmin yang dapat mengakses halaman ini.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Akses</h1>
          <p className="text-muted-foreground mt-1">
            Kelola user dan role access control system
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Kelola User
          </TabsTrigger>
          <TabsTrigger value="menu-access" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Menu & Akses Role
          </TabsTrigger>
          <TabsTrigger value="system-control" className="gap-2">
            <Database className="h-4 w-4" />
            Kontrol Sistem
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Settings className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>
            Semua user yang terdaftar dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getRoleBadgeVariant(user.role_name || "")}
                      className={getRoleBadgeStyle(user.role_name || "")}
                    >
                      {getRoleIcon(user.role_name || "")}
                      {user.role_name || "No Role"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role_is_active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.assigned_by_email || "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDialog(user)}
                      title="Lihat detail user"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      title="Edit role user"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {user.role_is_active && user.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateUser(user.id, user.email)}
                        title="Nonaktifkan user"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    {isSuperadmin && user.id !== currentUser?.id && user.role_name !== 'Super Admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        title="Hapus permanen user (hanya Super Admin)"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="menu-access" className="space-y-6">
        <div className="grid gap-6">
          {/* Role Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuAccess.map((role) => (
              <Card key={role.role_name} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => fetchRoleMenuDetail(role.role_name)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getRoleBadgeStyle(role.role_name)}>
                      {getRoleIcon(role.role_name)}
                      {role.role_name}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {role.total_menus} menus
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {role.role_description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>View: {role.view_access}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Create: {role.create_access}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Edit: {role.edit_access}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Delete: {role.delete_access}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <div className="font-medium">Akses Menu:</div>
                    <div className="line-clamp-2">{role.menu_list}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role Menu Detail */}
          {selectedRoleMenu.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRoleIcon(selectedRoleForMenu)}
                  Detail Akses Menu - {selectedRoleForMenu}
                </CardTitle>
                <CardDescription>
                  Daftar menu yang dapat diakses oleh role {selectedRoleForMenu}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>View</TableHead>
                      <TableHead>Create</TableHead>
                      <TableHead>Edit</TableHead>
                      <TableHead>Delete</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRoleMenu.map((menu, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{menu.menu_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{menu.menu_url}</TableCell>
                        <TableCell className="text-sm">{menu.menu_description}</TableCell>
                        <TableCell>
                          <Badge variant={menu.can_view ? "default" : "outline"} 
                                 className={menu.can_view ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}>
                            {menu.can_view ? "✓" : "✗"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={menu.can_create ? "default" : "outline"} 
                                 className={menu.can_create ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"}>
                            {menu.can_create ? "✓" : "✗"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={menu.can_edit ? "default" : "outline"} 
                                 className={menu.can_edit ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-500"}>
                            {menu.can_edit ? "✓" : "✗"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={menu.can_delete ? "default" : "outline"} 
                                 className={menu.can_delete ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-500"}>
                            {menu.can_delete ? "✓" : "✗"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {menu.permissions}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="system-control" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Kontrol Trigger Otomatis
            </CardTitle>
            <CardDescription>
              Kelola trigger otomatis untuk perhitungan data kegiatan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-semibold">Trigger Otomatis Data Kegiatan</h3>
                <p className="text-sm text-muted-foreground">
                  Trigger ini akan otomatis menghitung dan memperbarui data terkait ketika ada perubahan pada data kegiatan
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={triggerStatus ? "default" : "outline"} 
                         className={triggerStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {triggerStatus ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Status: {triggerStatus ? "Trigger berjalan otomatis" : "Trigger dinonaktifkan"}
                  </span>
                </div>
              </div>
              <Button 
                onClick={toggleTriggers}
                disabled={triggerLoading}
                variant={triggerStatus ? "destructive" : "default"}
                className="gap-2"
              >
                {triggerLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : triggerStatus ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
                {triggerStatus ? "Nonaktifkan" : "Aktifkan"} Trigger
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Trigger yang Dikontrol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Auto Populate Alokasi Gizi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Auto Populate Data Akomodasi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Auto Update Daftar Resep</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Recalc Prosentase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span>Sync Akomodasi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dampak Trigger</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span>Kalkulasi Biaya Gizi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span>Kalkulasi Biaya Akomodasi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>Kalkulasi Biaya Farmasi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Distribusi Biaya</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Rekapitulasi Unit Cost</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Peringatan:</strong> Menonaktifkan trigger akan menghentikan perhitungan otomatis. 
                Pastikan untuk mengaktifkan kembali setelah selesai melakukan perubahan data manual.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="branding" className="space-y-6">
        <BrandingSettings />
      </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "create" && "Tambah User Baru"}
              {dialogType === "edit" && "Edit Role User"}
              {dialogType === "view" && "Detail User & Permissions"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "create" && "Buat user baru dan assign role"}
              {dialogType === "edit" && "Ubah role yang di-assign ke user"}
              {dialogType === "view" && "Informasi user dan permissions yang dimiliki"}
            </DialogDescription>
          </DialogHeader>

          {dialogType === "create" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullname">Nama Lengkap (Opsional)</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Nama lengkap user"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.role_name}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Default: Viewer (jika tidak dipilih)
                </p>
              </div>
            </div>
          )}

          {dialogType === "edit" && selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>User Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Current Role</Label>
                <Badge 
                  variant={getRoleBadgeVariant(selectedUser.role_name || "")}
                  className={getRoleBadgeStyle(selectedUser.role_name || "")}
                >
                  {getRoleIcon(selectedUser.role_name || "")}
                  {selectedUser.role_name || "No Role"}
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-role">New Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.role_name}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {dialogType === "view" && selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <div className="text-sm">{selectedUser.email}</div>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Badge 
                  variant={getRoleBadgeVariant(selectedUser.role_name || "")}
                  className={getRoleBadgeStyle(selectedUser.role_name || "")}
                >
                  {getRoleIcon(selectedUser.role_name || "")}
                  {selectedUser.role_name || "No Role"}
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label>Role Description</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedUser.role_description || "-"}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  {userPermissions.length > 0 ? (
                    <div className="grid gap-2">
                      {userPermissions.map((perm, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{perm.permission_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {perm.permission_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center">
                      Tidak ada permissions
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Assigned At</Label>
                <div className="text-sm">
                  {selectedUser.assigned_at
                    ? new Date(selectedUser.assigned_at).toLocaleString("id-ID")
                    : "-"}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Assigned By</Label>
                <div className="text-sm">{selectedUser.assigned_by_email || "-"}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {dialogType === "view" ? "Tutup" : "Batal"}
            </Button>
            {dialogType === "create" && (
              <Button onClick={handleCreateUser} disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat User
              </Button>
            )}
            {dialogType === "edit" && (
              <Button onClick={handleAssignRole} disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

