import { useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  Check,
  Users,
  CalendarDays,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import axios from 'axios';
import type { GameEvent } from '@/shared/types';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { KebabMenu, ConfirmDialog } from '@/shared/ui';
import type { KebabMenuItem } from '@/shared/ui';
import {
  useToggleRsvp,
  useDeleteGameEvent,
} from '@/features/world/api/useGameEvents';
import { relativeEventDate } from '@/features/world/utils/relativeEventDate';
import { getImageStyle } from '@/shared/lib/imageStyle';
import {
  relativeCountdown,
  countdownVariant,
} from '@/features/world/utils/relativeCountdown';
import { GroupChip } from '../GroupChip/GroupChip';
import { GameEventModal } from '../GameEventModal/GameEventModal';
import { GameEventCommentsFooter } from '../EventComments/GameEventCommentsFooter';
import { GameEventComments } from '../EventComments/GameEventComments';
import s from './GameEventCard.module.css';

interface Props {
  event: GameEvent;
  viewerRole: WorldRole;
  worldId: string;
  customGroups: string[];
  groupColors: Record<string, string>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * 9.1-I — karta herní akce světa.
 *
 * Vychází z `IkarosEventCard` (copy-adapt). Odlišnosti:
 * - `GroupChip` v hlavičce (+ Lock ikona při groupOnly)
 * - Countdown badge „DNES/ZÍTRA/za N dní" (Matrix vzor, širší než isWithin24h)
 * - Kebab správy gateovaný `WorldRole.PomocnyPJ+`
 * - `confirmedCount`/`myRsvp` computováno z `confirmedBy + currentUserId`
 *   (BE neposílá agregát, oproti `IkarosEvent`).
 */
export function GameEventCard({
  event,
  viewerRole,
  worldId,
  customGroups,
  groupColors,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const toggle = useToggleRsvp();
  const deleteEvent = useDeleteGameEvent();
  const currentUser = useAtomValue(currentUserAtom);

  const isConfirmed = currentUser
    ? event.confirmedBy.some((c) => c.userId === currentUser.id)
    : false;
  const confirmedCount = event.confirmedBy.length;
  const showImage = event.imageUrl && !imageError;
  const canManage = viewerRole >= WorldRole.PomocnyPJ;

  const countdown = relativeCountdown(event.date);
  const variant = countdownVariant(event.date);
  const isPast = variant === 'past';
  const isRunning = variant === 'running';
  const isUrgent = variant === 'urgent';
  const isSoon = variant === 'soon';

  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
    null,
  );
  const [kebabOpen, setKebabOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  function handleToggle() {
    toggle.mutate(event.id, {
      onError: () => toast.error('Nepodařilo se změnit účast.'),
    });
  }

  async function handleDelete() {
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success('Akce smazána.');
      setDeleteOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Nemáš oprávnění.');
          setDeleteOpen(false);
          return;
        }
        if (status === 404) {
          toast.error('Akce neexistuje.');
          setDeleteOpen(false);
          return;
        }
      }
      toast.error('Nepodařilo se smazat akci.');
    }
  }

  const visibleAttendees = event.confirmedBy.slice(0, 4);
  const extraCount = confirmedCount - visibleAttendees.length;
  const groupColor =
    event.targetGroup && groupColors[event.targetGroup]
      ? groupColors[event.targetGroup]
      : 'var(--accent)';

  const kebabItems: KebabMenuItem[] = [
    {
      key: 'edit',
      label: 'Upravit',
      icon: <Pencil size={16} aria-hidden="true" />,
      onClick: () => {
        setKebabOpen(false);
        setEditOpen(true);
      },
    },
    {
      key: 'delete',
      label: 'Smazat',
      variant: 'danger',
      icon: <Trash2 size={16} aria-hidden="true" />,
      onClick: () => {
        setKebabOpen(false);
        setDeleteOpen(true);
      },
    },
  ];

  return (
    <article
      className={clsx(s.card, isPast && s.cardPast)}
      data-expanded={commentsExpanded ? 'true' : 'false'}
    >
      <div className={s.media}>
        {showImage ? (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError = fallback při selhání načtení obrázku, ne uživatelská interakce
          <img
            src={event.imageUrl!}
            alt=""
            className={s.image}
            style={getImageStyle(
              event.imageFocalX,
              event.imageFocalY,
              event.imageZoom,
              event.imageFit,
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={s.imageFallback} aria-hidden="true">
            <CalendarDays size={36} />
          </div>
        )}

        {canManage && (
          <button
            ref={setKebabAnchor}
            type="button"
            className={s.kebabBtn}
            aria-label="Akce"
            aria-haspopup="menu"
            aria-expanded={kebabOpen}
            onClick={() => setKebabOpen((v) => !v)}
          >
            <MoreVertical size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          {event.targetGroup && (
            <GroupChip
              name={event.targetGroup}
              color={groupColor}
              locked={event.groupOnly}
              size="sm"
            />
          )}
          <span className={s.dateChip}>{relativeEventDate(event.date)}</span>
          {isRunning && (
            <span className={s.running} aria-label="Probíhá">
              {countdown}
            </span>
          )}
          {isUrgent && (
            <span className={s.urgent} aria-label="Brzy">
              {countdown}
            </span>
          )}
          {isSoon && (
            <span className={s.countdown} aria-label="Odpočet">
              {countdown}
            </span>
          )}
          {isPast && (
            <span className={s.past} aria-label="Proběhlo">
              {countdown}
            </span>
          )}
        </div>

        <h4 className={s.title}>{event.title}</h4>

        <span className={s.time}>{formatTime(event.date)}</span>

        {event.description && (
          <p className={s.description}>{event.description}</p>
        )}

        {event.confirmable && !isPast && (
          <button
            type="button"
            className={clsx(s.rsvp, isConfirmed && s.rsvpActive)}
            onClick={handleToggle}
            disabled={toggle.isPending || !currentUser}
            aria-pressed={isConfirmed}
          >
            {isConfirmed && <Check size={14} aria-hidden="true" />}
            {isConfirmed ? 'Účastním se' : 'Zúčastním se'}
          </button>
        )}

        {event.confirmable && confirmedCount > 0 && (
          <div className={s.attendees}>
            <Users size={14} aria-hidden="true" />
            <span className={s.attendeesCount}>
              {confirmedCount}{' '}
              {confirmedCount === 1
                ? 'účastník'
                : confirmedCount < 5
                  ? 'účastníci'
                  : 'účastníků'}
            </span>
            <div className={s.attendeeChips}>
              {visibleAttendees.map((a) => (
                <span key={a.userId} className={s.attendeeChip}>
                  {a.userName}
                </span>
              ))}
              {extraCount > 0 && (
                <span className={s.attendeeChip}>+{extraCount}</span>
              )}
            </div>
          </div>
        )}

        <GameEventCommentsFooter
          commentCount={event.comments?.length}
          expanded={commentsExpanded}
          onToggle={() => setCommentsExpanded((v) => !v)}
        />
      </div>

      {commentsExpanded && (
        <GameEventComments eventId={event.id} worldRole={viewerRole} />
      )}

      {canManage && (
        <>
          <KebabMenu
            anchor={kebabAnchor}
            open={kebabOpen}
            onClose={() => setKebabOpen(false)}
            items={kebabItems}
            ariaLabel="Akce s touto událostí"
          />
          {editOpen && (
            <GameEventModal
              open
              onClose={() => setEditOpen(false)}
              worldId={worldId}
              event={event}
              customGroups={customGroups}
              groupColors={groupColors}
            />
          )}
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Smazat akci"
            message={
              <>
                Opravdu chceš smazat akci <strong>{event.title}</strong>?
                Tuto akci nelze vrátit zpět.
              </>
            }
            confirmLabel="Smazat"
            confirmVariant="danger"
            onConfirm={handleDelete}
            isPending={deleteEvent.isPending}
          />
        </>
      )}
    </article>
  );
}
