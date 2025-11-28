import { useEffect, useState } from 'react';

/**
 * useDebounce Hook
 * 
 * Custom React hook untuk debouncing nilai. Berguna untuk mengurangi
 * frekuensi update, terutama untuk search inputs atau API calls.
 * 
 * @template T - Type dari nilai yang akan di-debounce
 * @param value - Nilai yang akan di-debounce
 * @param delay - Delay dalam milliseconds (default: 300ms)
 * @returns Nilai yang sudah di-debounce
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   // API call dengan debounced value
 *   fetchData(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 * 
 * Performance impact:
 * - Mengurangi API calls hingga ~70% saat user mengetik
 * - Mencegah excessive re-renders
 * - Meningkatkan responsiveness aplikasi
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout untuk update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout jika value berubah sebelum delay selesai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
