import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import type { FateDiceSkin } from '../lib/diceSkins';
import { targetForFate, targetForGeneric } from '../lib/diceTargets';
import type { DiceTarget } from '../lib/diceTargets';
import { D4Model } from './models/D4Model';
import { D6Model } from './models/D6Model';
import { D8Model } from './models/D8Model';
import { D10Model } from './models/D10Model';
import { D12Model } from './models/D12Model';
import { D20Model } from './models/D20Model';
import { D100TensModel } from './models/D100TensModel';
import { FateSkinModel } from './models/FateSkinModel';
import './models/polyhedralDice.css';
import styles from './RollingDiceScene.module.css';

/**
 * Krok 6.3d — Orchestrace rolling animace jedné kostky.
 *
 * Stavy:
 * - `'rolling'` (0–1000 ms): náhodná rotace na 3 osách, pseudo-fyzický chaos.
 * - `'settling'` (1000–1400 ms): CSS `transition` do TARGETS quaternion.
 * - `'settled'` (1400+ ms): kostka stojí, drobný settle bounce + glow flash.
 *
 * Reduced motion → enforced 'settled' okamžitě.
 *
 * Komponenta je generická pro všechny typy kostek; vykreslí příslušný
 * `*Model` uvnitř obaleného `<div>` s rotujícím `transform`.
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

interface RollingDiceProps {
  /** Typ kostky pro výběr modelu + TARGETS. */
  type: DieType;
  /** Konečná tvář, na kterou má kostka dopadnout. */
  faceValue: number | '+' | '-' | '0';
  /** Skin (textury + barvy). */
  skin: FateDiceSkin;
  /** Velikost kostky v px (default 80). */
  size?: number;
  /** Animační delay od mount (stagger mezi kostkami v `DiceMessageScene`). */
  delayMs?: number;
  /** Pokud `false`, kostka se zobrazí rovnou v settled state bez animace. */
  animate?: boolean;
}

type Phase = 'rolling' | 'settling' | 'settled';

const ROLLING_MS = 1000;
const SETTLING_MS = 400;

function targetTransform(target: DiceTarget): string {
  return `rotateX(${target.rx}deg) rotateY(${target.ry}deg) rotateZ(${target.rz}deg)`;
}

function getTarget(
  type: DieType,
  faceValue: number | '+' | '-' | '0',
): DiceTarget {
  if (type === 'fate') return targetForFate(faceValue as '+' | '-' | '0');
  if (type === 'd100tens') {
    // d100 desítky: hodnota 0 = tvář 10, 10..90 = tvář (val/10).
    const num = Number(faceValue);
    const idx = num === 0 ? 10 : num / 10;
    return targetForGeneric('d10', idx);
  }
  return targetForGeneric(
    type as 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20',
    Number(faceValue),
  );
}

function renderModel(
  type: DieType,
  faceValue: number | '+' | '-' | '0',
  skin: FateDiceSkin,
  size: number,
): React.ReactNode {
  switch (type) {
    case 'fate':
      return <FateSkinModel skin={skin} faceValue={String(faceValue)} size={size} />;
    case 'd4':
      return <D4Model faceValue={faceValue} skin={skin} />;
    case 'd6':
      return <D6Model skin={skin} />;
    case 'd8':
      return <D8Model faceValue={faceValue} skin={skin} />;
    case 'd10':
      return <D10Model faceValue={faceValue} skin={skin} />;
    case 'd12':
      return <D12Model faceValue={faceValue} skin={skin} />;
    case 'd20':
      return <D20Model faceValue={faceValue} skin={skin} />;
    case 'd100tens':
      return <D100TensModel faceValue={faceValue} skin={skin} />;
  }
}

/**
 * Krok 6.3 perf — vrátí URL **konkrétní tváře** skinu pro danou hodnotu.
 * Použito v settled fázi místo renderu plného 3D modelu se všemi tvářemi.
 *
 * Bez tohoto by chat s 5 hody historicky stáhl ~5 × 20 = 100 paralelních
 * textur (každá ~50 KB). S tímto 5 × 1 = 5 lazy-loaded img.
 */
