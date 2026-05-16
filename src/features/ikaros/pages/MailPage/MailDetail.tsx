import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ChevronLeft, Reply } from 'lucide-react';
import { Button, Spinner, ConfirmDialog } from '@/shared/ui';
import {
  useMessageDetail,
  useConversation,
  useDeleteMessage,
} from '@/features/ikaros/api/useMail';
import { relativeTimeCs } from '@/shared/lib/relativeTime';
import type { IkarosMessage } from '@/shared/types';
import s from './MailPage.module.css';

interface Props {
  messageId: string | null;
  meId: string;
  onBack: () => void;
  onReply: (msg: IkarosMessage) => void;
  onDeletedHead: () => void;
}

export function MailDetail({
  messageId,
  meId,
  onBack,
  onReply,
  onDeletedHead,
}: Props) {
  const detail = useMessageDetail(messageId);
  const message = detail.data ?? null;
  const conv = useConversation(message?.conversationId ?? null);
  const del = useDeleteMessage();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!messageId) {
    return (
      <div className={s.detailPane}>
        <div className={s.stateBox}>
          <p>Vyber zprávu ze seznamu.</p>
        </div>
      </div>
    );
  }

  if (detail.isLoading) {
    return (
      <div className={s.detailPane}>
        <div className={s.stateBox}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className={s.detailPane}>
        <div className={s.stateBox}>
          <button type="button" className={s.backBtn} onClick={onBack}>
            <ChevronLeft size={16} /> Zpět
          </button>
          <p>Zprávu se nepodařilo načíst.</p>
        </div>
      </div>
    );
  }

  const otherName =
    (message.senderId === meId ? message.recipientName : message.senderName) ||
    'Neznámý';
  const thread = conv.data ?? [message];

  async function handleDelete() {
    if (!confirmId) return;
    const wasHead = confirmId === messageId;
    try {
      await del.mutateAsync(confirmId);
      setConfirmId(null);
      toast.success('Zpráva smazána.');
      if (wasHead) onDeletedHead();
    } catch {
      toast.error('Zprávu se nepodařilo smazat.');
    }
  }

  return (
    <div className={s.detailPane}>
      <div className={s.detailHeader}>
        <button type="button" className={s.backBtn} onClick={onBack}>
          <ChevronLeft size={16} /> Zpět
        </button>
        <h2 className={s.detailSubject}>{message.subject}</h2>
        <div className={s.detailMeta}>Konverzace s: {otherName}</div>
      </div>

      <div className={s.thread}>
        {thread.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div
              key={m.id}
              className={clsx(s.bubble, mine ? s.bubbleMine : s.bubbleOther)}
            >
              <div className={s.bubbleHead}>
                <span className={s.bubbleAuthor}>
                  {mine ? 'Já' : m.senderName}
                </span>
                <span className={s.bubbleTime}>
                  {relativeTimeCs(m.sentAtUtc)}
                </span>
              </div>
              <div className={s.bubbleBody}>{m.body}</div>
              <div className={s.bubbleFoot}>
                <button
                  type="button"
                  className={s.bubbleDelete}
                  onClick={() => setConfirmId(m.id)}
                >
                  Smazat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={s.detailActions}>
        <Button variant="primary" size="md" onClick={() => onReply(message)}>
          <Reply size={16} /> Odpovědět
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Smazat zprávu"
        message="Zpráva zmizí z tvé pošty. Druhé straně zůstane zachována."
        confirmLabel="Smazat"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isPending={del.isPending}
      />
    </div>
  );
}
