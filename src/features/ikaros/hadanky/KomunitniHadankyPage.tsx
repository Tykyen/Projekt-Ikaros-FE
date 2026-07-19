/**
 * 21.5d — Komunitní katalog hádanek ve Společné tvorbě.
 * Dvě knihovny (Schválená / Návrhy) + filtr Úroveň + rejstřík (zkrácené
 * zadání — hádanka nemá name, spec R4). Layout CSS reuse z kouzel.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useHadanky } from './hooks/useHadanky';
import { RiddleEditorModal } from './components/RiddleEditorModal';
import {
  DIFFICULTY_OPTIONS,
  difficultyLabel,
  riddleExcerpt,
  type GlobalRiddle,
  type RiddleDifficulty,
  type RiddleStatus,
} from './types';
import s from '../kouzla/KomunitniKouzla.module.css';
import './hadankySkins.css';

export default function KomunitniHadankyPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [library, setLibrary] = useState<RiddleStatus>('approved');
  const [diffFilter, setDiffFilter] = useState<RiddleDifficulty | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);

  const approved = useHadanky({ status: 'approved' });
  const drafts = useHadanky({ status: 'draft' });
  const active = library === 'approved' ? approved : drafts;
  const riddles = useMemo(() => active.data ?? [], [active.data]);

  const filtered = riddles.filter(
    (r) => diffFilter === 'all' || r.difficulty === diffFilter,
  );

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Hádanky' },
  ];

  return (
    <article className={s.page} data-riddle-scope="community">
      <Seo
        title="Komunitní hádanky"
        description="Sdílený katalog hádanek pro Pány jeskyně — zadání, skrytá odpověď a postupné nápovědy, úrovně od lehké po ultratěžkou."
        canonicalPath="/ikaros/hadanky"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Komunitní hádanky</h1>
        <p className={s.lead}>
          Hádanky pro tvou hru — od lehkých po ultratěžké. Odpovědi a nápovědy
          jsou schované za klik, ať si nic nevyzradíš předčasně.
        </p>
        {isAuth ? (
          <div className={s.headActions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nová hádanka
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
            setDiffFilter('all');
          }}
        >
          <span className={s.libIco} aria-hidden="true">
            📖
          </span>
          <span className={s.libMain}>
            <span className={s.libName}>Schválená knihovna</span>
            <span className={s.libDesc}>
              prověřené hádanky vč. lidové klasiky
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
            setDiffFilter('all');
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

      {/* Filtr úrovně */}
      <div className={s.filters}>
        <div className={s.filterRow}>
          <span className={s.filterLabel}>Úroveň</span>
          <Chip active={diffFilter === 'all'} onClick={() => setDiffFilter('all')}>
            Vše
          </Chip>
          {DIFFICULTY_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              active={diffFilter === o.id}
              onClick={() => setDiffFilter(o.id)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
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
        <ul className={s.list} data-hadanky-list="">
          {filtered.map((r) => (
            <RiddleRow key={r.id} riddle={r} />
          ))}
        </ul>
      )}

      {showCreate ? (
        <RiddleEditorModal
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

function RiddleRow({ riddle }: { riddle: GlobalRiddle }) {
  return (
    <li className={s.row} data-hadanky-row="">
      <Link to={`/ikaros/hadanky/${riddle.id}`} className={s.rowLink}>
        <span className={s.thumb} data-riddle-portrait="">
          {riddle.imageUrl ? (
            <img src={riddle.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              ？
            </span>
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowNameRow}>
            <span className={s.rowName}>{riddleExcerpt(riddle.question)}</span>
          </span>
          <span className={s.rowKind}>
            {difficultyLabel(riddle.difficulty)}
            {riddle.origin ? ` · ${riddle.origin}` : ''}
            {riddle.hints.length
              ? ` · ${riddle.hints.length} nápověd${riddle.hints.length === 1 ? 'a' : riddle.hints.length < 5 ? 'y' : ''}`
              : ''}
          </span>
        </span>
      </Link>
    </li>
  );
}
