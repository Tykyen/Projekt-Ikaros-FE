/**
 * 16.1e (D2) — combat roster jako VERTIKÁLNÍ panel v pravém railu (vedle/místo
 * Přítomní). Nahrazuje vodorovnou lištu nad konverzací (ta ukrajovala výšku
 * textu — chat je úzký vertikální tok). Hlavička = ovládání boje (Začít / Další
 * tah / Konec + kolo) + „+ přidat". Klik na řádek → detail v témže railu.
 */
import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { resolveHp, hpTierCss } from '@/features/world/tactical-map/utils/hpTier';
import { getInitials } from '@/features/world/tactical-map/utils/getInitials';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { InitiativeInput } from '@/features/world/tactical-map/components/initiative/InitiativeInput';
import type { ChatCombatant, ChatCombatConfig } from '../../lib/types';
import {
  useChannelCombatants,
  useChatCombat,
  useCombatantMutation,
  useCombatConfig,
  useChannelCombatSync,
  combatantLabel,
} from '../../api/useChannelCombat';
import s from './CombatRosterPanel.module.css';

interface Props {
  worldId: string;
  channelId: string;
  isManager: boolean;
  onOpenInfo: (combatantId: string) => void;
  onAdd: () => void;
}

const RING_DEFAULT = 'var(--map-token-ring-default)';

function visibilityAllows(c: ChatCombatant, cfg: ChatCombatConfig): boolean {
  if (c.kind === 'bestie') return cfg.showHpBestie;
  return c.isNpc ? cfg.showHpNpc : cfg.showHpPc;
}

function bestieHp(c: ChatCombatant, systemId: string | null) {
  if (c.kind !== 'bestie' || !systemId) return null;
  const schema = systemEntitySchemaRegistry.get(systemId, 'token');
  return resolveHp(schema, c.systemStats);
}

