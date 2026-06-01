/**
 * Krok 11.1 — barvy Pavučiny.
 *
 * Konkrétní barvy žijí jako CSS tokeny (`--cmp-*` v `campaign.tokens.css`,
 * navázané přes `var()` na existující design tokeny → themeable, žádný hex tady).
 * Canvas (force graph) nedokáže `var()` přímo — proto `resolveToken` přečte
 * konkrétní barvu přes `getComputedStyle` z kořenového elementu.
 */

import type {
  CampaignRelationshipStatus,
  CampaignSubjectType,
} from './types';

/** Subjekt-typ → název CSS custom property (pro getComputedStyle). */
export const TYPE_TOKEN: Record<CampaignSubjectType, string> = {
  PC: '--cmp-pc',
  NPC: '--cmp-npc',
  FACTION: '--cmp-faction',
  ORG: '--cmp-org',
  STATE: '--cmp-state',
  LOCATION: '--cmp-location',
  OTHER: '--cmp-other',
};

/** Subjekt-typ → `var(--cmp-*)` (pro CSS-in-JS / inline style badge). */
export function typeCssVar(type: CampaignSubjectType): string {
  return `var(${TYPE_TOKEN[type]})`;
}

export interface EdgeStyle {
  /** Vzor čárkování pro `setLineDash` ([] = plná). */
  dash: number[];
  /** Základní průhlednost hrany. */
  opacity: number;
  /** Krizový vztah → pulzování. */
  pulse: boolean;
}

export const STATUS_EDGE_STYLE: Record<CampaignRelationshipStatus, EdgeStyle> = {
  active: { dash: [], opacity: 1, pulse: false },
  dormant: { dash: [4, 4], opacity: 0.6, pulse: false },
  crisis: { dash: [], opacity: 1, pulse: true },
  closed: { dash: [2, 6], opacity: 0.35, pulse: false },
};

/** Valence → token barvy hrany (−3 červená, 0 šedá, +3 zelená). */
export function valenceToken(valence: number): string {
  if (valence < 0) return '--cmp-val-neg';
  if (valence > 0) return '--cmp-val-pos';
  return '--cmp-val-zero';
}

/** Intenzita |valence| → alpha 0.4..1 (slabý vztah bledší, silný sytější). */
export function valenceIntensity(valence: number): number {
  return Math.min(1, 0.4 + (Math.abs(valence) / 3) * 0.6);
}

/**
 * Přečte konkrétní barvu CSS tokenu z elementu (pro canvas).
 * V prostředí bez computed stylů (jsdom) vrátí `fallback`.
 */
export function resolveToken(
  rootEl: Element | null | undefined,
  token: string,
  fallback = 'gray',
): string {
  if (!rootEl || typeof getComputedStyle !== 'function') return fallback;
  const value = getComputedStyle(rootEl).getPropertyValue(token).trim();
  return value || fallback;
}
