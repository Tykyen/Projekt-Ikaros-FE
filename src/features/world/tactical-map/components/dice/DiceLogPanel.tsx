/**
 * 10.2j — DiceLogPanel.
 *
 * Plovoucí panel na taktické mapě s persistovanou historií hodů. Věrný
 * vizuální port legacy panelu (glassmorphism, barevně kódované výsledky),
 * přepsaný do CSS Modules + theme proměnných (žádné globální SCSS).
 *
 * Každý divák vidí filtrovanou podmnožinu (`canSeeRoll`) + svůj per-user
 * „clear" (localStorage timestamp — vyčištění jen schová hody z TOHOTO
 * panelu, nikdy nemaže data ani neovlivní ostatní).
 */
import { useState } from "react";
import { canSeeRoll } from "../../utils/diceVisibility";
import type { MapDiceRoll } from "../../types";
import type { DiceFaceValue } from "@/features/world/chat/dice/lib/dicePayload";
import type { WorldDiceVisibility } from "@/shared/types";
import styles from "./DiceLogPanel.module.css";

interface DiceLogPanelProps {
  rolls: MapDiceRoll[];
  viewer: { userId: string; isPj: boolean };
  visibility: WorldDiceVisibility | undefined;
  sceneId: string;
}

const CLEAR_KEY_PREFIX = "ikr-map-dice-cleared-";
const OPEN_KEY = "ikr-map-dice-log-open";
const RECENT_MS = 5000;

const CATEGORY_LABEL: Record<MapDiceRoll["category"], string> = {
  skill: "Schopnost",
  initiative: "Iniciativa",
  custom: "Vlastní",
};

function safeGet(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* SSR / private mode — clear je čistě UI, ignoruj */
  }
}

/** Barevné kódování tváří: fate → +/-/0 s plus|minus|zero třídou, jinak číslo. */
function renderFaces(faces: DiceFaceValue[]): React.ReactNode {
  return faces.map((f, i) => {
    if (f === "+") {
      return (
        <span key={i} className={styles.facePlus}>
          +
        </span>
      );
    }
    if (f === "-") {
      return (
        <span key={i} className={styles.faceMinus}>
          −
        </span>
      );
    }
    if (f === "0") {
      return (
        <span key={i} className={styles.faceZero}>
          0
        </span>
      );
    }
    return (
      <span key={i} className={styles.faceNum}>
        {f}
      </span>
    );
  });
}

function totalClass(total: number): string {
  if (total > 0) return styles.totalPositive;
  if (total < 0) return styles.totalNegative;
  return styles.totalNeutral;
}

export function DiceLogPanel({
  rolls,
  viewer,
  visibility,
  sceneId,
}: DiceLogPanelProps): React.ReactElement {
  const clearKey = sceneId ? CLEAR_KEY_PREFIX + sceneId : "";
  const [clearedBefore, setClearedBefore] = useState<string>(() =>
    clearKey ? safeGet(clearKey) : "",
  );
  const [open, setOpen] = useState<boolean>(() => safeGet(OPEN_KEY) !== "0");
  // Render-time „teď" zachycený jednou (purity); řídí jen flash novosti.
  const [now] = useState<number>(() => Date.now());

  const handleClear = (): void => {
    const now = new Date().toISOString();
    setClearedBefore(now);
    if (clearKey) safeSet(clearKey, now);
  };

  const toggleOpen = (): void => {
    setOpen((v) => {
      const next = !v;
      safeSet(OPEN_KEY, next ? "1" : "0");
      return next;
    });
  };

  const visible = rolls
    .filter(
      (r) =>
        canSeeRoll(r, viewer, visibility) &&
        (!clearedBefore || r.rolledAt > clearedBefore),
    )
    .slice(-30)
    .reverse();

  return (
    <aside className={styles.panel}>
      <header
        className={styles.header}
        onClick={toggleOpen}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <span className={styles.title}>Hody</span>
        <button
          type="button"
          className={styles.clear}
          aria-label="Vymazat hody"
          title="Vymazat hody z mého panelu"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
        >
          ✕
        </button>
      </header>

      {open && (
        <div className={styles.body}>
          {visible.length === 0 ? (
            <div className={styles.empty}>Žádné hody</div>
          ) : (
            visible.map((r) => {
              const recent = now - new Date(r.rolledAt).getTime() < RECENT_MS;
              const total = r.dicePayload.total;
              return (
                <div
                  key={r.id}
                  data-testid="dice-log-entry"
                  className={`${styles.entry} ${recent ? styles.recent : ""}`}
                >
                  <div className={styles.meta}>
                    <span className={styles.name} title={r.rollerName}>
                      {r.rollerName}
                    </span>
                    <span className={styles.chip}>
                      {CATEGORY_LABEL[r.category]}
                    </span>
                  </div>
                  <div className={styles.result}>
                    <span className={styles.faces}>
                      {renderFaces(r.dicePayload.faces)}
                    </span>
                    <span className={`${styles.total} ${totalClass(total)}`}>
                      {total}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}
