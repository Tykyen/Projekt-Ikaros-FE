/**
 * 16.2b-2 — Komunitní (globální) bestiář ve Společné tvorbě.
 * FE-2: dvě oddělené knihovny (Schválená / Návrhy) + filtry Typ/Systém + seznam
 * (rejstřík). Vzhled dle schválené HTML kostry, motiv-aware přes `--theme-*`
 * tokeny; tvarové skiny per motiv přijdou v SK-* přes `[data-theme] [data-lib-*]`.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useKomunitniBestiar } from './hooks/useKomunitniBestiar';
import { BestieEditorModal } from './components/BestieEditorModal';
import type { BestieStatus, GlobalBestie } from './types';
import s from './KomunitniBestiar.module.css';
import './komunitniBestiarSkins.css';

const uniq = (arr: string[]) => Array.from(new Set(arr));

export default function KomunitniBestiarPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [library, setLibrary] = useState<BestieStatus>('approved');
  const [kindFilter, setKindFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const approved = useKomunitniBestiar({ status: 'approved' });
  const drafts = useKomunitniBestiar({ status: 'draft' });
  const active = library === 'approved' ? approved : drafts;
  const beasts = useMemo(() => active.data ?? [], [active.data]);

  const kinds = useMemo(
    () => uniq(beasts.map((b) => b.kind ?? '').filter(Boolean)),
    [beasts],
  );
  const systems = useMemo(
    () => uniq(beasts.flatMap((b) => Object.keys(b.statblocks ?? {}))).sort(),
    [beasts],
  );

  const filtered = beasts.filter(
    (b) =>
      (kindFilter === 'all' || b.kind === kindFilter) &&
      (systemFilter === 'all' || Boolean(b.statblocks?.[systemFilter])),
  );

  const resetFilters = () => {
    setKindFilter('all');
    setSystemFilter('all');
  };

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Bestiář' },
  ];

  return (
    <article className={s.page} data-bestie-scope="community">
      <Seo
        title="Globální bestiář"
        description="Sdílený komunitní katalog bytostí a jejich statů napříč herními systémy — prohlížej, diskutuj, tvoř a vkládej si je do vlastního bestiáře."
        canonicalPath="/ikaros/bestiar"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Globální bestiář</h1>
        <p className={s.lead}>
          Dvě oddělené knihovny bytostí. Prohlížej, diskutuj, tvoř — a vkládej
          si je do vlastního bestiáře.
        </p>
        {isAuth ? (
          <div className={s.headActions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nová bytost
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
            📖
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Schválená knihovna</span>
            <span className={s.libDesc}>
              ověřené bytosti, laděné systém po systému
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
              komunitní, zatím neověřené — vzít lze i tak
            </span>
          </span>
          <span className={s.libCount}>{drafts.data?.length ?? '–'}</span>
        </button>
      </div>

      {/* Filtry (client-side) */}
      {(kinds.length > 0 || systems.length > 0) && (
        <div className={s.filters}>
          {kinds.length > 0 && (
            <div className={s.filterRow}>
              <span className={s.filterLabel}>Typ</span>
              <Chip active={kindFilter === 'all'} onClick={() => setKindFilter('all')}>
                Vše
              </Chip>
              {kinds.map((k) => (
                <Chip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
                  {k}
                </Chip>
              ))}
            </div>
          )}
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
                  {sy}
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
        <ul className={s.list} data-lib-list="">
          {filtered.map((b) => (
            <BeastRow key={b.id} bestie={b} />
          ))}
        </ul>
      )}

      {showCreate ? (
        <BestieEditorModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => setLibrary('draft')}
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

function BeastRow({ bestie }: { bestie: GlobalBestie }) {
  const systems = Object.keys(bestie.statblocks ?? {});
  return (
    <li className={s.row} data-lib-row="">
      <Link to={`/ikaros/bestiar/${bestie.id}`} className={s.rowLink}>
        <span className={s.thumb} data-bestie-portrait="">
          {bestie.imageUrl ? (
            <img src={bestie.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              {bestie.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowNameRow}>
            <span className={s.rowName}>{bestie.name}</span>
            {bestie.latin ? (
              <span className={s.rowLatin}>{bestie.latin}</span>
            ) : null}
          </span>
          {bestie.kind ? <span className={s.rowKind}>{bestie.kind}</span> : null}
        </span>
        <span className={s.rowSystems}>
          {systems.map((sy) => (
            <span key={sy} className={s.pill}>
              {sy}
            </span>
          ))}
        </span>
      </Link>
    </li>
  );
}
