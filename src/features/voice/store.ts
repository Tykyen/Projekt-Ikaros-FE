import { atom } from 'jotai';

/**
 * 17.6 — aktivní hlasový hovor ve světě (world-voice). `null` = nikdo nevolá.
 *
 * Sdílí jednu session mezi tlačítkem ve světovém chatu, dockem na taktické mapě
 * a persistentním hostem ve `WorldLayout` (mimo `<Outlet/>`, takže hovor přežije
 * přechod mapa↔chat). Jitsi room je per svět (`ikaros-world-{worldId}`), takže
 * všichni ve stejném světě jsou v jednom hovoru bez ohledu na to, kde zrovna jsou.
 */
export const worldVoiceSessionAtom = atom<{ worldId: string } | null>(null);
