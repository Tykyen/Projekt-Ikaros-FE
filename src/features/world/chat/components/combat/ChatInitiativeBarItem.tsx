/**
 * 16.1e — jeden bojovník v combat liště chatu. Vizuál = mapový
 * `InitiativeBarItem` (kruhový portrét + HP-tier ring + badge pořadí + „i"),
 * ale nad `ChatCombatant` (ne `MapToken`). HP-tier:
 *   - bestie → z instance `systemStats` (resolveHp);
 *   - PC/NPC → neutrální ring (HP žije v deníku, rosterem neprochází — detail
 *     se otevře v boku přes „i").
 */
import { resolveHp, hpTierCss } from '@/features/world/tactical-map/utils/hpTier';
import { getInitials } from '@/features/world/tactical-map/utils/getInitials';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { InitiativeInput } from '@/features/world/tactical-map/components/initiative/InitiativeInput';
import type { ChatCombatant, ChatCombatConfig } from '../../lib/types';
import { combatantLabel } from '../../api/useChannelCombat';
import s from './ChatInitiativeBar.module.css';

interface Props {
  combatant: ChatCombatant;
  /** 1-based pořadí pro badge; skryté když `muted`. */
  order: number;
  isCurrent: boolean;
  muted: boolean;
  canEdit: boolean;
  systemId: string | null;
  config: ChatCombatConfig;
  onOpenInfo: (id: string) => void;
  onChangeInitiative: (id: string, value: number) => void;
}

const KIND_DOT: Record<string, string> = {
  pc: 'var(--map-ui-success-solid)',
  npc: 'rgb(var(--map-ui-blue-bright-rgb))',
  bestie: 'var(--map-ui-danger-solid)',
};

function visibilityAllows(c: ChatCombatant, config: ChatCombatConfig): boolean {
  if (c.kind === 'bestie') return config.showHpBestie;
  return c.isNpc ? config.showHpNpc : config.showHpPc;
}

function ringColor(
  c: ChatCombatant,
  systemId: string | null,
  config: ChatCombatConfig,
): string {
  const fallback = 'var(--map-token-ring-default)';
  // PC/NPC: HP není v rosteru → neutrální ring. Bestie: tier z instance,
  // ale jen když to viditelnost dovolí (jinak neprozrazuj stav hráči).
  if (c.kind !== 'bestie' || !visibilityAllows(c, config)) return fallback;
  if (!systemId) return fallback;
  const schema = systemEntitySchemaRegistry.get(systemId, 'token');
  const hp = resolveHp(schema, c.systemStats);
  return hp ? hpTierCss(hp.percent, hp.current) : fallback;
}

function kindKey(c: ChatCombatant): 'pc' | 'npc' | 'bestie' {
  if (c.kind === 'bestie') return 'bestie';
  return c.isNpc ? 'npc' : 'pc';
}

export function ChatInitiativeBarItem({
  combatant,
  order,
  isCurrent,
  muted,
  canEdit,
  systemId,
  config,
  onOpenInfo,
  onChangeInitiative,
}: Props): React.ReactElement {
  const label = combatantLabel(combatant);
  const ring = ringColor(combatant, systemId, config);
  const image = combatant.kind === 'bestie' ? combatant.imageUrl : undefined;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className={`${s.item} ${isCurrent ? s.current : ''} ${muted ? s.muted : ''}`}
      role="button"
      tabIndex={0}
      title={label}
      onClick={() => onOpenInfo(combatant.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenInfo(combatant.id);
      }}
    >
      <div className={s.avatarWrap} style={{ ['--ring' as string]: ring }}>
        {image ? (
          <img className={s.avatar} src={image} alt={label} />
        ) : (
          <span className={s.initials}>{getInitials(label)}</span>
        )}
        <span
          className={s.kindDot}
          style={{ background: KIND_DOT[kindKey(combatant)] }}
        />
        {!muted && (
          <span className={s.badge} style={{ background: ring }}>
            {order}
          </span>
        )}
        <button
          type="button"
          className={s.infoBtn}
          onClick={(e) => {
            stop(e);
            onOpenInfo(combatant.id);
          }}
          onMouseDown={stop}
          aria-label={`Detail ${label}`}
        >
          i
        </button>
      </div>

      <div className={s.meta}>
        <span className={`${s.name} ${isCurrent ? s.nameCurrent : ''}`}>
          {label}
        </span>
        <InitiativeInput
          value={combatant.initiative ?? 0}
          disabled={!canEdit}
          aria-label={`Iniciativa ${label}`}
          onChange={(v) => onChangeInitiative(combatant.id, v)}
        />
      </div>
    </div>
  );
}
