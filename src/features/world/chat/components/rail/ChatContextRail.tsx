import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { User } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import type { Bestie } from '@/features/world/bestiar/types';
import { buildBestieToken } from '@/features/world/tactical-map/utils/buildSpawnToken';
import { getBestieAbilities } from '@/features/world/bestiar/lib/bestieAbilities';
import type { ChatChannel, ChannelPresenceUser } from '../../lib/types';
import { ChannelMemberPanel, type RosterEntry } from '../ChannelMemberPanel';
import { DiaryRollPanel } from './DiaryRollPanel';
import { BestieRollPanel } from './BestieRollPanel';
import { BestieInstancePanel } from './BestieInstancePanel';
import { RailEntitySearch, type RailSearchResult } from './RailEntitySearch';
import {
  useChannelCombatants,
  useCombatantMutation,
} from '../../api/useChannelCombat';
import type { RollAttribution } from './useChatDiaryRoll';
import s from './ChatContextRail.module.css';

interface Props {
  worldId: string;
  channel: ChatChannel;
  /** Aktivní konverzace — kam hod míří. */
  activeChannelId: string | null;
  /** PJ/PomocnyPJ vidí Přítomní + může načítat cizí deníky; hráč jen svůj. */
  isManager: boolean;
  currentUser: User;
  /** Živá presence (PJ-only; hráč ji nedostává). */
  presence: ChannelPresenceUser[];
  onClose?: () => void;
  /** Hlásí, že rail ukazuje deník/statblok (širší layout jako taktická mapa). */
  onWideChange?: (wide: boolean) => void;
  /** 16.1e — combatant otevřený z lišty přes „i" (má přednost před presence). */
  openCombatantId?: string | null;
  onClearCombatant?: () => void;
  /** 16.1e — „+ přidat do boje": rail vybírá entitu (člen/NPC/bestie). */
  combatAddMode?: boolean;
  onCombatAddDone?: () => void;
}

/** Co je v railu načtené (PJ): deník postavy/NPC, nebo statblok bestie. */
type Selected =
  | { kind: 'diary'; slug: string; title: string; attribution: RollAttribution }
  | { kind: 'bestie'; bestie: Bestie };

/** `characterPath` může být cesta i holý slug — vrať poslední segment. */
function slugOf(characterPath?: string): string | undefined {
  if (!characterPath) return undefined;
  return characterPath.split('/').pop() || undefined;
}

/**
 * 16.1a–c — kontextový pravý rail světového chatu.
 *   - Hráč: rovnou jeho deník (hody + editace do aktivní konverzace).
 *   - PJ: Přítomní + jedno pole hledání (NPC + bestie). Klik na člena / výběr
 *     NPC → deník (atribuce „PJ" / NPC); výběr bestie → statblok (atribuce
 *     bestie). ⟵ zpět na Přítomní.
 */
