/**
 * 8.7c — Sdílený helper pro čtení/zápis customData v sheetech.
 *
 * Každý systém má vlastní prefix (`coc_`, `dnd_`, `drd2_`, …). Helper
 * tento prefix automaticky aplikuje při čtení i zápisu, takže komponenta
 * pracuje jen s „logickými" klíči (`name`, `hp_cur`, …).
 *
 * Mode 'view': `onChange` je undefined → setters no-op (komponenta jen
 * čte). Mode 'edit': setters volají `onChange({customData})`.
 */
import type { SystemSheetProps } from '../types';

export interface CdAccess {
  /** Surová customData mapa (read-only). */
  readonly cd: Record<string, unknown>;
  /** Čte string hodnotu pod prefixovaným klíčem. */
  g: (key: string, fallback?: string) => string;
  /** Čte boolean (akceptuje `true` i string `'true'`). */
  bool: (key: string) => boolean;
  /** Zapíše hodnotu (no-op ve view mode). */
  set: (key: string, value: unknown) => void;
  /** Parsuje JSON pole (akceptuje array nebo JSON string). */
  parseJsonArr: <T = Record<string, string>>(key: string) => T[];
  /** Update jednoho řádku JSON pole (shallow merge). */
  updateArr: <T extends object>(
    arrKey: string,
    index: number,
    patch: Partial<T>,
  ) => void;
  /** Přidá nový řádek JSON pole. */
  addArr: <T>(arrKey: string, template: T) => void;
  /** Smaže řádek JSON pole. */
  removeArr: (arrKey: string, index: number) => void;
}

export function makeCdAccess(
  cd: Record<string, unknown>,
  prefix: string,
  onChange: SystemSheetProps['onChange'],
): CdAccess {
  const fullKey = (key: string) => `${prefix}${key}`;

  const g = (key: string, fallback = ''): string => {
    const val = cd[fullKey(key)];
    if (val === undefined || val === null) return fallback;
    return String(val);
  };

  const bool = (key: string): boolean => {
    const val = cd[fullKey(key)];
    return val === true || val === 'true';
  };

  const set = (key: string, value: unknown) => {
    if (!onChange) return;
    // 2026-05-24 (D-040-followup) — delta merge: posíláme jen změněný key.
    // BE provede `$set: { 'customData.<key>': value }`, ostatní system_*
    // keys (např. po switchi presetu) zůstanou v DB nedotčené. Předtím:
    // `onChange({ customData: { ...cd, [k]: v } })` přepisoval celý objekt
    // a první edit po system switchi mazal data jiných presetů (data loss).
    onChange({ customDataPatch: { [fullKey(key)]: value } });
  };

  const parseJsonArr = <T = Record<string, string>>(key: string): T[] => {
    const val = cd[fullKey(key)];
    if (Array.isArray(val)) return val as T[];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val || '[]');
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const updateArr = <T extends object>(
    arrKey: string,
    index: number,
    patch: Partial<T>,
  ) => {
    const arr = parseJsonArr<T>(arrKey);
    const copy = [...arr];
    copy[index] = { ...(copy[index] ?? ({} as T)), ...patch };
    set(arrKey, JSON.stringify(copy));
  };

  const addArr = <T,>(arrKey: string, template: T) => {
    const arr = parseJsonArr<T>(arrKey);
    set(arrKey, JSON.stringify([...arr, template]));
  };

  const removeArr = (arrKey: string, index: number) => {
    const copy = [...parseJsonArr(arrKey)];
    copy.splice(index, 1);
    set(arrKey, JSON.stringify(copy));
  };

  return { cd, g, bool, set, parseJsonArr, updateArr, addArr, removeArr };
}
