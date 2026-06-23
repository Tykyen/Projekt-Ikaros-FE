import { useMemo, useState } from 'react';
import { ArrowLeft, X, Pencil } from 'lucide-react';
import { DiaryTab } from '@/features/world/pages/CharacterDetailPage/components/DiaryTab';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { COMBAT_PANELS } from '@/features/world/tactical-map/components/token-panel/combatPanels';
import type { MapToken } from '@/features/world/tactical-map/types';
import { useChatDiaryRoll, type RollAttribution } from './useChatDiaryRoll';
import s from './railShell.module.css';

interface Props {
  worldId: string;
  /** Aktivní konverzace — kam hod míří. `null` = žádná → onRoll no-op. */
  channelId: string | null;
  /** Slug postavy, jejíž deník se zobrazí (vlastní / hráče / NPC). */
  slug: string;
  /** Kdo „mluví" za hod (spec R1). */
  attribution: RollAttribution;
  /** Smí editovat deník (vlastník / PJ). */
  canEdit: boolean;
  /** Fallback titulek, než se z adresáře dotáhne jméno postavy. */
  title: string;
  /** PJ — zpět na panel Přítomní. */
  onBack?: () => void;
  /** Mobil — zavřít rail. */
  onClose?: () => void;
}

/**
 * 16.1 — deník postavy v railu světového chatu. **Stejný jako v taktické mapě:**
 * per-systém kompaktní bojový panel (`COMBAT_PANELS` → `MatrixCombatPanel` …),
 * který čte/zapisuje přímo deník přes `characterSlug` (sceneId nepoužit).
 * Systémy bez combat panelu (jad/drdh/drdplus/pi/sr/generic) → fallback
 * `DiaryTab` (plný list) — opět jako mapa.
 *
 * Vizuál „pro hru": identity hlavička (portrét 72px + jméno z adresáře, protože
 * `Character` sám imageUrl nedrží), pod ní panel; hod schopnosti → chat.
 */
export function DiaryRollPanel({
  worldId,
  channelId,
  slug,
  attribution,
  canEdit,
  title,
  onBack,
  onClose,
}: Props) {
  const { world } = useWorldContext();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [, setDirty] = useState(false);

  const directory = usePersonaDirectory(worldId);
  const entry = useMemo(
    () => (directory.data ?? []).find((e) => e.slug === slug),
    [directory.data, slug],
  );
  const name = entry?.title ?? title;
  const imageUrl = entry?.imageUrl;

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll(attribution);

  // Stejné rozhodnutí jako TokenSystemSheet na mapě: má systém kompaktní panel?
  const CombatPanel = world?.system ? COMBAT_PANELS[world.system] : undefined;

  // Panely čtou/zapisují deník přes `token.characterSlug` (sceneId nepoužit,
  // žádná token perzistence) → stačí mini-token jen se slugem.
  const miniToken = useMemo<MapToken>(
    () =>
      ({
        id: '',
        characterSlug: slug,
        characterId: '',
        isNpc: attribution.kind === 'npc',
        q: 0,
        r: 0,
        instanceName: name,
        currentHp: 0,
        maxHp: 0,
        baseHp: 0,
        armor: 0,
        baseArmor: 0,
        injury: 0,
        initiative: 0,
        initiativeBase: 0,
        inCombat: false,
        movement: 5,
        abilities: [],
        customData: {},
      }) as MapToken,
    [slug, name, attribution.kind],
  );

  // Edit toggle jen u fallback DiaryTab — combat panel edituje inline (auto-save).
  const showEditToggle = !CombatPanel && canEdit;

  return (
    <aside className={s.panel}>
      <div className={s.controls}>
        {!(mode === 'edit' && !CombatPanel) && onBack && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onBack}
            aria-label="Zpět na Přítomní"
            title="Zpět na Přítomní"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className={s.spacer} />
        {showEditToggle && mode === 'view' && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={() => setMode('edit')}
            aria-label="Upravit deník"
            title="Upravit deník"
          >
            <Pencil size={15} />
          </button>
        )}
        {!(mode === 'edit' && !CombatPanel) && onClose && (
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
          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className={s.avatarFallback}>
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className={s.name}>{name}</h2>
      </div>

      <div className={s.scroll}>
        {CombatPanel ? (
          <CombatPanel
            token={miniToken}
            sceneId=""
            worldId={worldId}
            canEdit={canEdit}
            onRoll={onRoll}
          />
        ) : (
          <DiaryTab
            slug={slug}
            mode={mode}
            onExitEdit={() => setMode('view')}
            onDirtyChange={setDirty}
            onRoll={onRoll}
          />
        )}
      </div>
    </aside>
  );
}
