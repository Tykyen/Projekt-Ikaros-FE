import type { DicePayload } from '../lib/dicePayload';
import { getDiceSkin } from '../lib/diceSkins';
import { RollingDie } from './RollingDiceScene';
import type { DieType } from './RollingDiceScene';
import styles from './DiceMessageScene.module.css';

interface DiceMessageSceneProps {
  payload: DicePayload;
  skinId: string | null;
  /** Zdali přehrát rolling (čerstvý hod) nebo rovnou settled. */
  rolling: boolean;
}

/**
 * Krok 6.3d — Scéna kostek pro inline render v `MessageItem`.
 *
 * Renderuje 1..N kostek v řadě dle `payload.type`. Stagger animace
 * (delay 80 ms per kostka) v rolling fázi. Pro mixed/d100 vykreslí
 * smíšené modely podle `faceTypes` / pevně `d10` + `d10` (d100 = 2 desítky).
 */
export const DiceMessageScene: React.FC<DiceMessageSceneProps> = ({
  payload,
  skinId,
  rolling,
}) => {
  const skin = getDiceSkin(skinId);
  const dies = buildDieDefs(payload);

  return (
    <div className={styles.scene}>
      {dies.map((d, i) => (
        <RollingDie
          key={i}
          type={d.type}
          faceValue={d.faceValue}
          skin={skin}
          size={d.size}
          delayMs={rolling ? i * 80 : 0}
          animate={rolling}
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
