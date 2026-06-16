import { useCallback, useEffect, useRef, useState } from 'react';
import type { DicePayload } from '../lib/dicePayload';
import { getDiceSkin } from '../lib/diceSkins';
import { cdnSized } from '../lib/cdnImage';
import {
  D4_TARGETS,
  D6_TARGETS,
  D8_TARGETS,
  D10_TARGETS,
  D12_TARGETS,
  D20_TARGETS,
  type DiceTarget,
} from '../lib/diceTargets';
import { FateSkinModel } from './models/FateSkinModel';
import { D4Model } from './models/D4Model';
import { D6Model } from './models/D6Model';
import { D8Model } from './models/D8Model';
import { D10Model } from './models/D10Model';
import { D12Model } from './models/D12Model';
import { D20Model } from './models/D20Model';
import { D100TensModel } from './models/D100TensModel';
import './models/polyhedralDice.css';
import styles from './DiceRollOverlay.module.css';

/**
 * Krok 6.3 — Fullscreen 3D dice roll overlay (port `C:/Matrix/Matrix/
 * frontend/src/components/Map/Dice/DiceOverlay.tsx`).
 *
 * Pipeline:
 *   1. TUMBLE (0..0.9 s): kostky vletí z náhodného okraje obrazovky
 *      do středu, padají s frictioné rychlostí (vx,vy *= 0.965) a
 *      rotují (vrx,vry,vrz *= 0.97 — postupný útlum).
 *   2. SETTLE (0.9..1.4 s): kostky doletí na cílové pozice (rovnoměrně
 *      rozmístěné horizontálně), rotace se interpoluje do TARGETS pro
 *      konkrétní výslednou tvář. Bounce scale `1 + sin(t*π)*0.1`.
 *   3. SHOW (1.4..4.9 s): kostky stojí, zobrazí se readout (výsledek,
 *      faces, jméno rollera).
 *   4. HIDDEN: overlay zmizí, `onDone` callback.
 */

export interface DiceRollEvent {
  /** Strukturovaná data hodu (z `dicePayload` v `ChatMessage`). */
  payload: DicePayload;
  /** Skin použitý odesílatelem (z `ChatMessage.diceSkin`). */
  skinId: string | null;
  /** Jméno hráče, který hodil (zobrazí se v readout). */
  rollerName: string;
  /** Timestamp — slouží jako key, aby overlay nezachytil cizí hod. */
  timestamp: number;
}

interface DiceRollOverlayProps {
  /** Aktivní hod k animaci, `null` = overlay schovaný. */
  roll: DiceRollEvent | null;
  /** Volá se po SHOW fázi — kontext nastaví `roll = null`. */
  onDone: () => void;
}

type Phase = 'tumble' | 'settle' | 'show' | 'hidden';

interface DieAnim {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rz: number;
  vx: number;
  vy: number;
  vrx: number;
  vry: number;
  vrz: number;
  targetX: number;
  targetY: number;
  snapX: number;
  snapY: number;
}

interface DicePosition {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
}

const TUMBLE_TIME = 0.9;
const SETTLE_TIME = 0.5;
const SHOW_TIME = 3.5;
const TOTAL_TIME = TUMBLE_TIME + SETTLE_TIME + SHOW_TIME;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/** Odvodí seznam (dieType, faceValue) párů z `DicePayload`. */
function describeFaces(
  payload: DicePayload,
): Array<{ dieType: string; faceValue: number | string }> {
  if (payload.type === 'fate') {
    return payload.faces.map((f) => ({ dieType: 'fate', faceValue: String(f) }));
  }
  if (payload.type === 'd100') {
    return [
      { dieType: 'd100', faceValue: payload.tens === 0 ? 0 : payload.tens },
      { dieType: 'd10', faceValue: payload.ones },
    ];
  }
  if (payload.type === 'mixed') {
    return payload.faces.map((f, i) => ({
      dieType: payload.faceTypes[i] || 'd6',
      faceValue: f,
    }));
  }
  if (payload.type.startsWith('pool-d')) {
    const sides = payload.type.replace('pool-d', '');
    return payload.faces.map((f) => ({ dieType: `d${sides}`, faceValue: f }));
  }
  return payload.faces.map((f) => ({
    dieType: payload.type,
    faceValue: f,
  }));
}

