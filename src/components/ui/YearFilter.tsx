"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useYear } from "@/contexts/YearContext";

interface YearFilterProps {
  /** Override selectedYear jika halaman punya state tahun sendiri */
  value?: number;
  /** Override setter jika halaman punya state tahun sendiri */
  onChange?: (year: number) => void;
  /** Override daftar tahun jika berbeda dengan context global */
  years?: number[];
  className?: string;
}

/**
 * Komponen filter tahun yang dapat dipakai di setiap halaman.
 * Secara default menggunakan YearContext global.
 * Bisa di-override dengan props value/onChange/years untuk state lokal halaman.
 */
const YearFilter: React.FC<YearFilterProps> = ({
  value,
  onChange,
  years,
  className,
}) => {
  const { selectedYear, setSelectedYear, availableYears } = useYear();

  const currentValue = value !== undefined ? value : selectedYear;
  const currentYears = years !== undefined ? years : availableYears;
  const handleChange = onChange !== undefined ? onChange : setSelectedYear;

  return (
    <div className={`flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100/60 rounded-xl px-3 py-1.5 border border-teal-200/60 ${className ?? ""}`}>
      <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
      <span className="text-xs font-medium text-teal-700 hidden sm:inline">Tahun:</span>
      <Select
        value={currentValue.toString()}
        onValueChange={(v) => handleChange(parseInt(v, 10))}
      >
        <SelectTrigger className="h-8 w-[80px] border-0 bg-transparent text-teal-800 text-sm font-bold focus:ring-1 focus:ring-teal-400 focus:ring-offset-0 px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-[80px]">
          {currentYears.map((y) => (
            <SelectItem key={y} value={y.toString()} className="font-semibold">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default YearFilter;
