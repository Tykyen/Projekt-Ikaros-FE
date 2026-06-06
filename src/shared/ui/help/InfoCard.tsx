import type { CSSProperties, ReactNode } from 'react';
import { ACCENT_VAR, type HelpAccent } from './accents';
import s from './Help.module.css';

type InfoCardProps = {
  /** Ikona vlevo (lucide). */
  icon?: ReactNode;
  /** Nadpis karty (může obsahovat TagChip). */
  title: ReactNode;
  /** Barevný akcent (border-left + ikona + tint). */
  accent?: HelpAccent;
  /** Hover lift — pro karty, na které jde „kliknout"/odkazovat. */
  interactive?: boolean;
  /** Popis „co nástroj umí". */
  children: ReactNode;
};

/** Barevná karta „co nástroj umí v kostce". */
export function InfoCard({ icon, title, accent = 'accent', interactive, children }: InfoCardProps) {
  const cls = interactive ? `${s.infoCard} ${s.infoCardInteractive}` : s.infoCard;
  const style = { ['--acc' as string]: ACCENT_VAR[accent] } as CSSProperties;
  return (
    <div className={cls} style={style}>
      {icon && <span className={s.infoCardIcon}>{icon}</span>}
      <div className={s.infoCardBody}>
        <div className={s.infoCardTitle}>{title}</div>
        <div className={s.infoCardDesc}>{children}</div>
      </div>
    </div>
  );
}

/** Mřížka InfoCard — barevné dlaždice vedle sebe (auto-fill). */
export function InfoGrid({ children }: { children: ReactNode }) {
  return <div className={s.infoGrid}>{children}</div>;
}
