import { useEffect, useState, useRef, useCallback } from 'react';

interface Options {
  /** Debounce delay in ms. Default 3000. */
  debounceMs?: number;
}

interface Result {
  /** True pokud poslední změna ještě není v localStorage. */
  hasUnsavedLocal: boolean;
  /** HTML nalezené v localStorage při mountu (pokud se liší od initialValue).
   *  Caller by měl uživateli zobrazit „pokračovat s draftem?" dialog. */
  restoreCandidate: string | null;
  /** Vymaže lokální draft (po úspěšném BE save). */
  clearLocalDraft: () => void;
}

/**
 * 3.2b — auto-save TipTap obsahu do localStorage. Debounce 3 s. Při
 * `beforeunload` warning prompt pokud nesynchronizováno.
 *
 * Klíč konvence: `article-draft:{userId}:{articleId|new}`.
 */
export function useDraftAutoSave(
  key: string | undefined,
  value: string,
  options: Options = {},
): Result {
  const { debounceMs = 3000 } = options;
  const [hasUnsavedLocal, setHasUnsavedLocal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial value captured pro lazy init — bypass StrictMode dual-invocation issue.
  const initialValue = value;

  // Detekce existujícího draftu při mountu (lazy init — žádný useEffect cascade).
  const [restoreCandidate, setRestoreCandidate] = useState<string | null>(() => {
    if (!key || typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(key);
      if (saved && saved !== initialValue && saved.length > 0) {
        return saved;
      }
    } catch {
      // private mode / quota error → ignore
    }
    return null;
  });

  const initialValueRef = useRef(initialValue);

  // Debounced write na localStorage při změně value.
  useEffect(() => {
    if (!key) return;
    if (value === initialValueRef.current) {
      setHasUnsavedLocal(false);
      return;
    }
    setHasUnsavedLocal(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // quota error → ignore (draft je nice-to-have, ne kritická feature)
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, value, debounceMs]);

  // beforeunload — browser-native warning prompt (pouze pokud nesyncováno).
  useEffect(() => {
    if (!hasUnsavedLocal) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedLocal]);

  const clearLocalDraft = useCallback(() => {
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setHasUnsavedLocal(false);
    setRestoreCandidate(null);
  }, [key]);

  return { hasUnsavedLocal, restoreCandidate, clearLocalDraft };
}
