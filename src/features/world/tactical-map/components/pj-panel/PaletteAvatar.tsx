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
import styles from './PaletteAvatar.module.css';

interface Props {
  src?: string | null;
  /** Jméno entity — pro fallback iniciály + alt. */
  name: string;
  /** Průměr v px (default 24). */
  size?: number;
}

export function PaletteAvatar({
  src,
  name,
  size = 24,
}: Props): React.ReactElement {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" className={styles.img} />
      ) : (
        <span className={styles.fallback}>{getInitials(name)}</span>
      )}
    </span>
  );
}
