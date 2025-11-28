import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, X, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Role } from '@/services/roleAccessService';

interface AccessMatrixToolbarProps {
  roles: Role[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (roleId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  isExporting?: boolean;
}

export const AccessMatrixToolbar = ({
  roles,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onExpandAll,
  onCollapseAll,
  onExport,
  isExporting = false
}: AccessMatrixToolbarProps) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  // Debounce search input
  const debouncedSearch = useDebounce(localSearch, 300);
  
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari menu..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {localSearch && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role Filter */}
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Semua Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Role</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id.toString()}>
              {role.role_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Expand/Collapse Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExpandAll}
          className="flex items-center gap-1"
        >
          <ChevronDown className="h-4 w-4" />
          Expand
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCollapseAll}
          className="flex items-center gap-1"
        >
          <ChevronUp className="h-4 w-4" />
          Collapse
        </Button>
      </div>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Unduh Laporan
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('pdf')}>
            Unduh PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('excel')}>
            Unduh Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('csv')}>
            Unduh CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
