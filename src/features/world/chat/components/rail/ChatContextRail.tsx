import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { User } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { buildBestieToken } from '@/features/world/tactical-map/utils/buildSpawnToken';
import { getBestieAbilities } from '@/features/world/bestiar/lib/bestieAbilities';
import type { Bestie } from '@/features/world/bestiar/types';
import type { ChatChannel, ChannelPresenceUser } from '../../lib/types';
import { ChannelMemberPanel, type RosterEntry } from '../ChannelMemberPanel';
import { CombatRosterPanel } from '../combat/CombatRosterPanel';
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
  /** Aktivní konverzace — kam hod míří + odkud roster boje. */
  activeChannelId: string | null;
  /** PJ/PomocnyPJ vidí Přítomní + může načítat cizí deníky; hráč jen svůj. */
  isManager: boolean;
  currentUser: User;
  /** Živá presence (PJ-only; hráč ji nedostává). */
  presence: ChannelPresenceUser[];
  onClose?: () => void;
  /** Hlásí, že rail ukazuje deník/statblok/combat (širší layout). */
  onWideChange?: (wide: boolean) => void;
}

/** Co je v railu načtené (PJ): deník postavy/NPC, nebo statblok bestie z katalogu. */
type Selected =
  | { kind: 'diary'; slug: string; title: string; attribution: RollAttribution }
  | { kind: 'bestie'; bestie: Bestie };

/** Záložka railu (16.1e D2): Přítomní/Deník vs. Souboj. */
type RailTab = 'main' | 'combat';

function slugOf(characterPath?: string): string | undefined {
  if (!characterPath) return undefined;
  return characterPath.split('/').pop() || undefined;
}

