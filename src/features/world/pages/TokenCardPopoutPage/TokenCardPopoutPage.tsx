/**
 * 17.11 — karta tokenu v samostatném okně (pop-out, druhý monitor).
 *
 * Standalone route MIMO `WorldLayout` → bez horního menu i world kontextu.
 * Renderuje TÝŽ obsah jako karta na mapě:
 *  - postava/NPC (P1): per-systém combat panel jen ze `slug` (mini-token, bez scény)
 *  - bestie (P2): `TokenSystemSheet` z reálného tokenu ve fetchnuté scéně
 * Hody z okna se přes `BroadcastChannel` propíšou do 3D overlaye + logu mapy (P3).
 * Motiv světa + `WorldContext` + deníkový skin si okno sestaví samo z `worldSlug`.
 *
 * URL:
 *  - PC/NPC: `/svet/:worldSlug/karta-tokenu?slug=<slug>&npc=<0|1>&token=<mapTokenId>`
 *  - bestie: `/svet/:worldSlug/karta-tokenu?scene=<sceneId>&token=<tokenId>`
 */
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  WorldContext,
  type WorldContextValue,
} from '@/features/world/context/WorldContext';
import { useWorld } from '@/features/world/api/useWorlds';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { useResolvedSystemId } from '@/features/world/useResolvedSystemId';
import {
  COMBAT_PANELS,
  type CombatPanelProps,
} from '@/features/world/tactical-map/components/token-panel/combatPanels';
import { TokenSystemSheet } from '@/features/world/tactical-map/components/token-panel/TokenSystemSheet';
import { DiaryTab } from '@/features/world/pages/CharacterDetailPage/components/DiaryTab';
import { DiarySkinScope } from '@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope';
import { EmbedSubdocsBar } from '@/features/world/pages/CharacterDetailPage/components/embed/EmbedSubdocsBar';
import { performSheetRoll } from '@/features/world/tactical-map/utils/rollFromSheet';
import { getMapScene } from '@/features/world/tactical-map/api/mapApi';
import { mapRollChannelName } from '@/features/world/tactical-map/mapRollChannel';
import { applyTheme } from '@/themes/applyTheme';
import { resolveWorldTheme } from '@/themes/worldTheme';
import type { MapToken } from '@/features/world/tactical-map/types';
import type { MapRollRequest } from '@/features/world/tactical-map/hooks/useMapDiceRoll';
import s from './TokenCardPopoutPage.module.css';

/** BroadcastChannel do hlavního okna mapy (per-svět); null bez podpory/worldId. */
function useMapRollChannel(worldId: string): BroadcastChannel | null {
  const channel = useMemo(
    () =>
      worldId && typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(mapRollChannelName(worldId))
        : null,
    [worldId],
  );
  useEffect(() => () => channel?.close(), [channel]);
  return channel;
}

export default function TokenCardPopoutPage() {
  const { worldSlug = '' } = useParams();
  const [params] = useSearchParams();
  const slug = params.get('slug') ?? '';
  const isNpc = params.get('npc') === '1';
  const sceneId = params.get('scene') ?? '';
  const tokenId = params.get('token') ?? '';
  const isBestie = !!sceneId && !!tokenId && !slug;

  const { data: world, isLoading } = useWorld(worldSlug);
  const worldId = world?.id ?? '';
  const themeId = world ? resolveWorldTheme(world).themeId : undefined;

  // Motiv světa v novém okně (nemá WorldLayout, který ho normálně aplikuje).
  useEffect(() => {
    if (!world) return;
    const t = resolveWorldTheme(world);
    void applyTheme(t.themeId, {
      overrides: t.overrides,
      backgroundUrl: t.backgroundUrl,
    });
  }, [world]);

  useEffect(() => {
    document.title = 'Karta tokenu';
  }, []);

  const ctxValue = useMemo<WorldContextValue>(
    () => ({
      worldId,
      worldSlug,
      world: world ?? null,
      isPJ: false,
      userRole: null,
      character: null,
      loading: isLoading,
    }),
    [worldId, worldSlug, world, isLoading],
  );

  if (isLoading) return <div className={s.state}>Načítám kartu…</div>;
  if (!world || (!slug && !isBestie)) {
    return (
      <div className={s.state}>
        Kartu se nepodařilo otevřít — chybí svět nebo token.
      </div>
    );
  }

  return (
    <WorldContext.Provider value={ctxValue}>
      <div className={s.page} data-theme={themeId}>
        {isBestie ? (
          <BestieCardBody
            worldId={worldId}
            sceneId={sceneId}
            tokenId={tokenId}
          />
        ) : (
          <CharacterCardBody
            worldId={worldId}
            slug={slug}
            isNpc={isNpc}
            mapTokenId={tokenId}
          />
        )}
      </div>
    </WorldContext.Provider>
  );
}

