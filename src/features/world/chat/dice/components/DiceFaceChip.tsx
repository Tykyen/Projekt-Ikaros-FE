import { materialPreviewUrl } from '../lib/dice3dMaterials';
import styles from './DiceFaceChip.module.css';

/**
 * Typ kostky pro 2D placku. Dříve žil v `RollingDiceScene` (zrušen cleanupem
 * starého 2D skin systému, D-NEW-DICE-2D-LEGACY); `d100tens` = desítková tvář
 * d100, `d10` nese jednotky.
 */
export type DieType =
  | 'fate'
  | 'd4'
  | 'd6'
  | 'd8'
  | 'd10'
  | 'd12'
  | 'd20'
  | 'd100tens';

/**
 * Krok 6.3-fix6 — 2D placka hozené kostky (chatová historie).
 *
 * Materiál (z `dice3dMaterials`, stejný jako 3D overlay i picker chip) jako
 * kruhové pozadí + číslo hozené tváře navrch. Žádný starý 2D skin systém →
 * žádný drift: snímek v chatu = ta kostka, kterou hráč hodil.
 *
 * Vizuál sjednocen s `DicePickerPopover` chipem (materiál + scrim + glyf).
 */

interface DiceFaceChipProps {
  type: DieType;
  /** Hozená tvář — číslo, nebo fate symbol. */
  faceValue: number | '+' | '-' | '0';
  /** Materiál ID (`dice3dMaterials`), už přes `resolveMaterialId`. */
  materialId: string;
  /** Hrana placky v px. */
  size?: number;
}

/** Popisek tváře — číslo, fate symbol, d10/d100 zvláštnosti (10 → 0, 0 → 00). */
function faceLabel(type: DieType, faceValue: number | '+' | '-' | '0'): string {
  if (type === 'fate') {
    if (faceValue === '+' || faceValue === 1) return '+';
    if (faceValue === '-' || faceValue === -1) return '−';
    return '0';
  }
  const num = Number(faceValue);
  if (type === 'd100tens') return num === 0 ? '00' : String(num);
  if (type === 'd10') return String(num === 10 ? 0 : num);
  return String(faceValue);
}

export function DiceFaceChip({
  type,
  faceValue,
  materialId,
  size = 80,
}: DiceFaceChipProps) {
  const img = materialPreviewUrl(materialId);

  return (
    <span className={styles.chip} style={{ width: size, height: size }}>
      {img && (
        <img
          src={img}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={styles.mat}
        />
      )}
      <span className={styles.scrim} aria-hidden />
      <span className={styles.glyph} style={{ fontSize: size * 0.42 }}>
        {faceLabel(type, faceValue)}
      </span>
    </span>
  );
}

export default DiceFaceChip;
