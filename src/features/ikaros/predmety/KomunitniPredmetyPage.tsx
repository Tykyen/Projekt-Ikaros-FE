/**
 * 21.5e — Komunitní katalog předmětů ve Společné tvorbě.
 * Dvě knihovny (Schválená / Návrhy) + filtry Systém/Druh + rejstřík + hromadný
 * vklad do obchodu. Vzor: KomunitniLektvaryPage (21.5b); layout CSS modul
 * reuse z kouzel, skiny přes vlastní data-atributy `data-item-*`.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { InsertToShopModal } from '../herbar/components/InsertToShopModal';
import { catalogItemToShopInsert } from './shopInsert';
import { usePredmety } from './hooks/usePredmety';
import { ItemEditorModal } from './components/ItemEditorModal';
import { itemSystemLabel } from './systems/itemTemplates';
import type { GlobalItem, CatalogItemStatus } from './types';
import s from '../kouzla/KomunitniKouzla.module.css';
import './predmetySkins.css';

const uniq = (arr: string[]) => Array.from(new Set(arr));

export default function KomunitniPredmetyPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [library, setLibrary] = useState<CatalogItemStatus>('approved');
  const [systemFilter, setSystemFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkShop, setShowBulkShop] = useState(false);

  const approved = usePredmety({ status: 'approved' });
  const drafts = usePredmety({ status: 'draft' });
  const active = library === 'approved' ? approved : drafts;
  const items = useMemo(() => active.data ?? [], [active.data]);

  const systems = useMemo(
    () => uniq(items.flatMap((p) => Object.keys(p.statblocks ?? {}))).sort(),
    [items],
  );
  const kinds = useMemo(
    () =>
      uniq(items.map((p) => p.kind).filter(Boolean)).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    [items],
  );

  const filtered = items.filter(
    (p) =>
      (systemFilter === 'all' || Boolean(p.statblocks?.[systemFilter])) &&
      (kindFilter === 'all' || p.kind === kindFilter),
  );

  const resetFilters = () => {
    setSystemFilter('all');
    setKindFilter('all');
  };

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Předměty' },
  ];

  return (
    <article className={s.page} data-item-scope="community">
      <Seo
        title="Komunitní předměty"
        description="Sdílený katalog vlastních předmětů napříč herními systémy — zbraně, zbroje a vybavení s mechanikou per systém a vkladem do obchodu světa."
        canonicalPath="/ikaros/predmety"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Komunitní předměty</h1>
        <p className={s.lead}>
          Dvě oddělené knihovny předmětů. Zbraně, zbroje i vybavení — pole
          statbloku se řídí druhem předmětu a systémem, a rovnou do obchodu
          tvého světa.
        </p>
        {isAuth ? (
          <div className={s.headActions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nový předmět
            </Button>
            {filtered.length > 0 ? (
              <Button variant="ghost" onClick={() => setShowBulkShop(true)}>
                🛒 Vlož vše do obchodu
              </Button>
            ) : null}
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
            📖
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Schválená knihovna</span>
            <span className={s.libDesc}>
              přijaté předměty, balancnuté systém po systému
            </span>
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
            ✎
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Knihovna návrhů</span>
            <span className={s.libDesc}>
              komunitní, zatím neověřené — čekají na schválení
            </span>
          </span>
          <span className={s.libCount}>{drafts.data?.length ?? '–'}</span>
        </button>
      </div>

      {/* Filtry (client-side) */}
      {(systems.length > 0 || kinds.length > 0) && (
        <div className={s.filters}>
          {systems.length > 0 && (
            <div className={s.filterRow}>
              <span className={s.filterLabel}>Systém</span>
              <Chip
                active={systemFilter === 'all'}
                onClick={() => setSystemFilter('all')}
              >
                Vše
              </Chip>
              {systems.map((sy) => (
                <Chip
                  key={sy}
                  active={systemFilter === sy}
                  onClick={() => setSystemFilter(sy)}
                >
                  {itemSystemLabel(sy)}
                </Chip>
              ))}
            </div>
          )}
          {kinds.length > 0 && (
            <div className={s.filterRow}>
              <span className={s.filterLabel}>Druh</span>
              <Chip
                active={kindFilter === 'all'}
                onClick={() => setKindFilter('all')}
              >
                Vše
              </Chip>
              {kinds.map((k) => (
                <Chip
                  key={k}
                  active={kindFilter === k}
                  onClick={() => setKindFilter(k)}
                >
                  {k}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seznam (rejstřík) */}
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
        <ul className={s.list} data-predmety-list="">
          {filtered.map((p) => (
            <ItemRow key={p.id} item={p} />
          ))}
        </ul>
      )}

      {showCreate ? (
        <ItemEditorModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => setLibrary('draft')}
        />
      ) : null}
      {showBulkShop ? (
        <InsertToShopModal
          mode="bulk"
          items={filtered.map(catalogItemToShopInsert)}
          nounMany="předmětů"
          onClose={() => setShowBulkShop(false)}
        />
      ) : null}
    </article>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={clsx(s.chip, active && s.chipOn)}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ItemRow({ item }: { item: GlobalItem }) {
  const systems = Object.keys(item.statblocks ?? {});
  return (
    <li className={s.row} data-predmety-row="">
      <Link to={`/ikaros/predmety/${item.id}`} className={s.rowLink}>
        <span className={s.thumb} data-item-portrait="">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              ⚔
            </span>
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowNameRow}>
            <span className={s.rowName}>{item.name}</span>
            {item.aliases ? (
              <span className={s.rowLatin}>{item.aliases}</span>
            ) : null}
          </span>
          {item.kind ? <span className={s.rowKind}>{item.kind}</span> : null}
        </span>
        <span className={s.rowSystems}>
          {systems.map((sy) => (
            <span key={sy} className={s.pill}>
              {itemSystemLabel(sy)}
            </span>
          ))}
        </span>
      </Link>
    </li>
  );
}
