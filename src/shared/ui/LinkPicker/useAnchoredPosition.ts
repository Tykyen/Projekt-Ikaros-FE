import { useLayoutEffect, useState, type RefObject } from 'react';

export interface AnchoredPos {
  left: number;
  top: number;
}

/**
 * 7.2n — Spočítá `position: fixed` souřadnice popoveru ukotveného k `anchorRef`.
 *
 * Popover se renderuje přes Portal do `body`, takže ho neořízne `overflow`
 * rodičovského panelu (řeší „zalézání" pickeru u dolního okraje sekce).
 *
 * - vodorovně: pravý okraj popoveru zarovná s pravým okrajem tlačítka, clampnuto
 *   do viewportu (8px margin);
 * - svisle: výchozí pod tlačítkem; pokud dole není dost místa a nahoře ho je víc
 *   → **flip nahoru**.
 *
 * Výšku/šířku čte z reálného `popoverRef` (po prvním layoutu — `useLayoutEffect`
 * běží před paintem, takže žádný blik). Přepočítává na scroll (capture, i uvnitř
 * scrollovaných panelů) a resize.
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  open: boolean,
): AnchoredPos | null {
  const [pos, setPos] = useState<AnchoredPos | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pozice při zavření (intencionální)
      setPos(null);
      return;
    }
    const gap = 4;
    const margin = 8;

    function compute() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const a = anchor.getBoundingClientRect();
      const pop = popoverRef.current;
      const w = pop?.offsetWidth ?? 280;
      const h = pop?.offsetHeight ?? 300;

      let left = a.right - w;
      left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));

      const spaceBelow = window.innerHeight - a.bottom;
      const spaceAbove = a.top;
      let top = a.bottom + gap;
      if (spaceBelow < h + gap && spaceAbove > spaceBelow) {
        top = a.top - h - gap; // flip nahoru
      }
      // 17.10 A3 — dolní clamp: popover nikdy nepřeteče spodní hranu viewportu
      // (na nízkém okně jinak zůstal jeho spodek/obsah mimo obrazovku).
      top = Math.min(top, window.innerHeight - h - margin);
      top = Math.max(margin, top);

      setPos({ left, top });
    }

    compute();
    window.addEventListener('scroll', compute, { capture: true, passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, anchorRef, popoverRef]);

  return pos;
}
