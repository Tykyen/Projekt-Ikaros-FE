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

/**
 * Hluboký topik Tier 0 (06 §5.1b — kanonický číselník ID; spec 26.6).
 * Tělo = typované bloky, ne markdown (žádný parser v bundlu, žádné XSS).
 * `source` kotví tvrzení do docs/funkce/ (řetěz pravdy 06 §2).
 */
export interface HelpTopic {
  /** Stabilní ID z kanonického číselníku 06 §5.1b (deep-link, dismiss, telemetrie). */
  id: string;
  title: string;
  /** Synonyma/žargon pro budoucí fulltext (S2). */
  tags: string[];
  /** Kde se topik nabízí v bloku „K věci" (typováno proti registru rout). */
  routes: RoutePattern[];
  /** undefined = všichni. Filtruje NABÍDKU karty, ne obsah (minAudienceNote). */
  audience?: VypravecAudience[];
  /** Vysvětlení pro publikum POD prahem („tohle dělá tvůj PJ"). */
  minAudienceNote?: string;
  /** Odstavce 1–3 věty; kroky = číslovaný postup (šablona TOPIK 06 §4.1). */
  body: { odstavce: string[]; kroky?: string[] };
  /** Max 2 navigační akce (deep-link v rámci platformy). */
  akce?: { label: string; to: string }[];
  /** Kotva do docs/funkce/ (kapitola NN) + datum posledního ověření. */
  source: { kapitola: string };
  verifiedAt: string;
  /** Poctivost u 🚧 (06 §4.2): 'funkcni' | 'castecne' | 'stub'. */
  status: 'funkcni' | 'castecne' | 'stub';
}

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
