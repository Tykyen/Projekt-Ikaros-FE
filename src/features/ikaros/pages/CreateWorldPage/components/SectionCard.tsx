import type { ReactNode } from 'react';
import s from './SectionCard.module.css';

interface Props {
  /** Pořadové číslo (zobrazené jako velký marker v rohu). */
  index: number;
  title: string;
  description?: string;
  /** Plná šířka v 2col gridu (poslední sekce na desktopu). */
  fullWidth?: boolean;
  children: ReactNode;
}

const NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];

export function SectionCard({
  index,
  title,
  description,
  fullWidth,
  children,
}: Props) {
  return (
    <section
      className={`${s.card} ${fullWidth ? s.fullWidth : ''}`}
      style={{ animationDelay: `${(index - 1) * 80}ms` }}
    >
      <span className={s.marker} aria-hidden="true">
        {NUMERALS[index - 1] ?? `${index}`}
      </span>
      <header className={s.header}>
        <h2 className={s.title}>{title}</h2>
        {description && <p className={s.description}>{description}</p>}
      </header>
      <div className={s.body}>{children}</div>
    </section>
  );
}
