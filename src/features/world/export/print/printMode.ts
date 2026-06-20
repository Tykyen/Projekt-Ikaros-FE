import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import printDocCss from './printDoc.css?raw';

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

/**
 * Spustí tisk vybraného podstromu.
 *
 * Mechanismus: tiskne se v **samostatném okně** (`window.open`). Obsah cíle se
 * naklonuje (s rozbaleným stavem), canvas se nahradí snapshotem, a vloží do
 * nového dokumentu jen s čistým dokumentovým CSS (`printDoc.css`). CSS appky se
 * ZÁMĚRNĚ nepřebírá — to dřív táhlo SPA layout (prázdné listy) a hrubé resety
 * rozbíjely obrázky (chybový deník CH-007/008). Holý semantický klon na
 * element-level CSS tiskne spolehlivě.
 *
 * - Zapne `printMode` → komponenty v ORIGINÁLU rozbalí skrytý obsah; po 2
 *   snímcích (re-render) se teprve klonuje a otevírá okno.
 * - Lazy obrázky se odberou `loading` → v novém okně se načtou.
 * - Dialog prohlížeče nabízí „Tisk" i „Uložit jako PDF".
 */
export function usePrint(): {
  triggerPrint: (target: HTMLElement | null) => void;
} {
  const setPrintMode = useSetAtom(printModeAtom);

  const triggerPrint = useCallback(
    (target: HTMLElement | null) => {
      setPrintMode(true);

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          try {
            if (!target) return;

            const clone = target.cloneNode(true) as HTMLElement;
            // Tiskem skrývané prvky a interaktivní tlačítka pryč.
            clone
              .querySelectorAll('.print-hide, [data-print-hide]')
              .forEach((el) => el.remove());
            // Lazy obrázky → ať se v novém okně načtou.
            clone
              .querySelectorAll('img')
              .forEach((img) => img.removeAttribute('loading'));

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

            const win = window.open('', '_blank', 'width=900,height=1000');
            if (!win) return; // popup blokován

            // ZÁMĚRNĚ se NEkopíruje CSS appky. To dřív táhlo SPA layout
            // (height:100vh/overflow → prázdné listy, CH-007) a vynucovalo hrubé
            // resety, co rozbíjely obrázky (CH-008). Tiskne se holý semantický
            // klon jen na čistém dokumentovém CSS (printDoc.css).
            win.document.write(
              `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8">` +
                `<title>Tisk — Projekt Ikaros</title>` +
                `<style>${printDocCss}</style></head>` +
                `<body>${clone.innerHTML}</body></html>`,
            );
            win.document.close();

            // Počkat na načtení VŠECH obrázků v novém okně, teprve pak tisk
            // (jinak by se tisklo dřív, než se stáhnou → chybí obrázky).
            const doPrint = () => {
              const imgs = Array.from(win.document.images);
              void Promise.all(
                imgs.map((img) =>
                  img.complete
                    ? Promise.resolve()
                    : new Promise<void>((res) => {
                        img.onload = () => res();
                        img.onerror = () => res();
                      }),
                ),
              ).then(() => {
                win.focus();
                win.print();
              });
            };
            if (win.document.readyState === 'complete') {
              doPrint();
            } else {
              win.onload = doPrint;
            }
          } finally {
            setPrintMode(false);
          }
        }),
      );
    },
    [setPrintMode],
  );

  return { triggerPrint };
}
