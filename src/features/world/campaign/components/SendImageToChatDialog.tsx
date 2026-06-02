import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import {
  useChatGroups,
  useSendMessage,
  useScheduleMessage,
} from '@/features/world/chat/api/useWorldChat';
import type { ChatAttachment } from '@/features/chat/lib/types';
import s from './storyboard.module.css';

/** Sestaví obrázkovou přílohu z holé URL (galerie drží jen url). */
function imageAttachment(url: string): ChatAttachment {
  const filename = url.split('/').pop()?.split('?')[0] || 'obrazek';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeType =
    ext === 'png'
      ? 'image/png'
      : ext === 'gif'
        ? 'image/gif'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'svg'
            ? 'image/svg+xml'
            : 'image/jpeg';
  // size BE validuje (@Min(1)); galerie skutečnou velikost nezná → placeholder 1.
  return { url, publicId: '', type: 'image', mimeType, filename, size: 1 };
}

/** A (11.2-ext): pošli obrázek scény do zvoleného kanálu světového chatu. */
export function SendImageToChatDialog({
  worldId,
  imageUrl,
  onClose,
}: {
  worldId: string;
  imageUrl: string | null;
  onClose: () => void;
}) {
  const { data: groups = [] } = useChatGroups(worldId);
  const channels = useMemo(
    () =>
      groups.flatMap((g) =>
        g.channels.map((c) => ({
          id: c.id,
          label: `${g.group.name} / ${c.name}`,
        })),
      ),
    [groups],
  );

  const [channelId, setChannelId] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const send = useSendMessage(worldId, channelId);
  const schedule = useScheduleMessage(worldId);

  const isScheduled = scheduleAt.trim().length > 0;
  const pending = send.isPending || schedule.isPending;

  function submit() {
    if (!channelId) return;
    const attachments = imageUrl ? [imageAttachment(imageUrl)] : undefined;
    const content = caption.trim() || undefined;

    if (isScheduled) {
      const when = new Date(scheduleAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast.error('Čas odeslání musí být v budoucnosti');
        return;
      }
      schedule.mutate(
        { channelId, content, attachments, sendAt: when.toISOString() },
        {
          onSuccess: () => {
            toast.success('Zpráva naplánována');
            onClose();
          },
          onError: (e) => toast.error(parseApiError(e)),
        },
      );
      return;
    }

    send.mutate(
      { content, attachments },
      {
        onSuccess: () => {
          toast.success('Obrázek odeslán do chatu');
          onClose();
        },
        onError: (e) => toast.error(parseApiError(e)),
      },
    );
  }

  return (
    <Modal open={!!imageUrl} onClose={onClose} title="Poslat obrázek do chatu">
      <div className={s.sendDialog}>
        {imageUrl && (
          <img src={imageUrl} alt="" className={s.sendPreview} />
        )}
        <label className={s.field}>
          <span className={s.fieldLabel}>Kanál</span>
          <select
            className={s.select}
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
          >
            <option value="">— vyber kanál —</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Popisek (volitelný)</span>
          <input
            className={s.input}
            value={caption}
            placeholder="např. Mapa hradu…"
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Naplánovat na (volitelné)</span>
          <input
            type="datetime-local"
            className={s.input}
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
        </label>
        <div className={s.sendActions}>
          <Button variant="secondary" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={!channelId || pending}>
            {pending
              ? 'Odesílám…'
              : isScheduled
                ? 'Naplánovat'
                : 'Poslat'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
