import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Users,
  Bot,
  UserSquare,
  Search as SearchIcon,
  Star,
  LayoutGrid,
  X,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import { WorldRole, type WorldMembership } from '@/shared/types';
import { usePersonaDirectory } from '../api/usePersonaDirectory';
import { useWorldMembers } from '../../api/useWorldMembers';
import { useWorldSettings } from '../../api/useWorldSettings';
import type { CharacterDirectoryEntry } from '../api/characters.types';
import type { PageDirectoryEntry } from '../api/pages.types';
import { CharacterCard } from './components/CharacterCard';
import {
  NewPageWizardModal,
  type NewPageChoice,
} from '../PageEditor/components/NewPageWizardModal';
import { useFavoriteCharacters } from './hooks/useFavoriteCharacters';
import { normalize } from './utils/normalize';
import s from './CharacterDirectory.module.css';

// 9.1 — 'location' filter zrušen; Lokace jsou v /stranky (PageType Lokace),
// ne v adresáři postav.
type TypeFilter = 'all' | 'pc' | 'npc';

interface Props {
  worldId: string;
  worldSlug: string;
  userRole: WorldRole | null;
}

interface MemberMeta {
  name: string;
  group?: string;
}

interface GroupBucket {
  key: string;
  label: string;
  color?: string;
  entries: CharacterDirectoryEntry[];
}

const NO_GROUP_KEY = '__no_group__';
const NO_GROUP_LABEL = 'Bez skupiny';

function classify(entry: CharacterDirectoryEntry): 'pc' | 'npc' {
  if (entry.isNpc) return 'npc';
  return 'pc';
}

/**
 * 9.1 — Mapper PageDirectoryEntry → CharacterDirectoryEntry shape pro
 * kompatibilitu se stávajícími komponentami (CharacterCard, classify, …).
 * Page.type 'NPC' → isNpc=true; 'Postava hráče' → isNpc=false (PC).
 */
function pageEntryToCharacterEntry(p: PageDirectoryEntry): CharacterDirectoryEntry {
  return {
    id: p.id,
    slug: p.slug,
    name: p.title,
    imageUrl: p.imageUrl,
    imageFocalX: p.imageFocalX,
    imageFocalY: p.imageFocalY,
    imageZoom: p.imageZoom,
    imageFit: p.imageFit,
    isNpc: p.type === 'NPC',
    kind: p.type === 'Lokace' ? 'location' : 'persona',
    userId: p.ownerUserId,
  };
}

const FILTER_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'Vše' },
  { value: 'pc', label: 'Hráčské' },
  { value: 'npc', label: 'NPC' },
];

/** 8.3 — Rozdělí PC postavy do skupin dle `memberMeta[userId].group`. */
function buildGroupBuckets(
  pcs: CharacterDirectoryEntry[],
  memberMeta: Record<string, MemberMeta>,
  groupsOrder: string[],
  groupColors: Record<string, string>,
): GroupBucket[] {
  const buckets: Record<string, CharacterDirectoryEntry[]> = {};
  pcs.forEach((e) => {
    const g = e.userId ? memberMeta[e.userId]?.group : undefined;
    const key = g && g.trim() ? g : NO_GROUP_KEY;
    (buckets[key] ??= []).push(e);
  });
  const known = groupsOrder.filter((g) => buckets[g]?.length);
  const unknown = Object.keys(buckets)
    .filter((k) => k !== NO_GROUP_KEY && !groupsOrder.includes(k))
    .sort((a, b) => a.localeCompare(b, 'cs'));
  const ordered: GroupBucket[] = [];
  [...known, ...unknown].forEach((g) =>
    ordered.push({ key: g, label: g, entries: buckets[g], color: groupColors[g] }),
  );
  if (buckets[NO_GROUP_KEY]?.length) {
    ordered.push({ key: NO_GROUP_KEY, label: NO_GROUP_LABEL, entries: buckets[NO_GROUP_KEY] });
  }
  return ordered;
}

/**
 * 8.2e + 8.3 — Adresář postav světa. 3 sekce (PC / NPC / Lokace), filtr typu,
 * fulltext hledání, oblíbené, volitelné seskupení PC dle herních skupin.
 * URL state: `?q=&filter=&group=&create=`.
 */
