/**
 * 21.3a — panel generátoru: velikost, hustota místností, křivolakost chodeb,
 * podíl zvláštních dveří, seed. „Přegenerovat" hodí nový seed; stejný seed =
 * stejná mapa (deterministický engine).
 */
import { useState } from 'react';
import { Dices, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  SIZE_PRESETS,
  randomSeed,
  type GeneratorParams,
  type SizePresetKey,
} from '../engine/generate';
import styles from './GeneratorPanel.module.css';

export interface GeneratorPanelProps {
  onGenerate: (params: GeneratorParams) => void;
  onClose: () => void;
}

export function GeneratorPanel({
  onGenerate,
  onClose,
}: GeneratorPanelProps): React.ReactElement {
  const [size, setSize] = useState<SizePresetKey>('M');
  const [roomDensity, setRoomDensity] = useState(50);
  const [windiness, setWindiness] = useState(40);
  const [specialDoorRatio, setSpecialDoorRatio] = useState(30);
  const [seed, setSeed] = useState(() => randomSeed());
  const [generatedOnce, setGeneratedOnce] = useState(false);

  const fire = (nextSeed: number): void => {
    setSeed(nextSeed);
    setGeneratedOnce(true);
    onGenerate({
      width: SIZE_PRESETS[size].width,
      height: SIZE_PRESETS[size].height,
      roomDensity: roomDensity / 100,
      windiness: windiness / 100,
      specialDoorRatio: specialDoorRatio / 100,
      seed: nextSeed,
    });
  };

  return (
    <aside className={styles.panel} aria-label="Generátor podzemí">
      <div className={styles.header}>
        <h3 className={styles.title}>Generátor</h3>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Zavřít generátor"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <label className={styles.field}>
        <span>Velikost</span>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value as SizePresetKey)}
        >
          {(Object.keys(SIZE_PRESETS) as SizePresetKey[]).map((k) => (
            <option key={k} value={k}>
              {SIZE_PRESETS[k].label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>
          Hustota místností <em>{roomDensity} %</em>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={roomDensity}
          onChange={(e) => setRoomDensity(Number(e.target.value))}
        />
      </label>

      <label className={styles.field}>
        <span>
          Křivolakost chodeb <em>{windiness} %</em>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={windiness}
          onChange={(e) => setWindiness(Number(e.target.value))}
        />
      </label>

      <label className={styles.field}>
        <span>
          Zvláštní dveře <em>{specialDoorRatio} %</em>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={specialDoorRatio}
          onChange={(e) => setSpecialDoorRatio(Number(e.target.value))}
        />
      </label>

      <label className={styles.field}>
        <span>Seed (stejný seed = stejná mapa)</span>
        <div className={styles.seedRow}>
          <input
            type="number"
            value={seed}
            min={0}
            onChange={(e) => setSeed(Math.max(0, Number(e.target.value) || 0))}
          />
          <button
            type="button"
            className={styles.diceBtn}
            title="Náhodný seed"
            aria-label="Náhodný seed"
            onClick={() => setSeed(randomSeed())}
          >
            <Dices size={16} />
          </button>
        </div>
      </label>

      <div className={styles.actions}>
        <Button type="button" onClick={() => fire(seed)}>
          {generatedOnce ? 'Vygenerovat se seedem' : 'Vygenerovat'}
        </Button>
        {generatedOnce && (
          <Button type="button" variant="secondary" onClick={() => fire(randomSeed())}>
            Přegenerovat 🎲
          </Button>
        )}
      </div>
      <p className={styles.hint}>
        Generování přepíše plátno (jde vrátit přes Zpět). Pak dokresli detaily
        ručně — dveře, vybavení, popisky.
      </p>
    </aside>
  );
}
