/**
 * 16.1e — bok bestie INSTANCE z combat rosteru konverzace (otevřený přes „i").
 * Na rozdíl od 16.1c `BestieRollPanel` (read-only katalog) je tahle perzistentní:
 * PJ edituje HP/staty/schopnosti/poznámky → autosave (debounce 500 ms, vzor
 * `MatrixBestiePanel`) do konverzace přes `useCombatantMutation`. Schopnost →
 * hod do chatu (atribuce = jméno+obrázek instance). „🗑" odebere z boje.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, X, Trash2 } from 'lucide-react';
import type { MapToken } from '@/features/world/tactical-map/types';
import {
  BestieStatblock,
  type AbilityDraft,
} from '@/features/world/tactical-map/components/tokens/BestieStatblock';
import { DiarySkinScope } from '@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope';
import { getDiaryPreset } from '@/features/world/pages/CharacterDetailPage/diary-systems/registry';
import type { ChatBestieCombatant } from '../../lib/types';
import { useCombatantMutation } from '../../api/useChannelCombat';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import { Drd16ChatBestiePanel } from './Drd16ChatBestiePanel';
import { MatrixChatBestiePanel } from './MatrixChatBestiePanel';
import { PiChatBestiePanel } from './PiChatBestiePanel';
import { DrdPlusChatBestiePanel } from './DrdPlusChatBestiePanel';
import { Drd2ChatBestiePanel } from './Drd2ChatBestiePanel';
import { DrdhChatBestiePanel } from './DrdhChatBestiePanel';
import { GurpsChatBestiePanel } from './GurpsChatBestiePanel';
import { JadChatBestiePanel } from './JadChatBestiePanel';
import { DndChatBestiePanel } from './DndChatBestiePanel';
import { FateChatBestiePanel } from './FateChatBestiePanel';
import { ShadowrunChatBestiePanel } from './ShadowrunChatBestiePanel';
import s from './railShell.module.css';

interface Props {
  worldId: string;
  channelId: string;
  systemId: string;
  combatant: ChatBestieCombatant;
  canEdit: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

const AUTOSAVE_MS = 500;

export function BestieInstancePanel({
  worldId,
  channelId,
  systemId,
  combatant,
  canEdit,
  onBack,
  onClose,
}: Props) {
  const mut = useCombatantMutation(worldId, channelId);
  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll({
    kind: 'bestie',
    rollerName: combatant.name,
    avatarUrl: combatant.imageUrl,
  });

  // BestieStatblock čte z `token` jen `templateId` (katalogový lore); zbytek
  // jde přes props → minimální pseudo-token stačí.
  const token = useMemo(
    () => ({ templateId: combatant.bestieId }) as unknown as MapToken,
    [combatant.bestieId],
  );

  // Lokální editovaný stav (seed z instance), re-seed při přepnutí na jinou.
  const [stats, setStats] = useState<Record<string, unknown>>(
    combatant.systemStats,
  );
  const [abilities, setAbilities] = useState<AbilityDraft[]>(() =>
    // Robustní coerce (jako BestiePanelView/getBestieAbilities): instance snapshot
    // bývá {name,description}, ale cross-system tvar má `name` undefined →
    // `label:undefined` by shodil BestieStatblock (`a.label.trim()`).
    combatant.abilities.map((a) => {
      const raw = a as {
        name?: string;
        description?: string;
        label?: string;
        value?: string;
      };
      return {
        label: raw.name ?? raw.label ?? '',
        value: raw.description ?? raw.value ?? '',
      };
    }),
  );
  const [notes, setNotes] = useState(combatant.notes);

  // Re-seed lokálního stavu při přepnutí bojovníka řeší `key={combatant.id}` v
  // ChatContextRail (remount) — žádný setState-in-effect (cascading renders).

  // Debounced autosave (vzor MatrixBestiePanel). `mut.mutate` je stabilní.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const schedule = (patch: {
    systemStats?: Record<string, unknown>;
    abilities?: { name: string; description: string }[];
    notes?: string;
  }) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => mut.mutate({ op: 'update', combatantId: combatant.id, patch }),
      AUTOSAVE_MS,
    );
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const onStatsChange = (next: Record<string, unknown>) => {
    setStats(next);
    schedule({ systemStats: next });
  };
  const onAbilitiesChange = (next: AbilityDraft[]) => {
    setAbilities(next);
    schedule({
      abilities: next.map((a) => ({ name: a.label, description: a.value })),
    });
  };
  const onNotesChange = (next: string) => {
    setNotes(next);
    schedule({ notes: next });
  };

  const remove = () => {
    if (!window.confirm(`Odebrat „${combatant.name}" z boje?`)) return;
    mut.mutate({ op: 'remove', combatantId: combatant.id });
    onBack?.();
  };

  return (
    // 16.2d-chat — „obalení": data-diary-system přímo na aside (NE wrapper —
    // display:contents wrapper by ztratil `.tabWrap > :last-child { flex:1 }` →
    // rozbitá šířka). railShell `.panel[data-diary-system='drdplus']` skinuje chrome.
    // Pure getDiaryPreset (bez hooku). Vnitřní drd16/matrix panely mají vlastní
    // DiarySkinScope (skin tokeny); drdplus panel je self-contained.
    <aside className={s.panel} data-diary-system={getDiaryPreset(systemId).id}>
      <div className={s.controls}>
        {onBack && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onBack}
            aria-label="Zpět"
            title="Zpět"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className={s.spacer} />
        {canEdit && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={remove}
            aria-label="Odebrat z boje"
            title="Odebrat z boje"
          >
            <Trash2 size={16} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={s.identity}>
        <div className={s.avatar}>
          {combatant.imageUrl ? (
            <img src={combatant.imageUrl} alt={combatant.name} />
          ) : (
            <div className={s.avatarFallback}>
              {combatant.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className={s.name}>{combatant.name}</h2>
      </div>

      <div className={s.scroll}>
        {systemId === 'drd16' ? (
          // 16.2b-chat — drd16 panel konzumuje skin tokeny z předka → vlastní scope.
          <DiarySkinScope worldId={worldId}>
            <Drd16ChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              notes={combatant.notes}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'matrix' ? (
          // 16.2b-chat — Matrix panel konzumuje --mx-* z předka → vlastní scope.
          <DiarySkinScope worldId={worldId}>
            <MatrixChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              systemId={systemId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              abilities={combatant.abilities}
              notes={combatant.notes}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'pi' ? (
          // Příběhy Impéria — pi bestie instance v boji (HP ±, edit, sci-fi HUD).
          <DiarySkinScope worldId={worldId}>
            <PiChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              systemId={systemId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              abilities={combatant.abilities}
              notes={combatant.notes}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'drdplus' ? (
          // 16.2d-chat — DrD+ pergamen panel (2k6+/d6, BČ→iniciativa). Self-contained
          // (`.root` má vlastní --dd-*) → bez scope; chrome skinuje data-diary-system.
          <DrdPlusChatBestiePanel
            worldId={worldId}
            channelId={channelId}
            rollerName={combatant.name}
            avatarUrl={combatant.imageUrl}
            systemStats={combatant.systemStats}
            abilities={combatant.abilities}
            notes={combatant.notes}
            canEdit={canEdit}
            onPatch={(patch) =>
              mut.mutate({ op: 'update', combatantId: combatant.id, patch })
            }
          />
        ) : systemId === 'drd2' ? (
          // 16.2f-chat — DrD II bestie konzumuje skin tokeny (--dd-*) z předka →
          // vlastní DiarySkinScope (data-diary-skin), aby chat = mapa i u bestie.
          <DiarySkinScope worldId={worldId}>
            <Drd2ChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'drdh' ? (
          // 16b-chat — Dračí Hlídka bestie konzumuje skin tokeny (--dd-*) z předka
          // → vlastní DiarySkinScope (data-diary-skin), aby chat = mapa i u bestie.
          <DiarySkinScope worldId={worldId}>
            <DrdhChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'jad' ? (
          <DiarySkinScope worldId={worldId}>
            <JadChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'dnd5e' ? (
          <DiarySkinScope worldId={worldId}>
            <DndChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'gurps' ? (
          // GURPS bestie instance v boji — cold-steel statblok, editovatelná (onPatch).
          <DiarySkinScope worldId={worldId}>
            <GurpsChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : systemId === 'fae' || systemId === 'fate' ? (
          // FATE bestie instance v boji — „Karty osudu", editovatelná (onPatch).
          <FateChatBestiePanel
            worldId={worldId}
            channelId={channelId}
            systemId={systemId}
            rollerName={combatant.name}
            avatarUrl={combatant.imageUrl}
            systemStats={combatant.systemStats}
            canEdit={canEdit}
            onPatch={(patch) =>
              mut.mutate({ op: 'update', combatantId: combatant.id, patch })
            }
          />
        ) : systemId === 'shadowrun' ? (
          // Shadowrun bestie instance v boji — jantarový statblok, editovatelná (onPatch).
          // DiarySkinScope → data-diary-skin + --mx-* pro per-skin signature ornament
          // (.sec) shodně s mapou (ShadowrunBestieBody.module.css).
          <DiarySkinScope worldId={worldId}>
            <ShadowrunChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={combatant.name}
              avatarUrl={combatant.imageUrl}
              systemStats={combatant.systemStats}
              canEdit={canEdit}
              onPatch={(patch) =>
                mut.mutate({ op: 'update', combatantId: combatant.id, patch })
              }
            />
          </DiarySkinScope>
        ) : (
          <BestieStatblock
            token={token}
            worldId={worldId}
            systemId={systemId}
            canEdit={canEdit}
            stats={stats}
            onStatsChange={onStatsChange}
            abilities={abilities}
            onAbilitiesChange={onAbilitiesChange}
            notes={notes}
            onNotesChange={onNotesChange}
            disabled={false}
            onRollAbility={(a) =>
              onRoll({
                label: a.label,
                modifier: parseInt(a.value, 10) || 0,
                kind: 'fate',
              })
            }
          />
        )}
      </div>
    </aside>
  );
}