function pickFaceImg(
  type: DieType,
  faceValue: number | '+' | '-' | '0',
  skin: FateDiceSkin,
): string | undefined {
  if (type === 'fate') {
    if (faceValue === '+' || faceValue === 1) return skin.facePlusImg;
    if (faceValue === '-' || faceValue === -1) return skin.faceMinusImg;
    return skin.faceBlankImg;
  }
  if (type === 'd100tens') {
    const num = Number(faceValue);
    const label = num === 0 ? '00' : String(num);
    return (skin as unknown as Record<string, string | undefined>)[
      `d100_${label}Img`
    ];
  }
  const num = Number(faceValue);
  if (type === 'd10') {
    const label = num === 0 ? '0' : String(num === 10 ? 0 : num);
    return (skin as unknown as Record<string, string | undefined>)[
      `d10_${label}Img`
    ];
  }
  return (skin as unknown as Record<string, string | undefined>)[
    `${type}_${num}Img`
  ];
}

/**
 * Krok 6.3 perf — 2D snapshot tváře. Pro settled fázi (a historii chatu)
 * stačí jeden lazy-loaded `<img>` místo full 3D modelu se všemi tvářemi.
 * Fallback na 3D model jen pokud skin nemá texturu pro danou tvář.
 */
function SettledDieFace({
  type,
  faceValue,
  skin,
  size,
}: {
  type: DieType;
  faceValue: number | '+' | '-' | '0';
  skin: FateDiceSkin;
  size: number;
}) {
  const imgUrl = pickFaceImg(type, faceValue, skin);

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: skin.borderRadius || '14%',
          border: `1px solid ${skin.borderColor || 'transparent'}`,
          boxShadow:
            'inset 0 -3px 6px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.35)',
        }}
      />
    );
  }

  // Fallback — žádná textura, render 3D model (původní cesta).
  return <>{renderModel(type, faceValue, skin, size)}</>;
}

