/**
 * 21.5f — Komunitní ceníky ve Společné tvorbě.
 * Dvě oddělené knihovny (Schválená / Návrhy) + filtr štítku + seznam ceníků
 * (název, popis, počet položek). Vzhled motiv-aware přes `--theme-*` tokeny.
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useKomunitniCenikyList } from './hooks/useKomunitniCeniky';
import { CenikEditorModal } from './components/CenikEditorModal';
import {
  PRICE_LIST_ERAS,
  PRICE_LIST_ERA_OTHER,
  eraOf,
  type PriceListStatus,
  type GlobalPriceList,
} from './types';
import s from './KomunitniCeniky.module.css';

export default function KomunitniCenikyPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [library, setLibrary] = useState<PriceListStatus>('approved');
  const [tagFilter, setTagFilter] = useState('');
  /** 21.5k — klikací filtr ér ('all' = všechny éry). */
  const [eraFilter, setEraFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const approved = useKomunitniCenikyList({ status: 'approved' });
  const drafts = useKomunitniCenikyList({ status: 'draft' });
  const active = library === 'approved' ? approved : drafts;
  const lists = useMemo(() => active.data ?? [], [active.data]);

  // 21.5k — chips ér z aktuální knihovny (jen existující éry, s počty)
  const eraChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of lists) {
      const era = eraOf(l);
      counts.set(era, (counts.get(era) ?? 0) + 1);
    }
    const order = [
      ...PRICE_LIST_ERAS.map((e) => e.label),
      PRICE_LIST_ERA_OTHER,
    ];
    return order
      .filter((era) => counts.has(era))
      .map((era) => ({ era, count: counts.get(era)! }));
  }, [lists]);
  // filtr éry platí, jen pokud éra v aktuální knihovně existuje
  const activeEra = eraChips.some((c) => c.era === eraFilter)
    ? eraFilter
    : 'all';

  const tag = tagFilter.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      lists.filter(
        (l) =>
          (activeEra === 'all' || eraOf(l) === activeEra) &&
          (tag === '' ||
            (l.tags ?? []).some((t) => t.toLowerCase().includes(tag))),
      ),
    [lists, tag, activeEra],
  );

  // 21.5j R7 — seskupení podle ér (chronologicky; bez érového štítku = Ostatní)
  const eraGroups = useMemo(() => {
    const byEra = new Map<string, GlobalPriceList[]>();
    for (const l of filtered) {
      const era = eraOf(l);
      const arr = byEra.get(era);
      if (arr) arr.push(l);
      else byEra.set(era, [l]);
    }
    const order = [
      ...PRICE_LIST_ERAS.map((e) => e.label),
      PRICE_LIST_ERA_OTHER,
    ];
    return order
      .filter((era) => byEra.has(era))
      .map((era) => ({ era, lists: byEra.get(era)! }));
  }, [filtered]);

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Ceníky' },
  ];

  return (
    <article className={s.page} data-cenik-scope="community">
      <Seo
        title="Komunitní ceníky"
        description="Sdílené ceníky zboží a služeb — hotové kolekce položek s cenami ve zlatých, stříbrných a měďácích. Jedním klikem do obchodu tvého světa."
        canonicalPath="/ikaros/ceniky"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Komunitní ceníky</h1>
        <p className={s.lead}>
          Hotové kolekce zboží a služeb s cenami ve zlatých, stříbrných a
          měďácích. Prohlížej, tvoř — a celý ceník vlož jedním klikem do
          obchodu svého světa.
        </p>
        {isAuth ? (
          <div className={s.headActions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nový ceník
            </Button>
          </div>
        ) : null}
      </header>

      {/* Dvě oddělené knihovny */}
      <div className={s.libTabs} role="tablist" aria-label="Knihovny">
        <button
          role="tab"
          aria-selected={library === 'approved'}
          className={s.libTab}
          data-lib-tab="approved"
          onClick={() => setLibrary('approved')}
        >
          <span className={s.libIco} aria-hidden="true">
            🧾
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Schválená knihovna</span>
            <span className={s.libDesc}>ověřené ceníky, doladěné komunitou</span>
          </span>
          <span className={s.libCount}>{approved.data?.length ?? '–'}</span>
        </button>

        <button
          role="tab"
          aria-selected={library === 'draft'}
          className={s.libTab}
          data-lib-tab="drafts"
          onClick={() => setLibrary('draft')}
        >
          <span className={s.libIco} aria-hidden="true">
            📝
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Knihovna návrhů</span>
            <span className={s.libDesc}>komunitní, zatím neověřené</span>
          </span>
          <span className={s.libCount}>{drafts.data?.length ?? '–'}</span>
        </button>
      </div>

      {/* 21.5k — klikací filtr ér */}
      {eraChips.length > 1 ? (
        <div className={s.eraChips} role="group" aria-label="Filtr ér">
          <button
            type="button"
            className={s.eraChip}
            aria-pressed={activeEra === 'all'}
            onClick={() => setEraFilter('all')}
          >
            Vše
          </button>
          {eraChips.map((c) => (
            <button
              key={c.era}
              type="button"
              className={s.eraChip}
              aria-pressed={activeEra === c.era}
              onClick={() => setEraFilter(c.era)}
            >
              {c.era}
              <span className={s.eraChipCount}>{c.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Filtry (client-side) */}
      <div className={s.filters}>
        <label className={s.filterField}>
          <span className={s.filterLabel}>Štítek</span>
          <input
            className={s.input}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="např. jídlo"
          />
        </label>
      </div>

      {/* Seznam ceníků */}
      {active.isLoading ? (
        <p className={s.state}>Načítám…</p>
      ) : active.isError ? (
        <p className={s.state}>Knihovnu se nepodařilo načíst.</p>
      ) : filtered.length === 0 ? (
        <p className={s.state}>
          {library === 'approved'
            ? 'Ve schválené knihovně zatím nic není.'
            : 'Žádné návrhy.'}
        </p>
      ) : (
        eraGroups.map((g) => (
          <section key={g.era} data-cenik-era={g.era}>
            <h2 className={s.eraTitle}>
              {g.era}
              <span className={s.eraCount}>{g.lists.length}</span>
            </h2>
            <ul className={s.list} data-cenik-list="">
              {g.lists.map((l) => (
                <CenikRow key={l.id} list={l} />
              ))}
            </ul>
          </section>
        ))
      )}

      {showCreate ? (
        <CenikEditorModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => setLibrary('draft')}
        />
      ) : null}
    </article>
  );
}

function CenikRow({ list }: { list: GlobalPriceList }) {
  return (
    <li className={s.row} data-cenik-row="">
      <Link to={`/ikaros/ceniky/${list.id}`} className={s.rowLink}>
        <span className={s.thumb} data-cenik-portrait="">
          {list.imageUrl ? (
            <img src={list.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              {list.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowName}>{list.name}</span>
          {list.description ? (
            <span className={s.rowDesc}>{list.description}</span>
          ) : null}
        </span>
        {list.currency && list.currency !== 'gsc' ? (
          // 21.5g — měnový badge (gsc = default bez badge)
          <span className={s.countChip} title="Měna ceníku">
            {list.currency === 'usd' ? '$ USD' : 'kredity'}
          </span>
        ) : null}
        <span className={s.countChip} title="Počet položek">
          {list.items.length} položek
        </span>
      </Link>
    </li>
  );
}
