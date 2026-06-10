import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Users, ExternalLink, UserMinus } from 'lucide-react';
import clsx from 'clsx';
import { Button, ConfirmDialog, KebabMenu, type KebabMenuItem } from '@/shared/ui';
import type { FriendListItem, PublicUserListItem } from '@/shared/types';
import { UserCard } from '../UsersTab/UserCard';
import { useFriends } from '@/features/friendships/api/useFriends';
import { useOutgoingFriendRequests } from '@/features/friendships/api/useOutgoingFriendRequests';
import { useBlockedFriends } from '@/features/friendships/api/useBlockedFriends';
import { useRemoveFriend } from '@/features/friendships/api/useFriendshipMutations';
import { OutgoingRequestCard } from '@/features/friendships/components/OutgoingRequestCard';
import { BlockedRequestCard } from '@/features/friendships/components/BlockedRequestCard';
import s from './FriendsTab.module.css';
import g from '../UsersTab/CardsGrid.module.css';

/**
 * Spec 1.8 — naplnění tabu „Přátelé" (kostra z 1.4).
 *
 * Layout:
 *  1. Sekce „Moji přátelé" — grid `UserCard` (reuse z 1.4, kebab menu má
 *     2 položky: Otevřít profil / Odebrat z přátel)
 *  2. Sekce „Odeslané žádosti" (collapsible) — `OutgoingRequestCard` řádky;
 *     skryje se pokud 0
 *
 * Empty state: ikona Users + nadpis + výzva s CTA do adresáře (`?tab=uzivatele`).
 */
