/**
 * 15.6 — sdílená primitiva prázdných (empty) i chybových (error) stavů.
 * Místo holé „bílé obrazovky" / „403": nadžánrová ilustrace + vlídný text + CTA.
 *
 * Nepoužívej přímo napříč moduly — sáhni po tenkých wrapperech `<EmptyState>`
 * / `<ErrorState>`, které předvyplní tón a defaulty.
 *
 * Velikosti:
 *   hero   — plná stránka / first-dojem (velká ilustrace)
 *   panel  — sekce / tab (menší ilustrace nebo ikona)
 *   inline — prázdný řádek / list (jen ikona + text, BEZ ilustrace)
 */
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { stateIllustrationSrc, type StateIllustration } from './stateIllustrations';
import s from './StatePlaceholder.module.css';

export interface StateAction {
  label: string;
  /** Klik handler (vzájemně výlučné s `to`). */
  onClick?: () => void;
  /** Cílová route — vyrenderuje `<Link>` místo `<button>`. */
  to?: string;
}

export interface StatePlaceholderProps {
  variant: 'empty' | 'error';
  size?: 'hero' | 'panel' | 'inline';
  /** Klíč ilustrace; ignorováno pro `size="inline"`. */
  illustration?: StateIllustration;
  /** Fallback ikona (lucide / emoji) když není ilustrace nebo je inline. */
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Primární výzva k akci (role-aware: nepředávej, když uživatel nesmí). */
  action?: StateAction;
  secondaryAction?: StateAction;
  /** Extra obsah pod CTA (např. list scén, karty postav). */
  children?: ReactNode;
  className?: string;
}

function ActionButton({
  action,
  kind,
}: {
  action: StateAction;
  kind: 'primary' | 'secondary';
}): React.ReactElement {
  const cls = clsx(s.action, kind === 'primary' ? s.actionPrimary : s.actionSecondary);
  if (action.to) {
    return (
      <Link to={action.to} className={cls}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

export function StatePlaceholder({
  variant,
  size = 'panel',
  illustration,
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: StatePlaceholderProps): React.ReactElement {
  const showIllustration = size !== 'inline' && !!illustration;

  return (
    <div
      className={clsx(s.root, s[size], className)}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {showIllustration ? (
        <div className={s.visual}>
          <img
            src={stateIllustrationSrc(illustration)}
            alt=""
            aria-hidden="true"
            className={s.illustration}
            loading="lazy"
            draggable={false}
          />
        </div>
      ) : icon ? (
        <div className={clsx(s.visual, s.icon)} aria-hidden="true">
          {icon}
        </div>
      ) : null}

      <p className={s.title}>{title}</p>
      {description != null && <p className={s.description}>{description}</p>}

      {(action || secondaryAction) && (
        <div className={s.actions}>
          {action && <ActionButton action={action} kind="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} kind="secondary" />}
        </div>
      )}

      {children}
    </div>
  );
}
