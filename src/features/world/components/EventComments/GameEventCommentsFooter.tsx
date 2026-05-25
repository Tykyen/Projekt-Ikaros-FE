import clsx from 'clsx';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import s from './GameEventCommentsFooter.module.css';

interface Props {
  /** Počet komentářů z list query. Pokud `undefined` (list endpoint je nedává), render bez čísla. */
  commentCount?: number;
  expanded: boolean;
  onToggle: () => void;
}

export function GameEventCommentsFooter({
  commentCount,
  expanded,
  onToggle,
}: Props) {
  const hasCount = typeof commentCount === 'number';
  const label = hasCount
    ? commentCount === 0
      ? 'Komentovat'
      : `${commentCount} ${plural(commentCount)}`
    : 'Komentáře';

  return (
    <button
      type="button"
      className={clsx(s.footer, expanded && s.footerActive)}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={undefined}
    >
      <MessageSquare size={14} aria-hidden="true" />
      <span>{label}</span>
      {expanded ? (
        <ChevronUp size={14} aria-hidden="true" />
      ) : (
        <ChevronDown size={14} aria-hidden="true" />
      )}
    </button>
  );
}

function plural(n: number): string {
  if (n === 1) return 'komentář';
  if (n >= 2 && n <= 4) return 'komentáře';
  return 'komentářů';
}
