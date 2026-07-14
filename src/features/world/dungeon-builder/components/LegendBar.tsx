/**
 * 21.3a+e — spodní legenda glyfů (kind-aware: dveře pro podzemí, městské
 * prvky pro město). Věrné mini-náhledy z renderu.
 */
import type { MapKind } from '../types';
import { legendItemsFor } from '../render/drawDungeon';
import { GlyphIcon } from './GlyphIcon';
import styles from './LegendBar.module.css';

export function LegendBar({
  mapKind = 'dungeon',
}: {
  mapKind?: MapKind;
}): React.ReactElement {
  return (
    <div className={styles.bar} aria-label="Legenda mapy">
      {legendItemsFor(mapKind).map((item) => (
        <span key={item.key} className={styles.item}>
          <GlyphIcon draw={item.draw} size={20} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
