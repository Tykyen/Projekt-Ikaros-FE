import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import clsx from 'clsx';
import { SUBJECT_TYPES, TYPE_LABELS } from '../labels';
import {
  STATUS_EDGE_STYLE,
  TYPE_TOKEN,
  resolveToken,
  valenceIntensity,
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
}

/**
 * Pavučina — 2D force graph (canvas). Hustotu řeší interakce: focus mód
 * (klik → ego-síť), filtry (typ / valence), hledání → vycentrování.
 */
export function PavucinaGraph({
  subjects,
  relationships,
  storylines,
  storylineFilter,
  onStorylineFilter,
  onOpenSubject,
}: {
  subjects: CampaignSubject[];
  relationships: CampaignRelationship[];
  storylines: CampaignStoryline[];
  storylineFilter: string | null;
  onStorylineFilter: (id: string | null) => void;
  onOpenSubject: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [colors, setColors] = useState<ResolvedColors | null>(null);

  const [focusId, setFocusId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [valFilter, setValFilter] = useState<ValenceFilter>('all');
  const [search, setSearch] = useState('');

  const data = useMemo(
    () => buildGraphData(subjects, relationships),
    [subjects, relationships],
  );

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
    });
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
    <div className={s.graphWrap} ref={wrapRef}>
      <div className={s.graphControls}>
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
      </div>

      <GraphLegend />

      {colors && (
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={data}
          nodeId="id"
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
            const vis = nodeVisible(n.id, n.type);
            const r = RADIUS[n.type] ?? 7;
            ctx.globalAlpha = vis ? 1 : DIM;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI);
            ctx.fillStyle = colors.type[n.type] ?? colors.valZero;
            ctx.fill();
            if (focusId === n.id) {
              ctx.lineWidth = 2;
              ctx.strokeStyle = colors.label;
              ctx.stroke();
            }
            if (scale > 1.1 && vis) {
              ctx.globalAlpha = 1;
              ctx.font = `${11 / scale}px sans-serif`;
              ctx.fillStyle = colors.label;
              ctx.textAlign = 'center';
              ctx.fillText(n.name, n.x ?? 0, (n.y ?? 0) + r + 9 / scale);
            }
            ctx.globalAlpha = 1;
          }}
          linkCanvasObject={(
            link: GraphLink,
            ctx: CanvasRenderingContext2D,
          ) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sx = (link.source as any).x ?? 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sy = (link.source as any).y ?? 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tx = (link.target as any).x ?? 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ty = (link.target as any).y ?? 0;
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;
            const style = STATUS_EDGE_STYLE[link.status] ?? STATUS_EDGE_STYLE.active;
            const vis = linkVisible(link);
            const width = 0.6 + (link.strength / 10) * 2.4;

            ctx.save();
            ctx.lineWidth = width;
            ctx.setLineDash(style.dash);
            // půlka u zdroje = jak source cítí, půlka u cíle = jak cítí target
            ctx.globalAlpha =
              (vis ? style.opacity : DIM) * valenceIntensity(link.valenceA);
            ctx.strokeStyle = valColor(link.valenceA, colors);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(mx, my);
            ctx.stroke();
            ctx.globalAlpha =
              (vis ? style.opacity : DIM) * valenceIntensity(link.valenceB);
            ctx.strokeStyle = valColor(link.valenceB, colors);
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(tx, ty);
            ctx.stroke();
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
