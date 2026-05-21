import { useEffect } from 'react';

interface Options {
  /** Disabled, když user píše v inputu/textarea/contenteditable. Default true. */
  ignoreInInputs?: boolean;
  /** Vyžadovat modifikátor — Ctrl/Cmd. Default false. */
  ctrl?: boolean;
  /** Vyžadovat shift. Default false. */
  shift?: boolean;
}

/**
 * 7.1k — Sdílený hook pro single-key shortcuty. Pro Cmd+K se používá `ctrl: true`.
 *
 * Pravidla:
 *  • Pokud user píše v inputu/textarea/contenteditable → handler se nezavolá
 *  • Pokud `ctrl=true`, fire jen s Ctrl/Cmd modifikátorem
 *  • Pokud `shift=true`, fire jen s Shift modifikátorem
 *  • Bez modifier: fire jen pokud žádné modifikátory nejsou stisknuté
 */
export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: Options = {},
): void {
  const { ignoreInInputs = true, ctrl = false, shift = false } = options;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      const ctrlOk = ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftOk = shift ? e.shiftKey : !e.shiftKey;
      if (!ctrlOk || !shiftOk) return;

      if (ignoreInInputs) {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      handler(e);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [key, handler, ignoreInInputs, ctrl, shift]);
}

/**
 * Hook pro sekvenční shortcuty (např. `g s` = goto stránky). Druhá klávesa
 * musí přijít do 1.5 s od první, jinak se reset.
 */
export function useKeyboardSequence(
  sequence: [string, string],
  handler: () => void,
  options: { ignoreInInputs?: boolean } = {},
): void {
  const { ignoreInInputs = true } = options;

  useEffect(() => {
    let firstAt = 0;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (ignoreInInputs) {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const k = e.key.toLowerCase();
      const now = Date.now();
      if (k === sequence[0].toLowerCase()) {
        firstAt = now;
        return;
      }
      if (
        k === sequence[1].toLowerCase() &&
        firstAt > 0 &&
        now - firstAt < 1500
      ) {
        firstAt = 0;
        handler();
      } else {
        firstAt = 0;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence, handler, ignoreInInputs]);
}
