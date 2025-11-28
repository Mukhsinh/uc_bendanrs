import { CheckCircle2, XCircle, Eye, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AccessLevel } from '@/services/roleAccessService';
import { getAccessLevelType } from '@/services/roleAccessService';

interface AccessIndicatorProps {
  access: AccessLevel | undefined;
  onClick?: () => void;
}

export const AccessIndicator = ({ access, onClick }: AccessIndicatorProps) => {
  if (!access) {
    return (
      <div className="flex items-center justify-center">
        <XCircle className="h-5 w-5 text-gray-400" />
      </div>
    );
  }

  const accessType = getAccessLevelType(access);
  
  const indicators = {
    full: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      label: 'Akses Penuh',
      description: 'View, Create, Update, Delete'
    },
    readonly: {
      icon: <Eye className="h-5 w-5 text-blue-600" />,
      label: 'Hanya Lihat',
      description: 'View only'
    },
    partial: {
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      label: 'Akses Sebagian',
      description: 'Beberapa operasi diizinkan'
    },
    none: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      label: 'Tidak Ada Akses',
      description: 'No access'
    }
  };

  const indicator = indicators[accessType];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="flex items-center justify-center hover:bg-gray-100 rounded p-1 transition-colors"
          >
            {indicator.icon}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{indicator.label}</p>
            <p className="text-xs text-muted-foreground">{indicator.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
