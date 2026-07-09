import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';

/**
 * 20C §C1 (spec-20C) — GDPR data-export (čl. 15) na FE. Konzumuje existující
 * `GET /data-export/me` (account-centric JSON, rozsah řeší BE) a stáhne ho jako
 * soubor `ikaros-data-<YYYY-MM-DD>.json` v prohlížeči.
 *
 * BE payload bereme jako neprůhledný JSON (FE ho neinterpretuje, jen serializuje
 * a nabídne ke stažení), proto `unknown` — žádný FE mirror BE tvaru.
 */
function downloadJson(payload: unknown): void {
  // Datum z runtime prohlížeče (lokální den uživatele) — pro název souboru OK.
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ikaros-data-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Uvolni object URL, ať blob nezůstane viset v paměti.
  URL.revokeObjectURL(url);
}

export function useDataExport() {
  return useMutation({
    mutationFn: () => api.get<unknown>('/data-export/me'),
    onSuccess: (payload) => {
      downloadJson(payload);
      toast.success('Tvoje data byla stažena (JSON).');
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}
