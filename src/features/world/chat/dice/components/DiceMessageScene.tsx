import type { DicePayload } from '../lib/dicePayload';
import { resolveMaterialId } from '../lib/dice3dMaterials';
import { DiceFaceChip } from './DiceFaceChip';
import type { DieType } from './DiceFaceChip';
import styles from './DiceMessageScene.module.css';

interface DiceMessageSceneProps {
  payload: DicePayload;
  /** `ChatMessage.diceSkin` = materiál ID (`dice3dMaterials`); legacy/null → default. */
  skinId: string | null;
}

/**
 * Krok 6.3d / 6.3-fix6 — Scéna kostek pro inline render v `MessageItem`.
 *
 * Renderuje 1..N **materiálových placek** (`DiceFaceChip`) v řadě dle
 * `payload.type`. Materiál = `resolveMaterialId(skinId)` → stejný jako 3D
 * overlay i picker chip (žádný drift). Pro mixed/d100 vykreslí placky podle
 * `faceTypes` / pevně `d100tens` + `d10` (d100 = 2 desítky).
 */
export const DiceMessageScene: React.FC<DiceMessageSceneProps> = ({
  payload,
  skinId,
}) => {
  const materialId = resolveMaterialId(skinId);
  const dies = buildDieDefs(payload);

  return (
    <div className={styles.scene}>
      {dies.map((d, i) => (
        <DiceFaceChip
          key={i}
          type={d.type}
          faceValue={d.faceValue}
          materialId={materialId}
          size={d.size}
        />
      ))}
    </div>
  );
};

interface DieDef {
  type: DieType;
  faceValue: number | '+' | '-' | '0';
  size: number;
}

function buildDieDefs(payload: DicePayload): DieDef[] {
  const size = 80;

  if (payload.type === 'fate') {
    return payload.faces.map((f) => ({
      type: 'fate' as DieType,
      faceValue: f,
      size,
    }));
  }

  if (payload.type === 'd100') {
    // d100 = 1 desítková (tens) + 1 jednotková (d10 zobrazená jako 0..9).
    return [
      { type: 'd100tens' as DieType, faceValue: payload.tens, size },
      // pro jednotkovou kostku: 0 = 10. tvář, jinak hodnota přímo
      { type: 'd10' as DieType, faceValue: payload.ones === 0 ? 10 : payload.ones, size },
    ];
  }

  if (payload.type === 'mixed') {
    return payload.faces.map((f, i) => {
      const t = payload.faceTypes[i];
      if (t === 'fate') {
        const symbol = f === 1 ? '+' : f === -1 ? '-' : '0';
        return {
          type: 'fate' as DieType,
          faceValue: symbol as '+' | '-' | '0',
          size,
        };
      }
      // d100 v mixed = 2 položky (tens + ones)
      if (t === 'd100') {
        // Stačí render desítkové kostky — toto je heuristika; v reálu se
        // d100 z mixu zachová párově (každý 2. index).
        return { type: 'd100tens' as DieType, faceValue: f, size };
      }
      return {
        type: t as DieType,
        faceValue: f,
        size,
      };
    });
  }

  if (payload.type.startsWith('pool-d')) {
    const sides = payload.type.replace('pool-d', '');
    const dieType = `d${sides}` as DieType;
    return payload.faces.map((f) => ({
      type: dieType,
      faceValue: f,
      size,
    }));
  }

  // Generic: d4, d6, d8, d10, d12, d20
  return payload.faces.map((f) => ({
    type: payload.type as DieType,
    faceValue: f,
    size,
  }));
}

export default DiceMessageScene;
