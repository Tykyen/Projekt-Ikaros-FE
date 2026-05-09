import { useEffect, useState } from 'react';

/**
 * Vrací hodnotu zpožděnou o `ms` milisekund. Kdykoli se vstup změní,
 * timer se resetuje. Použití: live availability check v RegisterModal.
 */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
