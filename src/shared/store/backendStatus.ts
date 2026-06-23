import { atom } from 'jotai';

/**
 * Globální „backend je nedostupný" (deploy / restart / výpadek spojení).
 *
 * Nastavuje ho axios interceptor po několika po sobě jdoucích výpadcích
 * (`isBackendUnavailable`), čistí ho první úspěšná odpověď. `MaintenanceOverlay`
 * ho čte → ukáže údržbovou hlášku místo matoucího „svět nenalezen / 404", a sám
 * poll-uje `/health`, takže se po naběhnutí BE schová a obnoví data.
 */
export const backendUnavailableAtom = atom(false);
