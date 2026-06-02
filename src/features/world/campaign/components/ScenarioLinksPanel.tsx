import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { parseApiError } from '@/shared/api/client';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { useBestiar } from '@/features/world/bestiar/hooks/useBestiar';
import {
  ALL_PAGE_TYPES,
  type PageType,
} from '@/features/world/pages/api/pages.types';
import { useUpdateScenario } from '../api';
import { mergeMeta, getMeta, type ScenarioMeta } from '../scenarioMeta';
import type {
  CampaignScenario,
  CampaignStoryline,
  CampaignSubject,
  CreateScenarioInput,
} from '../types';
import s from './storyboard.module.css';

interface Option {
  id: string;
  label: string;
  imageUrl?: string;
  badge?: string;
  href?: string;
}

const MAX_RESULTS = 8;
/** Nad tolik položek vyžadujeme aspoň 1 znak (prázdný fokus by ukázal balast). */
const REQUIRE_QUERY_OVER = 20;

/** Diakritika-insensitive: „Sněf" ~ „snef". */
function norm(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Provázání scénáře „do světa" — 6 sekcí (spec §4.5). Ukládá OKAMŽITĚ při
 * add/remove (na rozdíl od těla scény = explicit Uložit), vždy přes `mergeMeta`
 * nad aktuálním scénářem → zachová tělo / tajná pole editoru.
 */
export function ScenarioLinksPanel({
  scenario,
  worldId,
  worldSlug,
  worldSystem,
  subjects,
  storylines,
  readOnly,
}: {
  scenario: CampaignScenario;
  worldId: string;
  worldSlug: string;
  worldSystem: string;
  subjects: CampaignSubject[];
  storylines: CampaignStoryline[];
  readOnly: boolean;
}) {
  const update = useUpdateScenario(worldId);
  const meta = getMeta(scenario);

  const { data: pages = [] } = usePagesDirectory(worldId);
  const { data: bestiar } = useBestiar(worldId, worldSystem || null);

  const allBestie = useMemo(
    () =>
      bestiar
        ? [...bestiar.world, ...bestiar.user, ...bestiar.system]
        : [],
    [bestiar],
  );

  function commit(
    patch: {
      linkedPageSlug?: string;
      subjectIds?: string[];
      storylineIds?: string[];
    },
    metaPatch?: Partial<ScenarioMeta>,
  ) {
    const input: CreateScenarioInput = {
      title: scenario.title,
      images: scenario.images,
      linkedPageSlug:
        'linkedPageSlug' in patch ? patch.linkedPageSlug : scenario.linkedPageSlug,
      subjectIds: patch.subjectIds ?? scenario.subjectIds,
      storylineIds: patch.storylineIds ?? scenario.storylineIds,
      isShared: scenario.isShared,
      contentData: metaPatch
        ? mergeMeta(scenario, metaPatch)
        : scenario.contentData,
    };
    update.mutate(
      { id: scenario.id, input },
      { onError: (e) => toast.error(parseApiError(e)) },
    );
  }

  // ── Options pro sekce ──
  const pageOptions: Option[] = useMemo(
    () =>
      pages.map((p) => ({
        id: p.slug,
        label: p.title,
        imageUrl: p.imageUrl,
        badge: p.type,
        href: `/svet/${worldSlug}/${p.slug}`,
      })),
    [pages, worldSlug],
  );
  const bestieOptions: Option[] = useMemo(
    () =>
      allBestie.map((b) => ({
        id: b.id,
        label: b.name,
        imageUrl: b.imageUrl,
        href: `/svet/${worldSlug}/bestiar`,
      })),
    [allBestie, worldSlug],
  );
  const subjectOptions: Option[] = useMemo(
    () =>
      subjects.map((x) => ({
        id: x.id,
        label: x.name,
        imageUrl: x.avatarUrl,
        href: `/svet/${worldSlug}/pavucina`,
      })),
    [subjects, worldSlug],
  );
  const storyOptions: Option[] = useMemo(
    () =>
      storylines.map((x) => ({
        id: x.id,
        label: x.title,
        href: `/svet/${worldSlug}/scenare`,
      })),
    [storylines, worldSlug],
  );

  return (
    <div className={s.linksPanel}>
      <div className={s.sectionLabel}>🔗 Provázání se světem</div>

      <PrimaryPageSection
        worldId={worldId}
        worldSlug={worldSlug}
        value={scenario.linkedPageSlug ?? null}
        readOnly={readOnly}
        onChange={(slug) => commit({ linkedPageSlug: slug ?? undefined })}
      />

      <MultiSection
        title="📄 Wiki stránky"
        hint="Postavy, novinky, místa — jakákoli stránka světa k této scéně."
        options={pageOptions}
        selectedIds={meta.pageSlugs}
        readOnly={readOnly}
        withTypeFilter
        onChange={(ids) => commit({}, { pageSlugs: ids })}
      />

      <MultiSection
        title="🐉 Bestiář"
        hint="Připravení protivníci/bytosti pro tuto scénu (spawn na mapu řešíš až na taktické mapě)."
        options={bestieOptions}
        selectedIds={meta.bestieIds}
        readOnly={readOnly}
        emptyHint={
          worldSystem ? 'Žádné bestie' : 'Svět nemá nastavený systém'
        }
        onChange={(ids) => commit({}, { bestieIds: ids })}
      />

      <MultiSection
        title="👥 Subjekty"
        hint="Aktéři z Pavučiny (postavy, frakce…), kteří ve scéně vystupují."
        options={subjectOptions}
        selectedIds={scenario.subjectIds}
        readOnly={readOnly}
        onChange={(ids) => commit({ subjectIds: ids })}
      />

      <MultiSection
        title="🧵 Linky"
        hint="Příběhové vlákno, které tahle scéna posouvá."
        options={storyOptions}
        selectedIds={scenario.storylineIds}
        readOnly={readOnly}
        onChange={(ids) => commit({ storylineIds: ids })}
      />

      {(scenario.storylineIds.length > 0 || scenario.subjectIds.length > 0) && (
        <Link
          className={s.netLink}
          to={
            scenario.storylineIds[0]
              ? `/svet/${worldSlug}/pavucina?storyline=${scenario.storylineIds[0]}`
              : `/svet/${worldSlug}/pavucina`
          }
        >
          🕸 Zobrazit v síti (Pavučina)
        </Link>
      )}
    </div>
  );
}

/** Hlavní místo scény — single výběr (reuse PagePicker). */
function PrimaryPageSection({
  worldId,
  worldSlug,
  value,
  readOnly,
  onChange,
}: {
  worldId: string;
  worldSlug: string;
  value: string | null;
  readOnly: boolean;
  onChange: (slug: string | null) => void;
}) {
  const { data: pages = [] } = usePagesDirectory(worldId);
  const current = pages.find((p) => p.slug === value);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const { results, moreCount } = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return { results: [] as typeof pages, moreCount: 0 };
    const matched = pages.filter(
      (p) => norm(p.title).includes(q) || norm(p.slug).includes(q),
    );
    return {
      results: matched.slice(0, MAX_RESULTS),
      moreCount: Math.max(0, matched.length - MAX_RESULTS),
    };
  }, [pages, query]);

  return (
    <section className={s.linkSection}>
      <div className={s.linkSectionHead}>📍 Místo scény</div>
      <div className={s.linkSectionHint}>
        Hlavní lokace (stránka), kde se scéna odehrává.
      </div>
      {value ? (
        <div className={s.linkChips}>
          <span className={s.linkChip}>
            <Link to={`/svet/${worldSlug}/${value}`} className={s.linkChipText}>
              {current?.title ?? value}
            </Link>
            {!readOnly && (
              <button
                type="button"
                className={s.linkChipRemove}
                aria-label="Odebrat místo"
                onClick={() => onChange(null)}
              >
                ×
              </button>
            )}
          </span>
        </div>
      ) : readOnly ? (
        <div className={s.linkEmpty}>—</div>
      ) : (
        <div className={s.linkSearch}>
          <input
            className={s.linkSearchInput}
            value={query}
            placeholder="Vyhledej místo (stránku)…"
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {focused && results.length > 0 && (
            <div className={s.linkDropdown}>
              {results.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  className={s.linkOption}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(p.slug);
                    setQuery('');
                  }}
                >
                  {p.title}
                  <span className={s.linkOptionBadge}>{p.type}</span>
                </button>
              ))}
              {moreCount > 0 && (
                <div className={s.linkHint}>
                  …a dalších {moreCount} — upřesni hledání
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Generická multi-výběr sekce: search → dropdown → chips. */
function MultiSection({
  title,
  hint,
  options,
  selectedIds,
  readOnly,
  withTypeFilter = false,
  emptyHint = 'Nic nevybráno',
  onChange,
}: {
  title: string;
  hint?: string;
  options: Option[];
  selectedIds: string[];
  readOnly: boolean;
  withTypeFilter?: boolean;
  emptyHint?: string;
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PageType | ''>('');

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean) as Option[];

  const { results, moreCount, needQuery } = useMemo(() => {
    const q = norm(query.trim());
    const sel = new Set(selectedIds);
    const pool = options
      .filter((o) => !sel.has(o.id))
      .filter((o) => !typeFilter || o.badge === typeFilter);
    // U velkých seznamů (60 subjektů, 2000 stránek…) nemá smysl ukazovat
    // „prvních 8 dle pořadí" — vyžádáme aspoň 1 znak.
    if (!q && pool.length > REQUIRE_QUERY_OVER) {
      return { results: [] as Option[], moreCount: 0, needQuery: true };
    }
    const matched = q
      ? pool.filter((o) => norm(o.label).includes(q))
      : pool;
    return {
      results: matched.slice(0, MAX_RESULTS),
      moreCount: Math.max(0, matched.length - MAX_RESULTS),
      needQuery: false,
    };
  }, [options, query, selectedIds, typeFilter]);

  const showDropdown = focused && (results.length > 0 || needQuery);

  function add(id: string) {
    onChange([...selectedIds, id]);
    setQuery('');
  }
  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  return (
    <section className={s.linkSection}>
      <div className={s.linkSectionHead}>{title}</div>
      {hint && <div className={s.linkSectionHint}>{hint}</div>}

      <div className={s.linkChips}>
        {selected.length === 0 && <span className={s.linkEmpty}>{emptyHint}</span>}
        {selected.map((o) => (
          <span key={o.id} className={s.linkChip}>
            {o.imageUrl && <img src={o.imageUrl} alt="" className={s.linkChipImg} />}
            {o.href ? (
              <Link to={o.href} className={s.linkChipText}>
                {o.label}
              </Link>
            ) : (
              <span className={s.linkChipText}>{o.label}</span>
            )}
            {!readOnly && (
              <button
                type="button"
                className={s.linkChipRemove}
                aria-label={`Odebrat ${o.label}`}
                onClick={() => remove(o.id)}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {!readOnly && (
        <div className={s.linkSearch}>
          {withTypeFilter && (
            <select
              className={clsx(s.select, s.linkTypeFilter)}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PageType | '')}
            >
              <option value="">Vše</option>
              {ALL_PAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <input
            className={s.linkSearchInput}
            value={query}
            placeholder="Vyhledej a přidej…"
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {showDropdown && (
            <div className={s.linkDropdown}>
              {needQuery ? (
                <div className={s.linkHint}>Začni psát pro vyhledání…</div>
              ) : (
                <>
                  {results.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={s.linkOption}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => add(o.id)}
                    >
                      {o.imageUrl && (
                        <img src={o.imageUrl} alt="" className={s.linkChipImg} />
                      )}
                      {o.label}
                      {o.badge && (
                        <span className={s.linkOptionBadge}>{o.badge}</span>
                      )}
                    </button>
                  ))}
                  {moreCount > 0 && (
                    <div className={s.linkHint}>
                      …a dalších {moreCount} — upřesni hledání
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
