import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getSocket } from '@/features/chat/api/socket';
import {
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';

interface WorldDeletedPayload {
  worldId: string;
}

/**
 * W-9 — world-level real-time. `WorldsGateway` emituje `world:updated`,
 * `world:deleted`, `world:membership:changed` a `world:membership:removed`
 * do roomu `world:{id}`, ale dosud je **nikdo neposlouchal** → dashboard,
 * Members i Settings se po změně od jiného PJ neaktualizovaly živě a smazaný
 * svět nechal uživatele na mrtvé stránce.
 *
 * Mount v `WorldLayout` (obaluje VŠECHNY stránky světa) → je **jediným**
 * vlastníkem `world:{id}` roomu pro celý svět. Dílčí komponenty (WorldChatRoom,
 * emote admin) už room:join `world:` dělat nemusí — eventy jim dorazí odsud.
 * Po reconnectu se room re-joinne (jinak by celý svět „oslepl", viz W-7).
 */
export function useWorldSocket(worldId: string | null): void {
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();
    socket.emit('room:join', `world:${worldId}`);
    return () => {
      socket.emit('room:leave', `world:${worldId}`);
    };
  }, [worldId]);

  useSocketReconnect(() => {
    if (worldId) getSocket().emit('room:join', `world:${worldId}`);
  });

  // Svět upraven (jméno, nastavení, headline…) → refetch aktivní world query.
  useSocketEvent('world:updated', () => {
    void qc.invalidateQueries({ queryKey: ['worlds'] });
  });

  // C-04 — world news real-time (BE world:news:changed → world:{id}). Cizí PJ
  // přidá/upraví oznámení → dashboard widget se obnoví bez čekání na staleTime.
  useSocketEvent('world:news:changed', () => {
    if (worldId) {
      void qc.invalidateQueries({ queryKey: ['world-news', worldId] });
    }
  });

  // Členství se změnilo / bylo odebráno → refetch seznamu členů světa.
  const invalidateMembers = (): void => {
    if (worldId) {
      void qc.invalidateQueries({
        queryKey: ['worlds', worldId, 'members'],
      });
    }
  };
  useSocketEvent('world:membership:changed', invalidateMembers);
  useSocketEvent('world:membership:removed', invalidateMembers);

  // Svět smazán, zatímco v něm jsem → hláška + odchod (ne mrtvá stránka).
  useSocketEvent<WorldDeletedPayload>('world:deleted', (p) => {
    if (p?.worldId !== worldId) return;
    toast.warning('Tento svět byl právě smazán.');
    navigate('/ikaros/svety');
  });
}
