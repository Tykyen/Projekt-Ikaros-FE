import s from './QuickRef.module.css';

interface Props {
  value?: string;
}

/**
 * Pravidlová kniha — HUD panel „Rychlý přehled" (taháková rekapitulace čísel).
 * Sticky v sidebaru kapitoly; renderuje se jen když má stránka `quickRef`.
 */
export function QuickRef({ value }: Props) {
  if (!value) return null;
  return (
    <aside className={s.hud} aria-label="Rychlý přehled">
      <div className={s.head}>
        <span className={s.tag}>Rychlý přehled</span>
      </div>
      <p className={s.body}>{value}</p>
    </aside>
  );
}