function getTargetForDie(
  dieType: string,
  faceValue: number | string,
): DiceTarget {
  const lower = dieType.toLowerCase();
  if (lower === 'fate') {
    // 10.2j fix — Fate kostka usazuje VŽDY čelně ({0,0,0}) a hozenou hodnotu
    // nese přední tvář (viz renderModelFor faceValue). Dřívější řešení
    // (dekorativní vzor + rotace na příslušnou tvář) zobrazovalo u '-' (rotace
    // 180° → zadní tvář) plus místo mínusu — případ '+' (čelní tvář, {0,0,0})
    // fungoval, tak ho používáme pro všechny hodnoty.
    return { rx: 0, ry: 0, rz: 0 };
  }
  const rVal =
    typeof faceValue === 'number' ? faceValue : parseInt(String(faceValue), 10);
  if (lower === 'd4' || lower === 'k4') {
    const tId = isNaN(rVal) ? 0 : (rVal - 1) % 4;
    return D4_TARGETS[tId];
  }
  if (lower === 'd6' || lower === 'k6') {
    const tId = isNaN(rVal) ? 0 : (rVal - 1) % 6;
    return D6_TARGETS[tId];
  }
  if (lower === 'd8' || lower === 'k8') {
    const tId = isNaN(rVal) ? 0 : (rVal - 1) % 8;
    return D8_TARGETS[tId];
  }
  if (lower === 'd10' || lower === 'k10') {
    const tId = isNaN(rVal) ? 0 : ((rVal === 0 ? 10 : rVal) - 1) % 10;
    return D10_TARGETS[tId];
  }
  if (lower === 'd100' || lower === 'k100') {
    const tId = isNaN(rVal) ? 0 : ((rVal === 0 ? 10 : rVal / 10) - 1) % 10;
    return D10_TARGETS[tId];
  }
  if (lower === 'd12' || lower === 'k12') {
    const tId = isNaN(rVal) ? 0 : (rVal - 1) % 12;
    return D12_TARGETS[tId];
  }
  if (lower === 'd20' || lower === 'k20') {
    const tId = isNaN(rVal) ? 0 : (rVal - 1) % 20;
    return D20_TARGETS[tId];
  }
  return D6_TARGETS[0];
}

function renderModelFor(
  dieType: string,
  faceValue: number | string,
  skin: ReturnType<typeof getDiceSkin>,
  isFirstD100: boolean,
) {
  const lower = dieType.toLowerCase();
  // 10.2j fix — Fate kostce předáváme faceValue → hozená hodnota je na PŘEDNÍ
  // tváři, ostatní '0'. Spolu s čelním targetem ({0,0,0} v getTargetForDie)
  // se vždy zobrazí správná tvář. Textury jsou RGB (bez alpha), takže žádný
  // „průhledný tunel" + vnitřní coreColor jádro kostku uzavírá. Dřívější
  // dekorativní vzor + rotace zobrazoval u '-' plus místo mínusu.
  if (lower === 'fate')
    return <FateSkinModel skin={skin} faceValue={String(faceValue)} />;
  if (lower === 'd4') return <D4Model faceValue={faceValue} skin={skin} />;
  if (lower === 'd6') return <D6Model skin={skin} />;
  if (lower === 'd8') return <D8Model faceValue={faceValue} skin={skin} />;
  if (lower === 'd10') return <D10Model faceValue={faceValue} skin={skin} />;
  if (lower === 'd12') return <D12Model faceValue={faceValue} skin={skin} />;
  if (lower === 'd20') return <D20Model faceValue={faceValue} skin={skin} />;
  if (lower === 'd100')
    return isFirstD100 ? (
      <D100TensModel faceValue={faceValue} skin={skin} />
    ) : (
      <D10Model faceValue={faceValue} skin={skin} />
    );
  return <D6Model skin={skin} />;
}

