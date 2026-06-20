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

/** Minimální čitelné tiskové styly pro samostatné tiskové okno. */
const PRINT_DOC_CSS = `
  * { color: #000 !important; background: transparent !important;
      box-shadow: none !important; text-shadow: none !important; }
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.55;
    color: #000; background: #fff; margin: 0 auto; padding: 1.5rem; max-width: 820px; }
  img { max-width: 100% !important; height: auto !important; break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; line-height: 1.2; }
  ul, ol { padding-left: 1.4rem; }
  li { margin: 0.15rem 0; }
  a { color: #000; text-decoration: underline; }
  table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
  td, th { border: 1px solid #999; padding: 4px 8px; text-align: left; }
  hr { border: none; border-top: 1px solid #ccc; margin: 0.8rem 0; }
  .print-hide, [data-print-hide], button { display: none !important; }
  .print-month { break-after: page; }
  .print-month:last-child { break-after: auto; }
`;

/**
 * Spustí tisk vybraného podstromu.
 *
 * Mechanismus (14.7b-fix2): tiskne se v **samostatném okně** (`window.open`).
 * Obsah cíle se naklonuje (s rozbaleným stavem), canvas se nahradí snapshotem,
 * a vloží do nového dokumentu s vlastním tiskovým CSS. Čistý kontext bez
 * dědění theme/visibility z hlavní appky → spolehlivé (klon do <body> dědil
 * skrytí a tiskl prázdno).
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

            // Zkopírovat stylesheets appky (CSS moduly = layout/styling deníku),
            // pak PRINT_DOC_CSS jako override (černobílé, skrýt tlačítka).
            const appStyles = [
              ...document.querySelectorAll('link[rel="stylesheet"]'),
            ]
              .map(
                (l) =>
                  `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`,
              )
              .join('');
            const inlineStyles = [...document.querySelectorAll('style')]
              .map((s) => s.outerHTML)
              .join('');
            // data-theme/world-shell na body, ať platí theme-scoped CSS moduly.
            const shellAttrs = document
              .querySelector('[data-world-shell]')
              ?.getAttributeNames()
              .filter((n) => n.startsWith('data-'))
              .map(
                (n) =>
                  `${n}="${document.querySelector('[data-world-shell]')?.getAttribute(n) ?? ''}"`,
              )
              .join(' ');
            win.document.write(
              `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8">` +
                `<title>Tisk — Projekt Ikaros</title>${appStyles}${inlineStyles}` +
                `<style>${PRINT_DOC_CSS}</style></head>` +
                `<body ${shellAttrs ?? ''}>${clone.innerHTML}</body></html>`,
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
