/**
 * Krok 11.2 — Storyboard: stromová metadata scénáře.
 *
 * BE `CampaignScenario` drží first-class jen `title/order/linkedPageSlug/
 * subjectIds/storylineIds/images/isShared` + schemaless `contentData`. Celý
 * strom příběhu (hierarchie, větvení, obsah, tajné PJ pole, provázání map/
 * bestiáře) ukládáme do `contentData.storyTree` — stejný vzor, jakým 11.1
 * uložila `valence` do schemaless `sideA`.
 *
 * ⚠️ Pořadí (`order`) je v metě, NE ve first-class `order` — BE update DTO
 * pole `order` nemá, přes PUT ho nelze měnit. Strom řadíme dle `meta.order`.
 *
 * ⚠️ Zápis vždy přes `mergeMeta` (read-merge-write) — BE `update` dělá
 * `$set` celého `contentData`, útržkový zápis by zbytek přepsal.
 */

import type { CampaignScenario } from './types';

const STORY_TREE_KEY = 'storyTree';

export type ScenarioStatus = 'draft' | 'active' | 'optional' | 'resolved';
/** 'folder' = Akt/Kapitola (organizace), 'scene' = hratelná scéna (má obsah). */
export type ScenarioKind = 'folder' | 'scene';

/** Mapa-podklad scény (11.2-ext B): obrázek lokace + očíslovaná verze + legenda. */
export interface MapPrep {
  imageUrl?: string;
  /** Tatáž mapa s čísly/značkami. */
  numberedImageUrl?: string;
  /** Vysvětlivky: značka/číslo → popis. */
  legend: { label: string; text: string }[];
}

export interface ScenarioMeta {
  /** null = kořen stromu. */
  parentId: string | null;
  /** Pořadí mezi sourozenci (řazení stromu). */
  order: number;
  kind: ScenarioKind;
  /** Label větve k rodiči (rozcestí dle voleb hráčů), např. „pokud zradí". */
  branchLabel?: string;
  status: ScenarioStatus;
  /** RichText HTML — tělo scény (veřejné/sdílené dle `isShared`). */
  body?: string;
  /** TAJNÉ — jen PJ. */
  gmNotes?: string;
  /** 🎯 cíl scény (tajné). */
  objective?: string;
  /** 🏁 výsledek scény (tajné). */
  outcome?: string;
  /** Provázané `MapScene` (taktická mapa 10.2). */
  mapSceneIds: string[];
  /** Wiki stránky libovolného typu (PC/NPC/Noviny/Lokace…) nad rámec `linkedPageSlug`. */
  pageSlugs: string[];
  /** Předpřipravené bestie z bestiáře (ref na šablonu) pro encounter scény. */
  bestieIds: string[];
  /** Mapa-podklad scény (obrázek + očíslovaná verze + legenda). */
  mapPrep?: MapPrep;
}

export const SCENARIO_STATUSES: ScenarioStatus[] = [
  'draft',
  'active',
  'optional',
  'resolved',
];

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  draft: 'Koncept',
  active: 'Aktivní',
  optional: 'Volitelná',
  resolved: 'Vyřešená',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : [];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isStatus(value: unknown): value is ScenarioStatus {
  return (
    value === 'draft' ||
    value === 'active' ||
    value === 'optional' ||
    value === 'resolved'
  );
}

function parseMapPrep(value: unknown): MapPrep | undefined {
  const raw = asRecord(value);
  if (!raw) return undefined;
  const legendRaw = Array.isArray(raw.legend) ? raw.legend : [];
  const legend = legendRaw
    .map((item) => asRecord(item))
    .filter((r): r is Record<string, unknown> => !!r)
    .map((r) => ({
      label: typeof r.label === 'string' ? r.label : '',
      text: typeof r.text === 'string' ? r.text : '',
    }));
  return {
    imageUrl: optionalString(raw.imageUrl),
    numberedImageUrl: optionalString(raw.numberedImageUrl),
    legend,
  };
}

/**
 * Přečte stromová metadata ze `contentData.storyTree` s defaulty.
 * Robustní na chybějící / poškozený contentData (vrací konzistentní default).
 */
