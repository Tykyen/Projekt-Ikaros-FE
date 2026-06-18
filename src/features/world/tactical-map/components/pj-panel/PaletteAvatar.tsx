/**
 * 10.2g — mini avatar pro spawn palety a katalog (PC / NPC / Bestie).
 *
 * Kruhový thumbnail pro rychlé vizuální rozeznání entity vedle jména
 * (PJ pozná postavu/bestii podle obrázku rychleji než čtením). Fallback =
 * iniciály (sdílené `getInitials`, stejné jako token na mapě).
 *
 * Reuse pattern z BestieCard, jen kompaktnější (list-item velikost).
 */
import { getInitials } from '../../utils/getInitials';
import { getImageStyle, type ImageFit } from '@/shared/lib/imageStyle';
import styles from './PaletteAvatar.module.css';

interface Props {
  src?: string | null;
  /** Jméno entity — pro fallback iniciály + alt. */
  name: string;
  /** Průměr v px (default 24). */
  size?: number;
  /** Výřez obrázku (bestie focal/zoom/fit). Bez něj = cover 50/50 (beze změny). */
  focalX?: number | null;
  focalY?: number | null;
  zoom?: number | null;
  fit?: ImageFit | null;
}

export function PaletteAvatar({
  src,
  name,
  size = 24,
  focalX,
  focalY,
  zoom,
  fit,
}: Props): React.ReactElement {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          className={styles.img}
          style={getImageStyle(focalX, focalY, zoom, fit)}
        />
      ) : (
        <span className={styles.fallback}>{getInitials(name)}</span>
      )}
    </span>
  );
}
