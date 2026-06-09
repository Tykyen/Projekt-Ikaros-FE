import type { CSSProperties } from 'react';
import s from './LevelSpine.module.css';

/**
 * Stupňová páteř magie — signature prvek pravidlové knihy (kódex / spec 2.3f).
 * Vertikální timeline stupňů se svítícími nody a tepelnou škálou barev
 * (chladně modrá = novic → horká červená = mistr). Vzhled dle prototypu
 * `rulebook-prototype.html`. Data nese `page.customData.magicLevels` (JSON pole textů).
 */

// tepelná škála stupňů — novic (chladná) → mistr (horká)
const LVLC = ['#6ea8ff', '#4fe3d0', '#6cf08a', '#ffcf5c', '#ff8a4c', '#ff5cd6', '#ff4d6d'];

interface Props {
  /** Texty stupňů (1..N), bez čísla. */
  levels: string[];
}

export function LevelSpine({ levels }: Props) {
  if (!levels.length) return null;
  return (
    <div className={s.spine}>
      {levels.map((text, i) => (
        <div
          key={i}
          className={s.lvl}
          style={
            {
              '--c': LVLC[i % LVLC.length],
              '--c2': LVLC[(i + 1) % LVLC.length],
            } as CSSProperties
          }
        >
          <span className={s.node}>{i + 1}</span>
          <div className={s.text}>
            <b>Stupeň {i + 1}</b> — {text}
          </div>
        </div>
      ))}
    </div>
  );
}