export function CharacterDirectory({ worldId, worldSlug, userRole }: Props) {
  // 9.1 — Pages directory s filterem type ∈ {PostavaHrace, NPC}. Sjednoceno
  // s Page entity; nové postavy z wizardu se objevují ihned (legacy
  // useCharacterDirectory by je nevracel).
  const { data: pageEntries, isLoading } = usePersonaDirectory(worldId);
  const entries = useMemo(
    () => (pageEntries ?? []).map(pageEntryToCharacterEntry),
    [pageEntries],
  );
  const { data: members } = useWorldMembers(worldId);
  const { data: settings } = useWorldSettings(worldId);
  const favorites = useFavoriteCharacters(worldId);

  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const filter = (searchParams.get('filter') as TypeFilter) ?? 'all';
  const groupBy = searchParams.get('group') === '1';
  // 9.1 — místo CreateCharacterModal otevíráme NewPageWizardModal.
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  function handleWizardChoice(choice: NewPageChoice) {
    setCreateOpen(false);
    // NPC z bestiáře navádí na Bestiář světa (tvorba bestií + spawn na mapu).
    if (choice === 'npc-bestiary') {
      navigate(`/svet/${worldSlug}/bestiar`);
      return;
    }
    const base = `/svet/${worldSlug}/nova-stranka`;
    const typeParam =
      choice === 'pc'
        ? '?type=PostavaHrace'
        : choice === 'npc'
          ? '?type=NPC'
          : '';
    navigate(`${base}${typeParam}`);
  }

  const canManage = userRole !== null && userRole >= WorldRole.PJ;
  // 9.1 — `?create=1` deep-link odstraněn; MyCharacterPage naviguje rovnou
  // na `/nova-stranka?type=PostavaHrace`. CreateCharacterModal už neexistuje.

  // Mapa userId → { name, group } — `name` pro PC karty, `group` pro group-by.
  const memberMeta = useMemo<Record<string, MemberMeta>>(() => {
    const map: Record<string, MemberMeta> = {};
    (members ?? []).forEach((m: WorldMembership) => {
      if (m.user?.id && m.user.username) {
        map[m.user.id] = { name: m.user.username, group: m.group };
      }
    });
    return map;
  }, [members]);

  // ── URL setters ─────────────────────────────────────────────────────
  const setQ = (next: string) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next) sp.set('q', next);
        else sp.delete('q');
        return sp;
      },
      { replace: true },
    );
  };
  const setFilter = (next: TypeFilter) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === 'all') sp.delete('filter');
        else sp.set('filter', next);
        return sp;
      },
      { replace: true },
    );
  };
  const setGroupBy = (next: boolean) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next) sp.set('group', '1');
        else sp.delete('group');
        return sp;
      },
      { replace: true },
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={s.page}>
        <Header canManage={canManage} onCreate={() => setCreateOpen(true)} />
        <div className={s.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={s.skeletonCard} aria-hidden />
          ))}
        </div>
      </div>
    );
  }

  const all = entries ?? [];

  // ── Žádné postavy vůbec ─────────────────────────────────────────────
  if (all.length === 0) {
    return (
      <div className={s.page}>
        <Header canManage={canManage} onCreate={() => setCreateOpen(true)} />
        <EmptyState canManage={canManage} onCreate={() => setCreateOpen(true)} />
        <NewPageWizardModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onChoose={handleWizardChoice}
          canUseBestiary={canManage}
        />
      </div>
    );
  }

  // ── Apply: search → type filter ─────────────────────────────────────
  const nq = normalize(q.trim());
  const matchesSearch = (e: CharacterDirectoryEntry): boolean => {
    if (!nq) return true;
    if (normalize(e.name).includes(nq)) return true;
    if (normalize(e.slug).includes(nq)) return true;
    const playerName = e.userId ? memberMeta[e.userId]?.name : undefined;
    if (playerName && normalize(playerName).includes(nq)) return true;
    return false;
  };

  const searched = all.filter(matchesSearch);
  const filtered =
    filter === 'all' ? searched : searched.filter((e) => classify(e) === filter);

  const pcs = filtered.filter((e) => classify(e) === 'pc');
  const npcs = filtered.filter((e) => classify(e) === 'npc');

  const favoriteEntries = filtered.filter((e) => favorites.isFavorite(e.slug));

  const groupColors = settings?.groupColors ?? {};
  const groupsOrder = settings?.customGroups ?? [];
  const pcsByGroup = groupBy
    ? buildGroupBuckets(pcs, memberMeta, groupsOrder, groupColors)
    : null;

  const renderCard = (entry: CharacterDirectoryEntry) => {
    const meta = entry.userId ? memberMeta[entry.userId] : undefined;
    return (
      <CharacterCard
        key={entry.id}
        entry={entry}
        worldSlug={worldSlug}
        playerName={meta?.name}
        groupLabel={groupBy && meta?.group ? meta.group : undefined}
        groupColor={groupBy && meta?.group ? groupColors[meta.group] : undefined}
        isFavorite={favorites.isFavorite(entry.slug)}
        onToggleFavorite={favorites.toggle}
      />
    );
  };

  const noResults = nq.length > 0 && filtered.length === 0;

  return (
    <div className={s.page}>
      <Header canManage={canManage} onCreate={() => setCreateOpen(true)} />

      {/* 8.3 — Toolbar nad filterbarem: search + groupBy toggle */}
      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <SearchIcon size={16} aria-hidden className={s.searchIcon} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat postavu…"
            aria-label="Hledat postavu"
            className={s.searchInput}
          />
          {q && (
            <button
              type="button"
              className={s.searchClear}
              aria-label="Vymazat hledání"
              onClick={() => setQ('')}
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        <button
          type="button"
          className={`${s.groupPill} ${groupBy ? s.groupPillActive : ''}`}
          aria-pressed={groupBy}
          onClick={() => setGroupBy(!groupBy)}
        >
          <LayoutGrid size={14} aria-hidden /> Skupiny
        </button>
      </div>

      <FilterBar value={filter} onChange={setFilter} />

      <div className={s.sections}>
        {noResults ? (
          <div className={s.empty} role="status">
            <SearchIcon size={36} aria-hidden className={s.emptyIcon} />
            <p>Žádná postava neodpovídá hledání.</p>
            <Button variant="secondary" onClick={() => setQ('')}>
              Vymazat hledání
            </Button>
          </div>
        ) : (
          <>
            {favoriteEntries.length > 0 && (
              <Section title="Oblíbené" Icon={Star} count={favoriteEntries.length}>
                <div className={s.grid}>{favoriteEntries.map(renderCard)}</div>
              </Section>
            )}

            {pcs.length > 0 && filter !== 'npc' && (
              <Section title="Postavy hráčů" Icon={Users} count={pcs.length}>
                {groupBy && pcsByGroup ? (
                  <div className={s.groupedSections}>
                    {pcsByGroup.map((g) => (
                      <div key={g.key} className={s.groupBlock}>
                        <h3
                          className={s.groupHead}
                          style={
                            g.color
                              ? ({ '--group-accent': g.color } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {g.label}
                          <span className={s.groupCount}>{g.entries.length}</span>
                        </h3>
                        <div className={s.grid}>{g.entries.map(renderCard)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={s.grid}>{pcs.map(renderCard)}</div>
                )}
              </Section>
            )}

            {npcs.length > 0 && filter !== 'pc' && (
              <Section title="NPC" Icon={Bot} count={npcs.length}>
                <div className={s.grid}>{npcs.map(renderCard)}</div>
              </Section>
            )}

            {filter !== 'all' && filtered.length === 0 && !noResults && (
              <p className={s.emptyFilter}>Žádné postavy tohoto typu.</p>
            )}
          </>
        )}
      </div>

      <NewPageWizardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onChoose={handleWizardChoice}
        canUseBestiary={canManage}
      />
    </div>
  );
}

function Header({
  canManage,
  onCreate,
}: {
  canManage: boolean;
  onCreate: () => void;
}) {
  return (
    <div className={s.pageHead}>
      <h1 className={s.title}>Postavy světa</h1>
      {canManage && (
        <Button variant="primary" onClick={onCreate}>
          <Plus size={16} aria-hidden /> Nová postava
        </Button>
      )}
    </div>
  );
}

function FilterBar({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  return (
    <div className={s.filterBar} role="tablist" aria-label="Filtr typu postavy">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`${s.filterPill} ${
            value === opt.value ? s.filterPillActive : ''
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  Icon: typeof Users;
  count: number;
  children: React.ReactNode;
}

function Section({ title, Icon, count, children }: SectionProps) {
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <Icon size={18} aria-hidden className={s.sectionIcon} />
        <h2 className={s.sectionTitle}>{title}</h2>
        <span className={s.sectionCount}>{count}</span>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  canManage,
  onCreate,
}: {
  canManage: boolean;
  onCreate: () => void;
}) {
  return (
    <div className={s.empty} role="status">
      <UserSquare size={48} aria-hidden className={s.emptyIcon} />
      <p>Zatím tu nejsou žádné postavy.</p>
      {canManage && (
        <Button variant="primary" onClick={onCreate}>
          <Plus size={16} aria-hidden /> Vytvořit první postavu
        </Button>
      )}
    </div>
  );
}
