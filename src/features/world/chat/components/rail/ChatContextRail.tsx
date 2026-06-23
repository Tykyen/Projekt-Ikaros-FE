import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { User } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import type { Bestie } from '@/features/world/bestiar/types';
import type { ChatChannel, ChannelPresenceUser } from '../../lib/types';
import { ChannelMemberPanel, type RosterEntry } from '../ChannelMemberPanel';
import { DiaryRollPanel } from './DiaryRollPanel';
import { BestieRollPanel } from './BestieRollPanel';
import { RailEntitySearch, type RailSearchResult } from './RailEntitySearch';
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
}: Props) {
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;
  const members = useWorldMembers(worldId);
  const [selected, setSelected] = useState<Selected | null>(null);

  const my = members.data?.find((m) => m.userId === currentUser.id);
  const mySlug = !isManager ? slugOf(my?.characterPath) : undefined;
  // „Wide" = rail ukazuje deník/statblok (ne presence roster) → širší sloupec.
  const wide = isManager ? selected !== null : Boolean(mySlug);
  useEffect(() => {
    onWideChange?.(wide);
  }, [wide, onWideChange]);

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
  const handleSearchSelect = (r: RailSearchResult) => {
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

  return (
    <ChannelMemberPanel
      worldId={worldId}
      channel={channel}
      presence={presence}
      onClose={onClose}
      topSlot={
        <RailEntitySearch
          worldId={worldId}
          systemId={systemId}
          onSelect={handleSearchSelect}
        />
      }
      onSelectMember={(e: RosterEntry) => {
        const slug = slugOf(e.characterPath);
        if (!slug) return;
        setSelected({
          kind: 'diary',
          slug,
          title: e.username,
          attribution: { kind: 'pj', rollerName: 'PJ' },
        });
      }}
    />
  );
}
