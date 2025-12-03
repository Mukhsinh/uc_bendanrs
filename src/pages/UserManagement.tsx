"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Save, X, UserCog } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_id: string;
  role_name: string;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadRoles(),
        loadPermissions(),
        loadMenuItems()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_with_role')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUsers(data || []);
  };

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) throw error;
    setRoles(data || []);
  };

  const loadPermissions = async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource, action');

    if (error) throw error;
    setPermissions(data || []);
  };

  const loadMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    setMenuItems(data || []);
  };

  const handleUpdateUserRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role_id: roleId })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Role user berhasil diupdate");
      loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Gagal mengupdate role user");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User berhasil ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Gagal mengubah status user");
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!roleName.trim()) {
        toast.error("Nama role tidak boleh kosong");
        return;
      }

      const { data: role, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: roleName,
          description: roleDescription
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Insert permissions
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: role.id,
          permission_id: permissionId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }

      // Insert menu items
      if (selectedMenuItems.length > 0) {
        const roleMenuItems = selectedMenuItems.map(menuItemId => ({
          role_id: role.id,
          menu_item_id: menuItemId
        }));

        const { error: menuError } = await supabase
          .from('role_menu_items')
          .insert(roleMenuItems);

        if (menuError) throw menuError;
      }

      toast.success("Role berhasil dibuat");
      setIsDialogOpen(false);
      resetForm();
      loadRoles();
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Gagal membuat role");
    }
  };

  const handleEditRole = async () => {
    try {
      if (!editingRole || !roleName.trim()) {
        toast.error("Nama role tidak boleh kosong");
        return;
      }

      // Update role
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: roleName,
          description: roleDescription
        })
        .eq('id', editingRole.id);

      if (roleError) throw roleError;

      // Delete existing permissions and menu items
      await tenantSupabase.from('role_permissions').delete().eq('role_id', editingRole.id);
      await tenantSupabase.from('role_menu_items').delete().eq('role_id', editingRole.id);

      // Insert new permissions
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: editingRole.id,
          permission_id: permissionId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }

      // Insert new menu items
      if (selectedMenuItems.length > 0) {
        const roleMenuItems = selectedMenuItems.map(menuItemId => ({
          role_id: editingRole.id,
          menu_item_id: menuItemId
        }));

        const { error: menuError } = await supabase
          .from('role_menu_items')
          .insert(roleMenuItems);

        if (menuError) throw menuError;
      }

      toast.success("Role berhasil diupdate");
      setIsDialogOpen(false);
      resetForm();
      loadRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Gagal mengupdate role");
    }
  };

  const resetForm = () => {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setSelectedMenuItems([]);
    setEditingRole(null);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    // Load existing permissions and menu items for this role
    loadRolePermissions(role.id);
    loadRoleMenuItems(role.id);
    setIsDialogOpen(true);
  };

  const loadRolePermissions = async (roleId: string) => {
    const { data } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    setSelectedPermissions(data?.map(p => p.permission_id) || []);
  };

  const loadRoleMenuItems = async (roleId: string) => {
    const { data } = await supabase
      .from('role_menu_items')
      .select('menu_item_id')
      .eq('role_id', roleId);

    setSelectedMenuItems(data?.map(m => m.menu_item_id) || []);
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const parentId = item.parent_id || 'root';
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const rootMenuItems = groupedMenuItems['root'] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-muted-foreground">
            Kelola user, role, dan permission akses aplikasi
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
              </DialogTitle>
              <DialogDescription>
                Buat atau edit role dengan permission dan menu yang dapat diakses
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Role Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roleName">Nama Role</Label>
                  <Input
                    id="roleName"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Masukkan nama role"
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription">Deskripsi</Label>
                  <Input
                    id="roleDescription"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Masukkan deskripsi role"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <Card key={resource}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium capitalize">
                          {resource.replace('-', ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {perms.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions([...selectedPermissions, permission.id]);
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`perm-${permission.id}`}
                              className="text-sm font-normal"
                            >
                              {permission.action} - {permission.description}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Menu Access</h3>
                <div className="space-y-4">
                  {rootMenuItems.map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`menu-${item.id}`}
                            checked={selectedMenuItems.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMenuItems([...selectedMenuItems, item.id]);
                              } else {
                                setSelectedMenuItems(selectedMenuItems.filter(id => id !== item.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`menu-${item.id}`}
                            className="text-sm font-medium"
                          >
                            {item.title}
                          </Label>
                        </div>
                      </CardHeader>
                      {groupedMenuItems[item.id] && (
                        <CardContent className="pl-6 space-y-2">
                          {groupedMenuItems[item.id].map((subItem) => (
                            <div key={subItem.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`menu-${subItem.id}`}
                                checked={selectedMenuItems.includes(subItem.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMenuItems([...selectedMenuItems, subItem.id]);
                                  } else {
                                    setSelectedMenuItems(selectedMenuItems.filter(id => id !== subItem.id));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`menu-${subItem.id}`}
                                className="text-sm font-normal"
                              >
                                {subItem.title}
                              </Label>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </Button>
                <Button onClick={editingRole ? handleEditRole : handleCreateRole}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingRole ? 'Update Role' : 'Buat Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>
            Kelola user dan role mereka
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role_id}
                      onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Role</CardTitle>
          <CardDescription>
            Kelola role dan permission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Role</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Jumlah User</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const userCount = users.filter(user => user.role_id === role.id).length;
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>{userCount} user</TableCell>
                    <TableCell>
                      <Button variant="edit" size="sm" onClick={() => openEditDialog(role)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;





