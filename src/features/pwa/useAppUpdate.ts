import { useEffect, useRef, useState } from 'react';

/** Interval kontroly nové verze na pozadí (ms). */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Otisk buildu = `src` vstupního module scriptu (`/assets/index-<hash>.js`)
 * z HTML `index.html`. Vite mění hash při JAKÉkoli změně kódu (mění se i
 * import-mapa ve vstupním chunku), takže změna = nový deploy. Čistá funkce
 * (test). Vrací první `<script type="module" src="/assets/…">`, na pořadí
 * atributů nezáleží.
 */
export function parseEntryScript(html: string): string | null {
  const tags = html.match(/<script\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (!/type="module"/i.test(tag)) continue;
    const src = tag.match(/src="(\/assets\/[^"]+)"/i);
    if (src) return src[1];
  }
  return null;
}

/** Otisk BĚŽÍCÍ verze — vstupní module script v aktuálním dokumentu. */
function runningEntryScript(): string | null {
  const el = document.querySelector('script[type="module"][src^="/assets/"]');
  return el?.getAttribute('src') ?? null;
}

/**
 * 15.1-followup — detekce nasazené nové verze u BĚŽÍCÍ appky (typicky
 * nainstalovaná PWA, která se jen probouzí z pozadí a sama se neaktualizuje;
 * `main.tsx` registruje SW bez update flow). Porovná otisk běžícího buildu
 * (DOM) s čerstvým `index.html` ze serveru; při rozdílu nabídne obnovení.
 *
 * Prompt (`reload` na klik), ne auto-reload → žádná ztráta rozepsaného textu
 * ani reload smyčka (po reloadu baseline == server → banner zmizí).
 */
export function useAppUpdate(): { updateReady: boolean; reload: () => void } {
  const [updateReady, setUpdateReady] = useState(false);
  const baseline = useRef<string | null>(null);

  useEffect(() => {
    baseline.current = runningEntryScript();
    // Dev bez /assets/ (Vite serví moduly jinak) → nemáme co porovnávat.
    if (!baseline.current) return;

    let cancelled = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/', { cache: 'no-store' });
        if (!res.ok) return;
        const server = parseEntryScript(await res.text());
        if (!cancelled && server && server !== baseline.current) {
          setUpdateReady(true);
        }
      } catch {
        // offline / transient — zkusí se při dalším ticku / probuzení
      }
    };

    const onVisible = () => void check();
    document.addEventListener('visibilitychange', onVisible);
    const id = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    void check(); // hned po startu — chytí i stav „appka naběhla už zastaralá"

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(id);
    };
  }, []);

  return { updateReady, reload: () => window.location.reload() };
}
