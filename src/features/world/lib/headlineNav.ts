/**
 * 12.2 — vlastní navigace světa (headline builder).
 *
 * Čistá logika: konverze `HeadlineNode[]` → render tvar nav skupin (sdílený s
 * `WorldLayout`) + immutable tree operace pro editor. Vše bez Reactu, ať jde
 * testovat samostatně.
 */
import type { HeadlineNode } from '@/shared/types';

/* ── Sdílený render tvar nav (used i pro systémovou nav ve WorldLayout) ── */
export interface NavLinkItem {
  readonly label: string;
  /** Cílová cesta. Chybí u rozbalovací položky (`children`). */
  readonly to?: string;
  readonly id?: string;
  readonly external?: boolean;
  /** 12.3 — vnořený podseznam (accordion v dropdownu), např. „Skupiny". */
  readonly children?: ReadonlyArray<NavLinkItem>;
}
export type NavNode =
  | {
      readonly label: string;
      readonly items: ReadonlyArray<NavLinkItem>;
      readonly id?: undefined;
      readonly to?: undefined;
    }
  | {
      readonly id: string;
      readonly label: string;
      readonly to: string;
      readonly items?: undefined;
    };

/** Externí odkaz = absolutní http(s) URL (render s ↗, otevře mimo svět). */
export function isExternalHref(to: string | undefined): boolean {
  return !!to && /^https?:\/\//i.test(to);
}

/**
 * Převede uložený `customHeadline` na nav skupiny pro headline lištu.
 * - `isGroup` → dropdown s `children` (jen platné odkazy s `to`).
 * - jinak → top-level odkaz (musí mít `to`).
 * Prázdné skupiny a odkazy bez `to` se vynechají (defensivně).
 * `id` u vlastních uzlů prefixujeme `custom:` — nekoliduje s `hiddenNavItems`
 * whitelistem ani s klíči systémové nav.
 */
export function headlineToNavGroups(
  nodes: readonly HeadlineNode[] | undefined,
): NavNode[] {
  if (!nodes?.length) return [];
  const out: NavNode[] = [];
  for (const node of nodes) {
    const label = node.label?.trim();
    if (!label) continue;
    if (node.isGroup) {
      const items: NavLinkItem[] = (node.children ?? [])
        .filter((c) => c.label?.trim() && c.to?.trim())
        .map((c) => ({
          label: c.label.trim(),
          to: c.to!.trim(),
          external: isExternalHref(c.to),
        }));
      if (items.length === 0) continue;
      out.push({ label, items });
    } else {
      const to = node.to?.trim();
      if (!to) continue;
      out.push({ id: `custom:${node.id}`, label, to });
    }
  }
  return out;
}

/* ── Tree operace (immutable; vrací nové pole) ── */

export function makeNodeId(): string {
  // crypto.randomUUID dostupné v moderních prohlížečích i jsdom (vitest).
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `n${Date.now()}${Math.random().toString(16).slice(2)}`;
}

export function addGroup(
  nodes: readonly HeadlineNode[],
  label: string,
): HeadlineNode[] {
  return [
    ...nodes,
    { id: makeNodeId(), label, isGroup: true, children: [] },
  ];
}

/**
 * Přidá odkaz. `groupId === null` → top-level uzel. Jinak vloží do `children`
 * dané skupiny (1 úroveň zanoření).
 */
export function addLink(
  nodes: readonly HeadlineNode[],
  label: string,
  to: string,
  groupId: string | null,
): HeadlineNode[] {
  const link: HeadlineNode = { id: makeNodeId(), label, isGroup: false, to };
  if (groupId === null) return [...nodes, link];
  return nodes.map((n) =>
    n.id === groupId && n.isGroup
      ? { ...n, children: [...(n.children ?? []), link] }
      : n,
  );
}

/** Smaže uzel na libovolné úrovni (top-level i v children). */
export function removeNode(
  nodes: readonly HeadlineNode[],
  id: string,
): HeadlineNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children
        ? { ...n, children: n.children.filter((c) => c.id !== id) }
        : n,
    );
}

/** Přejmenuje uzel (top-level i child). */
export function renameNode(
  nodes: readonly HeadlineNode[],
  id: string,
  label: string,
): HeadlineNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, label };
    if (n.children?.some((c) => c.id === id)) {
      return {
        ...n,
        children: n.children.map((c) => (c.id === id ? { ...c, label } : c)),
      };
    }
    return n;
  });
}

/** Změní cílovou cestu odkazu (top-level i child). */
export function setNodeTo(
  nodes: readonly HeadlineNode[],
  id: string,
  to: string,
): HeadlineNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, to };
    if (n.children?.some((c) => c.id === id)) {
      return {
        ...n,
        children: n.children.map((c) => (c.id === id ? { ...c, to } : c)),
      };
    }
    return n;
  });
}

function swap<T>(arr: readonly T[], i: number, j: number): T[] {
  const copy = arr.slice();
  [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  return copy;
}

/**
 * Posune uzel nahoru/dolů v rámci jeho sourozenců (top-level nebo uvnitř
 * skupiny). `dir = -1` nahoru, `+1` dolů. Mimo rozsah = beze změny.
 */
export function moveNode(
  nodes: readonly HeadlineNode[],
  id: string,
  dir: -1 | 1,
): HeadlineNode[] {
  const topIdx = nodes.findIndex((n) => n.id === id);
  if (topIdx !== -1) {
    const j = topIdx + dir;
    if (j < 0 || j >= nodes.length) return nodes.slice();
    return swap(nodes, topIdx, j);
  }
  return nodes.map((n) => {
    if (!n.children) return n;
    const idx = n.children.findIndex((c) => c.id === id);
    if (idx === -1) return n;
    const j = idx + dir;
    if (j < 0 || j >= n.children.length) return n;
    return { ...n, children: swap(n.children, idx, j) };
  });
}
