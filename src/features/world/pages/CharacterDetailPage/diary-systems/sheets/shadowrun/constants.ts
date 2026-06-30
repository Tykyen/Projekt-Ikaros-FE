/**
 * Shadowrun 6e (Sixth World) — konstanty deníku.
 *
 * Reálný 6e model (ne generická rešerše): 8 hlavních atributů + speciální
 * (Hrana/Esence/Magie-Rezonance). Odvozené hodnoty a velikosti záznamníků se
 * počítají v `ShadowrunSheet` z těchto atributů (výpočetní jádro — krok B).
 */

export interface SrAttr {
  /** Klíč v customData (`sr_attr_<key>`). */
  key: string;
  /** Krátký kód (HUD). */
  code: string;
  /** Lidský název. */
  label: string;
  /** Skupina pro vizuální odlišení (border accent). */
  group: 'phys' | 'mental';
}

/** 8 hlavních atributů (reálné SR6 6e). */
export const SR_CORE_ATTRS: SrAttr[] = [
  { key: 'bod', code: 'TĚL', label: 'Tělo', group: 'phys' },
  { key: 'agi', code: 'OBR', label: 'Obratnost', group: 'phys' },
  { key: 'rea', code: 'REA', label: 'Reakce', group: 'phys' },
  { key: 'str', code: 'SÍL', label: 'Síla', group: 'phys' },
  { key: 'wil', code: 'VŮL', label: 'Vůle', group: 'mental' },
  { key: 'log', code: 'LOG', label: 'Logika', group: 'mental' },
  { key: 'int', code: 'INT', label: 'Intuice', group: 'mental' },
  { key: 'cha', code: 'CHA', label: 'Charisma', group: 'mental' },
];

/** Kód → atribut (pro výběr u dovedností/zbraní). */
export const SR_ATTR_BY_KEY: Record<string, SrAttr> = Object.fromEntries(
  SR_CORE_ATTRS.map((a) => [a.key, a]),
);

/** Pořadí klíčů hlavních atributů (pro selecty). */
export const SR_ATTR_KEYS = SR_CORE_ATTRS.map((a) => a.key);

/** Matrix atributy zařízení (Útok / Maskování / Zpracování / Firewall). */
export const SR_MATRIX_STATS: { key: string; code: string; label: string }[] = [
  { key: 'mat_atk', code: 'A', label: 'Útok' },
  { key: 'mat_slz', code: 'M', label: 'Maskování' },
  { key: 'mat_dp', code: 'Z', label: 'Zpracování' },
  { key: 'mat_fw', code: 'F', label: 'Firewall' },
];

/** Velikost Matrix záznamníku (fixní 12 boxů — SR6 device condition). */
export const SR_MATRIX_TRACK = 12;

/** −1 postih za každé N zaplněných boxů záznamníku. */
export const SR_WOUND_STEP = 3;

/** ⌈n/2⌉ — pomocná pro velikost záznamníků (8 + ⌈atr/2⌉). */
export function ceilHalf(n: number): number {
  return Math.ceil(n / 2);
}
