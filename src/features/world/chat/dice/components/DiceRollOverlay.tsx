import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { DicePayload, PoolDicePayload } from '../lib/dicePayload';
import { payloadToNotation } from '../lib/diceNotation';
import { getDice3dTheme, isWebGLAvailable } from '../lib/dice3dThemes';
import styles from './DiceRollOverlay.module.css';

/**
 * Krok 6.3-fix4 — Fullscreen overlay hodu kostkou.
 *
 * Reálná fyzikální 3D kostka (`@drdreo/dice-box-threejs`) se realisticky
 * zakutálí a dopadne na PŘEDURČENÝ výsledek z payloadu (WS shoda). Po
 * dosednutí se ukáže readout (faces, total, jméno).
 *
 * Fallback (Fate kostka — engine nemá Fudge; nebo chybí WebGL): bez 3D,
 * jen readout po krátké pauze. Kostka tak nikdy neselže naprázdno.
 *
 * 3D engine je lazy (`React.lazy`) — načte se až při prvním 3D hodu a pak
 * žije dál (knihovna nemá destroy(); persistentní instance, viz DiceBox3D).
 */

const LazyDiceBox3D = lazy(() => import('./DiceBox3D'));

export interface DiceRollEvent {
  /** Strukturovaná data hodu (z `dicePayload` v `ChatMessage`). */
  payload: DicePayload;
  /** Skin použitý odesílatelem (z `ChatMessage.diceSkin`). */
  skinId: string | null;
  /** Jméno hráče, který hodil (zobrazí se v readout). */
  rollerName: string;
  /** Timestamp — slouží jako key/nonce hodu. */
  timestamp: number;
}

interface DiceRollOverlayProps {
  /** Aktivní hod k animaci, `null` = overlay schovaný. */
  roll: DiceRollEvent | null;
  /** Volá se po doběhnutí (readout odzobrazen) — kontext nastaví `roll = null`. */
  onDone: () => void;
  /**
   * Přednahřeje 3D engine hned při mountu (skrytě, bez hodu) — první reálný hod
   * pak netrefí studený engine (jinak se „ztratí", engine se teprve inicializuje
   * → uživatel musí hodit dvakrát). Zapíná jen taktická mapa; chat = default off
   * (žádný eager WebGL pro běžné uživatele).
   */
  warmup?: boolean;
}

type Phase = 'idle' | 'rolling' | 'result';

/** Jak dlouho po dosednutí držet readout, než overlay zmizí (ms). */
const RESULT_HOLD_MS = 2400;
/** Pauza fallbacku (fate / no-WebGL) než ukáže výsledek (ms). */
const FALLBACK_DELAY_MS = 650;
/** 3D animační strop, počítaný OD startu reálného hodu (onRollStart). */
const ROLL_CAP_MS = 6000;
/**
 * 6.3-fix8 — pojistka, dokud reálný 3D hod vůbec nezačne (warmup ghost + pomalý
 * init). Musí pohodlně překlenout init+ghost, ať se readout nezobrazí dřív, než
 * se kostka rozkutálí. Hází jen když engine selže úplně (jinak ho nahradí
 * ROLL_CAP_MS od onRollStart).
 */
const COLD_START_CAP_MS = 12000;

