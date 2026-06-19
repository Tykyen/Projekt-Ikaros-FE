import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import clsx from 'clsx';
import { PrintButton } from '@/features/world/export/print';
import { SUBJECT_TYPES, TYPE_LABELS } from '../labels';
import {
  STATUS_EDGE_STYLE,
  TYPE_TOKEN,
  resolveToken,
} from '../campaignColors';
import {
  buildGraphData,
  linkPassesFilter,
  neighborIds,
  type GraphLink,
  type GraphNode,
  type ValenceFilter,
} from '../graphData';
import type {
  CampaignRelationship,
  CampaignStoryline,
  CampaignSubject,
} from '../types';
import { GraphLegend } from './GraphLegend';
import s from './campaign.module.css';

const RADIUS: Record<string, number> = {
  PC: 9,
  NPC: 7,
  FACTION: 8,
  ORG: 8,
  STATE: 9,
  LOCATION: 8,
  OTHER: 6,
};

const DIM = 0.12;

interface ResolvedColors {
  type: Record<string, string>;
  valNeg: string;
  valZero: string;
  valPos: string;
  label: string;
  disc: string;
}

/**
 * Pavučina — 2D force graph (canvas) ve stylu „hvězdné mapy kampaně".
 * Uzly = zářící planetky s tváří (avatar), hrany = proudící energetické paprsky.
 * Hustotu řeší interakce: focus mód (klik → ego-síť), filtry, hledání.
 */
