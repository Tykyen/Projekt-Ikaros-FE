/**
 * Spec 26.2 — typy registru Vypravěče (výřez pro D5: RouteHeader).
 * Plný registr (HelpTopic, Anchor, Journey…) přibude s dalšími dny MVP-A —
 * definice viz docs/vypravec/04-architektura.md §2.
 */
import type { RoutePattern } from '@/app/routeRegistry';

/**
 * Publikum odvozené z WorldRole enumu + platformních stavů (04 §2).
 * Žadatel NENÍ audience (membershipPending je stav, ne role).
 */
export type VypravecAudience =
  | 'anon'
  | 'prihlaseny' /* mimo svět */
  | 'ctenar'
  | 'hrac'
  | 'korektor'
  | 'pomocnyPJ'
  | 'pj'
  | 'admin';

/** Kontextová hlavička „Kde jsem" (panel, blok A). */
export interface RouteHeader {
  /** Typováno proti route registru (spec 26.0) — překlep spadne v tsc. */
  route: RoutePattern;
  /** Název místa, jak ho zná uživatel (shodný s navigací). */
  name: string;
  /** 1–2 věty: co tu je a co tu jde dělat. Hlas dle scope (02 §2). */
  blurb: string;
  /** Volitelný aditivní dovětek per publikum (např. rada jen pro PJ). */
  audienceNotes?: Partial<Record<VypravecAudience, string>>;
}