/**
 * 16.1a–e — kontextový pravý rail světového chatu.
 *   - Hráč: deník (default) + záložka „Souboj" (read-only roster, když běží).
 *   - PJ: Přítomní + hledání (NPC/bestie) + záložka „Souboj" (combat roster,
 *     ovládání boje, „+ přidat"). Klik na bojovníka → jeho deník/statblok
 *     v témže railu (⟵ zpět). Combat stav (16.1e D2) je lokální v railu.
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
}: Props) {
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;
  const members = useWorldMembers(worldId);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [tab, setTab] = useState<RailTab>('main');
  const [openCombatantId, setOpenCombatantId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);

  const roster = useChannelCombatants(worldId, activeChannelId);
  const combatMut = useCombatantMutation(worldId, activeChannelId ?? '');
  const openCombatant =
    openCombatantId != null
      ? roster.data?.combatants.find((c) => c.id === openCombatantId)
      : undefined;

  // Přepnutí konverzace → zahoď combat kontext (combatant.id z jiné neplatí).
  useEffect(() => {
    setOpenCombatantId(null);
    setAddMode(false);
    setSelected(null);
  }, [activeChannelId]);

  const my = members.data?.find((m) => m.userId === currentUser.id);
  const mySlug = !isManager ? slugOf(my?.characterPath) : undefined;

  const wide =
    openCombatantId != null ||
    tab === 'combat' ||
    (isManager ? selected !== null : Boolean(mySlug));
  useEffect(() => {
    onWideChange?.(wide);
  }, [wide, onWideChange]);

  // ── Přidání vybrané entity do boje (addMode) ──
  const addBestie = (bestie: Bestie) => {
    const token = buildBestieToken(bestie, 0, 0);
    combatMut.mutate({
      op: 'add',
      data: {
        kind: 'bestie',
        bestieId: bestie.id,
        name: bestie.name,
        imageUrl: bestie.imageUrl,
        systemStats: token.systemStats,
        abilities: getBestieAbilities(bestie).map((a) => ({
          name: a.label,
          description: a.value,
        })),
        notes: bestie.notes ?? '',
      },
    });
    setAddMode(false);
  };
  const addCharacter = (slug: string, isNpc: boolean) => {
    // Postava/NPC = unikátní v rosteru (1 postava = 1 bojovník); duplikovat
    // se smí jen bestie (kopie nestvůr). Když už je v boji, jen zavři výběr.
    const already = (roster.data?.combatants ?? []).some(
      (c) => c.kind === 'character' && c.characterSlug === slug,
    );
    if (already) {
      setAddMode(false);
      return;
    }
    combatMut.mutate({
      op: 'add',
      data: { kind: 'character', characterSlug: slug, isNpc },
    });
    setAddMode(false);
  };

  // ── Detail bojovníka otevřený z rosteru (PJ i hráč) ──
  if (openCombatantId != null && activeChannelId) {
    if (openCombatant?.kind === 'bestie') {
      return (
        <BestieInstancePanel
          worldId={worldId}
          channelId={activeChannelId}
          systemId={systemId ?? ''}
          combatant={openCombatant}
          canEdit={isManager}
          onBack={() => setOpenCombatantId(null)}
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
          onBack={() => setOpenCombatantId(null)}
          onClose={onClose}
        />
      );
    }
    return (
      <aside className={s.empty}>
        <button
          type="button"
          className={s.emptyClose}
          onClick={() => setOpenCombatantId(null)}
          aria-label="Zpět"
        >
          <X size={16} />
        </button>
        <p>Bojovník už není v rosteru.</p>
      </aside>
    );
  }

  // ── PJ — načtený statblok bestie z katalogu (hledání) ──
  if (isManager && selected?.kind === 'bestie') {
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
  // ── PJ — načtený deník člena / NPC (hledání) ──
  if (isManager && selected?.kind === 'diary') {
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

  // ── Záložky (Přítomní/Deník · Souboj) ──
  const tabs = (
    <div className={s.tabs} role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'main'}
        className={`${s.tab} ${tab === 'main' ? s.tabActive : ''}`}
        onClick={() => setTab('main')}
      >
        {isManager ? 'Přítomní' : 'Můj deník'}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'combat'}
        className={`${s.tab} ${tab === 'combat' ? s.tabActive : ''}`}
        onClick={() => setTab('combat')}
      >
        ⚔️ Souboj
      </button>
    </div>
  );

  // ── Záložka Souboj — vertikální roster v railu ──
  if (tab === 'combat' && activeChannelId) {
    return (
      <div className={s.tabWrap}>
        {tabs}
        <CombatRosterPanel
          worldId={worldId}
          channelId={activeChannelId}
          isManager={isManager}
          onOpenInfo={(id) => setOpenCombatantId(id)}
          onAdd={() => {
            setTab('main');
            setAddMode(true);
          }}
        />
      </div>
    );
  }

  // ── Hráč — vlastní deník (záložka „main") ──
  if (!isManager) {
    if (!mySlug) {
      return (
        <div className={s.tabWrap}>
          {tabs}
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
        </div>
      );
    }
    return (
      <div className={s.tabWrap}>
        {tabs}
        <DiaryRollPanel
          worldId={worldId}
          channelId={activeChannelId}
          slug={mySlug}
          attribution={{ kind: 'self', rollerName: my?.user?.username ?? 'Hráč' }}
          canEdit
          title="Můj deník"
          onClose={onClose}
        />
      </div>
    );
  }

  // ── PJ — Přítomní + hledání (NPC + bestie); v addMode = přidat do boje ──
  const handleSearchSelect = (r: RailSearchResult) => {
    if (addMode) {
      if (r.kind === 'bestie') addBestie(r.bestie);
      else addCharacter(r.slug, r.kind === 'npc'); // pc→PC (false), npc→NPC (true)
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
    if (addMode) {
      addCharacter(slug, false);
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
    <div className={s.tabWrap}>
      {tabs}
      <ChannelMemberPanel
        worldId={worldId}
        channel={channel}
        presence={presence}
        onClose={onClose}
        topSlot={
          <>
            {addMode && (
              <div className={s.addBanner}>
                <span>⚔️ Vyber, koho přidat do boje</span>
                <button type="button" onClick={() => setAddMode(false)}>
                  Hotovo
                </button>
              </div>
            )}
            <RailEntitySearch
              worldId={worldId}
              systemId={systemId}
              includePc={addMode}
              onSelect={handleSearchSelect}
            />
          </>
        }
        onSelectMember={handleSelectMember}
      />
    </div>
  );
}
