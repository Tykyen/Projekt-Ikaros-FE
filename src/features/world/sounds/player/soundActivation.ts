/**
 * 13.3 — Autoplay gate + per-user hlasitost.
 *
 * Prohlížeč blokuje přehrání zvuku bez interakce uživatele (autoplay policy).
 * `soundActivatedAtom` drží, zda už uživatel v této kartě klikl na „Aktivovat
 * zvuk" — od té chvíle smíme přehrávat automaticky. Volume/mute persistujeme
 * v localStorage napříč surfaces (mapa, chat, databáze).
 */
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/** Per-tab, NEpersistovaný — gesto platí jen pro aktuální načtení. */
export const soundActivatedAtom = atom(false);

/** Per-user, persistovaný v LS. */
export const soundVolumeAtom = atomWithStorage<number>('ikr-sound-volume', 60);
export const soundMutedAtom = atomWithStorage<boolean>('ikr-sound-muted', false);

export function useSoundActivation() {
  const [activated, setActivated] = useAtom(soundActivatedAtom);
  return {
    activated,
    activate: () => setActivated(true),
  };
}

export function useSoundVolume() {
  const [volume, setVolume] = useAtom(soundVolumeAtom);
  const [muted, setMuted] = useAtom(soundMutedAtom);
  /** Efektivní hlasitost 0–100 (0 když ztlumeno). */
  const effectiveVolume = muted ? 0 : volume;
  return { volume, setVolume, muted, setMuted, effectiveVolume };
}