export function DiceRollOverlay({ roll, onDone, warmup }: DiceRollOverlayProps) {
  const [webgl] = useState(isWebGLAvailable);
  const [phase, setPhase] = useState<Phase>('idle');
  // Jednou nasazený 3D host žije dál (lazy instance se nereinicializuje).
  // Warmup: předmountuj engine hned při prvním renderu — lazy init místo
  // efektu se setState (react-hooks/set-state-in-effect). Engine se tak nahřeje
  // dřív, první reálný hod ho trefí připravený.
  const [mount3d, setMount3d] = useState(() => Boolean(warmup) && webgl);
  const [use3dThisRoll, setUse3dThisRoll] = useState(false);
  // 6.3-fix8 — kdy REÁLNÝ 3D hod opravdu začal kutálet (0 = ještě ne). Od tohoto
  // okamžiku běží ROLL_CAP_MS; do té doby drží COLD_START_CAP_MS (warmup/ghost).
  const [realRollStartedAt, setRealRollStartedAt] = useState(0);
  const handleRollStart = useCallback(() => setRealRollStartedAt(Date.now()), []);

  const notation = roll ? payloadToNotation(roll.payload) : null;
  const can3d = !!roll && webgl && notation !== null;

  // Nový hod / konec hodu — reaguje na změnu `roll.timestamp`. Adjust-during-
  // render (ne efekt se setState) — React přerenderuje okamžitě, bez cascading
  // efektu (react-hooks/set-state-in-effect). `trackedTs` drží poslední
  // zpracovaný timestamp; gate zabrání smyčce.
  const [trackedTs, setTrackedTs] = useState<number | null>(null);
  const rollTs = roll?.timestamp ?? null;
  if (rollTs !== trackedTs) {
    setTrackedTs(rollTs);
    if (rollTs === null) {
      setPhase('idle');
    } else {
      if (can3d) setMount3d(true);
      setUse3dThisRoll(can3d);
      setRealRollStartedAt(0); // DiceBox3D ohlásí start reálného hodu přes onRollStart
      setPhase('rolling');
    }
  }

  // Strop fáze 'rolling' → výsledek se ukáže VŽDY (je z payloadu), i kdyby 3D
  // onComplete nepřišel (hang/chyba). 3D normálně doběhne ~2–3 s; 6 s je jen
  // pojistka. Bez 3D (fate fallback) jen krátká pauza pro efekt.
  useEffect(() => {
    if (phase !== 'rolling') return;
    // 6.3-fix8 — u 3D počítáme strop od chvíle, kdy REÁLNÝ hod opravdu začal
    // (po případném warmup ghostu), ne od kliknutí. Pomalý init/ghost jinak
    // ukrojí z animačního okna a kostka by „zmizela" pod brzkým readoutem.
    const ms = use3dThisRoll
      ? realRollStartedAt
        ? ROLL_CAP_MS
        : COLD_START_CAP_MS
      : FALLBACK_DELAY_MS;
    const t = window.setTimeout(() => setPhase('result'), ms);
    return () => window.clearTimeout(t);
  }, [phase, use3dThisRoll, realRollStartedAt]);

  // Po zobrazení výsledku držet a dokončit.
  useEffect(() => {
    if (phase !== 'result') return;
    const t = window.setTimeout(() => onDone(), RESULT_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [phase, onDone]);

  const handle3dComplete = useCallback(() => setPhase('result'), []);
  const handle3dError = useCallback(() => setPhase('result'), []);

  if (!roll && !mount3d) return null;

  return (
    <>
      {mount3d && webgl && (
        <Suspense fallback={null}>
          <LazyDiceBox3D
            notation={notation ?? '1d6@1'}
            theme={getDice3dTheme(roll?.skinId ?? null)}
            nonce={roll?.timestamp ?? 0}
            active={use3dThisRoll && phase !== 'idle'}
            warmup={warmup}
            onRollStart={handleRollStart}
            onComplete={handle3dComplete}
            onError={handle3dError}
          />
        </Suspense>
      )}

      {phase !== 'idle' && roll && <Readout roll={roll} show={phase === 'result'} />}
    </>
  );
}

// ─── Readout (faces + total + jméno) ─────────────────────────────────────

export function Readout({ roll, show }: { roll: DiceRollEvent; show: boolean }) {
  if (!show) return null;

  const total = roll.payload.total;
  const totalColorClass =
    total > 0
      ? styles.totalPositive
      : total < 0
        ? styles.totalNegative
        : styles.totalNeutral;
  const isFate = roll.payload.type === 'fate';
  const faces = roll.payload.faces;
  // 8.7q JaD: fatální úspěch (nat 20) / neúspěch (nat 1) — místo výpočtu text.
  const crit = roll.payload.crit;
  // Shadowrun success-pool: počítají se úspěchy (5–6) + glitch.
  const pool =
    roll.payload.type.startsWith('pool-') &&
    typeof (roll.payload as PoolDicePayload).hits === 'number'
      ? (roll.payload as PoolDicePayload)
      : null;
  const hitThreshold = pool?.hitThreshold ?? 5;

  return (
    <div className={styles.overlay}>
      <div className={styles.readout}>
        <div className={styles.facesRow}>
          {faces.map((f, j) => {
            if (pool) {
              const n = Number(f);
              const cls =
                n >= hitThreshold
                  ? styles.faceHit
                  : n === 1
                    ? styles.faceOne
                    : styles.faceGeneric;
              return (
                <span key={j} className={`${styles.faceBadge} ${cls}`}>
                  {f}
                </span>
              );
            }
            if (isFate) {
              const cls =
                f === '+' || f === 1
                  ? styles.facePlus
                  : f === '-' || f === -1
                    ? styles.faceMinus
                    : styles.faceZero;
              const glyph =
                f === '+' || f === 1 ? '+' : f === '-' || f === -1 ? '−' : '0';
              return (
                <span key={j} className={`${styles.faceBadge} ${cls}`}>
                  {glyph}
                </span>
              );
            }
            return (
              <span
                key={j}
                className={`${styles.faceBadge} ${styles.faceGeneric}`}
              >
                {f}
              </span>
            );
          })}
        </div>

        {pool ? (
          <div className={styles.equation}>
            {roll.payload.label && (
              <span className={styles.skillName}>{roll.payload.label}</span>
            )}
            <span className={`${styles.totalValue} ${styles.totalHits}`}>
              {pool.hits ?? 0} úsp.
            </span>
            {pool.criticalGlitch ? (
              <span className={`${styles.glitchTag} ${styles.glitchCrit}`}>
                KRIT. GLITCH
              </span>
            ) : pool.glitch ? (
              <span className={`${styles.glitchTag} ${styles.glitchWarn}`}>
                glitch
              </span>
            ) : null}
          </div>
        ) : crit ? (
          <div className={styles.equation}>
            {roll.payload.label && (
              <span className={styles.skillName}>{roll.payload.label}</span>
            )}
            <span
              className={
                crit === 'success' ? styles.critSuccess : styles.critFail
              }
            >
              {crit === 'success' ? 'Fatální úspěch' : 'Fatální neúspěch'}
            </span>
          </div>
        ) : (
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
            {/* 16.1a — součet kostek jako samostatný operand, ať je vidět co je
                hod a co velikost schopnosti (`schopnost (mod) hod = total`).
                Jen při modifieru ≠ 0 — bez něj `sum === total`, breakdown = šum. */}
            {roll.payload.modifier !== undefined &&
              roll.payload.modifier !== 0 && (
                <span className={styles.diceSum}>
                  {roll.payload.sum > 0 ? '+' : ''}
                  {roll.payload.sum}
                </span>
              )}
            <span className={styles.eqSign}>=</span>
            <span className={`${styles.totalValue} ${totalColorClass}`}>
              {total > 0 ? `+${total}` : total === 0 ? '0' : total}
            </span>
          </div>
        )}

        <div className={styles.rollerName}>{roll.rollerName}</div>
      </div>
    </div>
  );
}
