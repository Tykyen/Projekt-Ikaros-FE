/**
 * 21.3a — spodní legenda dveřních glyfů (věrné mini-náhledy z renderu).
 */
import { LEGEND_ITEMS } from '../render/drawDungeon';
import { DoorGlyphIcon } from './GlyphIcon';
import styles from './LegendBar.module.css';

export function LegendBar(): React.ReactElement {
  return (
    <div className={styles.bar} aria-label="Legenda dveří">
      {LEGEND_ITEMS.map((item) => (
        <span key={item.type} className={styles.item}>
          <DoorGlyphIcon type={item.type} size={20} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