export function PavucinaGraph({
  subjects,
  relationships,
  storylines,
  storylineFilter,
  onStorylineFilter,
  imageFor,
  onOpenSubject,
}: {
  subjects: CampaignSubject[];
  relationships: CampaignRelationship[];
  storylines: CampaignStoryline[];
  storylineFilter: string | null;
  onStorylineFilter: (id: string | null) => void;
  imageFor: (s: CampaignSubject) => string | undefined;
  onOpenSubject: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [colors, setColors] = useState<ResolvedColors | null>(null);
  const [, bumpFrame] = useState(0);

  const [focusId, setFocusId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [valFilter, setValFilter] = useState<ValenceFilter>('all');
  const [search, setSearch] = useState('');

  const data = useMemo(() => {
    const g = buildGraphData(subjects, relationships);
    const imgById = new Map(subjects.map((sb) => [sb.id, imageFor(sb)]));
    g.nodes.forEach((n) => {
      n.img = imgById.get(n.id);
    });
    return g;
  }, [subjects, relationships, imageFor]);

  // Subjekty v krizovém vztahu → pulzují.
  const crisisIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of relationships) {
      if (r.status === 'crisis') {
        set.add(r.subjectAId);
        set.add(r.subjectBId);
      }
    }
    return set;
  }, [relationships]);

  // Cache načtených obrázků pro kreslení do uzlu (canvas).
  function getImg(url?: string): HTMLImageElement | null {
    if (!url) return null;
    const cache = imgCache.current;
    let img = cache.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      img.onload = () => bumpFrame((v) => v + 1);
      cache.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  // Rozměry kontejneru.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0)
          setSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rozliš barvy z CSS tokenů (canvas neumí var()).
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const type: Record<string, string> = {};
    for (const t of SUBJECT_TYPES) type[t] = resolveToken(root, TYPE_TOKEN[t]);
    setColors({
      type,
      valNeg: resolveToken(root, '--cmp-val-neg'),
      valZero: resolveToken(root, '--cmp-val-zero'),
      valPos: resolveToken(root, '--cmp-val-pos'),
      label: resolveToken(root, '--text', 'white'),
      disc: resolveToken(root, '--cmp-space-disc', 'black'),
    });
  }, []);

  // Animační smyčka (~30 fps) — drží pulz uzlů a tok částic v hranách živé
  // i poté, co se layout uklidní (force-graph jinak přestane překreslovat).
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (ts: number) => {
      if (ts - last > 33) {
        fgRef.current?.refresh?.();
        last = ts;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Subjekty vybrané linky (filtr „jak vše se vším souvisí" v rámci linky).
  const storylineSubjectIds = useMemo(() => {
    if (!storylineFilter) return null;
    const sl = storylines.find((x) => x.id === storylineFilter);
    return sl ? new Set(sl.subjectIds) : null;
  }, [storylineFilter, storylines]);

  const neighbors = useMemo(
    () => (focusId ? neighborIds(focusId, data.links) : null),
    [focusId, data.links],
  );

  function nodeVisible(id: string, type: string): boolean {
    if (typeFilter.size > 0 && !typeFilter.has(type)) return false;
    if (storylineSubjectIds && !storylineSubjectIds.has(id)) return false;
    if (neighbors && !neighbors.has(id)) return false;
    return true;
  }

  function linkVisible(link: GraphLink): boolean {
    if (!linkPassesFilter(link, valFilter)) return false;
    const sid = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
    const tid = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
    if (storylineSubjectIds && (!storylineSubjectIds.has(sid) || !storylineSubjectIds.has(tid)))
      return false;
    if (neighbors && (!neighbors.has(sid) || !neighbors.has(tid))) return false;
    return true;
  }

  function valColor(v: number, c: ResolvedColors): string {
    return v < 0 ? c.valNeg : v > 0 ? c.valPos : c.valZero;
  }

  function runSearch() {
    const q = search.trim().toLowerCase();
    if (!q) return;
    const hit = data.nodes.find((n) => n.name.toLowerCase().includes(q));
    if (hit) {
      setFocusId(hit.id);
      const ns = neighborIds(hit.id, data.links);
      fgRef.current?.zoomToFit(500, 60, (n: GraphNode) => ns.has(n.id));
    }
  }

  const toggleType = (t: string) =>
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div className={s.graphWrap} ref={wrapRef} data-print-scope>
      <div className={`${s.graphControls} print-hide`}>
        <input
          className={s.graphSearch}
          placeholder="Hledat uzel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Subjekty (uzly)</span>
          <div className={s.graphFilters}>
            {SUBJECT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={clsx(s.chip, typeFilter.has(t) && s.chipOn)}
                onClick={() => toggleType(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Vztahy (hrany)</span>
          <div className={s.graphFilters}>
            {(['all', 'crisis', 'positive', 'negative'] as ValenceFilter[]).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  className={clsx(s.chip, valFilter === f && s.chipOn)}
                  onClick={() => setValFilter(f)}
                >
                  {f === 'all'
                    ? 'Vše'
                    : f === 'crisis'
                      ? 'Krize'
                      : f === 'positive'
                        ? 'Kladné'
                        : 'Záporné'}
                </button>
              ),
            )}
          </div>
        </div>

        {storylines.length > 0 && (
          <div className={`${s.filterGroup} ${s.filterGroupStory}`}>
            <span className={s.filterGroupLabel}>Linky (příběhové)</span>
            <div className={s.graphFilters}>
              <button
                type="button"
                className={clsx(s.chip, !storylineFilter && s.chipOn)}
                onClick={() => onStorylineFilter(null)}
              >
                Vše
              </button>
              {storylines.map((sl) => (
                <button
                  key={sl.id}
                  type="button"
                  className={clsx(s.chip, storylineFilter === sl.id && s.chipOn)}
                  onClick={() =>
                    onStorylineFilter(storylineFilter === sl.id ? null : sl.id)
                  }
                >
                  ◆ {sl.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {focusId && (
          <button
            type="button"
            className={s.chip}
            onClick={() => setFocusId(null)}
          >
            ✕ Zrušit fokus
          </button>
        )}
        <PrintButton title="Vytisknout pavučinu (aktuální pohled)" />
      </div>

      <GraphLegend />

      {colors && (
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={data}
          nodeId="id"
          backgroundColor="transparent"
          cooldownTicks={120}
          onNodeClick={(n: GraphNode) =>
            setFocusId((prev) => (prev === n.id ? null : n.id))
          }
          onNodeRightClick={(n: GraphNode) => onOpenSubject(n.id)}
          onBackgroundClick={() => setFocusId(null)}
          nodeCanvasObject={(
            n: GraphNode,
            ctx: CanvasRenderingContext2D,
            scale: number,
          ) => {
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const vis = nodeVisible(n.id, n.type);
            const color = colors.type[n.type] ?? colors.valZero;
            const isFocus = focusId === n.id;
            const pulse = crisisIds.has(n.id)
              ? (Math.sin(Date.now() / 350) + 1) / 2
              : 0;
            const r = (RADIUS[n.type] ?? 7) * (1 + pulse * 0.14);
            ctx.globalAlpha = vis ? 1 : DIM;

            // Neonová záře (planetka)
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = (isFocus ? 26 : 12) + pulse * 16;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();

            // Tvář (avatar) nebo iniciála
            const img = getImg(n.img);
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r - 1.2, 0, 2 * Math.PI);
            ctx.clip();
            if (img) {
              ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
            } else {
              ctx.fillStyle = colors.disc;
              ctx.fillRect(x - r, y - r, r * 2, r * 2);
              ctx.fillStyle = color;
              ctx.font = `700 ${r}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText((n.name[0] ?? '?').toUpperCase(), x, y + 0.5);
            }
            ctx.restore();

            // Prstenec
            ctx.lineWidth = isFocus ? 2.4 : 1.3;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.stroke();

            // Štítek při přiblížení
            if (scale > 1.1 && vis) {
              ctx.globalAlpha = 1;
              ctx.font = `600 ${11 / scale}px sans-serif`;
              ctx.fillStyle = colors.label;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'alphabetic';
              ctx.fillText(n.name, x, y + r + 10 / scale);
            }
            ctx.globalAlpha = 1;
          }}
          linkCanvasObject={(
            link: GraphLink,
            ctx: CanvasRenderingContext2D,
          ) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const src = link.source as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tgt = link.target as any;
            const sx = src.x ?? 0;
            const sy = src.y ?? 0;
            const tx = tgt.x ?? 0;
            const ty = tgt.y ?? 0;
            const dx = tx - sx;
            const dy = ty - sy;
            const len = Math.hypot(dx, dy) || 1;
            // Řídicí bod zakřivení (kolmice ze středu)
            const curv = 0.16;
            const cx = (sx + tx) / 2 + (-dy / len) * len * curv;
            const cy = (sy + ty) / 2 + (dx / len) * len * curv;

            const style = STATUS_EDGE_STYLE[link.status] ?? STATUS_EDGE_STYLE.active;
            const vis = linkVisible(link);
            const baseAlpha = vis ? style.opacity : DIM;
            const width = 0.6 + (link.strength / 10) * 2.2;
            const colA = valColor(link.valenceA, colors);
            const colB = valColor(link.valenceB, colors);

            ctx.save();
            // Energetický paprsek — gradient valence A→B + záře
            const grad = ctx.createLinearGradient(sx, sy, tx, ty);
            grad.addColorStop(0, colA);
            grad.addColorStop(1, colB);
            ctx.globalAlpha = baseAlpha;
            ctx.lineWidth = width;
            ctx.setLineDash(style.dash);
            ctx.shadowBlur = vis ? 4 : 0;
            ctx.shadowColor = colB;
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(cx, cy, tx, ty);
            ctx.stroke();
            ctx.setLineDash([]);

            // Tok částic ve směru vztahu
            if (vis) {
              const n = Math.max(1, Math.min(3, Math.round(link.strength / 3)));
              const seed = (link.relId.charCodeAt(0) % 10) / 10;
              for (let i = 0; i < n; i++) {
                const t = (Date.now() / 2200 + i / n + seed) % 1;
                const it = 1 - t;
                const bx = it * it * sx + 2 * it * t * cx + t * t * tx;
                const by = it * it * sy + 2 * it * t * cy + t * t * ty;
                ctx.globalAlpha = baseAlpha;
                ctx.shadowBlur = 6;
                ctx.shadowColor = colB;
                ctx.fillStyle = colB;
                ctx.beginPath();
                ctx.arc(bx, by, Math.max(1.2, width * 0.7), 0, 2 * Math.PI);
                ctx.fill();
              }
            }
            ctx.restore();
          }}
        />
      )}

      {data.nodes.length === 0 && (
        <div className={s.graphEmpty}>
          Zatím žádné subjekty — přidej je v záložce Subjekty.
        </div>
      )}
    </div>
  );
}
