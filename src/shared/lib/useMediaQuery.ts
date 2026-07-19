import { useEffect, useState } from 'react';

/**
 * Reaktivní CSS media query v JS. Vrací `true`, když dotaz odpovídá.
 *
 * Použití: sladit chování JS s CSS breakpointem — např. focus trap smí být
 * aktivní jen v mobilním „šuplíkovém" režimu (`useMediaQuery('(max-width: 1024px)')`),
 * ne na desktopu, kde je tentýž prvek trvalý sloupec.
 *
 * SSR-safe (bez `window` vrací `false`); posluchač `change` reaguje na resize
 * i orientaci za běhu. Vzor navazuje na `useCoarsePointer`.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    // Sync i při změně dotazu (nový breakpoint) a při resize/orientaci.
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
