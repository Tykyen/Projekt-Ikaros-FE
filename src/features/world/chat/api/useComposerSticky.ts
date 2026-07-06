import { useEffect, useState } from 'react';

/**
 * Krok 6.2d + 6.2e — sticky stav composeru per konverzace.
 *
 * RP datum a NPC mód musí přežít:
 *   1. odeslání zprávy (PJ často píše víc replik za sebou ze stejného data /
 *      pod stejnou maskou),
 *   2. přepnutí konverzace (vrátit se zpět — datum zůstává),
 *   3. refresh stránky (browser reload — kontext „v jakém časovém okně jedeme"
 *      nesmí zmizet).
 *
 * Reset: jen explicitně klikem × OFF (NPC) / × na RP chipu / × na whisper chipu.
 *
 * `draft` (rozepsaná zpráva) sdílí storage, ale má JINOU reset sémantiku:
 * přežívá přepnutí konverzace i refresh (pokračovat v psaní), ale po odeslání
 * zprávy se vymaže (textarea je prázdná).
 *
 * Storage je per (worldId × channelId), per browser. Synchronizace mezi zařízeními
 * by vyžadovala BE persistenci (`User.chatPreferences.composerStickyByChannel`)
 * — out of scope, dluh.
 */

export interface ComposerStickyState {
  rpDate: string;
  npcActive: boolean;
  npcName: string;
  npcAvatarUrl: string;
  /** 6.2-followup — slug karty vybrané z adresáře (klikací jméno). '' = ad-hoc. */
  npcSlug: string;
  /** Rozepsaná (neodeslaná) zpráva. Reset po odeslání (viz JSDoc nahoře). */
  draft: string;
}

const EMPTY: ComposerStickyState = {
  rpDate: '',
  npcActive: false,
  npcName: '',
  npcAvatarUrl: '',
  npcSlug: '',
  draft: '',
};

const STORAGE_PREFIX = 'ikaros.chatComposer.';

function storageKey(worldId: string, channelId: string): string {
  return `${STORAGE_PREFIX}${worldId}.${channelId}`;
}

/**
 * FIX-3 — klíč je per (worldId × channelId), NE per uživatel → na sdíleném
 * zařízení by draft/NPC maska/RP datum přežily logout a viděl by je další
 * přihlášený. Volá se z `useAuth.ts` logout, vedle `qc.clear()` (vzor C-29).
 */
export function clearAllComposerSticky(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // localStorage nedostupné (private mode) — no-op.
  }
}

function read(worldId: string, channelId: string): ComposerStickyState {
  try {
    const raw = localStorage.getItem(storageKey(worldId, channelId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ComposerStickyState>;
    return {
      rpDate: typeof parsed.rpDate === 'string' ? parsed.rpDate : '',
      npcActive: parsed.npcActive === true,
      npcName: typeof parsed.npcName === 'string' ? parsed.npcName : '',
      npcAvatarUrl:
        typeof parsed.npcAvatarUrl === 'string' ? parsed.npcAvatarUrl : '',
      npcSlug: typeof parsed.npcSlug === 'string' ? parsed.npcSlug : '',
      draft: typeof parsed.draft === 'string' ? parsed.draft : '',
    };
  } catch {
    return EMPTY;
  }
}

export function useComposerSticky(worldId: string, channelId: string) {
  // Lazy init z localStorage (čte se jen jednou per mount).
  const [state, setState] = useState<ComposerStickyState>(() =>
    read(worldId, channelId),
  );

  // Při změně klíče (přepnutí konverzace) přečíst znovu. Vstup pak je
  // sticky z minulé návštěvy té konverzace, ne carry-over z předchozí.
  // R19 adjustment-during-render místo useEffect (klíč je primitivní string).
  const stickyKey = `${worldId}/${channelId}`;
  const [prevKey, setPrevKey] = useState(stickyKey);
  if (stickyKey !== prevKey) {
    setPrevKey(stickyKey);
    setState(read(worldId, channelId));
  }

  // Persist do localStorage při každé změně. Prázdný stav vyhodíme úplně
  // (úklid).
  useEffect(() => {
    const k = storageKey(worldId, channelId);
    try {
      const isEmpty =
        !state.rpDate &&
        !state.npcActive &&
        !state.npcName &&
        !state.npcAvatarUrl &&
        !state.npcSlug &&
        !state.draft;
      if (isEmpty) {
        localStorage.removeItem(k);
      } else {
        localStorage.setItem(k, JSON.stringify(state));
      }
    } catch {
      // localStorage může být disabled (private mode) — silně ignorujeme.
    }
  }, [state, worldId, channelId]);

  return [state, setState] as const;
}
