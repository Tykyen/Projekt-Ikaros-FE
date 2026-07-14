/**
 * 21.3a+e — panel generátoru; formulář se přepíná podle druhu mapy.
 * Podzemí: hustota místností, křivolakost, zvláštní dveře, zabydlenost.
 * Město: hustota zástavby, křivolakost ulic, hradby, řeka, zeleň, zabydlenost.
 * „Přegenerovat" hodí nový seed; stejný seed = stejná mapa (deterministické).
 */
import { useState } from 'react';
import { Dices, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { MapKind } from '../types';
import {
  DUNGEON_THEME_LABELS,
  SIZE_PRESETS,
  randomSeed,
  type DungeonTheme,
  type GeneratorParams,
  type SizePresetKey,
} from '../engine/generate';
import type { CityGeneratorParams } from '../engine/generateCity';
import type { WildernessGeneratorParams } from '../engine/generateWilderness';
import styles from './GeneratorPanel.module.css';

export type GenerateRequest =
  | { kind: 'dungeon'; params: GeneratorParams }
  | { kind: 'city'; params: CityGeneratorParams }
  | { kind: 'wilderness'; params: WildernessGeneratorParams };

export interface GeneratorPanelProps {
  mapKind: MapKind;
  onGenerate: (request: GenerateRequest) => void;
  onClose: () => void;
}

type TriState = 'auto' | 'yes' | 'no';

export function GeneratorPanel({
  mapKind,
  onGenerate,
  onClose,
}: GeneratorPanelProps): React.ReactElement {
  const [size, setSize] = useState<SizePresetKey>('M');
  // Podzemí
  const [theme, setTheme] = useState<DungeonTheme>('klasika');
  const [roomDensity, setRoomDensity] = useState(50);
  const [windiness, setWindiness] = useState(40);
  const [specialDoorRatio, setSpecialDoorRatio] = useState(30);
  // Město
  const [buildingDensity, setBuildingDensity] = useState(60);
  const [streetWindiness, setStreetWindiness] = useState(40);
  const [walls, setWalls] = useState<TriState>('auto');
  // Krajina
  const [forestness, setForestness] = useState(60);
  const [mountainness, setMountainness] = useState(40);
  const [settlement, setSettlement] = useState<TriState>('auto');
  // Sdílené (řeku má město i krajina)
  const [river, setRiver] = useState<TriState>('auto');
  const [greenery, setGreenery] = useState(50);
  const [furnishing, setFurnishing] = useState(40);
  const [seed, setSeed] = useState(() => randomSeed());
  const [generatedOnce, setGeneratedOnce] = useState(false);

  const fire = (nextSeed: number): void => {
    setSeed(nextSeed);
    setGeneratedOnce(true);
    const { width, height } = SIZE_PRESETS[size];
    if (mapKind === 'city') {
      onGenerate({
        kind: 'city',
        params: {
          width,
          height,
          buildingDensity: buildingDensity / 100,
          windiness: streetWindiness / 100,
          walls,
          river,
          greenery: greenery / 100,
          furnishing: furnishing / 100,
          seed: nextSeed,
        },
      });
    } else if (mapKind === 'wilderness') {
      onGenerate({
        kind: 'wilderness',
        params: {
          width,
          height,
          forestness: forestness / 100,
          mountainness: mountainness / 100,
          water: river,
          settlement,
          furnishing: furnishing / 100,
          seed: nextSeed,
        },
      });
    } else {
      onGenerate({
        kind: 'dungeon',
        params: {
          width,
          height,
          theme,
          roomDensity: roomDensity / 100,
          windiness: windiness / 100,
          specialDoorRatio: specialDoorRatio / 100,
          furnishing: furnishing / 100,
          seed: nextSeed,
        },
      });
    }
  };

  const slider = (
    label: string,
    value: number,
    onChange: (v: number) => void,
  ): React.ReactElement => (
    <label className={styles.field} key={label}>
      <span>
        {label} <em>{value} %</em>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );

  const triSelect = (
    label: string,
    value: TriState,
    onChange: (v: TriState) => void,
    id: string,
  ): React.ReactElement => (
    <label className={styles.field} htmlFor={id} key={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as TriState)}
      >
        <option value="auto">Podle seedu</option>
        <option value="yes">Ano</option>
        <option value="no">Ne</option>
      </select>
    </label>
  );

  return (
    <aside className={styles.panel} aria-label="Generátor">
      <div className={styles.header}>
        <h3 className={styles.title}>
          {mapKind === 'city'
            ? 'Generátor města'
            : mapKind === 'wilderness'
              ? 'Generátor krajiny'
              : 'Generátor podzemí'}
        </h3>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Zavřít generátor"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <label className={styles.field} htmlFor="gen-size-select">
        <span>Velikost</span>
        <select
          id="gen-size-select"
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

      {mapKind === 'dungeon' && (
        <>
          <label className={styles.field} htmlFor="gen-theme-select">
            <span>Téma</span>
            <select
              id="gen-theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as DungeonTheme)}
            >
              {(Object.keys(DUNGEON_THEME_LABELS) as DungeonTheme[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {DUNGEON_THEME_LABELS[t]}
                  </option>
                ),
              )}
            </select>
          </label>
          {theme === 'jeskyne' ? (
            slider('Otevřenost jeskyní', roomDensity, setRoomDensity)
          ) : (
            <>
              {slider('Hustota místností', roomDensity, setRoomDensity)}
              {slider('Křivolakost chodeb', windiness, setWindiness)}
              {slider('Zvláštní dveře', specialDoorRatio, setSpecialDoorRatio)}
            </>
          )}
        </>
      )}
      {mapKind === 'city' && (
        <>
          {slider('Hustota zástavby', buildingDensity, setBuildingDensity)}
          {slider('Křivolakost ulic', streetWindiness, setStreetWindiness)}
          {triSelect('Hradby', walls, setWalls, 'gen-walls-select')}
          {triSelect('Řeka', river, setRiver, 'gen-river-select')}
          {slider('Zeleň', greenery, setGreenery)}
        </>
      )}
      {mapKind === 'wilderness' && (
        <>
          {slider('Lesnatost', forestness, setForestness)}
          {slider('Hornatost', mountainness, setMountainness)}
          {triSelect('Voda (řeka/jezero)', river, setRiver, 'gen-water-select')}
          {triSelect('Osídlení', settlement, setSettlement, 'gen-settlement-select')}
        </>
      )}

      {slider('Zabydlenost', furnishing, setFurnishing)}

      <label className={styles.field}>
        <span>Seed (stejný seed = stejná mapa)</span>
        <div className={styles.seedRow}>
          <input
            type="number"
            value={seed}
            min={0}
            aria-label="Seed"
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
        ručně —{' '}
        {mapKind === 'city'
          ? 'budovy, stánky, popisky'
          : mapKind === 'wilderness'
            ? 'lesy, stavení, popisky'
            : 'dveře, vybavení, popisky'}
        .
      </p>
    </aside>
  );
}
