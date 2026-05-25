import { useEffect, useRef, useState, useCallback } from 'react';
import { INITIAL_PAGE_STATE, type PageEditorFormState } from './usePageEditorState';

interface Options {
  debounceMs?: number;
}

interface Result {
  hasUnsavedLocal: boolean;
  /** Plný form state nalezený v localStorage při mountu (pokud existuje). */
  restoreCandidate: PageEditorFormState | null;
  clearLocalDraft: () => void;
}

/**
 * 7.2l — Plný form draft auto-save do localStorage. Na rozdíl od
 * [useDraftAutoSave] (jen content), tady serializujeme celý PageEditorFormState
 * (sections, table, galleryImages, videos, menu, customData, accessRequirements,
 * imageUrl, bigImage, isWoodWide, order, type, title, content).
 *
 * Důvod: page form má ~15 polí, ztráta dat při refresh by byla bolestná.
 * Pattern stejný jako 3.2b `useDraftAutoSave`, jen serialize obal.
 *
 * Klíč: `page-draft:{userId}:{worldId}:{pageId|new}` (pageId = `new` v create mode).
 *
 * Beforeunload warning aktivní pokud `hasUnsavedLocal === true`.
 */
/**
 * Jednorázový cleanup zastaralých draftů. Mažeme klíče, které začínají
 * `page-draft:` ale nemají `:v<N>:` po prefixu (schema migrace bumpuje
 * verzi v `PageEditor.draftKey` — viz tam).
 */
// IIFE — jednorázový module-level side-effect při prvním importu. Nahrazuje
// dřívější `legacyCleanupDone` flag + per-hook-call check (React Compiler
// purity zakazuje module-level mutable state).
(function cleanupLegacyDrafts() {
  if (typeof window === 'undefined') return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('page-draft:') && !/^page-draft:v\d+:/.test(k)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // quota / private mode → ignore
  }
})();

export function useFormDraftAutoSave(
  key: string | undefined,
  state: PageEditorFormState,
  options: Options = {},
): Result {
  const { debounceMs = 3000 } = options;
  const [hasUnsavedLocal, setHasUnsavedLocal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(state);

  const [restoreCandidate, setRestoreCandidate] = useState<PageEditorFormState | null>(
    () => {
      if (!key || typeof window === 'undefined') return null;
      try {
        const saved = localStorage.getItem(key);
        if (!saved) return null;
        const parsed = JSON.parse(saved) as Partial<PageEditorFormState>;
        // Schema-tolerant merge: chybějící pole (starý draft před krokem 9.1
        // apod.) se doplní z INITIAL_PAGE_STATE. Bez tohohle crash v
        // RestoreDraftModal.buildSummary na `state.sections.length`.
        const merged: PageEditorFormState = {
          ...INITIAL_PAGE_STATE,
          ...parsed,
          table: { ...INITIAL_PAGE_STATE.table, ...(parsed.table ?? {}) },
        };
        if (deepEquals(merged, initialRef.current)) return null;
        return merged;
      } catch {
        return null;
      }
    },
  );

  // Debounced write na localStorage
  useEffect(() => {
    if (!key) return;
    if (deepEquals(state, initialRef.current)) {
      setHasUnsavedLocal(false);
      return;
    }
    setHasUnsavedLocal(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // quota / private mode → ignore
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, state, debounceMs]);

  // beforeunload warning
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

/**
 * Mělké JSON-equality (sufficient pro form state — všechny pole serializable).
 * Pro perf v debounce-write nepoužíváme strict deep equal lib.
 */
function deepEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
