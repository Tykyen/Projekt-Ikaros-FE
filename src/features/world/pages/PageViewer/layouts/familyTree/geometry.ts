import type { FamilyPerson, FamilyUnion } from '../../../api/pages.types';

/**
 * 17.7 — geometrie vizuálního rodokmenu. Sdílené mezi náhledem
 * (`FamilyTreeLayout`) a editorem (`FamilyTreeEditor`):
 *  - rozměrové konstanty uzlu (musí sedět s CSS `.node` ve family-tree.module.css),
 *  - `computeLinks` = ortogonální spojnice (manželství + rodič→dítě) jako SVG dráhy,
 *  - `autoLayout` = plnohodnotné generační srovnání (tidy-tree) bez překryvů.
 */

// Rozměry uzlu — držet v souladu s .node v family-tree.module.css.
export const NODE_W = 160;
/** Y střed medailonu od horní hrany uzlu (padding-top 12 + půl medailonu 38). */
export const MED_CY = 50;

// Auto-layout mezery.
const GEN_GAP = 300; // vertikální rozteč generací
const SIB_GAP = 44; // vodorovná mezera mezi sourozeneckými subtree
const COUPLE_STEP = 196; // rozteč levých hran manželů (NODE_W 160 + mezera 36)
const MARGIN = 60; // okraj plátna po normalizaci

export interface Pt {
  x: number;
  y: number;
}

/** Střed uzlu na ose X (uzly kotví levým horním rohem). */
function cx(p: FamilyPerson): number {
  return p.x + NODE_W / 2;
}

/**
 * Ortogonální spojnice. Vrací dvě SVG dráhy: `marriage` (vodorovné manželské
 * linky) a `links` (svislice pár→sběrnice→děti). Kreslí se měřením uložených
 * pozic `x,y`, takže sedí i po ručním tažení.
 */
export function computeLinks(
  people: FamilyPerson[],
  unions: FamilyUnion[],
): { marriage: string; links: string } {
  const byId = new Map(people.map((p) => [p.id, p]));
  let marriage = '';
  let links = '';

  for (const u of unions) {
    const a = byId.get(u.aId);
    if (!a) continue;
    const b = u.bId ? byId.get(u.bId) : undefined;
    const yM = (b ? Math.min(a.y, b.y) : a.y) + MED_CY;
    const midX = b ? (cx(a) + cx(b)) / 2 : cx(a);

    if (b) {
      const left = Math.min(cx(a), cx(b));
      const right = Math.max(cx(a), cx(b));
      // spoj od okraje medailonu k okraji medailonu (½ medailonu ≈ 40)
      marriage += `M ${left + 40} ${yM} H ${right - 40} `;
    }

    const kids = (u.childIds ?? [])
      .map((id) => byId.get(id))
      .filter((k): k is FamilyPerson => !!k);
    if (kids.length) {
      const kidTop = Math.min(...kids.map((k) => k.y));
      const busY = yM + (kidTop - yM) * 0.52;
      links += `M ${midX} ${yM} V ${busY} `;
      const kidCx = kids.map(cx);
      links += `M ${Math.min(...kidCx)} ${busY} H ${Math.max(...kidCx)} `;
      for (const k of kids) links += `M ${cx(k)} ${busY} V ${k.y - 2} `;
    }
  }
  return { marriage, links };
}

/**
 * „Srovnat" — generační tidy-tree layout. Vrací nové pozice `id → {x,y}`.
 *
 * Postup: kořeni = osoby, které nejsou ničím dítětem. Rekurzivně umístíme
 * potomky každého svazku (cursor-based, bez překryvů), pak pár vycentrujeme
 * nad jejich středem. Generace = hloubka rekurze (y). Manžel se pokládá vedle.
 *
 * Omezení v1: každá osoba se umístí jen jednou (primární svazek = první, kde je
 * partnerem). Druhé sňatky / sdílené děti dostanou jen hrany, ne vlastní blok —
 * dokonalý layout propletených linií je mimo v1 (viz spec 17.7).
 */
