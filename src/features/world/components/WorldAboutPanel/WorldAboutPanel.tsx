import { Info, ChevronDown } from 'lucide-react';
import type { World } from '@/shared/types';
import s from './WorldAboutPanel.module.css';

interface Props {
  world: World;
}

/**
 * Spec 5.4 — kompaktní sbalitelný blok „O světě" pod dashboardem (member view).
 * Popis + tóny + kostky. Bez „Detaily" (Systém/Hráči/PJ) — Hráči jsou ve StatBar,
 * Systém/PJ v nastavení světa. Sbalitelný nativním <details> (bez JS stavu).
 */
export function WorldAboutPanel({ world }: Props) {
  const hasDescription = !!world.description?.trim();
  const hasTones = (world.tones?.length ?? 0) > 0;
  const hasDice = (world.dice?.length ?? 0) > 0;

  if (!hasDescription && !hasTones && !hasDice) return null;

  return (
    <details className={s.panel}>
      <summary className={s.summary}>
        <span className={s.icon} aria-hidden>
          <Info size={16} />
        </span>
        <span className={s.summaryTitle}>O světě</span>
        <ChevronDown size={16} className={s.chevron} aria-hidden />
      </summary>

      <div className={s.body}>
        {hasDescription && (
          <p className={s.description}>{world.description}</p>
        )}

        {hasTones && world.tones && (
          <section className={s.section}>
            <h3 className={s.sectionTitle}>Tón a styl</h3>
            <div className={s.chips}>
              {world.tones.map((t) => (
                <span key={t} className={s.chip}>
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {hasDice && world.dice && (
          <section className={s.section}>
            <h3 className={s.sectionTitle}>Kostky a mechaniky</h3>
            <div className={s.chips}>
              {world.dice.map((d) => (
                <span key={d} className={s.chip}>
                  {d}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </details>
  );
}
