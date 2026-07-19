import { useEffect, type RefObject } from 'react';

/**
 * 17.8 — sdílený focus trap pro modaly/drawery/overlaye. Extrahováno z `Modal`
 * (dřív jediné místo s trapem) → znovupoužito v mobilních draverech a
 * `NotificationCenter` (dřív jen Escape, bez trapu a focus-restore).
 *
 * Když `active`:
 *   1) uloží aktuálně zaměřený prvek (pro návrat po zavření),
 *   2) přesune fokus DOVNITŘ kontejneru (form field > první focusable > sám
 *      kontejner — proto ať má `tabIndex={-1}` jako fallback),
 *   3) uvězní Tab/Shift+Tab v cyklu focusable prvků kontejneru.
 * Při deaktivaci (nebo unmountu) vrátí fokus na uložený prvek.
 *
 * Escape ZÁMĚRNĚ neřeší — každý konzument má vlastní close (atom / state /
 * onClose prop). Hook je čistě o fokusu, ať je zodpovědnost jednoznačná.
 */
// `[contenteditable]` je tu záměrně: rich-text editory (TipTap) jsou fokusovatelné
// contentEditable divy, ne <input>/<textarea>. Bez nich by trap kolem overlaye s
// editorem „prosakoval" (Tab z editoru unikl mimo). `:not([contenteditable="false"])`
// vyřadí read-only editory (TipTap při readOnly nastavuje false).
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>({
  active,
  containerRef,
}: {
  active: boolean;
  containerRef: RefObject<T | null>;
}): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // 1) zapamatovat fokus pro návrat
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // 2) fokus dovnitř: form field (form-modaly chceme rovnou v poli) >
    //    první focusable > sám kontejner (fallback přes tabIndex=-1).
    const formField = container.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );
    const initialFocusables =
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (formField ?? initialFocusables[0] ?? container).focus();

    // 3) trap — Tab na konci skočí na začátek a naopak
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      // Návrat fokusu jen když prvek pořád existuje v DOM (mohl se odmountovat).
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef]);
}