export const RollingDie: React.FC<RollingDiceProps> = ({
  type,
  faceValue,
  skin,
  size = 80,
  delayMs = 0,
  animate = true,
}) => {
  const [phase, setPhase] = useState<Phase>(animate ? 'rolling' : 'settled');
  const cubeRef = useRef<HTMLDivElement>(null);
  // Math.random je impure → lazy init přes useState garantuje single-eval per mount.
  const [seed] = useState(() => Math.floor(Math.random() * 100000));
  const seedRef = useRef<number>(seed);

  const target = useMemo(() => getTarget(type, faceValue), [type, faceValue]);

  /**
   * 6.3 perf + animace — JS RAF loop driver pro rolling/settling fázi.
   *
   * Rolling fáze (0..ROLLING_MS):
   *   - Kontinuální 3D rotace přes RAF — chaos tumble (různé rychlosti
   *     per osa, drobný seed posun aby každá kostka v hodu rotovala jinak).
   *   - `cube.style.transform` přepisován každý frame; `transition: none`.
   *
   * Settling fáze (ROLLING_MS..ROLLING_MS+SETTLING_MS):
   *   - Jednorázový set `target` transform s CSS transition (cubic-bezier).
   *   - Browser interpoluje z aktuálního rolling transformu do cíle.
   *   - RAF loop pokračuje (pasivně — jen čeká na konec settling).
   *
   * Settled fáze (po SETTLING_MS):
   *   - React přepne na 2D snapshot (`<SettledDieFace>`) — méně requestů.
   *
   * Předchozí implementace nastavila jeden statický chaos transform v
   * rolling fázi a kostka prostě stála — bez kontinuální rotace.
   */
  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;

    // Detekce reduced motion — zkrátíme rolling animaci, ale 3D model
    // zachováme (uživatel chce vidět kostku, jen ne dlouhou animaci).
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rollingMs = reducedMotion ? 200 : ROLLING_MS;
    const settlingMs = reducedMotion ? 100 : SETTLING_MS;

    if (!animate) {
      // Statický 3D — kostka rovnou v cílové orientaci, žádná animace.
      cube.style.transition = 'none';
      cube.style.transform = targetTransform(target);
      return;
    }

    let raf = 0;
    let active = true;
    let localPhase: Phase = 'rolling';
    const startTime = performance.now() + delayMs;
    const seedBase = seedRef.current;
    // Rychlosti per osa — různé pro každou kostku v hodu (přes seed),
    // aby kostky netáhly synchronně. Hodnoty ve stupních/sekundu.
    const speedX = 480 + (seedBase % 240); // 480..720 deg/s
    const speedY = 360 + ((seedBase * 7) % 240); // 360..600 deg/s
    const speedZ = 240 + ((seedBase * 13) % 200); // 240..440 deg/s
    const offsetX = (seedBase * 11) % 360;
    const offsetY = (seedBase * 17) % 360;
    const offsetZ = (seedBase * 23) % 360;

    // Inicial frame — než RAF vezme řízení, kostka stojí v náhodné
    // chaotické orientaci (ne v target — to by bylo viditelně skoč).
    cube.style.transition = 'none';
    cube.style.transform = `rotateX(${offsetX}deg) rotateY(${offsetY}deg) rotateZ(${offsetZ}deg)`;

    const loop = (now: number) => {
      if (!active) return;
      const elapsed = now - startTime;

      if (elapsed < 0) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const cubeEl = cubeRef.current;
      if (!cubeEl) {
        raf = requestAnimationFrame(loop);
        return;
      }

      if (elapsed < rollingMs) {
        // Rolling — kontinuální 3D rotace přes RAF.
        const t = elapsed / 1000;
        const rx = offsetX + t * speedX;
        const ry = offsetY + t * speedY;
        const rz = offsetZ + t * speedZ;
        cubeEl.style.transition = 'none';
        cubeEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
        raf = requestAnimationFrame(loop);
      } else if (elapsed < rollingMs + settlingMs) {
        // Settling — jednorázový set target + CSS transition. RAF pasivně
        // čeká (browser dokončí interpolaci, žádný style update).
        if (localPhase === 'rolling') {
          localPhase = 'settling';
          cubeEl.style.transition = `transform ${settlingMs}ms cubic-bezier(0.34, 1.2, 0.64, 1)`;
          cubeEl.style.transform = targetTransform(target);
          setPhase('settling');
        }
        raf = requestAnimationFrame(loop);
      } else {
        // Settled — React přepne na 2D snapshot.
        if (localPhase !== 'settled') {
          localPhase = 'settled';
          setPhase('settled');
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [animate, delayMs, target]);

  // 6.3 perf — settled fáze: 2D snapshot tváře místo full 3D modelu se
  // všemi tvářemi (cca 95% méně HTTP requestů u chatu plného hodů).
  // Rolling/settling: full 3D model (animace potřebuje všechny tváře).
  if (phase === 'settled') {
    return (
      <div
        className={`${styles.wrapper} ${styles.settledStatic}`}
        style={{ width: size, height: size }}
      >
        <SettledDieFace
          type={type}
          faceValue={faceValue}
          skin={skin}
          size={size}
        />
      </div>
    );
  }

  // Rolling/settling fáze — 3D model s RAF ovládaným transformem.
  // JSX inline style záměrně NEUVÁDÍ `transform` ani `transition` —
  // React by je v re-render přepsal (smazal `transition` co RAF nastavil),
  // takže transition do TARGETS by neproběhla. Místo toho RAF loop
  // ovládá DOM přímo přes `cube.style.*`.
  return (
    <div
      className={styles.wrapper}
      style={{ width: size, height: size, perspective: size * 6 }}
    >
      <div
        ref={cubeRef}
        className={styles.cube}
        style={{ width: size, height: size }}
        data-phase={phase}
      >
        {renderModel(type, faceValue, skin, size)}
      </div>
    </div>
  );
};
