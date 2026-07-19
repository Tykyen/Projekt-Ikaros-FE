/**
 * 21.5a — Komunitní (globální) herbář ve Společné tvorbě.
 * Dvě oddělené knihovny (Schválená / Návrhy) + filtry Vzácnost/Tag + seznam
 * (rejstřík rostlin). Vzhled motiv-aware přes `--theme-*` tokeny; tvarové skiny
 * per motiv přijdou později přes `[data-theme] [data-herbar-*]` (viz herbarSkins).
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useKomunitniHerbarList } from './hooks/useKomunitniHerbar';
import { PlantEditorModal } from './components/PlantEditorModal';
import { InsertToShopModal } from './components/InsertToShopModal';
import { plantToShopInsert } from './shopInsert';
import {
  RARITY_OPTIONS,
  rarityLabel,
  type PlantStatus,
  type PlantRarity,
  type GlobalPlant,
} from './types';
import s from './KomunitniHerbar.module.css';
import './herbarSkins.css';

export default function KomunitniHerbarPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [library, setLibrary] = useState<PlantStatus>('approved');
  const [rarityFilter, setRarityFilter] = useState<'all' | PlantRarity>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkShop, setShowBulkShop] = useState(false);

  const approved = useKomunitniHerbarList({ status: 'approved' });
  const drafts = useKomunitniHerbarList({ status: 'draft' });
  const active = library === 'approved' ? approved : drafts;
  const plants = useMemo(() => active.data ?? [], [active.data]);

  const tag = tagFilter.trim().toLowerCase();
  const filtered = plants.filter(
    (p) =>
      (rarityFilter === 'all' || p.rarity === rarityFilter) &&
      (tag === '' ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(tag))),
  );

  const resetFilters = () => {
    setRarityFilter('all');
    setTagFilter('');
  };

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Herbář' },
  ];

  return (
    <article className={s.page} data-plant-scope="community">
      <Seo
        title="Komunitní herbář"
        description="Sdílený komunitní katalog rostlin a bylin — kde rostou, k čemu slouží a jak jsou vzácné. Prohlížej, tvoř a schvaluj."
        canonicalPath="/ikaros/herbar"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Komunitní herbář</h1>
        <p className={s.lead}>
          Dvě oddělené knihovny rostlin. Kde rostou, k čemu slouží a jak jsou
          vzácné — prohlížej, tvoř a doplňuj.
        </p>
        {isAuth ? (
          <div className={s.headActions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nová rostlina
            </Button>
            <Button
              variant="secondary"
              disabled={filtered.length === 0}
              onClick={() => setShowBulkShop(true)}
            >
              🛒 Vlož vše do obchodu
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
          onClick={() => {
            setLibrary('approved');
            resetFilters();
          }}
        >
          <span className={s.libIco} aria-hidden="true">
            🌿
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Schválená knihovna</span>
            <span className={s.libDesc}>ověřené rostliny, doladěné komunitou</span>
          </span>
          <span className={s.libCount}>{approved.data?.length ?? '–'}</span>
        </button>

        <button
          role="tab"
          aria-selected={library === 'draft'}
          className={s.libTab}
          data-lib-tab="drafts"
          onClick={() => {
            setLibrary('draft');
            resetFilters();
          }}
        >
          <span className={s.libIco} aria-hidden="true">
            🌱
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Knihovna návrhů</span>
            <span className={s.libDesc}>komunitní, zatím neověřené</span>
          </span>
          <span className={s.libCount}>{drafts.data?.length ?? '–'}</span>
        </button>
      </div>

      {/* Filtry (client-side) */}
      <div className={s.filters}>
        <label className={s.filterField}>
          <span className={s.filterLabel}>Vzácnost</span>
          <select
            className={s.select}
            value={rarityFilter}
            onChange={(e) =>
              setRarityFilter(e.target.value as 'all' | PlantRarity)
            }
          >
            <option value="all">Vše</option>
            {RARITY_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.filterField}>
          <span className={s.filterLabel}>Štítek</span>
          <input
            className={s.input}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="např. léčivá"
          />
        </label>
      </div>

      {/* Seznam (rejstřík) */}
      {active.isLoading ? (
        <p className={s.state}>Načítám…</p>
      ) : active.isError ? (
        <ErrorState
          size="panel"
          title="Knihovnu se nepodařilo načíst"
          description="Zkus to prosím znovu."
          onRetry={() => void active.refetch()}
        />
      ) : filtered.length === 0 ? (
        <p className={s.state}>
          {library === 'approved'
            ? 'Ve schválené knihovně zatím nic není.'
            : 'Žádné návrhy.'}
        </p>
      ) : (
        <ul className={s.list} data-herbar-list="">
          {filtered.map((p) => (
            <PlantRow key={p.id} plant={p} />
          ))}
        </ul>
      )}

      {showCreate ? (
        <PlantEditorModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => setLibrary('draft')}
        />
      ) : null}

      {showBulkShop ? (
        <InsertToShopModal
          mode="bulk"
          items={filtered.map(plantToShopInsert)}
          nounMany="rostlin"
          onClose={() => setShowBulkShop(false)}
        />
      ) : null}
    </article>
  );
}

function PlantRow({ plant }: { plant: GlobalPlant }) {
  return (
    <li className={s.row} data-herbar-row="">
      <Link to={`/ikaros/herbar/${plant.id}`} className={s.rowLink}>
        <span className={s.thumb} data-plant-portrait="">
          {plant.imageUrl ? (
            <img src={plant.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              {plant.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowNameRow}>
            <span className={s.rowName}>{plant.name}</span>
            {plant.aliases ? (
              <span className={s.rowAliases}>{plant.aliases}</span>
            ) : null}
          </span>
          {plant.habitat ? (
            <span className={s.rowHabitat}>{plant.habitat}</span>
          ) : null}
        </span>
        {plant.rarity ? (
          <span
            className={s.rarityChip}
            data-rarity={plant.rarity}
            title="Vzácnost"
          >
            {rarityLabel(plant.rarity)}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
