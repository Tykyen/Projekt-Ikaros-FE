import clsx from 'clsx';
import { relativeTimeCs } from '@/shared/lib/relativeTime';
import type { IkarosMessage, MailFolder } from '@/shared/types';
import s from './MailPage.module.css';

interface Props {
  message: IkarosMessage;
  folder: MailFolder;
  selected: boolean;
  onClick: () => void;
}

export function MailListItem({ message, folder, selected, onClick }: Props) {
  const isInbox = folder === 'dorucene';
  const otherName = (isInbox ? message.senderName : message.recipientName) || 'Neznámý';
  const unread = isInbox && !message.isRead;
  const initial = otherName.charAt(0);

  return (
    <li>
      <button
        type="button"
        className={clsx(s.item, selected && s.itemSelected)}
        onClick={onClick}
      >
        <span className={s.avatar} aria-hidden="true">
          {initial}
        </span>
        <span className={s.itemMain}>
          <span className={s.itemTop}>
            <span className={clsx(s.itemName, unread && s.itemNameUnread)}>
              {otherName}
            </span>
            <span className={s.itemTime}>{relativeTimeCs(message.sentAtUtc)}</span>
          </span>
          <span className={s.itemSubject}>
            {unread && (
              <span className={s.unreadDot} aria-label="Nepřečteno" />
            )}
            {message.subject}
          </span>
        </span>
      </button>
    </li>
  );
}
