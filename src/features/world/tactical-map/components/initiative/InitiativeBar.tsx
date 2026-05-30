/**
 * 10.2f — horní full-width iniciativní lišta.
 *
 * Orchestruje `useCombat` (pořadí tahů) + `useTokenUpdate` (editace iniciativy).
 * Empty (žádný bojovník a boj neaktivní) → nerenderuje nic.
 *
 * Vrstvení: overlay nad PIXI canvasem, mimo transform root (řeší parent CSS).
 *
 * Permission:
 *   - PJ (`isPj`): ovládání boje, editace iniciativy všem, skok na tah.
 *   - hráč: read-only; edituje iniciativu jen vlastního PC (slug match).
 *   - klik na položku = pan-to-token + select (oba); „i" = deník.
 *
 * Plán: docs/arch/phase-10/plan-10.2f.md (f-1/F).
 */
import { useCombat } from '../../hooks/useCombat';
import { useTokenUpdate } from '../../hooks/useTokenUpdate';
import { isPcToken } from '../../utils/isPcToken';
import { InitiativeBarItem } from './InitiativeBarItem';
import { InitiativeControls } from './InitiativeControls';
import type { MapScene, MapToken } from '../../types';
import styles from './InitiativeBar.module.css';

interface Props {
  scene: MapScene;
  worldId: string;
  systemId: string | null | undefined;
  isPj: boolean;
  /** Slugy postav přihlášeného hráče — povolí edit iniciativy vlastního PC. */
  myCharacterSlugs: string[];
  /** Klik na položku — parent vycentruje token + označí. */
  onItemClick: (token: MapToken) => void;
  onOpenInfo: (tokenId: string) => void;
  /** Resolvuje obrázek tokenu (bestie z bestiáře přes templateId). */
  resolveTokenImage?: (token: MapToken) => string | undefined;
}

export function InitiativeBar({
  scene,
  worldId,
  systemId,
  isPj,
  myCharacterSlugs,
  onItemClick,
  onOpenInfo,
  resolveTokenImage,
}: Props): React.ReactElement | null {
  const combat = useCombat(scene, worldId);
  const tokenUpdate = useTokenUpdate(scene.id, worldId);

  // 10.2f — „mimo boj" sekce: PJ vidí všechny, hráč jen PC (spoluhráče).
  const visibleBench = isPj ? combat.bench : combat.bench.filter(isPcToken);

  // Empty = lišta skrytá (pro danou roli není co zobrazit).
  if (combat.combatants.length === 0 && visibleBench.length === 0) return null;

  const canEditInit = (token: MapToken): boolean =>
    isPj || myCharacterSlugs.includes(token.characterSlug);

  return (
    <div className={styles.bar} role="region" aria-label="Iniciativa">
      {isPj && (
        <InitiativeControls
          isActive={combat.isActive}
          round={combat.round}
          hasCombatants={combat.combatants.length > 0}
          isPending={combat.isPending}
          onStart={combat.start}
          onNextTurn={combat.nextTurn}
          onEnd={combat.end}
        />
      )}

      <div className={styles.strip}>
        {combat.combatants.map((token, i) => (
          <InitiativeBarItem
            key={token.id}
            token={token}
            order={i + 1}
            isCurrent={token.id === combat.currentTokenId}
            canEditInit={canEditInit(token)}
            showJump={isPj && combat.isActive}
            imageUrl={resolveTokenImage?.(token)}
            systemId={systemId}
            onClick={() => onItemClick(token)}
            onOpenInfo={onOpenInfo}
            onJumpTo={combat.jumpTo}
            onChangeInitiative={(tokenId, value) =>
              tokenUpdate.mutate({ tokenId, patch: { initiative: value } })
            }
          />
        ))}

        {/* Oddělovač mezi „v boji" a „mimo boj" sekcí */}
        {combat.combatants.length > 0 && visibleBench.length > 0 && (
          <div className={styles.divider} aria-hidden="true">
            🕊
          </div>
        )}

        {/* „Mimo boj" — ztlumené (PC pro hráče, vše pro PJ) */}
        {visibleBench.map((token) => (
          <InitiativeBarItem
            key={token.id}
            token={token}
            order={0}
            isCurrent={false}
            canEditInit={canEditInit(token)}
            showJump={false}
            muted
            imageUrl={resolveTokenImage?.(token)}
            systemId={systemId}
            onClick={() => onItemClick(token)}
            onOpenInfo={onOpenInfo}
            onJumpTo={combat.jumpTo}
            onChangeInitiative={(tokenId, value) =>
              tokenUpdate.mutate({ tokenId, patch: { initiative: value } })
            }
          />
        ))}
      </div>
    </div>
  );
}
