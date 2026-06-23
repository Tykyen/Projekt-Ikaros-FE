import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { useBestiar } from '@/features/world/bestiar/hooks/useBestiar';
import type { Bestie } from '@/features/world/bestiar/types';
import s from './RailEntitySearch.module.css';

/** Výsledek sjednoceného hledání v railu (PJ). */
export type RailSearchResult =
  | { kind: 'npc'; slug: string; title: string; imageUrl?: string }
  | { kind: 'bestie'; bestie: Bestie };

interface Props {
  worldId: string;
  /** Systém světa — pro katalog bestií. `null` = bez bestií (jen NPC). */
  systemId: string | null;
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
export function RailEntitySearch({ worldId, systemId, onSelect }: Props) {
  const personas = usePersonaDirectory(worldId);
  const bestiar = useBestiar(worldId, systemId);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo<RailSearchResult[]>(() => {
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
    return [...npcs, ...bestie];
  }, [personas.data, bestiar.data]);

  const filtered = useMemo(() => {
    const titleOf = (r: RailSearchResult) =>
      r.kind === 'npc' ? r.title : r.bestie.name;
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
          placeholder="Hledat NPC / bestii…"
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
                r.kind === 'npc' ? `npc:${r.slug}` : `bestie:${r.bestie.id}`;
              const title = r.kind === 'npc' ? r.title : r.bestie.name;
              const img = r.kind === 'npc' ? r.imageUrl : r.bestie.imageUrl;
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
                  <span className={s.type}>
                    {r.kind === 'npc' ? 'NPC' : 'bestie'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
