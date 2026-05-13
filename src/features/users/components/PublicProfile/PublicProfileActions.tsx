import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  UserPlus,
  Shield,
  X,
  Check,
  UserCheck,
  UserMinus,
  ShieldOff,
  MoreVertical,
  ShieldAlert,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  KebabMenu,
  type KebabMenuItem,
} from '@/shared/ui';
import { useFriendshipStatus } from '@/features/friendships/api/useFriendshipStatus';
import {
  useAcceptFriendRequest,
  useBlockUser,
  useRemoveFriend,
  useSendFriendRequest,
  useUnblockUser,
} from '@/features/friendships/api/useFriendshipMutations';
import s from './PublicProfile.module.css';

interface Props {
  /** Profil zobrazeného uživatele. */
  profileId: string;
  /** Aktuální přihlášený uživatel; když === profileId, friend zóna se schová. */
  meId: string | undefined;
  isAdmin: boolean;
  /** Username profile usera pro confirm dialog. */
  username: string;
}

/**
 * Spec 1.4 → 1.8 → D-055 — friend tlačítko + block kebab menu.
 *
 * Stavy:
 *  - none              → „Přidat do přátel"
 *  - pending_outgoing  → „Žádost čeká · Zrušit" (ghost)
 *  - pending_incoming  → „Přijmout" + „Odmítnout" (dva buttons)
 *  - accepted          → „Přátelé ✓ · Odebrat" (secondary, confirm modal)
 *  - blocked_by_me     → „Odblokovat" (ghost, ShieldOff ikona)
 *  - self / cooldown   → friend zóna skryta
 *
 * D-055 — kebab `MoreVertical` vpravo otevírá popover s akcí „Blokovat"
 * (kromě stavu blocked_by_me a self). Confirm dialog má kontextový text
 * podle existujícího stavu (none / pending / accepted).
 */
export function PublicProfileActions({
  profileId,
  meId,
  isAdmin,
  username,
}: Props) {
  const navigate = useNavigate();
  const isSelf = profileId === meId;
  const showAdminAction = isAdmin && !isSelf;

  const { data: status } = useFriendshipStatus(isSelf ? undefined : profileId);

  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  // Callback ref místo useRef — vyhne se „Cannot access refs during render"
  // (React 19 compiler) tím že nečteme `.current` v JSX prop.
  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
    null,
  );

  const kind = status?.kind ?? 'none';
  const isBlocked = kind === 'blocked_by_me';
  const showFriendZone = !isSelf && kind !== 'cooldown' && kind !== 'self';
  const showKebab = !isSelf && !isBlocked;

  const blockMessage = (() => {
    if (kind === 'accepted')
      return (
        <>
          Zablokovat <strong>{username}</strong>? Vaše přátelství bude ukončeno
          a žádný z vás nebude moct poslat novou žádost.
        </>
      );
    if (kind === 'pending_outgoing' || kind === 'pending_incoming')
      return (
        <>
          Zablokovat <strong>{username}</strong>? Žádost o přátelství se zruší.
        </>
      );
    return (
      <>
        Zablokovat <strong>{username}</strong>? Nebudete si moct posílat
        žádosti o přátelství.
      </>
    );
  })();

  const kebabItems: KebabMenuItem[] = [
    {
      key: 'block',
      label: 'Blokovat uživatele',
      icon: <ShieldAlert size={14} aria-hidden="true" />,
      variant: 'danger',
      onClick: () => {
        setKebabOpen(false);
        setConfirmBlock(true);
      },
    },
  ];

  return (
    <section className={s.section} aria-label="Akce">
      <h3 className={s.sectionTitle}>Akce</h3>
      <div className={s.actionsRow}>
        {showFriendZone && (
          <div className={s.friendZone}>
            {kind === 'none' && (
              <Button
                className={s.actionBtn}
                onClick={() => send.mutate(profileId)}
                loading={send.isPending}
              >
                <UserPlus size={14} aria-hidden="true" /> Přidat do přátel
              </Button>
            )}
            {kind === 'pending_outgoing' && status?.friendshipId && (
              <Button
                className={s.actionBtn}
                variant="ghost"
                onClick={() => remove.mutate(status.friendshipId as string)}
                disabled={remove.isPending}
              >
                <X size={14} aria-hidden="true" /> Žádost čeká · Zrušit
              </Button>
            )}
            {kind === 'pending_incoming' && status?.friendshipId && (
              <>
                <Button
                  className={s.actionBtn}
                  variant="danger"
                  onClick={() => remove.mutate(status.friendshipId as string)}
                  disabled={remove.isPending}
                >
                  <X size={14} aria-hidden="true" /> Odmítnout
                </Button>
                <Button
                  className={s.actionBtn}
                  onClick={() => accept.mutate(status.friendshipId as string)}
                  loading={accept.isPending}
                >
                  <Check size={14} aria-hidden="true" /> Přijmout
                </Button>
              </>
            )}
            {kind === 'accepted' && (
              <Button
                className={s.actionBtn}
                variant="secondary"
                onClick={() => setConfirmRemove(true)}
              >
                <UserCheck size={14} aria-hidden="true" /> Přátelé · Odebrat
              </Button>
            )}
            {isBlocked && (
              <Button
                className={s.actionBtn}
                variant="ghost"
                onClick={() => unblock.mutate(profileId)}
                loading={unblock.isPending}
              >
                <ShieldOff size={14} aria-hidden="true" /> Odblokovat
              </Button>
            )}
          </div>
        )}
        <Button
          className={s.actionBtn}
          variant="secondary"
          disabled
          title="Připravujeme — krok 3.5"
        >
          <Mail size={14} aria-hidden="true" /> Napsat zprávu
        </Button>
        {showAdminAction && (
          <Button
            className={s.actionBtn}
            onClick={() =>
              navigate(
                `/ikaros/uzivatele?tab=uzivatele&view=table&focus=${profileId}`,
              )
            }
          >
            <Shield size={14} aria-hidden="true" /> Otevřít v administraci
          </Button>
        )}
        {showKebab && (
          <button
            ref={setKebabAnchor}
            type="button"
            className={s.kebabBtn}
            aria-label="Další akce"
            aria-haspopup="menu"
            onClick={() => setKebabOpen((v) => !v)}
          >
            <MoreVertical size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <KebabMenu
        anchor={kebabAnchor}
        open={kebabOpen}
        onClose={() => setKebabOpen(false)}
        items={kebabItems}
        ariaLabel={`Další akce pro uživatele ${username}`}
      />

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Odebrat z přátel?"
        message={
          <>
            Opravdu chceš odebrat <strong>{username}</strong> z přátel? Budete
            si muset poslat novou žádost.{' '}
            <UserMinus
              size={14}
              aria-hidden="true"
              style={{ verticalAlign: 'middle' }}
            />
          </>
        }
        confirmLabel="Odebrat"
        confirmVariant="danger"
        isPending={remove.isPending}
        onConfirm={async () => {
          if (!status?.friendshipId) return;
          await remove.mutateAsync(status.friendshipId);
          setConfirmRemove(false);
        }}
      />

      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        title="Zablokovat uživatele?"
        message={blockMessage}
        confirmLabel="Blokovat"
        confirmVariant="danger"
        isPending={block.isPending}
        onConfirm={async () => {
          await block.mutateAsync(profileId);
          setConfirmBlock(false);
        }}
      />
    </section>
  );
}
