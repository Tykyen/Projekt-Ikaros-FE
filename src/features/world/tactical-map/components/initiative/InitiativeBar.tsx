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
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCombat } from '../../hooks/useCombat';
import { useTokenUpdate } from '../../hooks/useTokenUpdate';
import { isPcToken } from '../../utils/isPcToken';
import { effectivelyRevealed, isTokenHiddenByFog } from '../fog/fogUtils';
import { InitiativeBarItem } from './InitiativeBarItem';
import { InitiativeControls } from './InitiativeControls';
import type { MapScene, MapToken } from '../../types';
import { WorldHelpButton } from '@/features/world/help';
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
  /** 17.10 — nápověda k mapě (přesunuta sem vedle „Zahájit boj"). */
  onHelp?: () => void;
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
  onHelp,
}: Props): React.ReactElement | null {
  const combat = useCombat(scene, worldId);
  const tokenUpdate = useTokenUpdate(scene.id, worldId);

  // 10.2h — fog gate: hráč nevidí v liště NPC/bestie schované mlhou (ani
  // bojující — jinak by lišta prozradila skrytého nepřítele). PC vždy, PJ vše.
  const revealedSet = useMemo(
    () => effectivelyRevealed(scene.revealedHexes ?? [], scene.tokens),
    [scene.revealedHexes, scene.tokens],
  );
  const isFogHidden = (token: MapToken): boolean =>
    isTokenHiddenByFog(token, {
      fogEnabled: scene.fogEnabled,
      isPJ: isPj,
      revealedSet,
    });

  // 10.2f — „mimo boj" sekce: PJ vidí všechny, hráč jen PC (spoluhráče).
  // 10.2h — + odfiltruj mlhou skryté.
  const visibleCombatants = combat.combatants.filter((t) => !isFogHidden(t));
  const visibleBench = (
    isPj ? combat.bench : combat.bench.filter(isPcToken)
  ).filter((t) => !isFogHidden(t));

  // 17.10 — sbalení bojové lišty (roleta) + vystavení její výšky jako
  // --map-inset-top, aby se pod ní ležící utility řádek (weatherSlot) posouval
  // nahoru/dolů podle sbalení. Cleanup → 0 (např. když lišta zmizí bez tokenů).
  const barRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ikr-map-initbar-collapsed') === '1';
    } catch {
      return false;
    }
  });
  const toggleCollapsed = (): void => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('ikr-map-initbar-collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      '--map-inset-top',
      `${barRef.current?.offsetHeight ?? 0}px`,
    );
    return () => root.style.setProperty('--map-inset-top', '0px');
  });

  // Empty = lišta skrytá (pro danou roli není co zobrazit).
  if (visibleCombatants.length === 0 && visibleBench.length === 0) return null;

  const canEditInit = (token: MapToken): boolean =>
    isPj || myCharacterSlugs.includes(token.characterSlug);

  if (collapsed) {
    return (
      <div
        ref={barRef}
        className={`${styles.bar} ${styles.collapsed}`}
        role="region"
        aria-label="Iniciativa"
      >
        <button
          type="button"
          className={styles.reopen}
          onClick={toggleCollapsed}
        >
          ⚔ Zobrazit bojovou lištu ▾
        </button>
      </div>
    );
  }

  return (
    <div
      ref={barRef}
      className={styles.bar}
      role="region"
      aria-label="Iniciativa"
    >
      {onHelp && (
        <WorldHelpButton label="Nápověda k mapě" onClick={onHelp} />
      )}
      {isPj && (
        <InitiativeControls
          isActive={combat.isActive}
          round={combat.round}
          hasCombatants={visibleCombatants.length > 0}
          isPending={combat.isPending}
          onStart={combat.start}
          onNextTurn={combat.nextTurn}
          onEnd={combat.end}
        />
      )}

      <div className={styles.strip}>
        {visibleCombatants.map((token, i) => (
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
        {visibleCombatants.length > 0 && visibleBench.length > 0 && (
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

      <button
        type="button"
        className={styles.collapseBtn}
        onClick={toggleCollapsed}
        title="Sbalit bojovou lištu"
        aria-label="Sbalit bojovou lištu"
      >
        ▲
      </button>
    </div>
  );
}