export function ChatContextRail({
  worldId,
  channel,
  activeChannelId,
  isManager,
  currentUser,
  presence,
  onClose,
  onWideChange,
  openCombatantId,
  onClearCombatant,
  combatAddMode = false,
  onCombatAddDone,
}: Props) {
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;
  const members = useWorldMembers(worldId);
  const [selected, setSelected] = useState<Selected | null>(null);

  const roster = useChannelCombatants(worldId, activeChannelId);
  const combatMut = useCombatantMutation(worldId, activeChannelId ?? '');
  const openCombatant =
    openCombatantId != null
      ? roster.data?.combatants.find((c) => c.id === openCombatantId)
      : undefined;

  const my = members.data?.find((m) => m.userId === currentUser.id);
  const mySlug = !isManager ? slugOf(my?.characterPath) : undefined;
  // „Wide" = rail ukazuje deník/statblok (ne presence roster) → širší sloupec.
  const wide = openCombatantId != null || (isManager ? selected !== null : Boolean(mySlug));
  useEffect(() => {
    onWideChange?.(wide);
  }, [wide, onWideChange]);

  // 16.1e — přidání vybrané entity do boje (combatAddMode).
  const addBestie = (bestie: Bestie) => {
    const token = buildBestieToken(bestie, 0, 0);
    const abilities = getBestieAbilities(bestie).map((a) => ({
      name: a.label,
      description: a.value,
    }));
    combatMut.mutate({
      op: 'add',
      data: {
        kind: 'bestie',
        bestieId: bestie.id,
        name: bestie.name,
        imageUrl: bestie.imageUrl,
        systemStats: token.systemStats,
        abilities,
        notes: bestie.notes ?? '',
      },
    });
    onCombatAddDone?.();
  };
  const addCharacter = (slug: string, isNpc: boolean) => {
    combatMut.mutate({
      op: 'add',
      data: { kind: 'character', characterSlug: slug, isNpc },
    });
    onCombatAddDone?.();
  };

  // ── 16.1e — combatant otevřený z lišty přes „i" (PJ i hráč) ──
  if (openCombatantId != null && activeChannelId) {
    if (openCombatant?.kind === 'bestie') {
      return (
        <BestieInstancePanel
          worldId={worldId}
          channelId={activeChannelId}
          systemId={systemId ?? ''}
          combatant={openCombatant}
          canEdit={isManager}
          onBack={onClearCombatant}
          onClose={onClose}
        />
      );
    }
    if (openCombatant?.kind === 'character') {
      const isOwn = mySlug === openCombatant.characterSlug;
      const attribution: RollAttribution = isOwn
        ? { kind: 'self', rollerName: my?.user?.username ?? 'Hráč' }
        : openCombatant.isNpc
          ? {
              kind: 'npc',
              rollerName: openCombatant.characterSlug,
              slug: openCombatant.characterSlug,
            }
          : { kind: 'pj', rollerName: 'PJ' };
      return (
        <DiaryRollPanel
          worldId={worldId}
          channelId={activeChannelId}
          slug={openCombatant.characterSlug}
          attribution={attribution}
          canEdit={isManager || isOwn}
          title={openCombatant.characterSlug}
          onBack={onClearCombatant}
          onClose={onClose}
        />
      );
    }
    // Roster se ještě nenačetl / combatant zmizel — drobný stav se „zpět".
    return (
      <aside className={s.empty}>
        <button
          type="button"
          className={s.emptyClose}
          onClick={onClearCombatant}
          aria-label="Zpět"
        >
          <X size={16} />
        </button>
        <p>Bojovník už není v rosteru.</p>
      </aside>
    );
  }

  // ── Hráč — vlastní deník ──
  if (!isManager) {
    if (!mySlug) {
      return (
        <aside className={s.empty}>
          {onClose && (
            <button
              type="button"
              className={s.emptyClose}
              onClick={onClose}
              aria-label="Zavřít"
            >
              <X size={16} />
            </button>
          )}
          <p>
            Nemáš ve světě přiřazenou postavu — deník se zobrazí, až ti
            vypravěč postavu přiřadí.
          </p>
        </aside>
      );
    }
    return (
      <DiaryRollPanel
        worldId={worldId}
        channelId={activeChannelId}
        slug={mySlug}
        attribution={{ kind: 'self', rollerName: my?.user?.username ?? 'Hráč' }}
        canEdit
        title="Můj deník"
        onClose={onClose}
      />
    );
  }

  // ── PJ — načtený statblok bestie ──
  if (selected?.kind === 'bestie') {
    return (
      <BestieRollPanel
        worldId={worldId}
        channelId={activeChannelId}
        systemId={systemId ?? ''}
        bestie={selected.bestie}
        onBack={() => setSelected(null)}
        onClose={onClose}
      />
    );
  }

  // ── PJ — načtený deník člena / NPC ──
  if (selected?.kind === 'diary') {
    return (
      <DiaryRollPanel
        worldId={worldId}
        channelId={activeChannelId}
        slug={selected.slug}
        attribution={selected.attribution}
        canEdit
        title={selected.title}
        onBack={() => setSelected(null)}
        onClose={onClose}
      />
    );
  }

  // ── PJ — Přítomní + jedno pole hledání (NPC + bestie) ──
  // V `combatAddMode` výběr = přidat do boje (ne otevřít deník).
  const handleSearchSelect = (r: RailSearchResult) => {
    if (combatAddMode) {
      if (r.kind === 'bestie') addBestie(r.bestie);
      else addCharacter(r.slug, true); // NPC ze searche
      return;
    }
    if (r.kind === 'bestie') {
      setSelected({ kind: 'bestie', bestie: r.bestie });
      return;
    }
    setSelected({
      kind: 'diary',
      slug: r.slug,
      title: r.title,
      attribution: {
        kind: 'npc',
        rollerName: r.title,
        avatarUrl: r.imageUrl,
        slug: r.slug,
      },
    });
  };

  const handleSelectMember = (e: RosterEntry) => {
    const slug = slugOf(e.characterPath);
    if (!slug) return;
    if (combatAddMode) {
      addCharacter(slug, false); // PC z Přítomných
      return;
    }
    setSelected({
      kind: 'diary',
      slug,
      title: e.username,
      attribution: { kind: 'pj', rollerName: 'PJ' },
    });
  };

  return (
    <ChannelMemberPanel
      worldId={worldId}
      channel={channel}
      presence={presence}
      onClose={onClose}
      topSlot={
        <>
          {combatAddMode && (
            <div className={s.addBanner}>
              <span>⚔️ Vyber, koho přidat do boje</span>
              <button type="button" onClick={onCombatAddDone}>
                Hotovo
              </button>
            </div>
          )}
          <RailEntitySearch
            worldId={worldId}
            systemId={systemId}
            onSelect={handleSearchSelect}
          />
        </>
      }
      onSelectMember={handleSelectMember}
    />
  );
}
