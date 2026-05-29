/**
 * 10.2a/c — Hlavní komponenta taktické mapy.
 *
 * Mountuje PixiJS `<Application>` přes `@pixi/react` v8. 6 vrstev v určeném
 * z-order (background → grid → effects → tokens → fog → pings).
 *
 * Konzumuje:
 *   - `WorldContext` (worldId, userRole, loading)
 *   - `useMapTheme` (CSS vars → PixiJS hex/rgba)
 *   - `useViewportSize` / `useViewportPanZoom` (10.2a)
 *   - `useMapScene` (10.2c — fetch + WS + patcher)
 *   - `useReassignmentListener` (10.2c — autoload nové scény po PJ reassign)
 *
 * Spec:
 *   - 10.2a §3.2/§3.3/§3.7
 *   - 10.2b §3.3 (HexGrid render)
 *   - 10.2c §3.1/§3.4/§3.6 (scene load, isHidden/isLocked, background)
 */
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { currentUserAtom } from '@/shared/store/authStore';
import { WorldRole, UserRole } from '@/shared/types';
import { useMapTheme } from './hooks/useMapTheme';
import { useViewportPanZoom } from './hooks/useViewportPanZoom';
import { useViewportSize } from './hooks/useViewportSize';
import { useMapScene } from './hooks/useMapScene';
import { useReassignmentListener } from './hooks/useReassignmentListener';
import { usePlacementMode } from './hooks/usePlacementMode';
import { MapZoomControls } from './components/MapZoomControls';
import { MapEmptyState } from './components/MapEmptyState';
import { MapPlacementBanner } from './components/MapPlacementBanner';
import { HexGrid, type MapBounds } from './components/HexGrid';
import { MapBackground } from './components/MapBackground';
import { MapHiddenOverlay } from './components/MapHiddenOverlay';
import { MapLockedOverlay } from './components/MapLockedOverlay';
import { MapPjPanel } from './components/pj-panel/MapPjPanel';
import { TokenLayer } from './components/tokens/TokenLayer';
import { TokenInfoPanel } from './components/token-panel/TokenInfoPanel';
import { TokenSystemSheet } from './components/token-panel/TokenSystemSheet';
import { useMyCharacterSlugs } from './hooks/useMyCharacterSlugs';
import { useTokenPermissions } from './hooks/useTokenPermissions';
import { useTokenDrag } from './hooks/useTokenDrag';
import { applyOperationToScene } from './utils/applyOperationToScene';
import { findFirstFreeHex } from './utils/findFirstFreeHex';
import { screenToHex } from './utils/screenToHex';
import {
  readSpawnPayload,
  hasSpawnPayloadType,
  type SpawnPayload,
} from './utils/spawnPayload';
import {
  buildBestieToken,
  buildNpcToken,
  buildPcToken,
} from './utils/buildSpawnToken';
import { mapSceneQueryKey } from './hooks/useMapScene';
import { postMapOperation } from './api/mapApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseApiError } from '@/shared/api';
import { bestiarQueryKey } from '@/features/world/bestiar/hooks/useBestiar';
import type { BestiarResponse, Bestie } from '@/features/world/bestiar/types';
import type { MapOperation, MapToken } from './types';
import styles from './TacticalMapView.module.css';

// PixiJS v8 @pixi/react JSX pragma — extend dovolí použít `pixiContainer`
// (lowercase, prefix `pixi`) jako JSX element.
// 10.2c hotfix — @pixi/react v8 vyžaduje extend() pro každý PIXI class
// použitý v JSX. HexGrid používá <pixiGraphics>, MapBackground <pixiSprite>.
// Bez Graphics/Sprite v extend() runtime hodí
// "Graphics/Sprite is not part of the PIXI namespace".
extend({ Container, Graphics, Sprite, Text });

