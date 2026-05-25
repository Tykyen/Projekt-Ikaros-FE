import axios from 'axios';
import { parseApiErrorCode } from '@/shared/api';
import s from './subdocs.module.css';

interface Props {
  error: unknown;
  resourceLabel: 'finance' | 'výbavu' | 'poznámky' | 'kalendář';
  onRetry: () => void;
}

/**
 * 8.1-FIR — Sdílený error state pro subdoc taby Finance/Výbava.
 * Rozlišuje:
 *  • 404 + `*_NOT_APPLICABLE` → postava typu, který subdoc nemá (NPC/Lokace).
 *    Statická hláška, žádné CTA (tab by se sem ani neměl dostat — viz
 *    PostavaLayout `isCharacterPC` guard; tady je to jen pojistka pro
 *    deep-link / convert mid-session).
 *  • 403 → bez práv (cizí postava). Hráč ví, že je to záměr.
 *  • Ostatní (5xx, síť) → retry tlačítko.
 */
export function SubdocErrorState({ error, resourceLabel, onRetry }: Props) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const code = parseApiErrorCode(error);

  if (
    status === 404 &&
    (code === 'FINANCE_NOT_APPLICABLE' || code === 'INVENTORY_NOT_APPLICABLE')
  ) {
    return <p className={s.empty}>Tato postava {resourceLabel} nemá.</p>;
  }

  if (status === 403) {
    return <p className={s.empty}>Soukromé — vidí jen PJ a vlastník.</p>;
  }

  return (
    <div className={s.errorBox}>
      <p>Načtení se nepodařilo.</p>
      <button
        type="button"
        onClick={onRetry}
        className={s.retryBtn}
      >
        Zkusit znovu
      </button>
    </div>
  );
}
