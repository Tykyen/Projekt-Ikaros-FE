import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { useBestiar } from '@/features/world/bestiar/hooks/useBestiar';
import type { Bestie } from '@/features/world/bestiar/types';
import s from './RailEntitySearch.module.css';

/** Výsledek sjednoceného hledání v railu (PJ). */
export type RailSearchResult =
  | { kind: 'npc'; slug: string; title: string; imageUrl?: string }
  | { kind: 'pc'; slug: string; title: string; imageUrl?: string }
  | { kind: 'bestie'; bestie: Bestie };

interface Props {
  worldId: string;
  /** Systém světa — pro katalog bestií. `null` = bez bestií (jen NPC). */
  systemId: string | null;
  /** 16.1e — zahrnout i PC postavy (přidávání do boje). Default jen NPC+bestie. */
  includePc?: boolean;
  onSelect: (r: RailSearchResult) => void;
}

const MAX_VISIBLE = 8;

/** Diakritika-insensitive normalizace (š→s, á→a, …). */
function norm(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * 16.1c — jedno pole hledání v presence railu (PJ): NPC (persona adresář) +
 * bestie (katalog bestiáře). PC jsou v rosteru, sem nepatří. Výběr → rail
 * načte deník NPC (atribuce `npc`) nebo statblok bestie (atribuce `bestie`).
 */
export function RailEntitySearch({
  worldId,
  systemId,
  includePc = false,
  onSelect,
}: Props) {
  const personas = usePersonaDirectory(worldId);
  const bestiar = useBestiar(worldId, systemId);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo<RailSearchResult[]>(() => {
    const pcs: RailSearchResult[] = includePc
      ? (personas.data ?? [])
          .filter((e) => e.type === 'Postava hráče')
          .map((e) => ({
            kind: 'pc',
            slug: e.slug,
            title: e.title,
            imageUrl: e.imageUrl,
          }))
      : [];
    const npcs: RailSearchResult[] = (personas.data ?? [])
      .filter((e) => e.type === 'NPC')
      .map((e) => ({
        kind: 'npc',
        slug: e.slug,
        title: e.title,
        imageUrl: e.imageUrl,
      }));
    const bestie: RailSearchResult[] = [
      ...(bestiar.data?.system ?? []),
      ...(bestiar.data?.world ?? []),
      ...(bestiar.data?.user ?? []),
    ].map((b) => ({ kind: 'bestie', bestie: b }));
    return [...pcs, ...npcs, ...bestie];
  }, [personas.data, bestiar.data, includePc]);

  const filtered = useMemo(() => {
    const titleOf = (r: RailSearchResult) =>
      r.kind === 'bestie' ? r.bestie.name : r.title;
    const q = norm(query.trim());
    const pool = q ? results.filter((r) => norm(titleOf(r)).includes(q)) : results;
    return pool.slice(0, MAX_VISIBLE);
  }, [results, query]);

  const pick = (r: RailSearchResult) => {
    onSelect(r);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={s.wrap}>
      <div className={s.field}>
        <Search size={14} className={s.icon} aria-hidden="true" />
        <input
          type="text"
          className={s.input}
          value={query}
          placeholder={includePc ? 'Hledat postavu / NPC / bestii…' : 'Hledat NPC / bestii…'}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Delay — ať mousedown na položce (preventDefault) stihne vybrat.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          aria-label="Hledat NPC nebo bestii"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className={s.clear}
            onClick={() => setQuery('')}
            aria-label="Vymazat hledání"
          >
            <X size={13} />
          </button>
        )}
        {open && filtered.length > 0 && (
          <div className={s.popover}>
            {filtered.map((r) => {
              const key =
                r.kind === 'bestie' ? `bestie:${r.bestie.id}` : `${r.kind}:${r.slug}`;
              const title = r.kind === 'bestie' ? r.bestie.name : r.title;
              const img = r.kind === 'bestie' ? r.bestie.imageUrl : r.imageUrl;
              const typeLabel =
                r.kind === 'bestie' ? 'bestie' : r.kind === 'pc' ? 'PC' : 'NPC';
              return (
                <button
                  key={key}
                  type="button"
                  className={s.row}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    pick(r);
                  }}
                >
                  <span className={s.avatar} aria-hidden="true">
                    {img ? (
                      <img src={img} alt="" />
                    ) : (
                      (title || '?').slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className={s.name}>{title}</span>
                  <span className={s.type}>{typeLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
