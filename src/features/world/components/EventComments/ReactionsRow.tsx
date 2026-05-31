/* eslint-disable react-refresh/only-export-components -- komponenta + REACTION_EMOJIS konstanta/typ záměrně pohromadě; jen DX/HMR */
import clsx from 'clsx';
import s from './ReactionsRow.module.css';

/**
 * 9.1-II — sada 6 fixních emoji reakcí (recommended Q3-A).
 * Custom emoji picker = samostatný dluh.
 */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

interface Props {
  reactions: Record<string, string[]>;
  currentUserId: string | null;
  onToggle: (emoji: string) => void;
  /** Pending stav během mutace — chip disabled. */
  pending?: boolean;
  /** Smazaný komentář → schovat (žádné reakce). */
  hidden?: boolean;
}

/**
 * Zobrazí 6 chipů; chip s count 0 je ghost (opacity), klik vždy toggle.
 * Aktivní reakce (currentUser ji dal) má border accent.
 */
export function ReactionsRow({
  reactions,
  currentUserId,
  onToggle,
  pending = false,
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <div className={s.row} role="group" aria-label="Reakce">
      {REACTION_EMOJIS.map((emoji) => {
        const userIds = reactions[emoji] ?? [];
        const count = userIds.length;
        const isActive =
          !!currentUserId && userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            className={clsx(
              s.chip,
              count > 0 && s.chipHasCount,
              isActive && s.chipActive,
            )}
            onClick={() => onToggle(emoji)}
            disabled={pending || !currentUserId}
            aria-pressed={isActive}
            aria-label={`${emoji} (${count})`}
            title={count > 0 ? `${count} ${count === 1 ? 'reakce' : 'reakcí'}` : 'Reagovat'}
          >
            <span className={s.emoji} aria-hidden="true">
              {emoji}
            </span>
            {count > 0 && <span className={s.count}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
