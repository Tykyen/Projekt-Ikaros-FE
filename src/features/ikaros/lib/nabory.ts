import type { Nabor, NaborStrana, NaborMode } from '@/shared/types';

export { timeAgo } from './discussions';

/**
 * 19.3 — filtr + odvozené labely nástěnky náborů.
 * `expired` nábory se z výchozího pohledu skrývají (viz spec 19.3 §6).
 */

export interface NaboryFilter {
  /** `undefined` / `'vse'` = obě strany. */
  strana?: NaborStrana | 'vse';
  system?: string;
  mode?: NaborMode;
  query?: string;
}

export function filterNabory(list: Nabor[], f: NaboryFilter): Nabor[] {
  const q = f.query?.trim().toLowerCase();
  return list.filter((n) => {
    if (n.status === 'expired') return false;
    if (f.strana && f.strana !== 'vse' && n.strana !== f.strana) return false;
    if (f.system && n.system !== f.system) return false;
    if (f.mode && n.mode !== f.mode) return false;
    if (
      q &&
      !n.title.toLowerCase().includes(q) &&
      !n.body.toLowerCase().includes(q)
    )
      return false;
    return true;
  });
}

/** „3/5" nebo null (u `hledam-hru`, kde místa nedávají smysl). */
export function seatsLabel(taken?: number, total?: number): string | null {
  if (total == null) return null;
  return `${taken ?? 0}/${total}`;
}

/** Pole „teček obsazenosti" pro vizuál (plná = obsazená). Prázdné pole = neznámé. */
export function seatDots(taken?: number, total?: number): boolean[] {
  if (total == null || total <= 0) return [];
  const t = Math.min(taken ?? 0, total);
  return Array.from({ length: total }, (_, i) => i < t);
}

export const MODE_LABELS: Record<NaborMode, string> = {
  online: 'Online',
  zivo: 'Naživo',
};

export const STRANA_LABELS: Record<NaborStrana, string> = {
  'hledam-hrace': 'Hledám hráče',
  'hledam-hru': 'Hledám hru',
};
