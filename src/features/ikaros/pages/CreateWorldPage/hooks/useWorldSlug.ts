import { useEffect, useRef, useState } from 'react';

/**
 * Czech-friendly transliteration map. Pokud uživatel zadá český název,
 * slug se automaticky převede na ASCII-friendly podobu (lowercase, jen
 * `[a-z0-9-]`, max 40 znaků).
 */
const TRANSLIT: Record<string, string> = {
  á: 'a',
  č: 'c',
  ď: 'd',
  é: 'e',
  ě: 'e',
  í: 'i',
  ň: 'n',
  ó: 'o',
  ř: 'r',
  š: 's',
  ť: 't',
  ú: 'u',
  ů: 'u',
  ý: 'y',
  ž: 'z',
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Auto-derive slug z názvu světa. Pokud uživatel slug **ručně** upraví,
 * další změny názvu už ho nepřepíšou (dirty flag). Manuální editace přes
 * `onSlugChange`.
 */
export function useWorldSlug(name: string) {
  const [slug, setSlug] = useState('');
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setSlug(slugify(name));
  }, [name]);

  const onSlugChange = (value: string) => {
    dirtyRef.current = true;
    setSlug(slugify(value));
  };

  return { slug, onSlugChange };
}
