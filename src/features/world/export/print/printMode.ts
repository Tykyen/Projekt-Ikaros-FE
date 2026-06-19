import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

/**
 * 14.7a — Globální příznak „probíhá tisk". Komponenty ho čtou přes
 * `usePrintMode()` a podle něj rozbalí skrytý obsah (collapsed sekce,
 * odemčené AKJ záložky), aby se vytiskl celý, ne jen vizuálně otevřená část.
 */
export const printModeAtom = atom(false);

/** Čte, zda právě probíhá příprava tisku. */
export function usePrintMode(): boolean {
  return useAtomValue(printModeAtom);
}

const PRINT_ROOT_ATTR = 'data-print-root';
const PRINTING_ATTR = 'data-printing';

/**
 * Spustí `window.print()` nad vybraným podstromem.
 *
 * - `target` = kontejner, který se má vytisknout. `print.css` přes
 *   `[data-print-root]` schová zbytek stránky a zobrazí jen jeho.
 * - Zapne `printMode` → komponenty rozbalí skrytý obsah; počká 2 snímky na
 *   re-render a teprve pak tiskne (jinak by se vytiskl ještě sbalený stav).
 * - Po zavření tiskového dialogu (`afterprint`) vrátí vše zpět. Fallback
 *   timeout pro prohlížeče, které `afterprint` nevystřelí.
 *
 * Pozn.: dialog prohlížeče nabízí „Tisk" i „Uložit jako PDF" → jedna cesta
 * pokryje vytisknout i stáhnout PDF (spec 14.7, pilíř A).
 */
export function usePrint(): { triggerPrint: (target: HTMLElement | null) => void } {
  const setPrintMode = useSetAtom(printModeAtom);

  const triggerPrint = useCallback(
    (target: HTMLElement | null) => {
      if (target) target.setAttribute(PRINT_ROOT_ATTR, '');
      document.documentElement.setAttribute(PRINTING_ATTR, '');
      setPrintMode(true);

      // Canvas (grafy: pavučina 2D, hvězdná WebGL) se přes window.print
      // nevykreslí → nahradíme ho statickým <img> snapshotem na dobu tisku.
      const snapshots: { img: HTMLImageElement; canvas: HTMLCanvasElement }[] = [];

      let fallback = 0;
      const cleanup = () => {
        setPrintMode(false);
        document.documentElement.removeAttribute(PRINTING_ATTR);
        if (target) target.removeAttribute(PRINT_ROOT_ATTR);
        snapshots.forEach(({ img, canvas }) => {
          img.remove();
          canvas.removeAttribute('data-print-hide-canvas');
        });
        window.removeEventListener('afterprint', cleanup);
        window.clearTimeout(fallback);
      };
      window.addEventListener('afterprint', cleanup);
      fallback = window.setTimeout(cleanup, 60_000);

      // 2× rAF — počkat na re-render rozbaleného obsahu, pak snapshot + tisk.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (target) {
            target.querySelectorAll('canvas').forEach((canvas) => {
              try {
                const url = canvas.toDataURL('image/png');
                // Prázdný buffer (WebGL bez preserveDrawingBuffer) → vynech.
                if (!url || url === 'data:,') return;
                const img = document.createElement('img');
                img.src = url;
                img.className = 'print-canvas-snapshot';
                img.style.maxWidth = '100%';
                canvas.setAttribute('data-print-hide-canvas', '');
                canvas.parentElement?.insertBefore(img, canvas.nextSibling);
                snapshots.push({ img, canvas });
              } catch {
                /* tainted canvas (cross-origin obrázek bez CORS) — necháme být */
              }
            });
          }
          window.print();
        }),
      );
    },
    [setPrintMode],
  );

  return { triggerPrint };
}
