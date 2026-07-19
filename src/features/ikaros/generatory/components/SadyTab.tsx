/**
 * 21.2a — záložka „Sady": správa jmenných sad (2 knihovny draft/approved,
 * filtr kategorie, hledání) + založení nové. Detail = vlastní route.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Button, ErrorState } from '@/shared/ui';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useNameSetsList } from '../hooks/useNameSets';
import { NameSetEditorModal } from './NameSetEditorModal';
import {
  NAME_SET_CATEGORY_LABELS,
  type NameSetCategory,
  type NameSetStatus,
} from '../types';
import s from '../Generatory.module.css';

export function SadyTab() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [status, setStatus] = useState<NameSetStatus>('approved');
  const [category, setCategory] = useState<'all' | NameSetCategory>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const {
    data: sets = [],
    isLoading,
    isError,
    refetch,
  } = useNameSetsList({ status });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sets.filter(
      (set) =>
        (category === 'all' || set.category === category) &&
        (q === '' ||
          set.name.toLowerCase().includes(q) ||
          (set.description ?? '').toLowerCase().includes(q)),
    );
  }, [sets, category, search]);

  return (
    <div data-generator-sady="">
      <div className={s.panel}>
        <div className={s.paramGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="sady-status">
              Knihovna
            </label>
            <select
              id="sady-status"
              className={s.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as NameSetStatus)}
            >
              <option value="approved">Schválené</option>
              <option value="draft">Návrhy</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="sady-cat">
              Kategorie
            </label>
            <select
              id="sady-cat"
              className={s.select}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as 'all' | NameSetCategory)
              }
            >
              <option value="all">Vše</option>
              {Object.entries(NAME_SET_CATEGORY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="sady-search">
              Hledat
            </label>
            <input
              id="sady-search"
              className={s.input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="název sady…"
            />
          </div>
        </div>
        {isAuth ? (
          <div className={s.actions}>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              ＋ Nová sada
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <p className={s.state}>Načítám…</p>
      ) : isError ? (
        <ErrorState
          size="panel"
          title="Sady se nepodařilo načíst"
          description="Zkus to prosím znovu."
          onRetry={() => void refetch()}
        />
      ) : filtered.length === 0 ? (
        <p className={s.state}>
          {status === 'approved' ? 'Žádné schválené sady.' : 'Žádné návrhy.'}
        </p>
      ) : (
        <ul className={s.setList}>
          {filtered.map((set) => (
            <li key={set.id}>
              <Link
                to={`/ikaros/generatory/sady/${set.id}`}
                className={s.setRow}
                data-nameset-row=""
              >
                <span className={s.setMain}>
                  <span className={s.setName}>{set.name}</span>
                  {set.description ? (
                    <span className={s.setDesc}>{set.description}</span>
                  ) : null}
                </span>
                <span className={s.countChip}>
                  ♂{set.counts.male} · ♀{set.counts.female} · 👪
                  {set.counts.surnames}
                </span>
                <span className={s.stateBadge} data-status={set.status}>
                  {set.status === 'approved' ? '✔' : '📝'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showCreate ? (
        <NameSetEditorModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => setStatus('draft')}
        />
      ) : null}
    </div>
  );
}
