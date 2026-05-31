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
 * Storage je per (worldId × channelId), per browser. Synchronizace mezi zařízeními
 * by vyžadovala BE persistenci (`User.chatPreferences.composerStickyByChannel`)
 * — out of scope, dluh.
 */

export interface ComposerStickyState {
  rpDate: string;
  npcActive: boolean;
  npcName: string;
  npcAvatarUrl: string;
}

const EMPTY: ComposerStickyState = {
  rpDate: '',
  npcActive: false,
  npcName: '',
  npcAvatarUrl: '',
};

function storageKey(worldId: string, channelId: string): string {
  return `ikaros.chatComposer.${worldId}.${channelId}`;
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
        !state.npcAvatarUrl;
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
