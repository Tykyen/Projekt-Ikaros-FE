import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button, ConfirmDialog, Input, Spinner } from '@/shared/ui';
import type { AdminFriendshipView } from '@/shared/types';
import {
  useAdminFriendshipByPair,
  useAdminFriendshipsByUser,
  useAdminResetCooldown,
} from '@/features/admin/friendships/api/useAdminFriendships';
import s from './FriendshipDebugTab.module.css';

type Mode = 'by-pair' | 'by-user';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * D-056 — Admin nástroj pro debug + reset friendship cooldownů.
 *
 * Dva módy lookupu:
 *  - by-pair: hledá konkrétní pár přes 2 user IDs
 *  - by-user: vrátí všechny friendships konkrétního usera
 *
 * Akce „Reset cooldown" je dostupná jen pro řádky s aktivním cooldownem
 * (`lastDeclinedAt != null`). Reset se loguje do `AdminAuditLog`.
 */
export function FriendshipDebugTab() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('by-pair');
  const [userA, setUserA] = useState('');
  const [userB, setUserB] = useState('');
  const [userId, setUserId] = useState('');
  const [submittedPair, setSubmittedPair] = useState<{
    a: string;
    b: string;
  } | null>(null);
  const [submittedUser, setSubmittedUser] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<AdminFriendshipView | null>(
    null,
  );

  const pairQuery = useAdminFriendshipByPair(
    submittedPair?.a ?? null,
    submittedPair?.b ?? null,
  );
  const userQuery = useAdminFriendshipsByUser(submittedUser);
  const reset = useAdminResetCooldown();

  const submitPair = () => {
    if (!userA.trim() || !userB.trim()) return;
    setSubmittedPair({ a: userA.trim(), b: userB.trim() });
  };
  const submitUser = () => {
    if (!userId.trim()) return;
    setSubmittedUser(userId.trim());
  };

  const pairResult = pairQuery.data?.friendship;
  const userResults = userQuery.data?.items ?? [];

  return (
    <section className={s.tab} aria-label="Friendship debug">
      <header className={s.header}>
        <h2 className={s.title}>
          <ShieldAlert size={18} aria-hidden="true" /> Friendship debug
        </h2>
        <p className={s.lead}>
          Admin nástroj pro audit friendship cooldownů. Lookup podle páru nebo
          jednoho uživatele; reset smaže <code>lastDeclinedAt</code> +{' '}
          <code>lastDeclinedById</code> a zaloguje akci do Audit logu.
        </p>
      </header>

      <div className={s.modeTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'by-pair'}
          className={mode === 'by-pair' ? s.modeTabActive : s.modeTab}
          onClick={() => setMode('by-pair')}
        >
          Podle páru
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'by-user'}
          className={mode === 'by-user' ? s.modeTabActive : s.modeTab}
          onClick={() => setMode('by-user')}
        >
          Podle uživatele
        </button>
      </div>

      {mode === 'by-pair' && (
        <div className={s.searchForm}>
          <Input
            placeholder="User A ID (ObjectId)"
            value={userA}
            onChange={(e) => setUserA(e.target.value)}
            className={s.searchInput}
          />
          <Input
            placeholder="User B ID (ObjectId)"
            value={userB}
            onChange={(e) => setUserB(e.target.value)}
            className={s.searchInput}
          />
          <Button onClick={submitPair} disabled={!userA.trim() || !userB.trim()}>
            <Search size={14} aria-hidden="true" /> Najít
          </Button>
        </div>
      )}

      {mode === 'by-user' && (
        <div className={s.searchForm}>
          <Input
            placeholder="User ID (ObjectId)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={s.searchInput}
          />
          <Button onClick={submitUser} disabled={!userId.trim()}>
            <Search size={14} aria-hidden="true" /> Načíst friendships
          </Button>
        </div>
      )}

      <div className={s.results}>
        {mode === 'by-pair' && pairQuery.isLoading && <Spinner center />}
        {mode === 'by-pair' && submittedPair && !pairQuery.isLoading && (
          <>
            {pairResult ? (
              <FriendshipRow
                item={pairResult}
                onOpenProfile={(id) => navigate(`/ikaros/uzivatel/${id}`)}
                onResetClick={() => setConfirmReset(pairResult)}
              />
            ) : (
              <div className={s.empty}>
                Pro tento pár neexistuje friendship záznam.
              </div>
            )}
          </>
        )}

        {mode === 'by-user' && userQuery.isLoading && <Spinner center />}
        {mode === 'by-user' && submittedUser && !userQuery.isLoading && (
          <>
            {userResults.length === 0 ? (
              <div className={s.empty}>
                Uživatel nemá žádné friendships (nebo neexistuje).
              </div>
            ) : (
              <div className={s.list}>
                {userResults.map((f) => (
                  <FriendshipRow
                    key={f.id}
                    item={f}
                    onOpenProfile={(id) =>
                      navigate(`/ikaros/uzivatel/${id}`)
                    }
                    onResetClick={() => setConfirmReset(f)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        title="Reset friendship cooldownu?"
        message={
          confirmReset ? (
            <>
              Resetovat cooldown mezi{' '}
              <strong>{confirmReset.userAUsername ?? confirmReset.userAId}</strong>{' '}
              ↔{' '}
              <strong>{confirmReset.userBUsername ?? confirmReset.userBId}</strong>
              ? Akce se zaloguje do Audit logu jako{' '}
              <code>FRIENDSHIP_COOLDOWN_RESET</code>.
            </>
          ) : null
        }
        confirmLabel="Resetovat"
        isPending={reset.isPending}
        onConfirm={async () => {
          if (!confirmReset) return;
          await reset.mutateAsync(confirmReset.id);
          setConfirmReset(null);
        }}
      />
    </section>
  );
}

interface RowProps {
  item: AdminFriendshipView;
  onOpenProfile: (id: string) => void;
  onResetClick: () => void;
}

function FriendshipRow({ item, onOpenProfile, onResetClick }: RowProps) {
  const hasCooldown = !!item.lastDeclinedAt;
  return (
    <article className={s.row}>
      <div className={s.rowHeader}>
        <strong>
          {item.userAUsername ?? '(smazaný)'} ↔{' '}
          {item.userBUsername ?? '(smazaný)'}
        </strong>
        <span className={s.statusChip} data-status={item.status}>
          {item.status}
        </span>
      </div>
      <dl className={s.meta}>
        <div>
          <dt>ID páru</dt>
          <dd>
            <code>{item.id}</code>
          </dd>
        </div>
        <div>
          <dt>Requested by</dt>
          <dd>{item.requestedById}</dd>
        </div>
        <div>
          <dt>Last declined</dt>
          <dd>
            {formatDateTime(item.lastDeclinedAt)}
            {item.lastDeclinedById && ` (by ${item.lastDeclinedById})`}
          </dd>
        </div>
        <div>
          <dt>Blocked by</dt>
          <dd>{item.blockedById ?? '—'}</dd>
        </div>
        <div>
          <dt>Accepted</dt>
          <dd>{formatDateTime(item.acceptedAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDateTime(item.updatedAt)}</dd>
        </div>
      </dl>
      <div className={s.rowActions}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenProfile(item.userAId)}
        >
          Profil A
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenProfile(item.userBId)}
        >
          Profil B
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={!hasCooldown}
          onClick={onResetClick}
          title={
            hasCooldown
              ? 'Resetovat lastDeclinedAt + lastDeclinedById'
              : 'Pár nemá aktivní cooldown'
          }
        >
          <RefreshCw size={14} aria-hidden="true" /> Reset cooldown
        </Button>
      </div>
    </article>
  );
}
