import { useEffect, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { backendUnavailableAtom } from '@/shared/store/backendStatus';
import { Spinner } from '@/shared/ui/Spinner/Spinner';
import { Button } from '@/shared/ui/Button/Button';
import s from './MaintenanceOverlay.module.css';

const POLL_MS = 4000;

/**
 * Globální údržbový overlay (oprava: BE restart po deployi ukazoval „Tento svět
 * nenajdeme"). Když je `backendUnavailableAtom` true (axios detekoval výpadek),
 * překryje appku vlídnou hláškou a sám poll-uje `GET /health`. Jakmile BE
 * odpoví, interceptor (`markBackendUp`) atom shodí → overlay zmizí; navíc
 * invaliduje dotazy, takže stránky pod ním načtou čerstvá data bez reloadu.
 */
export function MaintenanceOverlay(): React.ReactElement | null {
  const down = useAtomValue(backendUnavailableAtom);
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);

  const probe = useCallback(async () => {
    setChecking(true);
    try {
      // Úspěch → response interceptor shodí atom (markBackendUp). Obnov data.
      await apiClient.get('/health');
      await queryClient.invalidateQueries();
    } catch {
      // Pořád dole — poll běží dál.
    } finally {
      setChecking(false);
    }
  }, [queryClient]);

  // Auto-poll, dokud je výpadek. Interval se uklidí, jakmile atom spadne.
  useEffect(() => {
    if (!down) return;
    const id = window.setInterval(() => void probe(), POLL_MS);
    return () => window.clearInterval(id);
  }, [down, probe]);

  if (!down) return null;

  return (
    <div className={s.overlay} role="alertdialog" aria-live="assertive" aria-label="Probíhá údržba">
      <div className={s.card}>
        <Spinner />
        <h2 className={s.title}>Probíhá údržba</h2>
        {/* Hlas Ishidy — replika 7 (Vypravěč 02 §2.1, moment 3c). */}
        <p className={s.text}>
          Za oponou se právě přestavuje scéna. Malý moment — stránka se sama
          obnoví, nemusíš nic dělat.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={checking}
          onClick={() => void probe()}
        >
          Zkusit hned
        </Button>
      </div>
    </div>
  );
}
