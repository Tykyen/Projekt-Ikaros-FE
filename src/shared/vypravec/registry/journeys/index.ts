/**
 * Spec 26.7 — registr všech cest. Engine je pro všechny stejný;
 * přidání cesty = obsahová práce (05 §5).
 */
import { PJ_START, type Journey } from './pjStart';
import { HRAC_START } from './hracStart';
import { WB_START } from './wbStart';
import { TM_VYCVIK } from './tmVycvik';
import { HRAC_VE_SVETE } from './hracVeSvete';

export type { Journey, JourneyStep, DoneCondition, EventMatch } from './pjStart';

export const CESTY: Record<string, Journey> = {
  'pj-start': PJ_START,
  'hrac-start': HRAC_START,
  'wb-start': WB_START,
  'tm-vycvik': TM_VYCVIK,
  'hrac-ve-svete': HRAC_VE_SVETE,
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
  'tm-vycvik': {
    sKontextem:
      'Výcvik dokončen. Mapa je tvoje bojiště — velení předávám tobě.',
    bezKontextu:
      'Výcvik dokončen. Mapa je tvoje bojiště — velení předávám tobě.',
  },
  'hrac-ve-svete': {
    sKontextem:
      'Postava, slovo u stolu, mapa světa v hlavě. Teď už jen hrát — a to je na vás dvou s PJ.',
  },
};
