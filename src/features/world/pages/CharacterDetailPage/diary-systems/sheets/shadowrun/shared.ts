/**
 * Shadowrun 6e — sdílená matematika + datové tvary deníku.
 *
 * Jeden zdroj pravdy pro výpočetní jádro: používá ho **deník** (`ShadowrunSheet`)
 * i **combat panel** na mapě/chatu (`ShadowrunCombatPanel`) → 0 drift mezi
 * listem a panelem. Bez JSX (čistá logika) — combat panel `.tsx` reusuje sekce
 * z `ShadowrunSheet.tsx`, ale matematiku bere odsud.
 */
import type { CdAccess } from '../../_shared/cdAccess';
import { SR_ATTR_KEYS, SR_WOUND_STEP, ceilHalf } from './constants';

// ── datové tvary (customData `sr_*`) ───────────────────────────
export interface SrSkill {
  name: string;
  attr: string;
  val: string;
  spec: string;
}
export interface SrWeapon {
  name: string;
  type: string;
  ar: string;
  dmg: string;
  attr: string;
  val: string;
  spec: string;
}
export interface SrSpell {
  name: string;
  type: string;
  rng: string;
  dur: string;
  drain: string;
}
/** Generický 3-sloupcový řádek (síly/zbroj/kontakty/aug…). */
export interface SrRow3 {
  name: string;
  a: string;
  b: string;
}

export const int = (s: string): number => parseInt(s, 10) || 0;

export type Attrs = Record<string, number>;

/** Načte 8 hlavních atributů z customData (`sr_attr_<key>`). */
export function readAttrs(cda: CdAccess): Attrs {
  const o: Attrs = {};
  for (const k of SR_ATTR_KEYS) o[k] = int(cda.g(`attr_${k}`, '0'));
  return o;
}

/** Dice pool = atribut + hodnocení (+2 specializace) − postih (min 0). */
export function poolOf(
  attrs: Attrs,
  attr: string,
  val: string,
  spec: string,
  woundPen: number,
): number {
  return Math.max(0, (attrs[attr] ?? 0) + int(val) + (spec ? 2 : 0) - woundPen);
}

/** Celkový postih z obou záznamníků (−1 za každé 3 zaplněné boxy). */
export function woundPenalty(physFilled: number, stunFilled: number): number {
  return (
    Math.floor(physFilled / SR_WOUND_STEP) +
    Math.floor(stunFilled / SR_WOUND_STEP)
  );
}

/** Součet hodnocení zbroje (pro HO). */
export function armorTotalOf(cda: CdAccess): number {
  return cda.parseJsonArr<SrRow3>('armor').reduce((s, a) => s + int(a.a), 0);
}

export interface SrDerived {
  init: number;
  dr: number;
  composure: number;
  judge: number;
  memory: number;
  lift: number;
  physMax: number;
  stunMax: number;
}

/** Odvozené hodnoty SR6 z atributů (+ zbroj pro HO). */
export function srDerived(attrs: Attrs, armorTotal: number): SrDerived {
  return {
    init: (attrs.rea ?? 0) + (attrs.int ?? 0),
    dr: (attrs.bod ?? 0) + armorTotal,
    composure: (attrs.wil ?? 0) + (attrs.cha ?? 0),
    judge: (attrs.wil ?? 0) + (attrs.int ?? 0),
    memory: (attrs.log ?? 0) + (attrs.wil ?? 0),
    lift: (attrs.str ?? 0) + (attrs.bod ?? 0),
    physMax: 8 + ceilHalf(attrs.bod ?? 0),
    stunMax: 8 + ceilHalf(attrs.wil ?? 0),
  };
}

/** Hero meta řádky (sdílené list i print). */
export const HERO_META: { key: string; label: string }[] = [
  { key: 'realname', label: 'Jméno' },
  { key: 'race', label: 'Metarasa' },
  { key: 'role_note', label: 'Archetyp' },
  { key: 'rep', label: 'Pověst' },
  { key: 'notoriety', label: 'Hledanost' },
  { key: 'public', label: 'Veřejné povědomí' },
];
