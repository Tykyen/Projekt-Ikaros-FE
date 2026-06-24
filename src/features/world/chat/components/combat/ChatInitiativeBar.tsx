/**
 * 16.1e — combat lišta nad konverzací. Roster PC/NPC/bestie seřazený dle
 * iniciativy; „i" otevře bojovníka v pravém boku (rail). Stav boje (R6): PJ
 * „Začít boj" → kolo + „na tahu"; před tím jen roster. Vidí ji i hráč
 * (read-only, HP-tier dle R3). Vzor = mapový `InitiativeBar`.
 */
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useChannelCombatants,
  useChatCombat,
  useCombatantMutation,
  useChannelCombatSync,
} from '../../api/useChannelCombat';
import { ChatInitiativeBarItem } from './ChatInitiativeBarItem';
import s from './ChatInitiativeBar.module.css';

interface Props {
  worldId: string;
  channelId: string;
  /** PJ/PomocnyPJ — ovládá boj + edituje iniciativu. */
  isManager: boolean;
  /** Klik na „i" položky → otevře bojovníka v boku. */
  onOpenInfo: (combatantId: string) => void;
  /** „+ přidat" → spustí výběr (Přítomní / search bestie). */
  onAdd: () => void;
}

export function ChatInitiativeBar({
  worldId,
  channelId,
  isManager,
  onOpenInfo,
  onAdd,
}: Props): React.ReactElement | null {
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;
  useChannelCombatSync(worldId, channelId);
  const { data } = useChannelCombatants(worldId, channelId);
  const combat = useChatCombat(worldId, channelId, data);
  const mut = useCombatantMutation(worldId, channelId);
  const config = data?.config ?? {
    showHpPc: true,
    showHpNpc: true,
    showHpBestie: true,
  };

  const hasAny = combat.combatants.length + combat.bench.length > 0;
  // Hráč prázdnou lištu nevidí (žádný boj neběží); PJ ji má vždy (může přidávat).
  if (!hasAny && !isManager) return null;

  const onChangeInit = (id: string, value: number) =>
    mut.mutate({ op: 'update', combatantId: id, patch: { initiative: value } });

  const noFighters = combat.combatants.length === 0;

  return (
    <div className={s.bar}>
      {combat.isActive && (
        <div className={s.roundBox}>
          <span className={s.k}>Kolo</span>
          <span className={s.n}>{combat.round}</span>
        </div>
      )}

      <div className={s.strip}>
        {combat.combatants.map((c, i) => (
          <ChatInitiativeBarItem
            key={c.id}
            combatant={c}
            order={i + 1}
            isCurrent={c.id === combat.currentCombatantId}
            muted={false}
            canEdit={isManager}
            systemId={systemId}
            config={config}
            onOpenInfo={onOpenInfo}
            onChangeInitiative={onChangeInit}
          />
        ))}

        {combat.bench.length > 0 && (
          <div className={s.divider} aria-hidden>
            mimo&nbsp;boj
          </div>
        )}
        {combat.bench.map((c) => (
          <ChatInitiativeBarItem
            key={c.id}
            combatant={c}
            order={0}
            isCurrent={false}
            muted
            canEdit={isManager}
            systemId={systemId}
            config={config}
            onOpenInfo={onOpenInfo}
            onChangeInitiative={onChangeInit}
          />
        ))}

        {!hasAny && isManager && (
          <div className={s.empty}>
            Zatím nikdo v boji — přidej bojovníky tlačítkem vpravo.
          </div>
        )}
      </div>

      {isManager && (
        <div className={s.controls}>
          {combat.isActive ? (
            <>
              <button
                type="button"
                className={`${s.btn} ${s.next}`}
                onClick={combat.nextTurn}
                disabled={noFighters || combat.isPending}
              >
                Další tah ▸
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.end}`}
                onClick={combat.end}
                disabled={combat.isPending}
              >
                Konec
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${s.btn} ${s.ghost}`}
                onClick={onAdd}
              >
                + přidat
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.start}`}
                onClick={combat.start}
                disabled={noFighters || combat.isPending}
              >
                ⚔️ Začít boj
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
