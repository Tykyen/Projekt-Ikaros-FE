import { useEffect, useState } from 'react';

/**
 * `true` na dotykových zařízeních (telefon/tablet bez myši).
 *
 * Detekuje TYP vstupu přes `matchMedia('(pointer: coarse)')`, ne šířku okna —
 * úzké okno na desktopu zůstává „jemné" (myš), telefon na šířku „hrubé" (prst).
 *
 * Použití: composer pak na mobilu mapuje Enter na nový řádek (odstavec) a
 * odesílá jen tlačítkem; na desktopu Enter dál odesílá.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState<boolean>(() =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setCoarse(mq.matches);
    // 2-in-1 zařízení (Surface) umí přepnout prst↔myš za běhu.
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return coarse;
}
