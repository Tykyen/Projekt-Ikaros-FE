import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Unlock, X, Check, UserPlus, Shield } from 'lucide-react';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { useUserLookup, type UserLookupItem } from '../api/useUserLookup';
import {
  useDiscussionMembers,
  usePatchDiscussion,
  useInviteUser,
  useAddManager,
  useRemoveManager,
  useResolveJoinRequest,
} from '../api/useDiscussions';
import type { IkarosDiscussion } from '@/shared/types';
import s from './DiscussionManagePanel.module.css';

const MAX_BULLETIN = 5000;

/** Spec 3.4d — panel správy diskuze (creator/manažer): zámek, vývěska,
 *  správci, pozvánky, žádosti o přidání. */
export function DiscussionManagePanel({
  discussion: d,
}: {
  discussion: IkarosDiscussion;
}) {
  const { data: members } = useDiscussionMembers(d.id);
  const patch = usePatchDiscussion();
  const invite = useInviteUser();
  const addManager = useAddManager();
  const removeManager = useRemoveManager();
  const resolveJoin = useResolveJoinRequest();

  const [bulletin, setBulletin] = useState(d.bulletin);
  const bulletinDirty = bulletin !== d.bulletin;

  function toggleLock() {
    patch.mutate(
      { id: d.id, dto: { isOpen: !d.isOpen } },
      {
        onSuccess: () =>
          toast.success(d.isOpen ? 'Diskuze uzamčena' : 'Diskuze otevřena'),
        onError: () => toast.error('Nepodařilo se změnit přístup'),
      },
    );
  }

  function saveBulletin() {
    patch.mutate(
      { id: d.id, dto: { bulletin } },
      {
        onSuccess: () => toast.success('Vývěska uložena'),
        onError: () => toast.error('Nepodařilo se uložit vývěsku'),
      },
    );
  }

  return (
    <section className={s.panel}>
      <h2 className={s.heading}>
        <Shield size={16} aria-hidden /> Správa diskuze
      </h2>

      {/* Zámek */}
      <div className={s.row}>
        <div>
          <div className={s.rowTitle}>Přístup</div>
          <div className={s.rowHint}>
            {d.isOpen
              ? 'Otevřená — přispívat může každý.'
              : 'Uzamčená — jen pozvaní; ostatní žádají o přidání.'}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleLock}
          disabled={patch.isPending}
          className={s.btnGhost}
        >
          {d.isOpen ? <Lock size={14} /> : <Unlock size={14} />}
          {d.isOpen ? 'Uzamknout' : 'Otevřít'}
        </button>
      </div>

      {/* Vývěska */}
      <div className={s.block}>
        <div className={s.rowTitle}>Vývěska</div>
        <div className={s.rowHint}>Krátké oznámení zvýrazněné v hlavičce.</div>
        <textarea
          value={bulletin}
          onChange={(e) => setBulletin(e.target.value)}
          maxLength={MAX_BULLETIN}
          rows={2}
          placeholder="Bez vývěsky"
          className={s.textarea}
        />
        <button
          type="button"
          onClick={saveBulletin}
          disabled={!bulletinDirty || patch.isPending}
          className={s.btnGhost}
        >
          Uložit vývěsku
        </button>
      </div>

      {/* Správci */}
      <div className={s.block}>
        <div className={s.rowTitle}>Správci</div>
        <ul className={s.memberList}>
          {(members?.managers ?? []).map((m) => (
            <li key={m.id} className={s.member}>
              <span>{m.username}</span>
              {m.id === d.creatorId ? (
                <span className={s.tag}>tvůrce</span>
              ) : (
                <button
                  type="button"
                  className={s.removeBtn}
                  aria-label={`Odebrat správce ${m.username}`}
                  onClick={() =>
                    removeManager.mutate(
                      { id: d.id, userId: m.id },
                      {
                        onSuccess: () => toast.success('Správce odebrán'),
                        onError: () =>
                          toast.error('Nepodařilo se odebrat správce'),
                      },
                    )
                  }
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <UserPicker
          placeholder="Přidat správce…"
          icon={<Shield size={13} />}
          excludeIds={(members?.managers ?? []).map((m) => m.id)}
          isPending={addManager.isPending}
          onPick={(u) =>
            addManager.mutate(
              { id: d.id, userId: u.id },
              {
                onSuccess: () => toast.success(`${u.username} je správce`),
                onError: () => toast.error('Nepodařilo se přidat správce'),
              },
            )
          }
        />
      </div>

      {/* Pozvánky + žádosti — jen uzamčená diskuze */}
      {!d.isOpen && (
        <>
          <div className={s.block}>
            <div className={s.rowTitle}>Pozvaní</div>
            <ul className={s.memberList}>
              {(members?.invited ?? []).length === 0 && (
                <li className={s.empty}>Zatím nikdo nepozván.</li>
              )}
              {(members?.invited ?? []).map((m) => (
                <li key={m.id} className={s.member}>
                  <span>{m.username}</span>
                </li>
              ))}
            </ul>
            <UserPicker
              placeholder="Pozvat uživatele…"
              icon={<UserPlus size={13} />}
              excludeIds={(members?.invited ?? []).map((m) => m.id)}
              isPending={invite.isPending}
              onPick={(u) =>
                invite.mutate(
                  { id: d.id, userId: u.id },
                  {
                    onSuccess: () => toast.success(`${u.username} pozván/a`),
                    onError: () => toast.error('Nepodařilo se pozvat'),
                  },
                )
              }
            />
          </div>

          <div className={s.block}>
            <div className={s.rowTitle}>
              Žádosti o přidání
              {(members?.joinRequests ?? []).length > 0 && (
                <span className={s.count}>
                  {' '}
                  ({members?.joinRequests.length})
                </span>
              )}
            </div>
            <ul className={s.memberList}>
              {(members?.joinRequests ?? []).length === 0 && (
                <li className={s.empty}>Žádné čekající žádosti.</li>
              )}
              {(members?.joinRequests ?? []).map((m) => (
                <li key={m.id} className={s.member}>
                  <span>{m.username}</span>
                  <span className={s.reqBtns}>
                    <button
                      type="button"
                      className={s.acceptBtn}
                      disabled={resolveJoin.isPending}
                      onClick={() =>
                        resolveJoin.mutate(
                          {
                            discussionId: d.id,
                            userId: m.id,
                            accept: true,
                          },
                          {
                            onSuccess: () => toast.success('Žadatel přidán'),
                            onError: () => toast.error('Akce selhala'),
                          },
                        )
                      }
                    >
                      <Check size={13} /> Přijmout
                    </button>
                    <button
                      type="button"
                      className={s.removeBtn}
                      disabled={resolveJoin.isPending}
                      onClick={() =>
                        resolveJoin.mutate(
                          {
                            discussionId: d.id,
                            userId: m.id,
                            accept: false,
                          },
                          {
                            onSuccess: () => toast.success('Žádost odmítnuta'),
                            onError: () => toast.error('Akce selhala'),
                          },
                        )
                      }
                    >
                      <X size={13} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

// ─── User picker (debounced lookup) ─────────────────────────────────────────

function UserPicker({
  placeholder,
  icon,
  excludeIds,
  isPending,
  onPick,
}: {
  placeholder: string;
  icon: React.ReactNode;
  excludeIds: string[];
  isPending: boolean;
  onPick: (user: UserLookupItem) => void;
}) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const { data: results = [], isFetching } = useUserLookup(debounced);
  const visible = results.filter((u) => !excludeIds.includes(u.id));

  return (
    <div className={s.picker}>
      <label className={s.pickerInput}>
        <span aria-hidden>{icon}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      {debounced.trim().length >= 2 && (
        <ul className={s.pickerResults}>
          {isFetching && <li className={s.pickerHint}>Hledám…</li>}
          {!isFetching && visible.length === 0 && (
            <li className={s.pickerHint}>Nikdo nenalezen.</li>
          )}
          {visible.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  onPick(u);
                  setQuery('');
                }}
                className={s.pickerItem}
              >
                {u.username}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
