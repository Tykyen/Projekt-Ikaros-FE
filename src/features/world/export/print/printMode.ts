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
 * Mechanismus (14.7b-fix): tiskne se **klon** cíle vložený přímo do `<body>`
 * jako `[data-print-root]`. `print.css` skryje ostatní děti `<body>` →
 * vytiskne se jen klon, a to v NORMÁLNÍM flow (obsah se láme přes stránky;
 * dřívější `position:absolute` ořezával dlouhý obsah na jednu stránku).
 *
 * - Zapne `printMode` → komponenty v ORIGINÁLU rozbalí skrytý obsah; po 2
 *   snímcích (re-render) se teprve klonuje rozbalený stav.
 * - Lazy obrázky se vynutí `eager` a počká se na jejich dekódování.
 * - `<canvas>` (grafy) se v klonu nahradí `<img>` snapshotem (`toDataURL`).
 * - Po `afterprint` se klon odstraní; fallback timeout pro jistotu.
 *
 * Dialog prohlížeče nabízí „Tisk" i „Uložit jako PDF" → jedna cesta.
 */
export function usePrint(): {
  triggerPrint: (target: HTMLElement | null) => void;
} {
  const setPrintMode = useSetAtom(printModeAtom);

  const triggerPrint = useCallback(
    (target: HTMLElement | null) => {
      document.documentElement.setAttribute(PRINTING_ATTR, '');
      setPrintMode(true);

      let printContainer: HTMLElement | null = null;
      let fallback = 0;
      const cleanup = () => {
        setPrintMode(false);
        document.documentElement.removeAttribute(PRINTING_ATTR);
        printContainer?.remove();
        printContainer = null;
        window.removeEventListener('afterprint', cleanup);
        window.clearTimeout(fallback);
      };
      window.addEventListener('afterprint', cleanup);
      fallback = window.setTimeout(cleanup, 120_000);

      // 2× rAF — počkat na re-render rozbaleného obsahu, pak připravit klon.
      requestAnimationFrame(() =>
        requestAnimationFrame(async () => {
          if (target) {
            // Lazy obrázky se v tisku jinak nenačtou (hero Lokace aj.) →
            // vynutit eager a počkat na dekódování.
            const imgs = Array.from(target.querySelectorAll('img'));
            for (const img of imgs) {
              if (img.loading === 'lazy') img.loading = 'eager';
            }
            await Promise.all(
              imgs.map((img) =>
                img.complete ? null : img.decode().catch(() => undefined),
              ),
            );

            // Klon cíle do samostatného kořene v <body> (normální flow).
            printContainer = document.createElement('div');
            printContainer.setAttribute(PRINT_ROOT_ATTR, '');
            const clone = target.cloneNode(true) as HTMLElement;

            // Canvas (pavučina/hvězdná) klon nezachytí jako bitmapu →
            // nahradit <img> snapshotem z originálu (WebGL prázdný → necháme).
            const srcCanvases = Array.from(target.querySelectorAll('canvas'));
            const cloneCanvases = Array.from(clone.querySelectorAll('canvas'));
            srcCanvases.forEach((srcCanvas, i) => {
              try {
                const url = srcCanvas.toDataURL('image/png');
                if (!url || url === 'data:,') return;
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%';
                cloneCanvases[i]?.replaceWith(img);
              } catch {
                /* tainted canvas (cross-origin bez CORS) — necháme být */
              }
            });

            printContainer.appendChild(clone);
            document.body.appendChild(printContainer);
          }
          window.print();
        }),
      );
    },
    [setPrintMode],
  );

  return { triggerPrint };
}
