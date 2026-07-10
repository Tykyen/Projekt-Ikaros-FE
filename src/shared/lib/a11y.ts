import type { KeyboardEvent } from 'react';

/**
 * Klávesová aktivace pro ne-nativní tlačítka — prvek `<span>`/`<div>` s
 * `role="button"`, `tabIndex={0}` a `onClick`. Spustí `run` na Enter/mezerník
 * a potlačí výchozí chování (scroll na mezerníku).
 *
 * Vzor:
 *   <span
 *     role="button"
 *     tabIndex={0}
 *     onClick={handleClick}
 *     onKeyDown={activateOnKey(handleClick)}
 *   />
 *
 * Splní jsx-a11y `click-events-have-key-events` + `no-static-element-interactions`
 * (element získá klávesovou obsluhu i interaktivní roli) bez změny tagu a stylu.
 */
export function activateOnKey(run: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      run();
    }
  };
}
