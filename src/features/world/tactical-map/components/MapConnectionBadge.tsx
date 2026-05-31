/**
 * 10.2i — indikátor stavu WS spojení na taktické mapě (levý horní roh).
 *
 * Princip „mizí, když je vše OK": `connected` = jen tichá tečka bez textu.
 * Při výpadku/reconnectu se rozsvítí. Po obnově krátce „synchronizováno"
 * (catch-up proběhl) a zhasne.
 *
 * Čte sdílený `socketStatusAtom` (nastavuje `features/chat/api/socket.ts`).
 */
import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { socketStatusAtom } from "@/features/chat/store/socketStore";
import styles from "./MapConnectionBadge.module.css";

export function MapConnectionBadge(): React.ReactElement {
  const status = useAtomValue(socketStatusAtom);
  const prevRef = useRef(status);
  const [showSynced, setShowSynced] = useState(false);

  // přechod z výpadku zpět do connected → krátce „synchronizováno"
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = status;
    if (status === "connected" && prev !== "connected") {
      setShowSynced(true);
      const t = setTimeout(() => setShowSynced(false), 2000);
      return () => clearTimeout(t);
    }
  }, [status]);

  let tone: "ok" | "warn" | "error";
  let label: string | null;
  if (status === "connected") {
    tone = "ok";
    label = showSynced ? "synchronizováno" : null;
  } else if (status === "connecting") {
    tone = "warn";
    label = "synchronizuji";
  } else {
    tone = "error";
    label = "odpojeno";
  }

  return (
    <div
      className={`${styles.badge} ${styles[tone]} ${label ? styles.hasLabel : ""}`}
      role="status"
      aria-live="polite"
      title={
        status === "connected"
          ? "Spojení v pořádku"
          : status === "connecting"
            ? "Obnovuji spojení…"
            : "Spojení přerušeno"
      }
    >
      <span className={styles.dot} />
      {label && <span className={styles.text}>{label}</span>}
    </div>
  );
}
