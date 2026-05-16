import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Input, Button } from '@/shared/ui';
import { RecipientPicker } from '@/features/ikaros/components/RecipientPicker';
import { useSendMessage } from '@/features/ikaros/api/useMail';
import type { UserLookupItem } from '@/features/ikaros/api/useUserLookup';
import type { ApiError, IkarosMessage } from '@/shared/types';
import s from './MailPage.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  meId: string;
  /** Vyplněno → modal je odpověď ve vlákně. */
  replyTo?: IkarosMessage | null;
}

function prefixRe(subject: string): string {
  const next = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
  return next.slice(0, 200);
}

export function ComposeModal({ open, onClose, meId, replyTo }: Props) {
  const isReply = !!replyTo;
  const send = useSendMessage();

  // Protistrana rodičovské zprávy = příjemce odpovědi.
  const replyOther: UserLookupItem | null = replyTo
    ? replyTo.senderId === meId
      ? { id: replyTo.recipientId, username: replyTo.recipientName }
      : { id: replyTo.senderId, username: replyTo.senderName }
    : null;

  // Stav se inicializuje z props — rodič komponentu při každém otevření
  // remountuje přes `key`, takže initializery běží s aktuálním `replyTo`.
  const [recipient, setRecipient] = useState<UserLookupItem | null>(replyOther);
  const [subject, setSubject] = useState(
    replyTo ? prefixRe(replyTo.subject) : '',
  );
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!recipient) {
      setError('Vyber příjemce.');
      return;
    }
    if (subject.trim().length === 0) {
      setError('Vyplň předmět zprávy.');
      return;
    }
    if (body.trim().length === 0) {
      setError('Napiš text zprávy.');
      return;
    }
    try {
      await send.mutateAsync({
        subject: subject.trim().slice(0, 200),
        body: body.trim(),
        recipientId: recipient.id,
        recipientName: recipient.username,
        replyToId: replyTo?.id,
      });
      toast.success(isReply ? 'Odpověď odeslána.' : 'Zpráva odeslána.');
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const code = (err.response?.data as ApiError | undefined)?.error?.code;
        if (code === 'RECIPIENT_FRIENDS_ONLY') {
          setError('Tento uživatel přijímá zprávy jen od přátel.');
          return;
        }
      }
      setError('Zprávu se nepodařilo odeslat. Zkus to prosím znovu.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReply ? 'Odpovědět' : 'Nová zpráva'}
      size="md"
    >
      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <span className={s.label}>Příjemce *</span>
          {isReply && replyOther ? (
            <div className={s.lockedRecipient}>{replyOther.username}</div>
          ) : (
            <RecipientPicker
              value={recipient}
              onChange={setRecipient}
              excludeId={meId}
            />
          )}
        </div>

        <Input
          label="Předmět *"
          type="text"
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <div className={s.field}>
          <label className={s.label} htmlFor="compose-body">
            Text zprávy *
          </label>
          <textarea
            id="compose-body"
            className={s.textarea}
            maxLength={5000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {error && <span className={s.errorMsg}>{error}</span>}

        <div className={s.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" variant="primary" loading={send.isPending}>
            Odeslat
          </Button>
        </div>
      </form>
    </Modal>
  );
}
