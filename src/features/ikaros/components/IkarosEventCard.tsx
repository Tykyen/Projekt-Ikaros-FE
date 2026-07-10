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
import type { IkarosEvent } from '@/shared/types';
import { UserRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { KebabMenu, ConfirmDialog } from '@/shared/ui';
import type { KebabMenuItem } from '@/shared/ui';
import {
  relativeEventDate,
  isWithin24h,
} from '@/features/world/utils/relativeEventDate';
import { getImageStyle } from '@/shared/lib/imageStyle';
import {
  useToggleIkarosEventRsvp,
  useDeleteIkarosEvent,
} from '@/features/ikaros/api/useIkarosEvents';
import { IkarosEventModal } from './IkarosEventModal';
import s from './IkarosEventCard.module.css';

interface Props {
  event: IkarosEvent;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function IkarosEventCard({ event }: Props) {
  const [imageError, setImageError] = useState(false);
  const toggle = useToggleIkarosEventRsvp();
  const deleteEvent = useDeleteIkarosEvent();
  const isConfirmed = event.myRsvp === 'confirmed';
  const urgent = isWithin24h(event.date);
  const showImage = event.imageUrl && !imageError;

  const currentUser = useAtomValue(currentUserAtom);
  const canManage =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Superadmin;

  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
    null,
  );
  const [kebabOpen, setKebabOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
  const extraCount = event.confirmedCount - visibleAttendees.length;

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
    <article className={s.card}>
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
          <span className={s.dateChip}>{relativeEventDate(event.date)}</span>
          {urgent && (
            <span className={s.urgent} aria-label="Brzy">
              {(() => {
                const d = new Date(event.date);
                const today = new Date();
                return d.toDateString() === today.toDateString()
                  ? 'DNES!'
                  : 'ZÍTRA!';
              })()}
            </span>
          )}
        </div>

        <h4 className={s.title}>{event.title}</h4>

        <span className={s.time}>{formatTime(event.date)}</span>

        {event.description && (
          <p className={s.description}>{event.description}</p>
        )}

        {event.confirmable && (
          <button
            type="button"
            className={clsx(s.rsvp, isConfirmed && s.rsvpActive)}
            onClick={handleToggle}
            disabled={toggle.isPending}
            aria-pressed={isConfirmed}
          >
            {isConfirmed && <Check size={14} aria-hidden="true" />}
            {isConfirmed ? 'Účastním se' : 'Zúčastním se'}
          </button>
        )}

        {event.confirmable && event.confirmedCount > 0 && (
          <div className={s.attendees}>
            <Users size={14} aria-hidden="true" />
            <span className={s.attendeesCount}>
              {event.confirmedCount}{' '}
              {event.confirmedCount === 1 ? 'účastník' : 'účastníků'}
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
      </div>

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
            <IkarosEventModal
              open
              onClose={() => setEditOpen(false)}
              event={event}
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