export function autoLayout(
  people: FamilyPerson[],
  unions: FamilyUnion[],
): Record<string, Pt> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const pos: Record<string, Pt> = {};
  const placed = new Set<string>();

  // primární svazek osoby (první, kde vystupuje jako partner)
  const partnerUnion = new Map<string, FamilyUnion>();
  for (const u of unions) {
    if (!partnerUnion.has(u.aId)) partnerUnion.set(u.aId, u);
    if (u.bId && !partnerUnion.has(u.bId)) partnerUnion.set(u.bId, u);
  }
  const isChild = new Set(unions.flatMap((u) => u.childIds ?? []));

  let cursor = 0;

  function layout(
    personId: string,
    gen: number,
  ): { left: number; right: number; center: number } | null {
    if (placed.has(personId) || !byId.has(personId)) return null;
    const y = gen * GEN_GAP;
    const u = partnerUnion.get(personId);
    const partnerId =
      u && u.bId ? (u.aId === personId ? u.bId : u.aId) : undefined;
    const kids = u
      ? (u.childIds ?? []).filter((c) => byId.has(c) && !placed.has(c))
      : [];

    placed.add(personId);
    if (partnerId) placed.add(partnerId);

    if (kids.length === 0) {
      // list — pár bez dětí nebo samotná osoba
      const x = cursor;
      pos[personId] = { x, y };
      let right = x + NODE_W;
      let center = x + NODE_W / 2;
      if (partnerId && byId.has(partnerId)) {
        const px = x + COUPLE_STEP;
        pos[partnerId] = { x: px, y };
        right = px + NODE_W;
        center = (x + px + NODE_W) / 2;
      }
      cursor = Math.max(cursor, right + SIB_GAP);
      return { left: x, right, center };
    }

    // nejdřív umísti potomky
    const kidCenters: number[] = [];
    let childLeft = Infinity;
    let childRight = -Infinity;
    for (const c of kids) {
      const r = layout(c, gen + 1);
      if (r) {
        kidCenters.push(r.center);
        childLeft = Math.min(childLeft, r.left);
        childRight = Math.max(childRight, r.right);
      }
    }
    const kidsCenter = kidCenters.length
      ? (kidCenters[0] + kidCenters[kidCenters.length - 1]) / 2
      : cursor + NODE_W / 2;

    // pár vycentrovaný nad dětmi
    let ax: number;
    let rightEdge: number;
    if (partnerId && byId.has(partnerId)) {
      ax = kidsCenter - COUPLE_STEP / 2 - NODE_W / 2;
      const px = ax + COUPLE_STEP;
      pos[personId] = { x: ax, y };
      pos[partnerId] = { x: px, y };
      rightEdge = px + NODE_W;
    } else {
      ax = kidsCenter - NODE_W / 2;
      pos[personId] = { x: ax, y };
      rightEdge = ax + NODE_W;
    }

    const left = Math.min(childLeft, ax);
    const right = Math.max(childRight, rightEdge);
    cursor = Math.max(cursor, right + SIB_GAP);
    return { left, right, center: kidsCenter };
  }

  // kořeni v pořadí výskytu (stabilní)
  for (const p of people) {
    if (!isChild.has(p.id) && !placed.has(p.id)) layout(p.id, 0);
  }
  // zbytek (cykly / osamocené / sekundární sňatky) — do spodní řady
  let orphanX = cursor;
  const maxGen = Math.max(0, ...Object.values(pos).map((p) => p.y / GEN_GAP));
  for (const p of people) {
    if (!placed.has(p.id)) {
      pos[p.id] = { x: orphanX, y: (maxGen + 1) * GEN_GAP };
      orphanX += NODE_W + SIB_GAP;
      placed.add(p.id);
    }
  }

  // normalizace na kladné souřadnice s okrajem
  const xs = Object.values(pos).map((p) => p.x);
  const ys = Object.values(pos).map((p) => p.y);
  const dx = MARGIN - Math.min(0, ...xs);
  const dy = MARGIN - Math.min(0, ...ys);
  for (const id of Object.keys(pos)) {
    pos[id] = { x: pos[id].x + dx, y: pos[id].y + dy };
  }
  return pos;
}

/** Rozměr plátna, aby se strom vešel (+ okraj). */
export function contentBounds(people: FamilyPerson[]): {
  width: number;
  height: number;
} {
  if (!people.length) return { width: 800, height: 500 };
  const right = Math.max(...people.map((p) => p.x + NODE_W));
  const bottom = Math.max(...people.map((p) => p.y + 150));
  return { width: right + MARGIN, height: bottom + MARGIN };
}
