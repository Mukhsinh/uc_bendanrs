import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';

const STORAGE_KEY = 'pintar_uc_selected_year';

const getCurrentYear = () => new Date().getFullYear();

const getInitialYear = (): number => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (Number.isFinite(parsed) && parsed >= 2025 && parsed < 2100) {
      return parsed;
    }
  }
  return 2025;
};

interface YearContextValue {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const YearContext = createContext<YearContextValue | undefined>(undefined);

/** Rentang tahun yang tersedia: Mulai dari 2025 hingga 1 tahun ke depan */
const buildAvailableYears = (): number[] => {
  const current = getCurrentYear();
  const startYear = 2025;
  const years: number[] = [];

  // Ambil tahun tertinggi (current + 1 atau target yang ingin dituju)
  // Untuk saat ini kita batasi sampai current + 1
  for (let y = Math.max(current + 1, startYear); y >= startYear; y--) {
    years.push(y);
  }

  return years;
};

export const YearProvider = ({ children }: { children: ReactNode }) => {
  const [selectedYear, setSelectedYearState] = useState<number>(getInitialYear);

  const setSelectedYear = useCallback((year: number) => {
    setSelectedYearState(year);
    localStorage.setItem(STORAGE_KEY, year.toString());
  }, []);

  const availableYears = useMemo(() => buildAvailableYears(), []);

  const value = useMemo<YearContextValue>(
    () => ({ selectedYear, setSelectedYear, availableYears }),
    [selectedYear, setSelectedYear, availableYears]
  );

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
};

export const useYear = (): YearContextValue => {
  const context = useContext(YearContext);
  if (!context) {
    throw new Error('useYear harus dipakai di dalam YearProvider');
  }
  return context;
};
