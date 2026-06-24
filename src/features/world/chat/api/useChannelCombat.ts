/**
 * 16.1e — data vrstva combat rosteru konverzace.
 *
 *  - `useChannelCombatants` — GET roster (server-filtrovaný dle role + R3).
 *  - `useCombatantMutation` — add/update/remove s optimistic apply + rollback
 *    (vzor `useTokenUpdate` z taktické mapy).
 *  - `useChatCombat` — derivace combatants/bench + akce start/turn/end (analog
 *    mapového `useCombat`; FE řídí pořadí + wrap → round+1).
 *  - `useChannelCombatSync` — WS `chat:combat:updated` → invalidate (reconnect-safe).
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';
import type {
  ChannelCombatRoster,
  ChatCombatant,
  ChatCombatState,
} from '../lib/types';

const base = (worldId: string) => `/worlds/${worldId}/chat`;

export const combatKey = (worldId: string, channelId: string | null) =>
  ['world-chat', worldId, 'combat', channelId ?? ''] as const;

const EMPTY_ROSTER: ChannelCombatRoster = {
  combatants: [],
  combat: { active: false, round: 0 },
  config: { showHpPc: true, showHpNpc: true, showHpBestie: true },
};

/** Zobrazované jméno bojovníka (bestie = snapshot name, postava = slug). */
export function combatantLabel(c: ChatCombatant): string {
  return c.kind === 'bestie' ? c.name : c.characterSlug;
}

/** Řazení dle iniciativy desc, tie-break jméno (cs) — parita s mapou. */
export function sortCombatants(list: ChatCombatant[]): ChatCombatant[] {
  return [...list].sort((a, b) => {
    const d = (b.initiative ?? 0) - (a.initiative ?? 0);
    if (d !== 0) return d;
    return combatantLabel(a).localeCompare(combatantLabel(b), 'cs');
  });
}

export function useChannelCombatants(
  worldId: string,
  channelId: string | null,
) {
  return useQuery({
    queryKey: combatKey(worldId, channelId),
    queryFn: () =>
      api.get<ChannelCombatRoster>(
        `${base(worldId)}/channels/${channelId}/combatants`,
      ),
    enabled: !!worldId && !!channelId,
  });
}

type AddPayload =
  | { kind: 'character'; characterSlug: string; isNpc?: boolean; initiative?: number; inCombat?: boolean }
  | {
      kind: 'bestie';
      bestieId: string;
      name: string;
      imageUrl?: string;
      systemStats?: Record<string, unknown>;
      abilities?: { name: string; description: string }[];
      notes?: string;
      initiative?: number;
      inCombat?: boolean;
    };

type CombatantOp =
  | { op: 'add'; data: AddPayload }
  | { op: 'update'; combatantId: string; patch: Record<string, unknown> }
  | { op: 'remove'; combatantId: string };

/**
 * Mutace nad rosterem. Optimistic apply (update/remove se projeví hned),
 * `add` čeká na server (potřebuje BE-generované `id`). Rollback při chybě;
 * WS `chat:combat:updated` dorovná ostatní klienty.
 */
export function useCombatantMutation(worldId: string, channelId: string) {
  const qc = useQueryClient();
  const key = combatKey(worldId, channelId);
  const url = `${base(worldId)}/channels/${channelId}/combatants`;
  return useMutation({
    mutationFn: (op: CombatantOp) => {
      if (op.op === 'add') return api.post<ChannelCombatRoster>(url, op.data);
      if (op.op === 'update')
        return api.patch<ChannelCombatRoster>(`${url}/${op.combatantId}`, op.patch);
      return api.delete<ChannelCombatRoster>(`${url}/${op.combatantId}`);
    },
    onMutate: (op) => {
      const prev = qc.getQueryData<ChannelCombatRoster>(key);
      if (prev && op.op === 'update') {
        qc.setQueryData<ChannelCombatRoster>(key, {
          ...prev,
          combatants: prev.combatants.map((c) =>
            c.id === op.combatantId ? ({ ...c, ...op.patch } as ChatCombatant) : c,
          ),
        });
      }
      if (prev && op.op === 'remove') {
        qc.setQueryData<ChannelCombatRoster>(key, {
          ...prev,
          combatants: prev.combatants.filter((c) => c.id !== op.combatantId),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

export interface UseChatCombatResult {
  /** Bojovníci `inCombat`, seřazení dle iniciativy (lišta nahoře). */
  combatants: ChatCombatant[];
  /** Mimo boj (bench), seřazení. */
  bench: ChatCombatant[];
  combat: ChatCombatState;
  isActive: boolean;
  round: number;
  currentCombatantId: string | null;
  start: () => void;
  nextTurn: () => void;
  jumpTo: (id: string) => void;
  end: () => void;
  isPending: boolean;
}

/**
 * Derivace + akce boje (analog mapového `useCombat`). Akce jdou přes
 * `PATCH .../combat`; FE počítá další tah z živého pořadí (wrap → round+1).
 */
export function useChatCombat(
  worldId: string,
  channelId: string,
  roster: ChannelCombatRoster | undefined,
): UseChatCombatResult {
  const qc = useQueryClient();
  const key = combatKey(worldId, channelId);
  const data = roster ?? EMPTY_ROSTER;

  const combatants = useMemo(
    () => sortCombatants(data.combatants.filter((c) => c.inCombat)),
    [data.combatants],
  );
  const bench = useMemo(
    () => sortCombatants(data.combatants.filter((c) => !c.inCombat)),
    [data.combatants],
  );

  const combat = data.combat;
  const currentCombatantId = combat.currentCombatantId ?? null;
  const round = combat.round ?? 0;

  const op = useMutation({
    mutationFn: (body: {
      op: 'start' | 'turn' | 'end';
      orderCombatantIds?: string[];
      combatantId?: string;
      round?: number;
    }) =>
      api.patch<ChannelCombatRoster>(
        `${base(worldId)}/channels/${channelId}/combat`,
        body,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });

  return {
    combatants,
    bench,
    combat,
    isActive: combat.active,
    round,
    currentCombatantId,
    start: () =>
      op.mutate({ op: 'start', orderCombatantIds: combatants.map((c) => c.id) }),
    nextTurn: () => {
      if (combatants.length === 0) return;
      const idx = combatants.findIndex((c) => c.id === currentCombatantId);
      const nextIdx = (idx + 1) % combatants.length;
      const wrap = idx >= 0 && nextIdx === 0;
      op.mutate({
        op: 'turn',
        combatantId: combatants[nextIdx].id,
        round: wrap ? round + 1 : round,
      });
    },
    jumpTo: (id) => op.mutate({ op: 'turn', combatantId: id, round }),
    end: () => op.mutate({ op: 'end' }),
    isPending: op.isPending,
  };
}

/** WS sync — `chat:combat:updated { channelId }` → invalidate; reconnect re-seed. */
export function useChannelCombatSync(
  worldId: string,
  channelId: string | null,
): void {
  const qc = useQueryClient();
  useSocketEvent<{ channelId: string }>('chat:combat:updated', (e) => {
    if (!channelId || e.channelId !== channelId) return;
    void qc.invalidateQueries({ queryKey: combatKey(worldId, channelId) });
  });
  useSocketReconnect(() => {
    if (!channelId) return;
    void qc.invalidateQueries({ queryKey: combatKey(worldId, channelId) });
  });
}
