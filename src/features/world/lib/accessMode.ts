import type { World } from '@/shared/types';

/**
 * Spec 5.1 — sdílený zdroj pravdy pro lidsky čitelné labely `accessMode`.
 * Importuje `WorldDetailHero` (badge v hero banneru) i `WorldLayout`
 * (badge v headeru světa) — žádná duplicitní mapa.
 */
export const ACCESS_LABELS: Record<World['accessMode'], string> = {
  public: 'Veřejný',
  open: 'Veřejný se schválením',
  private: 'Soukromý',
  closed: 'Uzavřený',
};

/** Vrátí český label pro `accessMode`; fallback na surovou hodnotu. */
export function accessModeLabel(mode: string): string {
  return ACCESS_LABELS[mode as World['accessMode']] ?? mode;
}