export function getMeta(scenario: CampaignScenario): ScenarioMeta {
  const contentData = asRecord(scenario.contentData) ?? {};
  const raw = asRecord(contentData[STORY_TREE_KEY]) ?? {};
  const parentId =
    typeof raw.parentId === 'string' && raw.parentId ? raw.parentId : null;
  return {
    parentId,
    order: typeof raw.order === 'number' ? raw.order : (scenario.order ?? 0),
    kind: raw.kind === 'folder' ? 'folder' : 'scene',
    branchLabel: optionalString(raw.branchLabel),
    status: isStatus(raw.status) ? raw.status : 'draft',
    body: optionalString(raw.body),
    gmNotes: optionalString(raw.gmNotes),
    objective: optionalString(raw.objective),
    outcome: optionalString(raw.outcome),
    mapSceneIds: stringArray(raw.mapSceneIds),
    pageSlugs: stringArray(raw.pageSlugs),
    bestieIds: stringArray(raw.bestieIds),
    mapPrep: parseMapPrep(raw.mapPrep),
  };
}

/**
 * Read-merge-write: vrátí NOVÝ `contentData` se zmergovaným `storyTree`.
 * Zachová ostatní klíče `contentData` i neměněná pole mety — chrání proti
 * `$set` přepisu (změna `status` nesmí smazat `body` apod.).
 */
export function mergeMeta(
  scenario: CampaignScenario,
  patch: Partial<ScenarioMeta>,
): Record<string, unknown> {
  const contentData = asRecord(scenario.contentData) ?? {};
  const next: ScenarioMeta = { ...getMeta(scenario), ...patch };
  return { ...contentData, [STORY_TREE_KEY]: next };
}

// ── Strom ─────────────────────────────────────────────────────────────────────

export interface ScenarioTreeNode {
  scenario: CampaignScenario;
  meta: ScenarioMeta;
  depth: number;
  children: ScenarioTreeNode[];
}

/** Vrátí `parentId`, pokud existuje a nevede k cyklu; jinak null (→ kořen). */
function resolveParentId(
  id: string,
  metaById: Map<string, ScenarioMeta>,
): string | null {
  const seen = new Set<string>([id]);
  let cursor = metaById.get(id)?.parentId ?? null;
  let firstHop: string | null = null;
  while (cursor) {
    if (!metaById.has(cursor)) return null; // dangling → kořen
    if (seen.has(cursor)) return null; // cyklus → kořen
    if (firstHop === null) firstHop = cursor;
    seen.add(cursor);
    cursor = metaById.get(cursor)?.parentId ?? null;
  }
  return firstHop;
}

function sortNodes(a: ScenarioTreeNode, b: ScenarioTreeNode): number {
  if (a.meta.order !== b.meta.order) return a.meta.order - b.meta.order;
  return a.scenario.title.localeCompare(b.scenario.title, 'cs');
}

/**
 * Poskládá plochý seznam scénářů na strom dle `meta.parentId` + `meta.order`.
 * Cyklus-guard (parentId zpět k sobě) i dangling parent (smazaný rodič) →
 * uzel spadne na kořen, nikdy nezmizí.
 */
export function buildTree(scenarios: CampaignScenario[]): ScenarioTreeNode[] {
  const metaById = new Map<string, ScenarioMeta>();
  for (const s of scenarios) metaById.set(s.id, getMeta(s));

  const nodeById = new Map<string, ScenarioTreeNode>();
  for (const s of scenarios) {
    nodeById.set(s.id, {
      scenario: s,
      meta: metaById.get(s.id)!,
      depth: 0,
      children: [],
    });
  }

  const roots: ScenarioTreeNode[] = [];
  for (const s of scenarios) {
    const node = nodeById.get(s.id)!;
    const parentId = resolveParentId(s.id, metaById);
    const parent = parentId ? nodeById.get(parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const applyDepth = (nodes: ScenarioTreeNode[], depth: number) => {
    nodes.sort(sortNodes);
    for (const n of nodes) {
      n.depth = depth;
      applyDepth(n.children, depth + 1);
    }
  };
  applyDepth(roots, 0);

  return roots;
}

/** Ploché pole uzlů v zobrazovacím pořadí (pre-order) — pro render i klávesovou navigaci. */
export function flattenTree(nodes: ScenarioTreeNode[]): ScenarioTreeNode[] {
  const out: ScenarioTreeNode[] = [];
  const walk = (list: ScenarioTreeNode[]) => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
