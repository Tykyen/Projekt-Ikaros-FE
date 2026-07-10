import type { CSSProperties, ReactNode } from 'react';
import type { FamilyPerson } from '../../../api/pages.types';
import s from './family-tree.module.css';

interface Props {
  person: FamilyPerson;
  className: string;
  /** Odkaz na stránku existuje → zobraz „↗" badge (jen v náhledu). */
  showLinkBadge?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
  /** Overlay v editoru (mini-tlačítka příbuzných). */
  children?: ReactNode;
}

function initials(p: FamilyPerson): string {
  const a = p.name?.[0] ?? '?';
  const cleaned = p.sub?.replace(/^roz\.?\s*|^z\s+/i, '');
  const b = cleaned?.[0] ?? '';
  return (a + b).toUpperCase();
}

function formatDates(p: FamilyPerson): string {
  if (!p.born && !p.died) return '';
  if (p.born && p.died) return `${p.born} – ${p.died}`;
  return p.born || `† ${p.died}`;
}

export function FamilyNode({
  person,
  className,
  showLinkBadge,
  onPointerDown,
  onClick,
  children,
}: Props) {
  const style: CSSProperties = { left: person.x, top: person.y };
  const medStyle: CSSProperties = person.imageUrl
    ? { backgroundImage: `url(${person.imageUrl})` }
    : {
        background: `radial-gradient(120% 120% at 35% 25%, rgba(255,255,255,.22), transparent 55%), ${person.color || 'var(--theme-accent, #6b5aa8)'}`,
      };
  const dates = formatDates(person);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- uzel je drag cíl v editoru (obsahuje vnořená mini-tlačítka příbuzných → nelze role=button) / navigační dlaždice v náhledu
    <div
      className={className}
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {children}
      <div className={s.medallion} style={medStyle} aria-hidden>
        {!person.imageUrl && initials(person)}
      </div>
      <div className={s.name}>{person.name || 'Bez jména'}</div>
      {person.sub && <div className={s.sub}>{person.sub}</div>}
      {dates && <div className={s.dates}>{dates}</div>}
      {showLinkBadge && person.pageSlug && (
        <span className={s.linkBadge} aria-hidden>
          ↗
        </span>
      )}
    </div>
  );
}