function CombatRow({
  c,
  order,
  isCurrent,
  muted,
  canEdit,
  systemId,
  config,
  image,
  onOpenInfo,
  onInit,
  onRemove,
}: {
  c: ChatCombatant;
  order: number;
  isCurrent: boolean;
  muted: boolean;
  canEdit: boolean;
  systemId: string | null;
  config: ChatCombatConfig;
  /** Portrét: bestie ze snapshotu, PC/NPC z adresáře (resolve v panelu). */
  image?: string;
  onOpenInfo: (id: string) => void;
  onInit: (id: string, v: number) => void;
  onRemove: (id: string) => void;
}) {
  const label = combatantLabel(c);
  const showHp = visibilityAllows(c, config);
  const hp = showHp ? bestieHp(c, systemId) : null;
  const ring = hp ? hpTierCss(hp.percent, hp.current) : RING_DEFAULT;

  return (
    <li
      className={`${s.row} ${isCurrent ? s.current : ''} ${muted ? s.muted : ''}`}
      role="button"
      tabIndex={0}
      title={`Detail ${label}`}
      onClick={() => onOpenInfo(c.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenInfo(c.id);
      }}
    >
      <span className={s.avatar} style={{ ['--ring' as string]: ring }}>
        {image ? (
          <img src={image} alt={label} />
        ) : (
          <span className={s.initials}>{getInitials(label)}</span>
        )}
        {!muted && <span className={s.order} style={{ background: ring }}>{order}</span>}
      </span>

      <span className={s.body}>
        <span className={s.name}>{label}</span>
        {hp && (
          <span className={s.hpRow}>
            <span className={s.hpBar} aria-hidden>
              <span
                className={s.hpFill}
                style={{ width: `${Math.round(hp.percent * 100)}%`, background: ring }}
              />
            </span>
            <span className={s.hpText}>
              {hp.current}/{hp.max}
            </span>
          </span>
        )}
      </span>

      <span className={s.init} onClick={(e) => e.stopPropagation()}>
        <InitiativeInput
          value={c.initiative ?? 0}
          disabled={!canEdit}
          aria-label={`Iniciativa ${label}`}
          onChange={(v) => onInit(c.id, v)}
        />
      </span>

      {canEdit && (
        <button
          type="button"
          className={s.rowRemove}
          title="Odebrat ze souboje"
          aria-label={`Odebrat ${label} ze souboje`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(c.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}

export function CombatRosterPanel({
  worldId,
  channelId,
  isManager,
  onOpenInfo,
  onAdd,
}: Props) {
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;
  useChannelCombatSync(worldId, channelId);
  const { data } = useChannelCombatants(worldId, channelId);
  const combat = useChatCombat(worldId, channelId, data);
  const mut = useCombatantMutation(worldId, channelId);
  const cfgMut = useCombatConfig(worldId, channelId);
  const config = data?.config ?? {
    showHpPc: true,
    showHpNpc: true,
    showHpBestie: true,
  };

  // Portrét PC/NPC = z adresáře (combatant nese jen slug, ne obrázek); bestie ze snapshotu.
  const personas = usePersonaDirectory(worldId);
  const imageBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of personas.data ?? []) if (e.imageUrl) m.set(e.slug, e.imageUrl);
    return m;
  }, [personas.data]);
  const resolveImage = (c: ChatCombatant): string | undefined =>
    c.kind === 'bestie' ? c.imageUrl : imageBySlug.get(c.characterSlug);

  const onInit = (id: string, v: number) =>
    mut.mutate({ op: 'update', combatantId: id, patch: { initiative: v } });
  const onRemove = (id: string) => mut.mutate({ op: 'remove', combatantId: id });

  const VIS: { key: 'showHpPc' | 'showHpNpc' | 'showHpBestie'; label: string }[] =
    [
      { key: 'showHpPc', label: 'PC' },
      { key: 'showHpNpc', label: 'NPC' },
      { key: 'showHpBestie', label: 'Bestie' },
    ];
  const noFighters = combat.combatants.length === 0;
  const hasAny = combat.combatants.length + combat.bench.length > 0;

  return (
    <aside className={s.panel}>
      <header className={s.head}>
        <div className={s.headTop}>
          <span className={s.title}>
            {combat.isActive ? `⚔️ Souboj · kolo ${combat.round}` : '⚔️ Souboj'}
          </span>
          {isManager && (
            <button type="button" className={`${s.btn} ${s.ghost}`} onClick={onAdd}>
              + přidat
            </button>
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
              <button
                type="button"
                className={`${s.btn} ${s.start}`}
                onClick={combat.start}
                disabled={noFighters || combat.isPending}
              >
                ⚔️ Začít boj
              </button>
            )}
          </div>
        )}
        {isManager && (
          <div className={s.visRow} title="Komu se ukazují životy na liště">
            <span className={s.visLabel}>👁 HP hráčům:</span>
            {VIS.map((v) => (
              <button
                key={v.key}
                type="button"
                className={`${s.chip} ${config[v.key] ? s.chipOn : ''}`}
                onClick={() => cfgMut.mutate({ [v.key]: !config[v.key] })}
                aria-pressed={config[v.key]}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <ul className={s.list}>
        {combat.combatants.map((c, i) => (
          <CombatRow
            key={c.id}
            c={c}
            order={i + 1}
            isCurrent={c.id === combat.currentCombatantId}
            muted={false}
            canEdit={isManager}
            systemId={systemId}
            config={config}
            image={resolveImage(c)}
            onOpenInfo={onOpenInfo}
            onInit={onInit}
            onRemove={onRemove}
          />
        ))}

        {combat.bench.length > 0 && (
          <li className={s.divider} aria-hidden>
            mimo boj
          </li>
        )}
        {combat.bench.map((c) => (
          <CombatRow
            key={c.id}
            c={c}
            order={0}
            isCurrent={false}
            muted
            canEdit={isManager}
            systemId={systemId}
            config={config}
            image={resolveImage(c)}
            onOpenInfo={onOpenInfo}
            onInit={onInit}
            onRemove={onRemove}
          />
        ))}

        {!hasAny && (
          <li className={s.empty}>
            {isManager
              ? 'Zatím nikdo v boji — přidej bojovníky tlačítkem „+ přidat".'
              : 'Žádný souboj neběží.'}
          </li>
        )}
      </ul>
    </aside>
  );
}
