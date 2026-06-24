/**
 * 8.7a — Provider, který:
 *   1. Resolvuje `world.system` → `DiarySystemPreset` (přes `getDiaryPreset`).
 *   2. Lazy-loaduje CSS preset (dynamic import) — bundle nezatížen, dokud
 *      deník není otevřen v daném systému.
 *   3. Vloží `data-diary-system="<id>"` wrapper, na který se scopují styly.
 *
 * Hook `useDiarySystem` žije v `DiarySystemContext.ts` (kvůli fast-refresh).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { DiarySystemContext } from './DiarySystemContext';
import { getDiaryPreset } from './registry';
// 16.2c — skin token sady (7 stylů). Statický import: malý CSS, vždy
// potřeba jakmile je deník otevřen; tokeny řídí `data-diary-skin`.
import './styles/diary-skins.css';

interface Props {
  /** Hodnota `world.system`. Pokud undefined/neznámá → generic preset. */
  system: string | undefined | null;
  children: ReactNode;
  /**
   * Volitelný className na wrapper div. `data-diary-system` atribut se
   * přidává vždy nezávisle.
   */
  className?: string;
  /**
   * 16.2c — aktivní skin deníku (`data-diary-skin`). Když chybí, atribut se
   * nepřidá → matrix.css fallbackuje na sci-fi defaulty.
   */
  skin?: string;
}

export function DiarySystemProvider({
  system,
  children,
  className,
  skin,
}: Props) {
  const preset = getDiaryPreset(system);

  // `loadedFor` drží ID presetu, jehož styly už byly načteny. Derived
  // `stylesReady` zabraňuje synchronnímu setState v effectu (lint rule
  // `react-hooks/set-state-in-effect`).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const stylesReady = !preset.loadStyles || loadedFor === preset.id;

  useEffect(() => {
    if (!preset.loadStyles) return;
    let cancelled = false;
    preset
      .loadStyles()
      .catch((err) => {
        console.error(
          `[DiarySystemProvider] Failed to load styles for "${preset.id}":`,
          err,
        );
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(preset.id);
      });
    return () => {
      cancelled = true;
    };
  }, [preset]);

  return (
    <DiarySystemContext.Provider value={{ preset, stylesReady }}>
      <div
        data-diary-system={preset.id}
        data-diary-skin={skin || undefined}
        className={className}
      >
        {children}
      </div>
    </DiarySystemContext.Provider>
  );
}
