/**
 * 16.2e — DrD II: seznamy povolání (názvy + podmiňující povolání).
 *
 * Tohle jsou herní fakta o systému (struktura tvorby postavy), NE chráněný
 * text příruček — proto žijí samostatně, oddělené od katalogu zvláštních
 * schopností [drd2Abilities.ts](./drd2Abilities.ts), který je z UI odpojen
 * (čeká na licenční dohodu s ALTARem). `Drd2Sheet` importuje JEN tento soubor.
 *
 * Zdroj: Přehled tvorby a vývoje povolání v DrD II (základní pravidla + Hry
 * mocných).
 */

export interface ProfDef {
  id: string;
  name: string;
  /** Podmiňující povolání (názvy) — prázdné u základních. */
  requires?: string[];
}

/** Základní povolání (úroveň 0–5). */
export const BASIC_PROFS: ProfDef[] = [
  { id: 'bojovnik', name: 'Bojovník' },
  { id: 'lovec', name: 'Lovec' },
  { id: 'kejklir', name: 'Kejklíř' },
  { id: 'mastickar', name: 'Mastičkář' },
  { id: 'zarikavac', name: 'Zaříkávač' },
];

/** Pokročilá povolání — otevře se při součtu ≥ 6 ve dvou základech (každý ≥ 1). */
export const ADVANCED_PROFS: ProfDef[] = [
  { id: 'valecnik', name: 'Válečník', requires: ['Bojovník', 'Kejklíř'] },
  { id: 'hranicar', name: 'Hraničář', requires: ['Bojovník', 'Lovec'] },
  { id: 'saman', name: 'Šaman', requires: ['Lovec', 'Mastičkář'] },
  { id: 'druid', name: 'Druid', requires: ['Lovec', 'Zaříkávač'] },
  { id: 'lupic', name: 'Lupič', requires: ['Kejklíř', 'Mastičkář'] },
  { id: 'zved', name: 'Zvěd', requires: ['Kejklíř', 'Lovec'] },
  { id: 'vedmak', name: 'Vědmák', requires: ['Mastičkář', 'Bojovník'] },
  { id: 'alchymista', name: 'Alchymista', requires: ['Mastičkář', 'Zaříkávač'] },
  { id: 'carodej', name: 'Čaroděj', requires: ['Zaříkávač', 'Bojovník'] },
  { id: 'mag', name: 'Mág', requires: ['Zaříkávač', 'Kejklíř'] },
];

/** Mistrovská povolání — součet ≥ 6 v podmiňujících pokročilých povoláních. */
export const MASTER_PROFS: ProfDef[] = [
  { id: 'cernoknieznik', name: 'Černokněžník', requires: ['Šaman', 'Alchymista', 'Mág'] },
  { id: 'divotvurce', name: 'Divotvůrce', requires: ['Šaman', 'Druid', 'Alchymista', 'Čaroděj'] },
  { id: 'inkvizitor', name: 'Inkvizitor', requires: ['Zvěd', 'Vědmák', 'Mág'] },
  { id: 'mstitel', name: 'Mstitel', requires: ['Válečník', 'Hraničář', 'Lupič', 'Zvěd'] },
  { id: 'nicitel', name: 'Ničitel', requires: ['Válečník', 'Hraničář', 'Vědmák'] },
  { id: 'paladin', name: 'Paladin', requires: ['Válečník', 'Vědmák', 'Čaroděj'] },
  { id: 'stin', name: 'Stín', requires: ['Lupič', 'Alchymista', 'Mág'] },
  { id: 'vudce', name: 'Vůdce', requires: ['Válečník', 'Lupič', 'Zvěd'] },
  { id: 'zivlomag', name: 'Živlomág', requires: ['Druid', 'Čaroděj'] },
  { id: 'zrec', name: 'Žrec', requires: ['Hraničář', 'Šaman', 'Druid'] },
];

/** Názvy základních povolání pro select „povolání" u ručních ZS. */
export const ALL_PROF_NAMES: string[] = [
  ...BASIC_PROFS.map((p) => p.name),
  ...ADVANCED_PROFS.map((p) => p.name),
  ...MASTER_PROFS.map((p) => p.name),
];
