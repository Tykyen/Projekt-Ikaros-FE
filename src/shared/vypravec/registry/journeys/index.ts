/**
 * Spec 26.7 — registr všech cest. Engine je pro všechny stejný;
 * přidání cesty = obsahová práce (05 §5).
 */
import { PJ_START, type Journey } from './pjStart';
import { HRAC_START } from './hracStart';
import { WB_START } from './wbStart';

export type { Journey, JourneyStep, DoneCondition, EventMatch } from './pjStart';

export const CESTY: Record<string, Journey> = {
  'pj-start': PJ_START,
  'hrac-start': HRAC_START,
  'wb-start': WB_START,
};

/** Oslavy dokončení cest (bublina; 05 §6 — oslava jen z eventu, ne backfillu). */
export const OSLAVY_DOKONCENI: Record<string, { sKontextem: string; bezKontextu?: string }> = {
  'pj-start': {
    sKontextem:
      'Svět žije a první slovo padlo. Odsud už to je vaše hra — kdybys mě potřeboval, víš, kde mě najdeš.',
  },
  'hrac-start': {
    sKontextem:
      'Z tvé strany hotovo. Teď je řada na PJ — dám ti vědět, až se brána otevře.',
    bezKontextu:
      'První slovo padlo. Až si vybereš svět, víš, kde mě najdeš.',
  },
  'wb-start': {
    sKontextem: 'Ateliér stojí a svět už není jen tvůj. Dobrá práce.',
  },
};