export function FriendsTab() {
  const navigate = useNavigate();
  const friendsQuery = useFriends();
  const outgoingQuery = useOutgoingFriendRequests();
  const blockedQuery = useBlockedFriends();
  const remove = useRemoveFriend();

  const [kebab, setKebab] = useState<{
    friend: FriendListItem;
    anchor: HTMLElement;
  } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<FriendListItem | null>(
    null,
  );
  const [outgoingExpanded, setOutgoingExpanded] = useState(true);
  // D-055 — default collapsed, citlivý seznam neměl by být primárně visible.
  const [blockedExpanded, setBlockedExpanded] = useState(false);

  // Pojistka: záznam bez protějšku (`friend`) by shodil `toPublicUserListItem`.
  // BE teď protějška vždy dohledá (i placeholder „neznámý"), tohle je jen
  // poslední záchrana proti neúplným datům.
  const friends = (friendsQuery.data?.items ?? []).filter((f) => f.friend);
  const outgoing = outgoingQuery.data?.items ?? [];
  const blocked = blockedQuery.data?.items ?? [];
  const isLoading =
    friendsQuery.isLoading ||
    outgoingQuery.isLoading ||
    blockedQuery.isLoading;

  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="Načítání přátel">
        <div className={g.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={g.skeleton} />
          ))}
        </div>
      </section>
    );
  }

  if (friends.length === 0 && outgoing.length === 0 && blocked.length === 0) {
    return (
      <section className={s.empty} aria-label="Přátelé">
        <span className={s.icon} aria-hidden="true">
          <Users size={48} />
        </span>
        <h2 className={s.title}>Zatím nemáš přátele</h2>
        <p className={s.subtitle}>
          Najdi nové známé v adresáři uživatelů a pošli jim žádost o
          přátelství.
        </p>
        <div className={s.emptyAction}>
          <Button
            onClick={() => navigate('/ikaros/uzivatele?tab=uzivatele')}
          >
            Otevřít adresář →
          </Button>
        </div>
      </section>
    );
  }

  const kebabItems: KebabMenuItem[] = kebab
    ? [
        {
          key: 'open',
          label: 'Otevřít profil',
          icon: <ExternalLink size={14} aria-hidden="true" />,
          onClick: () => {
            const id = kebab.friend.friend.id;
            setKebab(null);
            navigate(`/ikaros/uzivatel/${id}`);
          },
        },
        {
          key: 'remove',
          label: 'Odebrat z přátel',
          icon: <UserMinus size={14} aria-hidden="true" />,
          variant: 'danger',
          onClick: () => {
            setConfirmRemove(kebab.friend);
            setKebab(null);
          },
        },
      ]
    : [];

  return (
    <section aria-label="Přátelé" className={s.tab}>
      {friends.length > 0 && (
        <div className={s.section}>
          <h2 className={s.sectionTitle}>
            Moji přátelé <span className={s.count}>({friends.length})</span>
          </h2>
          <div className={g.grid}>
            {friends.map((f) => (
              <UserCard
                key={f.friendshipId}
                user={toPublicUserListItem(f)}
                onOpen={(id) => navigate(`/ikaros/uzivatel/${id}`)}
                onKebab={(_u, anchor) => setKebab({ friend: f, anchor })}
              />
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className={s.section}>
          <button
            type="button"
            className={s.collapseToggle}
            aria-expanded={outgoingExpanded}
            onClick={() => setOutgoingExpanded((v) => !v)}
          >
            <ChevronDown
              size={18}
              className={clsx(
                s.chevron,
                !outgoingExpanded && s.chevronCollapsed,
              )}
              aria-hidden="true"
            />
            Odeslané žádosti{' '}
            <span className={s.count}>({outgoing.length})</span>
          </button>
          {outgoingExpanded && (
            <div className={s.outgoingList}>
              {outgoing.map((req) => (
                <OutgoingRequestCard key={req.friendshipId} item={req} />
              ))}
            </div>
          )}
        </div>
      )}

      {blocked.length > 0 && (
        <div className={s.section}>
          <button
            type="button"
            className={s.collapseToggle}
            aria-expanded={blockedExpanded}
            onClick={() => setBlockedExpanded((v) => !v)}
          >
            <ChevronDown
              size={18}
              className={clsx(
                s.chevron,
                !blockedExpanded && s.chevronCollapsed,
              )}
              aria-hidden="true"
            />
            Zablokovaní <span className={s.count}>({blocked.length})</span>
          </button>
          {blockedExpanded && (
            <div className={s.outgoingList}>
              {blocked.map((b) => (
                <BlockedRequestCard key={b.friendshipId} item={b} />
              ))}
            </div>
          )}
        </div>
      )}

      <KebabMenu
        anchor={kebab?.anchor ?? null}
        open={!!kebab}
        onClose={() => setKebab(null)}
        items={kebabItems}
        ariaLabel={
          kebab ? `Akce pro přítele ${kebab.friend.friend.username}` : undefined
        }
      />

      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Odebrat z přátel?"
        message={
          <>
            Opravdu chceš odebrat{' '}
            <strong>{confirmRemove?.friend.username}</strong> z přátel? Budete
            si muset poslat novou žádost.
          </>
        }
        confirmLabel="Odebrat"
        confirmVariant="danger"
        isPending={remove.isPending}
        onConfirm={async () => {
          if (!confirmRemove) return;
          await remove.mutateAsync(confirmRemove.friendshipId);
          setConfirmRemove(null);
        }}
      />
    </section>
  );
}

/**
 * Spec 1.8 — bridge mezi `FriendListItem.friend` a `PublicUserListItem` shape,
 * který očekává sdílená `UserCard` (z 1.4).
 *
 * `worldsCount` a `createdAt` nejsou součástí friend listu (BE shape je
 * záměrně užší). `UserCard` zobrazuje worldsCount v meta — v Přátelé kontextu
 * jako 0 placeholder, dokud nepřijde 2.x (per-friend worlds badge).
 */
function toPublicUserListItem(f: FriendListItem): PublicUserListItem {
  return {
    id: f.friend.id,
    username: f.friend.username,
    displayName: f.friend.displayName,
    city: f.friend.city,
    avatarUrl: f.friend.avatarUrl,
    defaultAvatarType: f.friend.defaultAvatarType,
    role: f.friend.role,
    worldsCount: 0,
    createdAt: f.acceptedAt,
    deleted: f.friend.deleted,
    pendingDeletion: f.friend.pendingDeletion,
  };
}