export function DiceRollOverlay({ roll, onDone }: DiceRollOverlayProps) {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [dicePositions, setDicePositions] = useState<DicePosition[]>([]);
  const animRef = useRef<number>(0);
  const startRef = useRef(0);
  const snappedRef = useRef(false);

  const buildDice = useCallback((): DieAnim[] => {
    if (!roll) return [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dies = describeFaces(roll.payload);
    const count = dies.length;

    return Array.from({ length: count }, (_, i): DieAnim => {
      const spacing = Math.min(vw * (count > 4 ? 0.08 : 0.11), 110);
      const totalW = (count - 1) * spacing;
      const targetX = (vw - totalW) / 2 + i * spacing;
      const targetY = vh * 0.33 + (Math.random() * 30 - 15);

      const edge = i % 4;
      let sx: number;
      let sy: number;
      if (edge === 0) {
        sx = -80;
        sy = vh * 0.3 + Math.random() * vh * 0.3;
      } else if (edge === 1) {
        sx = vw + 80;
        sy = vh * 0.3 + Math.random() * vh * 0.3;
      } else if (edge === 2) {
        sx = vw * 0.2 + Math.random() * vw * 0.6;
        sy = -80;
      } else {
        sx = vw * 0.2 + Math.random() * vw * 0.6;
        sy = vh + 80;
      }

      const lower = dies[i].dieType.toLowerCase();
      const spinX =
        lower === 'd4'
          ? 1000
          : lower === 'd8'
            ? 1200
            : lower === 'd10' || lower === 'd100'
              ? 1400
              : lower === 'd12'
                ? 1500
                : lower === 'd20'
                  ? 1600
                  : 1800;
      const spinZ =
        lower === 'd4'
          ? 500
          : lower === 'd8'
            ? 600
            : lower === 'd10' || lower === 'd100'
              ? 700
              : lower === 'd12' || lower === 'd20'
                ? 800
                : 800;

      return {
        x: sx,
        y: sy,
        rx: Math.random() * 360,
        ry: Math.random() * 360,
        rz: Math.random() * 180 - 90,
        vx: (targetX - sx) * 1.5,
        vy: (targetY - sy) * 1.5,
        vrx: (Math.random() - 0.5) * spinX,
        vry: (Math.random() - 0.5) * spinX,
        vrz: (Math.random() - 0.5) * spinZ,
        targetX,
        targetY,
        snapX: 0,
        snapY: 0,
      };
    });
  }, [roll]);

  // Animační orchestrace (requestAnimationFrame phase machine) — legitimní effekt,
  // setPhase řídí běh animace, render-phase by nešlo.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!roll) {
      setPhase('hidden');
      return;
    }

    const dies = describeFaces(roll.payload);
    let local = buildDice();
    snappedRef.current = false;
    setPhase('tumble');
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      if (elapsed > TOTAL_TIME) {
        setPhase('hidden');
        onDone();
        return;
      }

      const dt = 0.016;

      if (elapsed < TUMBLE_TIME) {
        // Tumble — let s frictioné rychlosti + rotace.
        local = local.map((d) => ({
          ...d,
          x: d.x + d.vx * dt,
          y: d.y + d.vy * dt,
          vx: d.vx * 0.965,
          vy: d.vy * 0.965,
          rx: d.rx + d.vrx * dt,
          ry: d.ry + d.vry * dt,
          rz: d.rz + d.vrz * dt,
          vrx: d.vrx * 0.97,
          vry: d.vry * 0.97,
          vrz: d.vrz * 0.97,
        }));
        setDicePositions(
          local.map((d) => ({
            x: d.x,
            y: d.y,
            rx: d.rx,
            ry: d.ry,
            rz: d.rz,
            scale: 1,
          })),
        );
      } else if (elapsed < TUMBLE_TIME + SETTLE_TIME) {
        if (!snappedRef.current) {
          local = local.map((d) => ({ ...d, snapX: d.x, snapY: d.y }));
          snappedRef.current = true;
        }
        const t = smoothstep((elapsed - TUMBLE_TIME) / SETTLE_TIME);
        setDicePositions(
          local.map((d, i) => {
            const target = getTargetForDie(dies[i].dieType, dies[i].faceValue);
            return {
              x: d.snapX + (d.targetX - d.snapX) * t,
              y: d.snapY + (d.targetY - d.snapY) * t,
              rx: d.rx + (target.rx - d.rx) * t,
              ry: d.ry + (target.ry - d.ry) * t,
              rz: d.rz + (target.rz - d.rz) * t,
              scale: 1 + Math.sin(t * Math.PI) * 0.1,
            };
          }),
        );
        if (t > 0.9) setPhase('show');
      } else {
        // Show — statické cílové pozice.
        setDicePositions(
          local.map((d, i) => {
            const target = getTargetForDie(dies[i].dieType, dies[i].faceValue);
            return {
              x: d.targetX,
              y: d.targetY,
              rx: target.rx,
              ry: target.ry,
              rz: target.rz,
              scale: 1,
            };
          }),
        );
        setPhase('show');
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.timestamp]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (phase === 'hidden' || !roll) return null;

  const skin = getDiceSkin(roll.skinId);
  const dies = describeFaces(roll.payload);
  const settled = phase === 'show';

  // Readout — total + faces + jméno
  const total = roll.payload.total;
  const totalColorClass =
    total > 0
      ? styles.totalPositive
      : total < 0
        ? styles.totalNegative
        : styles.totalNeutral;
  const isFate = roll.payload.type === 'fate';

  return (
    <div className={styles.overlay}>
      {dicePositions.map((pos, i) => {
        const die = dies[i];
        const isFirstD100 = die.dieType.toLowerCase() === 'd100' && i === 0;
        const isFate = die.dieType.toLowerCase() === 'fate';
        const fateImgSrc = cdnSized(
          isFate
            ? die.faceValue === '+'
              ? skin.facePlusImg
              : die.faceValue === '-'
                ? skin.faceMinusImg
                : skin.faceBlankImg
            : undefined,
        );
        return (
          <div
            key={i}
            className="fate-die-3d-wrapper"
            data-i={i}
            data-face={String(die.faceValue)}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) scale(${pos.scale})`,
            }}
          >
            {/* 2D fallback `<img>` MIMO cube — wrapper plane se nerotuje
                s cube transformací. Pro Fate '0' hod, kde 3D rotace
                způsobí že faces jsou na bok / mimo viewport, 2D image
                zajistí že kostka je VŽDY viditelná. Pro '+' / '-' je
                3D cube nahoře (z-index implicit) a překrývá 2D fallback.
                Toto je pragmatický kompromis — Fate hod není „rolling
                kostka" ale spíše „odhalení tváře". */}
            {isFate && fateImgSrc && (
              <img
                src={fateImgSrc}
                alt={String(die.faceValue)}
                loading="eager"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: skin.borderRadius || '20%',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            )}
            <div
              className={`fate-die-3d-cube ${settled ? 'settled' : ''}`}
              style={{
                transform: `rotateX(${pos.rx}deg) rotateY(${pos.ry}deg) rotateZ(${pos.rz}deg)`,
                zIndex: 1,
              }}
            >
              {renderModelFor(die.dieType, die.faceValue, skin, isFirstD100)}
            </div>
          </div>
        );
      })}

      {settled && (
        <div className={styles.readout}>
          <div className={styles.facesRow}>
            {dies.map((d, j) => {
              if (isFate) {
                const v = d.faceValue;
                const cls =
                  v === '+' || v === 1
                    ? styles.facePlus
                    : v === '-' || v === -1
                      ? styles.faceMinus
                      : styles.faceZero;
                const glyph =
                  v === '+' || v === 1 ? '+' : v === '-' || v === -1 ? '−' : '0';
                return (
                  <span key={j} className={`${styles.faceBadge} ${cls}`}>
                    {glyph}
                  </span>
                );
              }
              return (
                <span key={j} className={`${styles.faceBadge} ${styles.faceGeneric}`}>
                  {d.faceValue}
                </span>
              );
            })}
          </div>

          <div className={styles.equation}>
            {roll.payload.label && (
              <>
                <span className={styles.skillName}>{roll.payload.label}</span>
                {roll.payload.modifier !== undefined &&
                  roll.payload.modifier !== 0 && (
                    <span className={styles.skillMod}>
                      ({roll.payload.modifier > 0 ? '+' : ''}
                      {roll.payload.modifier})
                    </span>
                  )}
              </>
            )}
            <span className={styles.eqSign}>=</span>
            <span className={`${styles.totalValue} ${totalColorClass}`}>
              {total > 0 ? `+${total}` : total === 0 ? '0' : total}
            </span>
          </div>

          <div className={styles.rollerName}>{roll.rollerName}</div>
        </div>
      )}
    </div>
  );
}