export function TacticalMapView(): React.ReactElement {
  const { worldId, world, userRole, loading } = useWorldContext();
  const worldSystemId = world?.system ?? 'drd2';
  const currentUser = useAtomValue(currentUserAtom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const theme = useMapTheme();
  const { width, height } = useViewportSize(viewportRef);

  // 10.2c — scene fetch + WS + cross-scene reassignment listener.
  // POZOR: `useMapScene` musí být před `useViewportPanZoom`, aby hook
  // dostal `scene.id` pro per-scéna LS klíče (10.2c-edit-5).
  const { scene } = useMapScene(worldId || null);
  useReassignmentListener(worldId || null);

  const panZoom = useViewportPanZoom(viewportRef, scene?.id ?? null);

  // 10.2c-edit-5 — bbox mapy z MapBackground.onLoad. Předáno do HexGrid
  // pro lem hexů kolem mapy (ne přes celý viewport). Reset na null při
  // změně scény, MapBackground volá onLoad(null) na začátku každého loadu.
  const [mapTextureSize, setMapTextureSize] = useState<
    { width: number; height: number } | null
  >(null);

  // Background offset v map-space (z scene.config — 10.2c "free positioning").
  // backgroundScale aplikuje MapBackground sám v onLoad (vrací width * scale),
  // takže mapTextureSize jsou už finální rozměry v map-space.
  const backgroundX =
    (scene?.config as unknown as { backgroundX?: number })?.backgroundX ?? 0;
  const backgroundY =
    (scene?.config as unknown as { backgroundY?: number })?.backgroundY ?? 0;
  // Derived: pokud scéna nemá imageUrl, ignoruj případné starý mapTextureSize
  // (mohl zůstat z předchozí scény, kde MapBackground volal onLoad před unmount).
  const mapBounds: MapBounds | null =
    scene?.imageUrl && mapTextureSize
      ? {
          x: backgroundX,
          y: backgroundY,
          width: mapTextureSize.width,
          height: mapTextureSize.height,
        }
      : null;

  // Bind pointer events. Window-level pointermove/up pro continuous drag
  // i po opuštění viewportu.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent): void => panZoom.onWheel(e);
    const down = (e: PointerEvent): void => panZoom.onPointerDown(e);
    const move = (e: PointerEvent): void => panZoom.onPointerMove(e);
    const up = (e: PointerEvent): void => panZoom.onPointerUp(e);

    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [panZoom]);

  // PJ branching — práh `>= PomocnyPJ` (zarovnané s BE OperationsAuthorizer).
  // 10.2c hotfix — globální Sa/Admin bypass (mirror BE `OperationsAuthorizer`
  // z 10.2-prep-1, který povoluje ops Sa/Admin bez ohledu na WorldRole).
  // Bez tohoto bypassu Superadmin (vlastník platformy) neviděl `MapPjPanel`
  // v cizích světech, kde nemá explicit PomocnyPJ+ membership.
  const isGlobalAdmin =
    currentUser?.role === UserRole.Superadmin ||
    currentUser?.role === UserRole.Admin;
  const isPJ =
    isGlobalAdmin || (userRole !== null && userRole >= WorldRole.PomocnyPJ);

  // 10.2d — selection state (UI-only, lokální).
  // 10.2c-edit-9e — rozděleno na 2 nezávislé states:
  //   - selectedTokenId = highlight ring (click-to-place: další klik na hex = move)
  //   - openedTokenId = otevřený modal s deníkem (přes 'i' badge)
  // V Matrixu (`MapPage.tsx:1310/1315`) jsou tyto stavy nezávislé. Klik na
  // token = SELECT. Klik na 'i' = OPEN MODAL.
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [openedTokenId, setOpenedTokenId] = useState<string | null>(null);

  // 10.2d — permission gate pro drag.
  const mySlugs = useMyCharacterSlugs(worldId || null, currentUser?.id ?? null);
  const canDrag = useTokenPermissions({
    scene,
    isGlobalAdmin,
    isPj: userRole !== null && userRole >= WorldRole.PomocnyPJ,
    mySlugs,
  });

  // 10.2d-B — optimistic token.move mutation s rollback.
  const queryClient = useQueryClient();
  const moveMutation = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onMutate: ({ op }) => {
      if (!worldId || !scene) return { prev: null };
      const prev = queryClient.getQueryData(mapSceneQueryKey(worldId));
      queryClient.setQueryData(
        mapSceneQueryKey(worldId),
        applyOperationToScene(scene, op),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (worldId && ctx?.prev) {
        queryClient.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
      }
      // 10.2c-edit-9d: toast místo silent rollback (user dříve viděl jen
      // token vrátit na původní místo bez vysvětlení).
      toast.error(`Pohyb tokenu selhal: ${parseApiError(err)}`);
    },
  });

  // 10.2c-edit-9a — spawn mutation (token.add). Žádný optimistic — BE
  // přepíše pending ID UUID-em, optimistic by způsobil flicker. WS broadcast
  // přijde za pár ms a applyOperationToScene token přidá pro všechny.
  const spawnMutation = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onSuccess: () => {
      if (worldId) {
        void queryClient.invalidateQueries({
          queryKey: mapSceneQueryKey(worldId),
        });
      }
    },
    onError: (err) => {
      // 10.2c-edit-9d: toast pro spawn fail (dříve jen console.error)
      toast.error(`Spawn tokenu selhal: ${parseApiError(err)}`);
    },
  });

  const handleTokenDrop = (
    tokenId: string,
    q: number,
    r: number,
  ): void => {
    if (!scene) return;
    moveMutation.mutate({
      sceneId: scene.id,
      op: { type: 'token.move', tokenId, q, r },
    });
  };

  const { handleTokenPointerDown } = useTokenDrag({
    viewport: {
      zoom: panZoom.zoom,
      offsetX: panZoom.offsetX,
      offsetY: panZoom.offsetY,
    },
    config: scene?.config ?? { size: 40, originX: 0, originY: 0, showGrid: true },
    onDrop: handleTokenDrop,
  });

  // 10.2c-edit-9a — placement mode state machine (klik v paletě → klik na hex).
  const placement = usePlacementMode();

  // Lookup bestie ze query cache (BestiePalette zobrazuje aktivní podle ID;
  // payload nese jen ID, pro factory potřebujeme plný snapshot).
  const lookupBestie = useCallback(
    (bestieId: string): Bestie | null => {
      const cached = queryClient.getQueryData<BestiarResponse>(
        bestiarQueryKey(worldId ?? null, worldSystemId ?? null),
      );
      if (!cached) return null;
      const all = [...cached.user, ...cached.world, ...cached.system];
      return all.find((b) => b.id === bestieId) ?? null;
    },
    [queryClient, worldId, worldSystemId],
  );

  // Bestie tokeny nemají `characterData` (nejsou Page) → na mapě by neměly
  // obrázek. Doplníme `imageUrl` ze snapshotu bestie (cache přes templateId),
  // ať TokenSprite vykreslí avatar. Query cache se nemutuje (mapujeme kopii).
  const enrichedTokens = useMemo(() => {
    const list = scene?.tokens ?? [];
    return list.map((t) => {
      if (!t.templateId || t.characterData?.imageUrl) return t;
      const img = lookupBestie(t.templateId)?.imageUrl;
      if (!img) return t;
      return { ...t, characterData: { ...t.characterData, imageUrl: img } };
    });
  }, [scene?.tokens, lookupBestie]);

  /**
   * Sjednocený spawn — z drop handleru i z placement-mode klikem.
   * Volá `token.add` op s tokenem postaveným factory dle payload.kind.
   * Pokud cílový hex obsazený, fallback `findFirstFreeHex(tokens, target)`
   * — spirálový BFS od pointed hex (ne od (0,0) jako dřív).
   */
  const spawnTokenAt = useCallback(
    (payload: SpawnPayload, targetQ: number, targetR: number): void => {
      if (!scene) return;
      const taken = scene.tokens.some(
        (t) => t.q === targetQ && t.r === targetR,
      );
      const { q, r } = taken
        ? findFirstFreeHex(scene.tokens, { q: targetQ, r: targetR })
        : { q: targetQ, r: targetR };

      let token: MapToken;
      if (payload.kind === 'pc') {
        token = buildPcToken(payload, q, r);
      } else if (payload.kind === 'npc') {
        token = buildNpcToken(payload, q, r);
      } else {
        const bestie = lookupBestie(payload.bestieId);
        if (!bestie) {
          console.error(
            '[TacticalMapView] spawn: bestie nenalezena v cache',
            payload.bestieId,
          );
          return;
        }
        token = buildBestieToken(bestie, q, r);
      }
      spawnMutation.mutate({
        sceneId: scene.id,
        op: { type: 'token.add', token },
      });
    },
    [scene, lookupBestie, spawnMutation],
  );

  // 10.2c-edit-9a — HTML5 drop handler (drag&drop z palety na viewport)
  const handleViewportDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!scene || !isPJ) return;
      if (!hasSpawnPayloadType(e.dataTransfer)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    [scene, isPJ],
  );

  const handleViewportDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!scene || !viewportRef.current) return;
      e.preventDefault();
      const payload = readSpawnPayload(e.dataTransfer);
      if (!payload) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const target = screenToHex(e.clientX, e.clientY, rect, panZoom, scene.config);
      spawnTokenAt(payload, target.q, target.r);
      // Drop sice samo nevolá placement.consume(), ale pokud byl placement aktivní
      // (uživatel klikl v paletě a pak místo na hex prostě dragl), ukončíme ho.
      if (placement.state.active && !placement.state.multi) placement.cancel();
    },
    [scene, panZoom, spawnTokenAt, placement],
  );

  // 10.2c-edit-9a — placement mode = HTML5 click na viewport. Pixi
  // `<pixiContainer>` bez explicit hitArea nezachytí pointer na pozadí,
  // takže native click handler na wrapper divu je robustnější (a navíc
  // tokeny pod canvas pointerdown se zpracují normálně přes existing
  // TokenSprite handlery — bez kolize).
  //
  // 10.2c-edit-9e — sekundární use case stejného handleru: pokud je
  // selected token (žádný placement aktivní), klik na hex = MOVE token
  // (click-to-place pattern z Matrixu, `MapPage.tsx:1065`).
  const handleViewportClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (!scene || !viewportRef.current) return;
      if (e.button !== 0) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const target = screenToHex(e.clientX, e.clientY, rect, panZoom, scene.config);

      // Placement mode má prioritu (PJ právě spawn-uje z palety)
      if (placement.state.active) {
        spawnTokenAt(placement.state.payload, target.q, target.r);
        placement.consume();
        return;
      }

      // Click-to-place: vybraný token + klik na hex = move
      if (selectedTokenId && scene) {
        const selToken = scene.tokens.find((t) => t.id === selectedTokenId);
        if (!selToken) {
          setSelectedTokenId(null);
          return;
        }
        if (!canDrag(selToken)) return;

        // 10.2c-edit-9e BUG FIX: klik na token vyvolá ZÁROVEŇ Pixi onSelect
        // (select) A DOM click bubble (handleViewportClick). Target hex
        // bubble-click = pod tokenem = current hex. Bez tohoto check by se
        // token okamžitě deselectoval. → Pokud target = current hex VYBRANÉHO
        // tokenu, NOOP (nic neudělej). Toggle deselect je přes klik na token
        // znovu (řeší se v setSelectedTokenId onSelect callback — toggle).
        if (target.q === selToken.q && target.r === selToken.r) {
          return;
        }

        // Klik na hex obsazený JINÝM tokenem → noop (user možná chce vybrat
        // jiný token; pixi onSelect na tom druhém token to udělá).
        const blocked = scene.tokens.some(
          (t) => t.id !== selectedTokenId && t.q === target.q && t.r === target.r,
        );
        if (blocked) return;

        // Move: prázdný hex jiný než current
        moveMutation.mutate({
          sceneId: scene.id,
          op: { type: 'token.move', tokenId: selectedTokenId, q: target.q, r: target.r },
        });
        setSelectedTokenId(null);
      }
    },
    [placement, scene, panZoom, spawnTokenAt, selectedTokenId, canDrag, moveMutation],
  );

  // Empty state: world ready ale scéna chybí (hráč není přiřazený)
  const showEmptyState = !loading && (!worldId || (!scene && !loading));

  // Hidden overlay jen pro hráče (PJ vidí scénu vždy)
  const showHidden = !!scene && scene.isHidden && !isPJ;

  // Locked banner jen pro hráče (PJ může pokračovat)
  const showLocked = !!scene && scene.isLocked && !isPJ;

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      onDragOver={isPJ ? handleViewportDragOver : undefined}
      onDrop={isPJ ? handleViewportDrop : undefined}
      onClick={
        placement.state.active || selectedTokenId !== null
          ? handleViewportClick
          : undefined
      }
      data-placement-active={placement.state.active ? 'true' : undefined}
    >
      {/* PIXI v8 Application init je async — pokud se mountne bez scény
          (jen podle rozměrů) a scéna dorazí teprve během initu, @pixi/react
          děti nepřipojí ke stage (prázdná mapa po refreshi; „přepni scénu a
          zpět" to obejde). Mountujeme proto až když jsou rozměry i scéna
          ready — Application i děti vzniknou společně, init proběhne s nimi. */}
      {width > 0 && height > 0 && scene && (
        <div className={styles.canvasWrapper}>
          <Application
            background={theme.canvasBg}
            width={width}
            height={height}
            antialias
            autoDensity
            resolution={window.devicePixelRatio || 1}
          >
            <pixiContainer
              label="map-root"
              x={panZoom.offsetX}
              y={panZoom.offsetY}
              scale={panZoom.zoom}
            >
              <pixiContainer label="layer-background">
                {scene?.imageUrl && (
                  <MapBackground
                    imageUrl={scene.imageUrl}
                    scale={
                      (scene.config as unknown as { backgroundScale?: number })
                        .backgroundScale ?? 1
                    }
                    offsetX={backgroundX}
                    offsetY={backgroundY}
                    onLoad={setMapTextureSize}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-grid">
                {scene && (
                  <HexGrid
                    config={scene.config}
                    theme={theme}
                    mapBounds={mapBounds}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-effects" />
              <pixiContainer label="layer-tokens">
                {scene && (
                  <TokenLayer
                    tokens={enrichedTokens}
                    config={scene.config}
                    theme={theme}
                    selectedTokenId={selectedTokenId}
                    activeTurnTokenId={scene.combat?.currentTokenId ?? null}
                    canDrag={canDrag}
                    onSelect={setSelectedTokenId}
                    onOpenInfo={setOpenedTokenId}
                    onTokenPointerDown={handleTokenPointerDown}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-fog" />
              <pixiContainer label="layer-pings" />
            </pixiContainer>
          </Application>
        </div>
      )}

      {showEmptyState && (
        <MapEmptyState
          isPJ={isPJ}
          worldId={worldId ?? undefined}
          currentUserId={currentUser?.id}
        />
      )}
      {showHidden && <MapHiddenOverlay />}
      {showLocked && <MapLockedOverlay />}

      {isPJ && worldId && currentUser && (
        <MapPjPanel
          worldId={worldId}
          currentScene={scene}
          currentUserId={currentUser.id}
          onStartPlacement={placement.start}
        />
      )}


      {placement.state.active && (
        <MapPlacementBanner
          payload={placement.state.payload}
          multi={placement.state.multi}
          onCancel={placement.cancel}
        />
      )}

      {openedTokenId && scene && worldId && (() => {
        const openedToken = scene.tokens.find((t) => t.id === openedTokenId);
        if (!openedToken) return null;
        const displayName =
          openedToken.instanceName ?? openedToken.characterData?.name ?? '?';
        const editable = canDrag(openedToken);
        const deletable =
          isGlobalAdmin || (userRole !== null && userRole >= WorldRole.PomocnyPJ);
        // Body osudu — Matrix-specific stat. Pro ostatní systémy se badge skryje.
        const fatePoints =
          worldSystemId === 'matrix'
            ? Number(
                openedToken.characterData?.diaryData?.matrix_fatePoints ?? 0,
              )
            : null;
        return (
          <TokenInfoPanel
            open
            header={{
              // Bestie token nemá characterData (není Page) → dotáhni obrázek
              // z bestiar cache přes templateId (snapshot šablony).
              avatar:
                openedToken.characterData?.imageUrl ??
                (openedToken.templateId
                  ? (lookupBestie(openedToken.templateId)?.imageUrl ??
                    undefined)
                  : undefined),
              name: displayName,
              badge:
                fatePoints !== null ? (
                  <>
                    <span>Body osudu:</span>
                    <strong>{fatePoints}</strong>
                  </>
                ) : undefined,
              actions: deletable ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Smazat token „${displayName}"?`)) return;
                    void postMapOperation(scene.id, {
                      type: 'token.remove',
                      tokenId: openedToken.id,
                    });
                    setOpenedTokenId(null);
                  }}
                  style={{
                    padding: '5px 12px',
                    background: 'rgba(255, 80, 96, 0.18)',
                    color: '#ff9090',
                    border: '1px solid rgba(255, 80, 96, 0.45)',
                    borderRadius: 5,
                    font: 'inherit',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                  title={`Odebrat ${displayName} z mapy (postava v DB zůstane)`}
                >
                  Odstranit z mapy
                </button>
              ) : undefined,
              onClose: () => setOpenedTokenId(null),
            }}
          >
            <TokenSystemSheet
              token={openedToken}
              sceneId={scene.id}
              worldId={worldId}
              canEdit={editable}
            />
          </TokenInfoPanel>
        );
      })()}

      <MapZoomControls
        zoom={panZoom.zoom}
        onZoomIn={() => panZoom.setZoom(panZoom.zoom + 0.1)}
        onZoomOut={() => panZoom.setZoom(panZoom.zoom - 0.1)}
        onReset={panZoom.resetZoom}
        fullscreenTargetRef={viewportRef}
      />
    </div>
  );
}
