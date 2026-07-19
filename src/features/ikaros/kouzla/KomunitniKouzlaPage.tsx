/**
 * 21.5c — Komunitní katalog kouzel ve Společné tvorbě.
 * Dvě oddělené knihovny (Schválená / Návrhy) + filtry Systém/Škola + seznam
 * (rejstřík). Vzor: KomunitniBestiarPage; motiv-aware přes `--theme-*` tokeny;
 * tvarové skiny per motiv přijdou přes `[data-theme] [data-spell-*]`.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useKouzla } from './hooks/useKouzla';
import { SpellEditorModal } from './components/SpellEditorModal';
import { spellSchool, spellSystemLabel } from './systems/spellTemplates';
import type { GlobalSpell, SpellStatus } from './types';
import s from './KomunitniKouzla.module.css';
import './kouzlaSkins.css';

const uniq = (arr: string[]) => Array.from(new Set(arr));

/** Školy magie napříč statbloky kouzla (filtr + badge). */
function spellSchools(spell: GlobalSpell): string[] {
  return uniq(
    Object.values(spell.statblocks ?? {})
      .map((sb) => spellSchool(sb.systemStats))
      .filter(Boolean),
  );
}

export default function KomunitniKouzlaPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [library, setLibrary] = useState<SpellStatus>('approved');
  const [systemFilter, setSystemFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const approved = useKouzla({ status: 'approved' });
  const drafts = useKouzla({ status: 'draft' });
  const active = library === 'approved' ? approved : drafts;
  const spells = useMemo(() => active.data ?? [], [active.data]);

  const systems = useMemo(
    () => uniq(spells.flatMap((sp) => Object.keys(sp.statblocks ?? {}))).sort(),
    [spells],
  );
  const schools = useMemo(
    () => uniq(spells.flatMap(spellSchools)).sort((a, b) => a.localeCompare(b, 'cs')),
    [spells],
  );

  const filtered = spells.filter(
    (sp) =>
      (systemFilter === 'all' || Boolean(sp.statblocks?.[systemFilter])) &&
      (schoolFilter === 'all' || spellSchools(sp).includes(schoolFilter)),
  );

  const resetFilters = () => {
    setSystemFilter('all');
    setSchoolFilter('all');
  };

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Kouzla' },
  ];

  return (
    <article className={s.page} data-spell-scope="community">
      <Seo
        title="Komunitní kouzla"
        description="Sdílený katalog vlastních kouzel napříč herními systémy — prohlížej, diskutuj a tvoř nová kouzla se školou magie a statblokem pro tvůj systém."
        canonicalPath="/ikaros/kouzla"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Komunitní kouzla</h1>
        <p className={s.lead}>
          Dvě oddělené knihovny kouzel. Tvoř vlastní kouzla se školou magie a
          statblokem pro tvůj systém — komunita je vyladí, kurátor schválí.
        </p>
        {isAuth ? (
          <div className={s.headActions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nové kouzlo
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
              přijatá kouzla, balancnutá systém po systému
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
      {(systems.length > 0 || schools.length > 0) && (
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
                  {spellSystemLabel(sy)}
                </Chip>
              ))}
            </div>
          )}
          {schools.length > 0 && (
            <div className={s.filterRow}>
              <span className={s.filterLabel}>Škola</span>
              <Chip
                active={schoolFilter === 'all'}
                onClick={() => setSchoolFilter('all')}
              >
                Vše
              </Chip>
              {schools.map((sc) => (
                <Chip
                  key={sc}
                  active={schoolFilter === sc}
                  onClick={() => setSchoolFilter(sc)}
                >
                  {sc}
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
        <ul className={s.list} data-kouzla-list="">
          {filtered.map((sp) => (
            <SpellRow key={sp.id} spell={sp} />
          ))}
        </ul>
      )}

      {showCreate ? (
        <SpellEditorModal
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

function SpellRow({ spell }: { spell: GlobalSpell }) {
  const systems = Object.keys(spell.statblocks ?? {});
  const schools = spellSchools(spell);
  return (
    <li className={s.row} data-kouzla-row="">
      <Link to={`/ikaros/kouzla/${spell.id}`} className={s.rowLink}>
        <span className={s.thumb} data-spell-portrait="">
          {spell.imageUrl ? (
            <img src={spell.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              ✦
            </span>
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowNameRow}>
            <span className={s.rowName}>{spell.name}</span>
            {spell.aliases ? (
              <span className={s.rowLatin}>{spell.aliases}</span>
            ) : null}
          </span>
          {schools.length ? (
            <span className={s.rowKind}>{schools.join(' · ')}</span>
          ) : null}
        </span>
        <span className={s.rowSystems}>
          {systems.map((sy) => (
            <span key={sy} className={s.pill}>
              {spellSystemLabel(sy)}
            </span>
          ))}
        </span>
      </Link>
    </li>
  );
}
