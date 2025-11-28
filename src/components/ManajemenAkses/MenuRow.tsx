import { ChevronRight, ChevronDown } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { AccessIndicator } from './AccessIndicator';
import type { MenuItem, Role, AccessLevel } from '@/services/roleAccessService';

interface MenuRowProps {
  menu: MenuItem;
  roles: Role[];
  accessByRole: Map<string, AccessLevel>; // UUID string
  level?: number;
  onCellClick: (roleId: string, menuId: string) => void; // UUID string
  expandedMenus?: Set<string>;
  onToggleMenu?: (menuId: string) => void;
}

export const MenuRow = ({ menu, roles, accessByRole, level = 0, onCellClick, expandedMenus, onToggleMenu }: MenuRowProps) => {
  const hasChildren = menu.children && menu.children.length > 0;
  const isExpanded = expandedMenus?.has(menu.id) || false;
  const indentation = level * 24; // 24px per level

  const handleToggle = () => {
    if (onToggleMenu) {
      onToggleMenu(menu.id);
    }
  };

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        {/* Menu Name Cell */}
        <TableCell className="font-medium sticky left-0 bg-background">
          <div className="flex items-center" style={{ paddingLeft: `${indentation}px` }}>
            {hasChildren && (
              <button
                onClick={handleToggle}
                className="mr-2 hover:bg-muted rounded p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <span className="w-6 mr-2" />}
            <span>{menu.name}</span>
          </div>
        </TableCell>

        {/* Access Indicator Cells */}
        {roles.map((role) => {
          const access = accessByRole.get(role.id);
          return (
            <TableCell key={role.id} className="text-center">
              <AccessIndicator
                access={access}
                onClick={() => onCellClick(role.id, menu.id)}
              />
            </TableCell>
          );
        })}
      </TableRow>

      {/* Render Children Recursively */}
      {hasChildren && isExpanded && menu.children?.map((child) => (
        <MenuRow
          key={child.id}
          menu={child}
          roles={roles}
          accessByRole={accessByRole}
          level={level + 1}
          onCellClick={onCellClick}
          expandedMenus={expandedMenus}
          onToggleMenu={onToggleMenu}
        />
      ))}
    </>
  );
};
