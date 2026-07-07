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

/**
 * 17.10 — hovor sbalený/rozbalený. Globální (ne lokální `useState`), aby ho
 * uměl nahodit i čip „Hovor" v liště „Zmenšené" na taktické mapě, který žije
 * v jiné komponentě než `WorldVoiceHost`.
 */
export const worldVoiceMinimizedAtom = atom(false);

/**
 * 17.10 — signál „taktická mapa je právě mountnutá". Zapíná ho `TacticalMapView`
 * (mount → true, unmount → false). Když je `true` a hovor je sbalený, plovoucí
 * pruh `WorldVoiceHost` se skryje a jeho místo převezme čip v liště „Zmenšené".
 * Mimo mapu (false) zůstane sbalený hovor jako malý plovoucí pruh (žádná lišta).
 */
export const worldVoiceDockedAtom = atom(false);
