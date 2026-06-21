import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Plus, Search, ArrowUpDown, Lock, MessageCircle, Heart } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { Spinner, EmptyState } from '@/shared/ui';
import { useDiscussions } from '../api/useDiscussions';
import { filterDiscussions, timeAgo, type DiscussionSort } from '../lib/discussions';
import type { IkarosDiscussion } from '@/shared/types';
import s from './DiscussionsPage.module.css';

type Tab = 'prehled' | 'moje';

export default function DiscussionsPage() {
  const [tab, setTab] = useState<Tab>('prehled');
  const user = useAtomValue(currentUserAtom);
  const { data: discussions = [], isLoading } = useDiscussions();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [sort, setSort] = useState<DiscussionSort>('activity');

  const scoped = useMemo(() => {
    if (tab !== 'moje' || !user) return discussions;
    return discussions.filter(
      (d) => d.creatorId === user.id || d.managerIds.includes(user.id),
    );
  }, [discussions, tab, user]);

  const filtered = useMemo(
    () => filterDiscussions(scoped, debouncedQuery, sort),
    [scoped, debouncedQuery, sort],
  );

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Diskuze</h1>
          <p className={s.subtitle}>Témata k rozhovoru napříč komunitou</p>
        </div>
        <Link to="/ikaros/diskuze/nova" className={s.newBtn}>
          <Plus size={16} /> Nová diskuze
        </Link>
      </header>

      <nav className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'prehled'}
          onClick={() => setTab('prehled')}
          className={tab === 'prehled' ? s.tabActive : s.tab}
        >
          Přehled
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'moje'}
          onClick={() => setTab('moje')}
          className={tab === 'moje' ? s.tabActive : s.tab}
        >
          Moje
        </button>
      </nav>

      <div className={s.toolbar}>
        <label className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat diskuzi…"
            className={s.searchInput}
            aria-label="Hledat diskuzi"
          />
        </label>
        <label className={s.sortWrap}>
          <ArrowUpDown size={14} aria-hidden />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as DiscussionSort)}
            className={s.sortSelect}
            aria-label="Řazení"
          >
            <option value="activity">Podle aktivity</option>
            <option value="new">Nejnovější</option>
            <option value="posts">Nejvíc příspěvků</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <Spinner center />
      ) : filtered.length === 0 ? (
        debouncedQuery ? (
          <EmptyState
            size="panel"
            title="Nic neodpovídá hledání"
            description="Zkus jiné klíčové slovo."
          />
        ) : tab === 'moje' ? (
          <EmptyState
            size="hero"
            illustration="messages"
            title="Zatím nic nespravuješ"
            description="Tady se objeví diskuze, které jsi založil nebo spravuješ."
            action={{ label: 'Založit diskuzi', to: '/ikaros/diskuze/nova' }}
          />
        ) : (
          <EmptyState
            size="hero"
            illustration="messages"
            title="Začni první rozhovor"
            description="Zatím tu není žádná diskuze."
            action={{ label: 'Nová diskuze', to: '/ikaros/diskuze/nova' }}
          />
        )
      ) : (
        <ul className={s.list}>
          {filtered.map((d) => (
            <DiscussionCard key={d.id} discussion={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Karta diskuze ─────────────────────────────────────────────────────────

function DiscussionCard({ discussion: d }: { discussion: IkarosDiscussion }) {
  return (
    <li>
      <Link to={`/ikaros/diskuze/${d.id}`} className={s.card}>
        <div className={s.cardMain}>
          <div className={s.cardHead}>
            {!d.isOpen && (
              <span className={s.lockBadge} title="Uzamčená diskuze">
                <Lock size={11} /> Uzamčená
              </span>
            )}
            {!d.isApproved && (
              <span className={s.pendingBadge}>Čeká na schválení</span>
            )}
            <h2 className={s.cardTitle}>{d.title}</h2>
          </div>
          {d.description && <p className={s.cardDesc}>{d.description}</p>}
          <div className={s.meta}>
            {/* D-040 — tombstone label u creatora. */}
            <span
              className={s.author}
              style={d.creatorIsDeleted ? { fontStyle: 'italic', opacity: 0.7 } : undefined}
            >
              {d.creatorIsDeleted ? 'Smazaný účet' : d.creatorName}
            </span>
            <span className={s.metaSep}>·</span>
            <span className={s.metaItem}>
              <MessageCircle size={12} aria-hidden /> {d.postCount}
            </span>
            <span className={s.metaSep}>·</span>
            <span className={s.metaItem}>
              <Heart size={12} aria-hidden /> {d.likeCount}
            </span>
            <span className={s.metaSep}>·</span>
            <span>{timeAgo(d.lastActivityUtc)}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
