/**
 * 17.9 — Streamer overlay (OBS režim).
 *
 * Klientský view-stav taktické mapy: skrýt UI chrome + přepnout pozadí na chroma
 * barvu / průhledné, aby šla mapa čistě zachytit v OBS. Vzor `printMode` (14.7a) —
 * globální jotai atom + hook, komponenty reagují.
 *
 * `active` je runtime (neukládá se — spouští se ad hoc). `bg` a `keep` se ukládají
 * do localStorage, aby streamer nemusel nastavovat při každém spuštění.
 *
 * Spec: docs/arch/phase-17/spec-17.9.md.
 */
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type StreamBg = 'green' | 'blue' | 'transparent';

export interface StreamKeep {
  /** Nechat viditelnou iniciativní lištu i ve stream režimu. */
  initiative: boolean;
  /** Nechat viditelný log hodů (deník hodů) i ve stream režimu. */
  diceLog: boolean;
}

/**
 * Chroma odstíny pro PIXI `renderer.background.color` (hex number).
 * Zelená/modrá = standardní OBS chroma-key barvy. `transparent` barva je
 * lhostejná (kreslí se s alpha 0), ponecháme černou.
 */
export const STREAM_CHROMA: Record<StreamBg, number> = {
  green: 0x00b140,
  blue: 0x0047bb,
  transparent: 0x000000,
};

/** Aktivní stream režim (runtime — NEukládá se). */
export const streamActiveAtom = atom(false);

/** Volba pozadí (persistováno). */
export const streamBgAtom = atomWithStorage<StreamBg>(
  'ikaros.map.streamBg',
  'green',
);

/** Co nechat viditelné i ve stream režimu (persistováno). */
export const streamKeepAtom = atomWithStorage<StreamKeep>('ikaros.map.streamKeep', {
  initiative: false,
  diceLog: false,
});

/** Čtení + settery stream režimu na jednom místě. */
export function useStreamMode(): {
  active: boolean;
  setActive: (v: boolean) => void;
  bg: StreamBg;
  setBg: (v: StreamBg) => void;
  keep: StreamKeep;
  setKeep: (v: StreamKeep) => void;
} {
  const [active, setActive] = useAtom(streamActiveAtom);
  const [bg, setBg] = useAtom(streamBgAtom);
  const [keep, setKeep] = useAtom(streamKeepAtom);
  return { active, setActive, bg, setBg, keep, setKeep };
}
