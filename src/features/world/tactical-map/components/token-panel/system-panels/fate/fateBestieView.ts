/**
 * FATE bestie — sdílený adaptér `systemStats` → view-model pro `FateCombatBody`.
 *
 * Sdílí ho bestie panel na mapě (`FateBestiePanel`, token.systemStats) i v chatu
 * (`FateChatBestiePanel`, combatant.systemStats) → 0 drift. Pure funkce; každý
 * panel si jen řeší perzistenci (token update / combatant patch).
 *
 * Stres bestie = damageable model `health.current` (zbývající kapacita =
 * max − zaškrtnuté boxy; spawn seed current=max = bez stresu).
 */
import { APPROACHES } from '@/features/world/pages/CharacterDetailPage/diary-systems/_shared/FateLikeSheet';
import type {
  FateBox,
  FateAbility,
  FateAspect,
  FateStunt,
} from './FateCombatBody';

export const FATE_CONSEQUENCES = [
  { key: 'mild', label: 'Drobný', value: 2 },
  { key: 'moderate', label: 'Mírný', value: 4 },
  { key: 'severe', label: 'Vážný', value: 6 },
] as const;

export const clampStat = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

function parseArr<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'string' && raw) {
    try {
      const p: unknown = JSON.parse(raw);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function num(stats: Record<string, unknown>, key: string, fb = 0): number {
  const v = stats[key];
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fb;
}

export interface FateBestieView {
  refresh: number;
  fatePoints: number;
  maxBoxes: number;
  used: number;
  boxes: FateBox[];
  abilities: FateAbility[];
  aspects: FateAspect[];
  stunts: FateStunt[];
  consequences: { key: string; label: string; value: number; text: string }[];
}

export function fateBestieView(
  stats: Record<string, unknown>,
  variant: 'fae' | 'core',
): FateBestieView {
  const refresh = num(stats, 'refresh', 3);
  const fatePoints = num(stats, 'fatePoints', refresh);
  const maxBoxes = num(stats, 'health.max', 3);
  const current = num(stats, 'health.current', maxBoxes);
  const used = clampStat(maxBoxes - current, 0, maxBoxes);

  const boxes: FateBox[] = Array.from({ length: Math.max(0, maxBoxes) }, (_, i) => ({
    size: i + 1,
    on: i < used,
  }));

  const abilities: FateAbility[] =
    variant === 'fae'
      ? APPROACHES.map((a) => ({ label: a.label, bonus: num(stats, `appr_${a.key}`, 0) }))
      : parseArr<{ label: string; rating: unknown }>(stats.skills).map((s) => ({
          label: s.label || '—',
          bonus: parseInt(String(s.rating ?? 0), 10) || 0,
        }));

  const aspects: FateAspect[] = [];
  const hc = stats.highConcept;
  if (typeof hc === 'string' && hc) aspects.push({ text: hc, kind: 'hc' });
  parseArr<{ label: string }>(stats.aspects).forEach((a) => {
    if (a.label) aspects.push({ text: a.label, kind: 'other' });
  });

  const stunts: FateStunt[] = parseArr<{ label: string; value: string }>(stats.stunts)
    .filter((s) => s.label)
    .map((s) => ({ name: s.label, desc: s.value ?? '' }));

  const consequences = FATE_CONSEQUENCES.map((c) => ({
    ...c,
    text:
      typeof stats[`cons_${c.key}`] === 'string'
        ? (stats[`cons_${c.key}`] as string)
        : '',
  }));

  return { refresh, fatePoints, maxBoxes, used, boxes, abilities, aspects, stunts, consequences };
}

/** Patch po kliknutí na stres box `i` (count model: used = max − current). */
export function fateStressTogglePatch(
  stats: Record<string, unknown>,
  i: number,
): Record<string, unknown> {
  const maxBoxes = num(stats, 'health.max', 3);
  const current = num(stats, 'health.current', maxBoxes);
  const used = clampStat(maxBoxes - current, 0, maxBoxes);
  const newUsed = i < used ? i : i + 1;
  return { 'health.current': clampStat(maxBoxes - newUsed, 0, maxBoxes) };
}

/** Patch po +/- Body osudu. */
export function fateFatePointsPatch(
  stats: Record<string, unknown>,
  delta: number,
): Record<string, unknown> {
  const refresh = num(stats, 'refresh', 3);
  const fp = num(stats, 'fatePoints', refresh);
  return { fatePoints: clampStat(fp + delta, 0, 20) };
}
