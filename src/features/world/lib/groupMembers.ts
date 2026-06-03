/**
 * 12.3 — logika skupin členů pro záložku „Informace".
 *
 * Stránka skupiny zobrazuje JEN členy s přiřazenou postavou (`characterPath`)
 * a rolí Hráč+ (spec R4). Skupiny = `WorldSettings.customGroups`; členové bez
 * skupiny (nebo se skupinou mimo customGroups) spadají do „Nezařazení".
 */
import { WorldRole, type WorldMembership } from '@/shared/types';

/** Rezervovaný klíč skupiny „Nezařazení" v URL (`/skupina/__none__`). */
export const UNGROUPED_KEY = '__none__';
export const UNGROUPED_LABEL = 'Nezařazení';

/**
 * Člen je „hrající" = zobrazí se na stránce skupiny: má přiřazenou postavu a
 * roli Hráč a výš. Bez postavy se nezobrazí nikdo (ani PJ/PomocnyPJ).
 */
export function isPlayingMember(m: WorldMembership): boolean {
  return !!m.characterPath && m.role >= WorldRole.Hrac;
}

/** URL klíč pro skupinu (název → bezpečný segment). */
export function encodeGroupKey(group: string): string {
  return encodeURIComponent(group);
}

/** Z URL klíče zpět na název skupiny; `__none__` → null (Nezařazení). */
export function decodeGroupKey(key: string): string | null {
  if (key === UNGROUPED_KEY) return null;
  return decodeURIComponent(key);
}

/**
 * Klíč skupiny, do které člen patří vůči seznamu `customGroups`. Member bez
 * skupiny nebo se skupinou mimo seznam → `UNGROUPED_KEY`.
 */
export function memberGroupKey(
  m: WorldMembership,
  customGroups: readonly string[],
): string {
  if (m.group && customGroups.includes(m.group)) return encodeGroupKey(m.group);
  return UNGROUPED_KEY;
}

/**
 * Vyfiltruje hrající členy patřící do dané skupiny. `groupName === null` =
 * Nezařazení (bez skupiny / skupina mimo customGroups).
 */
export function membersInGroup(
  members: readonly WorldMembership[],
  groupName: string | null,
  customGroups: readonly string[],
): WorldMembership[] {
  return members.filter((m) => {
    if (!isPlayingMember(m)) return false;
    const inCustom = !!m.group && customGroups.includes(m.group);
    if (groupName === null) return !inCustom; // Nezařazení
    return m.group === groupName && inCustom;
  });
}

export interface GroupNavEntry {
  key: string;
  label: string;
}

/**
 * Položky skupin pro dropdown „Informace": všechny `customGroups` + Nezařazení.
 * (Bez members dotazu — prázdné skupiny ukáže stránka empty statem, spec R6.)
 */
export function buildGroupNavEntries(
  customGroups: readonly string[],
): GroupNavEntry[] {
  return [
    ...customGroups.map((g) => ({ key: encodeGroupKey(g), label: g })),
    { key: UNGROUPED_KEY, label: UNGROUPED_LABEL },
  ];
}
