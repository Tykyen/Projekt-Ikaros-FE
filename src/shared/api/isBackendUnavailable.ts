import axios from 'axios';

/**
 * Rozliší „backend je dole / restartuje (údržba)" od skutečné aplikační chyby.
 *
 * `true` když:
 *  - axios chyba nemá `response` = server vůbec neodpověděl (ECONNREFUSED /
 *    ERR_NETWORK / timeout) — typicky restart BE po deployi, nebo
 *  - reverzní proxy hlásí nedostupný upstream (502 / 503 / 504).
 *
 * `500` (server odpověděl, ale spadl) je `false` — to je reálná chyba appky
 * („Něco se rozbilo"), ne údržba. Tím se 404 / 403 / 500 nepletou s výpadkem.
 */
export function isBackendUnavailable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return [502, 503, 504].includes(error.response.status);
}
