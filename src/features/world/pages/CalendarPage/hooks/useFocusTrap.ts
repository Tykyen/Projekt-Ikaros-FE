import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 9.4 — Custom focus trap pro modal/drawer.
 *
 * Pri `active=true`:
 *  - Uloží aktuálně focused element
 *  - Přesune focus na první focusable uvnitř `ref.current`
 *  - Tab cykluje fokus uvnitř, Shift+Tab opačně
 *  - Při unmount / `active=false` vrátí focus na původní element
 *
 * Žádná externí lib (focus-trap-react není v package.json).
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusables[0];
    if (first) first.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const all = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (all.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = all[0];
      const lastEl = all[all.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Vrátíme focus jen pokud původní element stále existuje v DOM.
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, ref]);
}
