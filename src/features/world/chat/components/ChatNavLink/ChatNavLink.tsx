import { MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useWorldChatUnread } from '@/features/world/api/useWorldChat';
import s from './ChatNavLink.module.css';

interface Props {
  worldSlug: string;
  worldId: string;
  /** `bar` = desktop header (accent pill), `drawer` = mobilní menu (plný řádek). */
  variant?: 'bar' | 'drawer';
  onClick?: () => void;
}

/**
 * Zvýrazněný vstup do chatu světa. Tester-feedback (2026-06-24): chat byl
 * přehlížený — v navigaci úplně chyběl, jen nenápadná dlaždice na dashboardu.
 * Accent pill (přes `--accent-*` tokeny → ladí se všemi skiny) + unread badge,
 * který se rozsvítí a jemně pulzuje jen při nepřečtených zprávách.
 */
export function ChatNavLink({ worldSlug, worldId, variant = 'bar', onClick }: Props) {
  const unread = useWorldChatUnread(worldId);
  return (
    <NavLink
      to={`/svet/${worldSlug}/chat`}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(variant === 'drawer' ? s.drawer : s.bar, isActive && s.active)
      }
    >
      <MessageSquare size={variant === 'drawer' ? 18 : 16} aria-hidden="true" />
      <span className={s.label}>Chat</span>
      {unread > 0 && (
        <span
          className={clsx(s.badge, s.badgePulse)}
          aria-label={`${unread} nepřečtených zpráv`}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </NavLink>
  );
}
