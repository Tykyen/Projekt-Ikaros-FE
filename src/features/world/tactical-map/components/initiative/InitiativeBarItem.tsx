/**
 * 10.2f — jeden bojovník v iniciativní liště.
 *
 * Port vzhledu ze starého Matrixu (MapToolbar `.mx-map-token-item`):
 *   - kruhový portrét s borderem = HP tier barva
 *   - badge pořadí (bottom-right, barva = HP tier)
 *   - jméno (truncate) + InitiativeInput
 *   - „na tahu" (isCurrent) = zlatý highlight
 *   - „i" = otevřít deník/info; PJ za boje má „⏱" skok na tah
 *
 * Klik na tělo = pan-to-token + select (řeší parent). Interaktivní prvky
 * (input, tlačítka) stopují propagaci, ať neselectují omylem.
 */
import { resolveHp, hpTierCss } from '../../utils/hpTier';
import { combatantName } from '../../utils/initiativeOrder';
import { getInitials } from '../../utils/getInitials';
import { systemEntitySchemaRegistry } from '../../schemas/registry';
import { InitiativeInput } from './InitiativeInput';
import type { MapToken } from '../../types';
import styles from './InitiativeBarItem.module.css';

interface Props {
  token: MapToken;
  /** Pořadí 1-based pro badge. Ignorováno když `muted`. */
  order: number;
  isCurrent: boolean;
  canEditInit: boolean;
  /** PJ za běžícího boje — zobrazí „⏱" skok na tah. */
  showJump: boolean;
  /** 10.2f — „mimo boj" token: ztlumený, bez čísla pořadí. */
  muted?: boolean;
  /** Resolvovaný obrázek (bestie dotažená z bestiáře přes templateId). */
  imageUrl?: string;
  systemId: string | null | undefined;
  onClick: (tokenId: string) => void;
  onOpenInfo: (tokenId: string) => void;
  onJumpTo: (tokenId: string) => void;
  onChangeInitiative: (tokenId: string, value: number) => void;
}

function tierBorder(token: MapToken, systemId: string | null | undefined): string {
  if (!systemId) return 'var(--map-token-ring-default, var(--map-token-ring-default))';
  const schema = systemEntitySchemaRegistry.get(systemId, 'token');
  const stats =
    token.systemStats ?? {
      'health.current': token.currentHp,
      'health.max': token.maxHp,
    };
  const hp = resolveHp(schema, stats);
  if (!hp) return 'var(--map-token-ring-default, var(--map-token-ring-default))';
  return hpTierCss(hp.percent, hp.current);
}

export function InitiativeBarItem({
  token,
  order,
  isCurrent,
  canEditInit,
  showJump,
  muted = false,
  imageUrl,
  systemId,
  onClick,
  onOpenInfo,
  onJumpTo,
  onChangeInitiative,
}: Props): React.ReactElement {
  const name = combatantName(token);
  const resolvedImage = imageUrl ?? token.characterData?.imageUrl;
  const borderColor = tierBorder(token, systemId);

  const stop = (e: React.SyntheticEvent): void => e.stopPropagation();

  return (
    <div
      className={`${styles.item} ${isCurrent ? styles.current : ''} ${muted ? styles.muted : ''}`}
      onClick={() => onClick(token.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(token.id);
      }}
      title={name}
    >
      <div className={styles.avatarWrap} style={{ borderColor }}>
        {resolvedImage ? (
          <img className={styles.avatar} src={resolvedImage} alt={name} />
        ) : (
          <span className={styles.initials}>{getInitials(name)}</span>
        )}
        {!muted && (
          <span className={styles.badge} style={{ background: borderColor }}>
            {order}
          </span>
        )}
        <button
          type="button"
          className={styles.infoBtn}
          onClick={(e) => {
            stop(e);
            onOpenInfo(token.id);
          }}
          onMouseDown={stop}
          aria-label={`Detail ${name}`}
        >
          i
        </button>
      </div>

      <div className={styles.meta}>
        <span className={styles.name}>{name}</span>
        <div className={styles.controls}>
          <InitiativeInput
            value={token.initiative ?? 0}
            disabled={!canEditInit}
            aria-label={`Iniciativa ${name}`}
            onChange={(v) => onChangeInitiative(token.id, v)}
          />
          {showJump && (
            <button
              type="button"
              className={styles.jumpBtn}
              onClick={(e) => {
                stop(e);
                onJumpTo(token.id);
              }}
              onMouseDown={stop}
              title="Nastavit na tah"
              aria-label={`Nastavit ${name} na tah`}
            >
              ⏱
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