/** P1/P3 — postava/NPC: combat panel jen ze slugu; hody → kanál. */
function CharacterCardBody({
  worldId,
  slug,
  isNpc,
  mapTokenId,
}: {
  worldId: string;
  slug: string;
  isNpc: boolean;
  mapTokenId: string;
}) {
  const directory = usePersonaDirectory(worldId);
  const entry = useMemo(
    () => (directory.data ?? []).find((e) => e.slug === slug),
    [directory.data, slug],
  );
  const name = entry?.title ?? slug;
  const imageUrl = entry?.imageUrl;
  const channel = useMapRollChannel(worldId);

  // Stejné rozhodnutí jako mapa/rail: má systém kompaktní combat panel?
  const CombatPanel = COMBAT_PANELS[useResolvedSystemId()];

  // Combat panely čtou deník jen přes characterSlug → mini-token stačí
  // (vzor `DiaryRollPanel`); id = map token (kvůli přiřazení hodu na mapě).
  const miniToken = useMemo<MapToken>(
    () =>
      ({
        id: mapTokenId,
        characterSlug: slug,
        characterId: '',
        isNpc,
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
    [slug, name, isNpc, mapTokenId],
  );

  // P3 — hod z okna: spočítej dicePayload lokálně (jako TokenSystemSheet) a
  // pošli hotový MapRollRequest do hlavního okna mapy (3D overlay + log).
  const onRoll: NonNullable<CombatPanelProps['onRoll']> = (req) => {
    const res = performSheetRoll({
      label: req.label,
      modifier: req.modifier,
      kind: req.kind,
      critOnD20: req.critOnD20,
      mixed: req.mixed,
      pool: req.pool,
      target: req.target,
      breakdown: req.breakdown,
      damage: req.damage,
      rollerName: name,
    });
    if (!res) return;
    const isInit = req.initiative ?? /iniciativ/i.test(req.label);
    const payload: MapRollRequest = {
      category: isInit ? 'initiative' : 'skill',
      dicePayload: res.dicePayload,
      tokenId: mapTokenId || undefined,
      rollerKind: isNpc ? 'npc' : 'pc',
      rollerName: name,
    };
    channel?.postMessage({ type: 'map-roll', payload });
  };

  // P1 — edit povolen; skutečná práva vynucuje BE (autosave deníku → 403 bez
  // oprávnění). Zpřesnění (skrýt edit dle role) → pozdější fáze.
  const canEdit = true;

  return (
    <>
      <CardBar name={name} imageUrl={imageUrl} channelReady={!!channel} />
      <div className={s.scroll}>
        <DiarySkinScope worldId={worldId}>
          {!isNpc && (
            <EmbedSubdocsBar worldId={worldId} slug={slug} canEdit={canEdit} />
          )}
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
              mode="view"
              onExitEdit={() => {}}
              onDirtyChange={() => {}}
              onRoll={onRoll}
            />
          )}
        </DiarySkinScope>
      </div>
    </>
  );
}

/** P2/P3 — bestie: reálný token ze scény → TokenSystemSheet; hody → kanál. */
function BestieCardBody({
  worldId,
  sceneId,
  tokenId,
}: {
  worldId: string;
  sceneId: string;
  tokenId: string;
}) {
  const { data: scene, isLoading } = useQuery({
    queryKey: ['map', 'scene', sceneId],
    queryFn: () => getMapScene(sceneId),
    enabled: !!sceneId,
  });
  const token = useMemo(
    () => scene?.tokens.find((t) => t.id === tokenId),
    [scene, tokenId],
  );
  const channel = useMapRollChannel(worldId);

  if (isLoading) return <div className={s.state}>Načítám nestvůru…</div>;
  if (!token) {
    return (
      <div className={s.state}>
        Token už ve scéně není (PJ ho možná smazal nebo přepnul scénu).
      </div>
    );
  }

  const name = token.instanceName ?? token.characterData?.name ?? 'Nestvůra';
  const onMapRoll = (payload: MapRollRequest) =>
    channel?.postMessage({ type: 'map-roll', payload });

  return (
    <>
      <CardBar
        name={name}
        imageUrl={token.characterData?.imageUrl}
        channelReady={!!channel}
      />
      <div className={s.scroll}>
        {/* TokenSystemSheet routuje bestii na per-systém panel a sám obaluje
            DiarySkinScope; má reálný sceneId → save statbloku funguje. */}
        <TokenSystemSheet
          token={token}
          sceneId={sceneId}
          worldId={worldId}
          canEdit
          onMapRoll={onMapRoll}
        />
      </div>
    </>
  );
}

function CardBar({
  name,
  imageUrl,
  channelReady,
}: {
  name: string;
  imageUrl?: string;
  channelReady: boolean;
}) {
  return (
    <header className={s.bar}>
      <div className={s.avatar}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} />
        ) : (
          <span className={s.avatarFallback}>
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <h1 className={s.name}>{name}</h1>
      {/* Kanál k mapě — když není (starý prohlížeč), hody se do overlaye
          nepropíšou. Tichý indikátor. */}
      {!channelReady && (
        <span className={s.badge} title="Hody se nepropíšou do mapy">
          bez mostu
        </span>
      )}
    </header>
  );
}
