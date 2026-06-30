/**
 * Shadowrun 6e — bestie adaptér `systemStats` → view-model pro `ShadowrunBestieBody`.
 *
 * Sdílí ho bestie panel na mapě (`ShadowrunBestiePanel`, token.systemStats) i
 * v chatu (`ShadowrunChatBestiePanel`, combatant/bestie.systemStats) → 0 drift.
 * Pure funkce; každý panel řeší jen perzistenci (token update / combatant patch).
 *
 * Datový model (klíče s tečkou = flat klíče v systemStats, ne nested):
 *  - fyzický záznamník = damageable `health.current` (zbývá = max − zaplněné;
 *    spawn seed current=max = bez zranění). HP bar na tokenu z toho čte.
 *  - omráčení = `stun_cur` zaplněné boxy (jen postih, ne HP bar).
 *  - útoky/dovednosti drží PŘÍMÝ pool (k6); atributy klik = pool o velikosti
 *    atributu. Postih do poolů sdílí `woundPenalty` z deníkového `shared.ts`.
 */
import { SR_CORE_ATTRS } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/shadowrun/constants';
import { woundPenalty } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/shadowrun/shared';

export interface SrBestieAttr {
  key: string;
  code: string;
  label: string;
  group: 'phys' | 'mental';
  value: number;
}
export interface SrBestieWeapon {
  name: string;
  type: string;
  dmg: string;
  pool: number;
}
export interface SrBestieSkill {
  name: string;
  attr: string;
  pool: number;
}
export interface SrBestiePower {
  name: string;
  desc: string;
}
export interface SrBestieBox {
  idx: number;
  on: boolean;
}

export interface ShadowrunBestieView {
  profile: string;
  physMax: number;
  physCur: number;
  stunMax: number;
  stunCur: number;
  /** Celkový postih do poolů (−1 / 3 zaplněné boxy, oba záznamníky). */
  woundPen: number;
  defense: number;
  armor: number;
  movement: number;
  initBase: number;
  attrs: SrBestieAttr[];
  physBoxes: SrBestieBox[];
  stunBoxes: SrBestieBox[];
  weapons: SrBestieWeapon[];
  skills: SrBestieSkill[];
  powers: SrBestiePower[];
}

export const clampStat = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

function num(stats: Record<string, unknown>, key: string, fb = 0): number {
  const v = stats[key];
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fb;
}
function str(stats: Record<string, unknown>, key: string): string {
  const v = stats[key];
  return typeof v === 'string' ? v : '';
}
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

export function shadowrunBestieView(
  stats: Record<string, unknown>,
): ShadowrunBestieView {
  const physMax = Math.max(1, num(stats, 'health.max', 11));
  const physCur = clampStat(num(stats, 'health.current', physMax), 0, physMax);
  const stunMax = Math.max(0, num(stats, 'stun_max', 10));
  const stunCur = clampStat(num(stats, 'stun_cur', 0), 0, stunMax);

  const physFilled = physMax - physCur;
  const woundPen = woundPenalty(physFilled, stunCur);

  const attrs: SrBestieAttr[] = SR_CORE_ATTRS.map((a) => ({
    key: a.key,
    code: a.code,
    label: a.label,
    group: a.group,
    value: num(stats, `attr_${a.key}`, 0),
  }));

  const physBoxes: SrBestieBox[] = Array.from({ length: physMax }, (_, i) => ({
    idx: i,
    on: i < physFilled,
  }));
  const stunBoxes: SrBestieBox[] = Array.from({ length: stunMax }, (_, i) => ({
    idx: i,
    on: i < stunCur,
  }));

  const weapons = parseArr<Partial<SrBestieWeapon>>(stats.weapons)
    .filter((w) => w.name)
    .map((w) => ({
      name: String(w.name),
      type: String(w.type ?? ''),
      dmg: String(w.dmg ?? ''),
      pool: typeof w.pool === 'number' ? w.pool : parseInt(String(w.pool ?? 0), 10) || 0,
    }));

  const skills = parseArr<Partial<SrBestieSkill>>(stats.skills)
    .filter((sk) => sk.name)
    .map((sk) => ({
      name: String(sk.name),
      attr: String(sk.attr ?? ''),
      pool: typeof sk.pool === 'number' ? sk.pool : parseInt(String(sk.pool ?? 0), 10) || 0,
    }));

  const powers = parseArr<Partial<SrBestiePower>>(stats.powers)
    .filter((p) => p.name)
    .map((p) => ({ name: String(p.name), desc: String(p.desc ?? '') }));

  return {
    profile: str(stats, 'profile'),
    physMax,
    physCur,
    stunMax,
    stunCur,
    woundPen,
    defense: num(stats, 'defense', 0),
    armor: num(stats, 'armor', 0),
    movement: num(stats, 'movement', 10),
    initBase: num(stats, 'initiative.base', 7),
    attrs,
    physBoxes,
    stunBoxes,
    weapons,
    skills,
    powers,
  };
}

/**
 * Patch po kliknutí na fyzický box `i` (damageable count model:
 * zaplněné = max − current). Klik na poslední zaplněný = odškrtne (i), jinak
 * naplní po `i` včetně (i+1).
 */
export function shadowrunPhysTogglePatch(
  stats: Record<string, unknown>,
  i: number,
): Record<string, unknown> {
  const physMax = Math.max(1, num(stats, 'health.max', 11));
  const physCur = clampStat(num(stats, 'health.current', physMax), 0, physMax);
  const filled = physMax - physCur;
  const newFilled = i + 1 === filled ? i : i + 1;
  return { 'health.current': clampStat(physMax - newFilled, 0, physMax) };
}

/** Patch po kliknutí na box omráčení `i` (přímý count `stun_cur`). */
export function shadowrunStunTogglePatch(
  stats: Record<string, unknown>,
  i: number,
): Record<string, unknown> {
  const stunMax = Math.max(0, num(stats, 'stun_max', 10));
  const cur = clampStat(num(stats, 'stun_cur', 0), 0, stunMax);
  const next = i + 1 === cur ? i : i + 1;
  return { stun_cur: clampStat(next, 0, stunMax) };
}
