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
import { Application, extend } from "@pixi/react";
import { Container, Graphics, Sprite, Text } from "pixi.js";
import type { Application as PixiApplication } from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { useWorldContext } from "@/features/world/context/WorldContext";
import { currentUserAtom } from "@/shared/store/authStore";
import { WorldRole, UserRole } from "@/shared/types";
import { useMapTheme } from "./hooks/useMapTheme";
import { useViewportPanZoom } from "./hooks/useViewportPanZoom";
import { useViewportSize } from "./hooks/useViewportSize";
import { useMapScene } from "./hooks/useMapScene";
import { useReassignmentListener } from "./hooks/useReassignmentListener";
import { usePlacementMode } from "./hooks/usePlacementMode";
import { useEffectTool } from "./hooks/useEffectTool";
import { useFogTool } from "./hooks/useFogTool";
import { EffectsPalette } from "./components/effects/EffectsPalette";
import { EffectsLayer } from "./components/effects/EffectsLayer";
import { FogLayer } from "./components/fog/FogLayer";
import { FogPalette } from "./components/fog/FogPalette";
import {
  effectivelyRevealed,
  fogBrushHexes,
  isTokenHiddenByFog,
} from "./components/fog/fogUtils";
import { getHexesInRadius, hexDistance } from "./hexUtils";
import { MapZoomControls } from "./components/MapZoomControls";
import { MapToolDock, MapDockStack } from "./components/MapToolDock";
import { MapEmptyState } from "./components/MapEmptyState";
import { MapPlacementBanner } from "./components/MapPlacementBanner";
import { HexGrid, type MapBounds } from "./components/HexGrid";
import { MapBackground } from "./components/MapBackground";
import { MapHiddenOverlay } from "./components/MapHiddenOverlay";
import { MapLockedOverlay } from "./components/MapLockedOverlay";
import { MapPjPanel } from "./components/pj-panel/MapPjPanel";
import { TokenLayer } from "./components/tokens/TokenLayer";
import { InitiativeBar } from "./components/initiative/InitiativeBar";
import { MapConnectionBadge } from "./components/MapConnectionBadge";
import { MapWeatherPanel } from "./components/weather/MapWeatherPanel";
import { MapWeatherAtmosphere } from "./components/weather/MapWeatherAtmosphere";
import { useMapWeather } from "./hooks/useMapWeather";
import { TokenInfoPanel } from "./components/token-panel/TokenInfoPanel";
import { TokenSystemSheet } from "./components/token-panel/TokenSystemSheet";
import { useMyCharacterSlugs } from "./hooks/useMyCharacterSlugs";
import { useTokenPermissions } from "./hooks/useTokenPermissions";
import { useTokenUpdate } from "./hooks/useTokenUpdate";
import { useTokenDrag } from "./hooks/useTokenDrag";
import { applyOperationToScene } from "./utils/applyOperationToScene";
import { findFirstFreeHex } from "./utils/findFirstFreeHex";
import { screenToHex } from "./utils/screenToHex";
import { axialToPixel } from "./hexUtils";
import { isPcToken } from "./utils/isPcToken";
import { sortByInitiativeDesc } from "./utils/initiativeOrder";
import {
  readSpawnPayload,
  hasSpawnPayloadType,
  type SpawnPayload,
} from "./utils/spawnPayload";
import {
  buildBestieToken,
  buildNpcToken,
  buildPcToken,
} from "./utils/buildSpawnToken";
import { mapSceneQueryKey } from "./hooks/useMapScene";
import { postMapOperation } from "./api/mapApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseApiError } from "@/shared/api";
import { bestiarQueryKey } from "@/features/world/bestiar/hooks/useBestiar";
import type { BestiarResponse, Bestie } from "@/features/world/bestiar/types";
import type { MapOperation, MapToken, MapScene } from "./types";
import styles from "./TacticalMapView.module.css";

// PixiJS v8 @pixi/react JSX pragma — extend dovolí použít `pixiContainer`
// (lowercase, prefix `pixi`) jako JSX element.
// 10.2c hotfix — @pixi/react v8 vyžaduje extend() pro každý PIXI class
// použitý v JSX. HexGrid používá <pixiGraphics>, MapBackground <pixiSprite>.
// Bez Graphics/Sprite v extend() runtime hodí
// "Graphics/Sprite is not part of the PIXI namespace".
extend({ Container, Graphics, Sprite, Text });

/**
 * 10.2g — pokrývá efekt daný hex? Pro mazání klikem na hex (souřadnicové,
 * deterministické). `color`/`barrier` = hex je v `hexes`; klik kdekoliv na
 * bariéře tak smaže celou (je to jeden souvislý objekt). `explosion` =
 * vzdálenost ≤ max ring radius (mimo excluded).
 */
function effectCoversHex(e: MapEffect, q: number, r: number): boolean {
  if (e.type === "explosion") {
    const center = e.hexes[0];
    if (!center || !e.rings?.length) return false;
    if (e.excludedHexes?.some((ex) => ex.q === q && ex.r === r)) return false;
    const maxR = Math.max(...e.rings.map((ri) => ri.radius));
    return hexDistance(center, { q, r }) <= maxR;
  }
  return e.hexes.some((h) => h.q === q && h.r === r);
}

export function TacticalMapView(): React.ReactElement {
  const { worldId, world, userRole, loading } = useWorldContext();
  const worldSystemId = world?.system ?? "drd2";
  const currentUser = useAtomValue(currentUserAtom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const theme = useMapTheme();
  const { width, height } = useViewportSize(viewportRef);

  // 10.2f-3 — spotlight („ukazováček" PJ z iniciativní lišty). Ephemeral
  // červený ring na tokenu, auto-clear po 3 s. Trigger lokálně (PJ klik) i
  // z WS (jiný PJ ukázal). Definováno před useMapScene, ať může přijmout cb.
  const [spotlightTokenId, setSpotlightTokenId] = useState<string | null>(null);
  const spotlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSpotlight = useCallback((tokenId: string) => {
    setSpotlightTokenId(tokenId);
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    spotlightTimerRef.current = setTimeout(
      () => setSpotlightTokenId(null),
      3000,
    );
  }, []);
  useEffect(
    () => () => {
      if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    },
    [],
  );

  // 10.2c — scene fetch + WS + cross-scene reassignment listener.
  // POZOR: `useMapScene` musí být před `useViewportPanZoom`, aby hook
  // dostal `scene.id` pro per-scéna LS klíče (10.2c-edit-5).
  const { scene, emitSpotlight } = useMapScene(worldId || null, {
    onSpotlight: triggerSpotlight,
  });
  useReassignmentListener(worldId || null);

  // 10.2i — počasí na mapě (world-room join + weather:updated listener + FX toggle).
  const weather = useMapWeather();

  // 10.2c-edit-9a — placement mode (klik v paletě → klik na hex).
  // 10.2g — effect tool state (paleta efektů). Oba deklarovány PŘED panZoom,
  // ať můžou suppressnout left-pan (kreslení efektu / placement = left-drag
  // patří nástroji, ne posunu mapy).
  const placement = usePlacementMode();
  const effectTool = useEffectTool();
  // 10.2h — fog tool state (paleta mlhy). Aktivní = left-drag kreslí mlhu.
  const fogTool = useFogTool();
  // 10.2h — poslední hex pod fog brushem (dedup při tažení, výkon).
  const lastFogHexRef = useRef<string | null>(null);
  // 10.2g — master id rozpracované brush bariéry (jeden tah = jedna bariéra).
  // Ref (ne state) → synchronní, imunní vůči staleness při rychlém tažení.
  // Reset na null při pointerup (konec tahu) a změně nástroje.
  const brushBarrierIdRef = useRef<string | null>(null);

  const panZoom = useViewportPanZoom(
    viewportRef,
    scene?.id ?? null,
    effectTool.activeTool !== null || placement.state.active || fogTool.active,
  );

  // 10.2c-edit-5 — bbox mapy z MapBackground.onLoad. Předáno do HexGrid
  // pro lem hexů kolem mapy (ne přes celý viewport). Reset na null při
  // změně scény, MapBackground volá onLoad(null) na začátku každého loadu.
  const [mapTextureSize, setMapTextureSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Background offset v map-space (z scene.config — 10.2c "free positioning").
  // backgroundScale aplikuje MapBackground sám v onLoad (vrací width * scale),
  // takže mapTextureSize jsou už finální rozměry v map-space.
  const backgroundX =
    (scene?.config as unknown as { backgroundX?: number })?.backgroundX ?? 0;
  const backgroundY =
    (scene?.config as unknown as { backgroundY?: number })?.backgroundY ?? 0;
  // Derived: pokud scéna nemá imageUrl, ignoruj případné starý mapTextureSize
  // (mohl zůstat z předchozí scény, kde MapBackground volal onLoad před unmount).
  // useMemo — stabilní reference pro useEffect dep (mapBoundsRef sync).
  const mapBounds: MapBounds | null = useMemo(
    () =>
      scene?.imageUrl && mapTextureSize
        ? {
            x: backgroundX,
            y: backgroundY,
            width: mapTextureSize.width,
            height: mapTextureSize.height,
          }
        : null,
    [scene?.imageUrl, mapTextureSize, backgroundX, backgroundY],
  );

  // Live ref na mapBounds — fullscreen listener čte aktuální hodnotu bez
  // re-bindingu (mapBounds se mění s každým renderem).
  const mapBoundsRef = useRef(mapBounds);
  useEffect(() => {
    mapBoundsRef.current = mapBounds;
  }, [mapBounds]);

  // @pixi/react <Application> nepřekresluje canvas, když se změní width/height
  // prop (zůstane na velikosti z initu). Při vstupu do fullscreenu se viewport
  // zvětší, ale canvas ne → sprite je oříznutý a pod ním černo. Imperativně
  // zvětšíme renderer při každé změně rozměru.
  const appRef = useRef<PixiApplication | null>(null);
  useEffect(() => {
    const app = appRef.current;
    if (!app?.renderer || width <= 0 || height <= 0) return;
    app.renderer.resize(width, height);
  }, [width, height]);

  // Fullscreen flag — měníme přes fullscreenchange event.
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const el = viewportRef.current;
    const onFsChange = (): void =>
      setIsFullscreen(document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Auto-fit mapy ve fullscreenu. Spustí se při KAŽDÉ změně rozměru viewportu
  // (vstup do fullscreenu 800→1080, pozdější resize / zavření devtools). Bere
  // width/height z useViewportSize = přesně rozměr canvasu, takže fit a canvas
  // se vždy shodují a poslední přepočet vyhraje — žádný timing race ani závislost
  // na tom, kdy fullscreen geometrie dorazí. Mimo fullscreen = no-op.
  // fit přes ref — panZoom je nový objekt každý render, jako dep by způsobil
  // nekonečnou smyčku (fit → setState → re-render → nový panZoom → fit → …).
  const fitRef = useRef(panZoom.fitToViewport);
  useEffect(() => {
    fitRef.current = panZoom.fitToViewport;
  });
  useEffect(() => {
    if (!isFullscreen) return;
    if (width <= 0 || height <= 0 || !mapBoundsRef.current) return;
    fitRef.current(mapBoundsRef.current, width, height);
  }, [isFullscreen, width, height]);

  // Bind pointer events. Window-level pointermove/up pro continuous drag
  // i po opuštění viewportu.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent): void => panZoom.onWheel(e);
    const down = (e: PointerEvent): void => panZoom.onPointerDown(e);
    const move = (e: PointerEvent): void => panZoom.onPointerMove(e);
    const up = (e: PointerEvent): void => panZoom.onPointerUp(e);

    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
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

  // 10.2f — token.update pro „V boji / Mimo boj" toggle v panelu tokenu.
  const tokenUpdate = useTokenUpdate(scene?.id ?? "", worldId ?? "");

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

  // 10.2g — effect mutace (add / update / remove). Optimistic přes
  // applyOperationToScene + rollback (pattern moveMutation); WS dorovná
  // ostatní klienty. Barrier brush spawne desítky ops za tah → optimistic je
  // nutný, ať PJ vidí čáru hned bez čekání na round-trip.
  const effectMutation = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onMutate: ({ op }) => {
      if (!worldId) return { prev: null };
      // Base = FRESH cache (`prev`), NE closure `scene` — při rychlém brush
      // tažení se React nestihne re-renderovat, closure scene by byla stale
      // (bez právě přidané bariéry) → effect.update by ji nenašel a přepsal
      // cache zpět. Stavění na prev řetězí ops korektně.
      const prev = queryClient.getQueryData<MapScene>(
        mapSceneQueryKey(worldId),
      );
      if (prev) {
        queryClient.setQueryData(
          mapSceneQueryKey(worldId),
          applyOperationToScene(prev, op),
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (worldId && ctx?.prev) {
        queryClient.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
      }
      toast.error(`Efekt selhal: ${parseApiError(err)}`);
    },
  });

  // 10.2h — fog mutace (fog.set / fog.brush). Optimistic přes
  // applyOperationToScene + rollback (stejný pattern jako effectMutation —
  // brush tažení spawne řadu ops, optimistic je nutný pro plynulé kreslení).
  // Base = FRESH cache, ne closure scene (staleness při rychlém tažení).
  const fogMutation = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onMutate: ({ op }) => {
      if (!worldId) return { prev: null };
      const prev = queryClient.getQueryData<MapScene>(
        mapSceneQueryKey(worldId),
      );
      if (prev) {
        queryClient.setQueryData(
          mapSceneQueryKey(worldId),
          applyOperationToScene(prev, op),
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (worldId && ctx?.prev) {
        queryClient.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
      }
      toast.error(`Mlha selhala: ${parseApiError(err)}`);
    },
  });

  // 10.2h — efektivně odhalené hexy = revealedHexes ∪ hexy PC tokenů. Sdíleno
  // mezi FogLayer (maska) a NPC visibility gate (TokenLayer).
  const revealedSet = useMemo(
    () => effectivelyRevealed(scene?.revealedHexes ?? [], scene?.tokens ?? []),
    [scene?.revealedHexes, scene?.tokens],
  );

  // 10.2h — fog brush: štětec na hex (reveal/fog dle režimu). Dedup posledního
  // hexu (výkon při tažení). Jen PJ + aktivní fog tool + zapnutá mlha.
  const applyFogAtHex = useCallback(
    (q: number, r: number): void => {
      if (!scene || !isPJ || !fogTool.active || !scene.fogEnabled) return;
      if (effectTool.activeTool) return; // effect tool má v kreslení přednost
      const key = `${q},${r}`;
      if (lastFogHexRef.current === key) return;
      lastFogHexRef.current = key;
      fogMutation.mutate({
        sceneId: scene.id,
        op: {
          type: "fog.brush",
          mode: fogTool.mode,
          hexes: fogBrushHexes(q, r, fogTool.brushSize),
        },
      });
    },
    [
      scene,
      isPJ,
      fogTool.active,
      fogTool.mode,
      fogTool.brushSize,
      effectTool.activeTool,
      fogMutation,
    ],
  );

  // 10.2h — master přepínač mlhy (zachová revealedHexes).
  const handleToggleFog = useCallback(
    (enabled: boolean): void => {
      if (!scene || !isPJ) return;
      fogMutation.mutate({
        sceneId: scene.id,
        op: {
          type: "fog.set",
          enabled,
          revealedHexes: scene.revealedHexes ?? [],
        },
      });
    },
    [scene, isPJ, fogMutation],
  );

  // 10.2h — reset mlhy (zahalit vše = vymaž revealedHexes, mlha zůstává zapnutá).
  const handleResetFog = useCallback((): void => {
    if (!scene || !isPJ) return;
    fogMutation.mutate({
      sceneId: scene.id,
      op: { type: "fog.set", enabled: scene.fogEnabled, revealedHexes: [] },
    });
  }, [scene, isPJ, fogMutation]);

  const handleTokenDrop = (tokenId: string, q: number, r: number): void => {
    if (!scene) return;
    moveMutation.mutate({
      sceneId: scene.id,
      op: { type: "token.move", tokenId, q, r },
    });
  };

  const { handleTokenPointerDown } = useTokenDrag({
    viewport: {
      zoom: panZoom.zoom,
      offsetX: panZoom.offsetX,
      offsetY: panZoom.offsetY,
    },
    config: scene?.config ?? {
      size: 40,
      originX: 0,
      originY: 0,
      showGrid: true,
    },
    onDrop: handleTokenDrop,
  });

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

  // Bestie tokeny nemají `characterData` (nejsou Page) → obrázek dotahujeme ze
  // snapshotu bestie (cache přes templateId). Resolvujeme FRESH při každém
  // renderu (ne přes memo) — jinak obrázek zmizel po refetchi/bestiar load
  // (stale memo). Stejná cesta jako iniciativní lišta.
  const resolveTokenImage = useCallback(
    (t: MapToken): string | undefined =>
      t.characterData?.imageUrl ??
      (t.templateId ? lookupBestie(t.templateId)?.imageUrl : undefined),
    [lookupBestie],
  );

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
      if (payload.kind === "pc") {
        token = buildPcToken(payload, q, r);
      } else if (payload.kind === "npc") {
        token = buildNpcToken(payload, q, r);
      } else {
        const bestie = lookupBestie(payload.bestieId);
        if (!bestie) {
          console.error(
            "[TacticalMapView] spawn: bestie nenalezena v cache",
            payload.bestieId,
          );
          return;
        }
        token = buildBestieToken(bestie, q, r);
      }
      spawnMutation.mutate({
        sceneId: scene.id,
        op: { type: "token.add", token },
      });
    },
    [scene, lookupBestie, spawnMutation],
  );

  /**
   * 10.2g — aplikace aktivního efekt-nástroje na hex (port Matrix
   * `handleHexClick` effect větve). `isDrag=true` při tažení (barrier brush,
   * paint color). Jen PJ; když není aktivní nástroj → no-op.
   */
  const applyEffectAtHex = useCallback(
    (q: number, r: number, isDrag = false): void => {
      if (!scene || !isPJ || !effectTool.activeTool) return;
      const newId = (): string =>
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `effect-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (effectTool.activeTool === "color") {
        effectMutation.mutate({
          sceneId: scene.id,
          op: {
            type: "effect.add",
            effect: {
              id: newId(),
              type: "color",
              hexes: [{ q, r }],
              color: effectTool.selectedColor,
            },
          },
        });
        return;
      }

      if (effectTool.activeTool === "explosion") {
        if (effectTool.explosionRings.length === 0 || isDrag) return;
        effectMutation.mutate({
          sceneId: scene.id,
          op: {
            type: "effect.add",
            effect: {
              id: newId(),
              type: "explosion",
              hexes: [{ q, r }],
              rings: effectTool.explosionRings,
              variant: effectTool.explosionVariant,
            },
          },
        });
        return;
      }

      if (effectTool.activeTool === "barrier") {
        // Kruh — jeden klik, žádný drag spam.
        if (effectTool.barrierShape === "circle") {
          if (isDrag) return;
          effectMutation.mutate({
            sceneId: scene.id,
            op: {
              type: "effect.add",
              effect: {
                id: newId(),
                type: "barrier",
                hexes: getHexesInRadius(q, r, effectTool.barrierRadius),
                barrierDC: effectTool.barrierDC,
              },
            },
          });
          return;
        }
        // Brush — append hex do rozpracované bariéry (kontinuita jednoho tahu).
        // Master = `brushBarrierIdRef` (synchronní, imunní vůči staleness při
        // rychlém tažení). Fresh scéna z cache (po předchozí optimistic mutaci),
        // ne closure `scene` — jinak by se hexy přepisovaly.
        const fresh =
          (worldId &&
            queryClient.getQueryData<MapScene>(mapSceneQueryKey(worldId))) ||
          scene;
        const activeId = brushBarrierIdRef.current;
        const active = activeId
          ? fresh.effects.find((e) => e.id === activeId)
          : null;
        if (active) {
          if (active.hexes.some((h) => h.q === q && h.r === r)) return; // už tam je
          effectMutation.mutate({
            sceneId: scene.id,
            op: {
              type: "effect.update",
              effectId: active.id,
              patch: {
                hexes: [...active.hexes, { q, r }],
                barrierDC: effectTool.barrierDC,
              },
            },
          });
        } else {
          const id = newId();
          brushBarrierIdRef.current = id;
          effectMutation.mutate({
            sceneId: scene.id,
            op: {
              type: "effect.add",
              effect: {
                id,
                type: "barrier",
                hexes: [{ q, r }],
                barrierDC: effectTool.barrierDC,
              },
            },
          });
        }
      }
    },
    [scene, isPJ, effectTool, effectMutation, worldId, queryClient],
  );

  // 10.2g — smazat efekt podle id.
  const handleRemoveEffect = useCallback(
    (effectId: string): void => {
      if (!scene || !isPJ) return;
      effectMutation.mutate({
        sceneId: scene.id,
        op: { type: "effect.remove", effectId },
      });
    },
    [scene, isPJ, effectMutation],
  );

  // 10.2g — souřadnicové mazání: klik na hex v mazacím režimu smaže všechny
  // efekty, které ten hex pokrývají (color = ten čtvereček, barrier = celá
  // souvislá bariéra, explosion = celý výbuch). Deterministické — nezávisí na
  // Pixi hit-testu přes alpha / z-order navrstvených efektů. Fresh scéna z cache.
  const eraseEffectsAtHex = useCallback(
    (q: number, r: number): void => {
      if (!scene || !isPJ) return;
      const fresh =
        (worldId &&
          queryClient.getQueryData<MapScene>(mapSceneQueryKey(worldId))) ||
        scene;
      const hits = fresh.effects.filter((e) => effectCoversHex(e, q, r));
      for (const e of hits) handleRemoveEffect(e.id);
    },
    [scene, isPJ, worldId, queryClient, handleRemoveEffect],
  );

  // 10.2g — smazat všechny efekty najednou (paleta 🗑). Jedna op místo N.
  const handleClearAllEffects = useCallback((): void => {
    if (!scene || !isPJ) return;
    effectMutation.mutate({
      sceneId: scene.id,
      op: { type: "scene.effects.replace", effects: [] },
    });
  }, [scene, isPJ, effectMutation]);

  // 10.2g — tažení levým tlačítkem: barrier brush maluje hexy, guma maže.
  // Ostatní nástroje (color/explosion/circle) jsou single-klik (přes onClick).
  const handleViewportPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!scene || !isPJ) return;
      const isBrush =
        effectTool.activeTool === "barrier" &&
        effectTool.barrierShape === "brush";
      const isErase = effectTool.activeTool === "erase";
      const isFog =
        fogTool.active && scene.fogEnabled && !effectTool.activeTool;
      if (!isBrush && !isErase && !isFog) return;
      if ((e.buttons & 1) === 0) return; // levé tlačítko drženo
      if ((e.target as HTMLElement).tagName !== "CANVAS") return;
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const target = screenToHex(
        e.clientX,
        e.clientY,
        rect,
        panZoom,
        scene.config,
      );
      if (isFog) {
        applyFogAtHex(target.q, target.r);
      } else if (isErase) {
        eraseEffectsAtHex(target.q, target.r);
      } else {
        applyEffectAtHex(target.q, target.r, true);
      }
    },
    [
      scene,
      isPJ,
      effectTool,
      fogTool.active,
      panZoom,
      applyEffectAtHex,
      eraseEffectsAtHex,
      applyFogAtHex,
    ],
  );

  // Konec tahu → další brush stroke začne novou bariéru / nový fog tah.
  const handleViewportPointerUp = useCallback((): void => {
    brushBarrierIdRef.current = null;
    lastFogHexRef.current = null;
  }, []);

  // Změna nástroje ukončí rozpracovanou bariéru.
  useEffect(() => {
    brushBarrierIdRef.current = null;
  }, [effectTool.activeTool]);

  // Změna fog režimu/velikosti → resetuj dedup (další hex se zase aplikuje).
  useEffect(() => {
    lastFogHexRef.current = null;
  }, [fogTool.active, fogTool.mode, fogTool.brushSize]);

  // 10.2c-edit-9a — HTML5 drop handler (drag&drop z palety na viewport)
  const handleViewportDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!scene || !isPJ) return;
      if (!hasSpawnPayloadType(e.dataTransfer)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
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
      const target = screenToHex(
        e.clientX,
        e.clientY,
        rect,
        panZoom,
        scene.config,
      );
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
      // Reaguj jen na klik přímo na mapový canvas. UI overlaye (placement
      // banner, PJ panel, deník) jsou děti viewportu a jejich klik sem bublá
      // taky — bez tohoto guardu Zrušit spawne entitu a zavření panelu pohne
      // vybraným tokenem.
      if ((e.target as HTMLElement).tagName !== "CANVAS") return;
      const rect = viewportRef.current.getBoundingClientRect();
      const target = screenToHex(
        e.clientX,
        e.clientY,
        rect,
        panZoom,
        scene.config,
      );

      // 10.2h — fog brush single-klik. Effect tool má přednost (níž), proto
      // guard !activeTool. Tažení řeší handleViewportPointerMove.
      if (
        fogTool.active &&
        isPJ &&
        scene.fogEnabled &&
        !effectTool.activeTool
      ) {
        lastFogHexRef.current = null; // klik = nový tah
        applyFogAtHex(target.q, target.r);
        return;
      }

      // 10.2g — aktivní efekt-nástroj má NEJVYŠŠÍ prioritu (PJ kreslí / maže).
      if (effectTool.activeTool && isPJ) {
        if (effectTool.activeTool === "erase") {
          eraseEffectsAtHex(target.q, target.r);
        } else {
          applyEffectAtHex(target.q, target.r, false);
        }
        return;
      }

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
          (t) =>
            t.id !== selectedTokenId && t.q === target.q && t.r === target.r,
        );
        if (blocked) return;

        // Move: prázdný hex jiný než current
        moveMutation.mutate({
          sceneId: scene.id,
          op: {
            type: "token.move",
            tokenId: selectedTokenId,
            q: target.q,
            r: target.r,
          },
        });
        setSelectedTokenId(null);
      }
    },
    [
      placement,
      scene,
      panZoom,
      spawnTokenAt,
      selectedTokenId,
      canDrag,
      moveMutation,
      effectTool.activeTool,
      isPJ,
      applyEffectAtHex,
      eraseEffectsAtHex,
      fogTool.active,
      applyFogAtHex,
    ],
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
        placement.state.active ||
        selectedTokenId !== null ||
        effectTool.activeTool !== null ||
        fogTool.active
          ? handleViewportClick
          : undefined
      }
      onPointerMove={isPJ ? handleViewportPointerMove : undefined}
      onPointerUp={isPJ ? handleViewportPointerUp : undefined}
      data-placement-active={placement.state.active ? "true" : undefined}
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
            onInit={(app) => {
              appRef.current = app;
            }}
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
              <pixiContainer label="layer-effects">
                {scene && (
                  // 10.2g — mazání řeší souřadnicově handleViewportClick
                  // (klik na hex), ne Pixi hit-test → EffectsLayer je čistě
                  // render (canEdit=false).
                  <EffectsLayer
                    effects={scene.effects}
                    config={scene.config}
                    theme={theme}
                    canEdit={false}
                    onRemoveEffect={handleRemoveEffect}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-tokens">
                {scene && (
                  <TokenLayer
                    tokens={scene.tokens}
                    config={scene.config}
                    theme={theme}
                    selectedTokenId={selectedTokenId}
                    activeTurnTokenId={scene.combat?.currentTokenId ?? null}
                    spotlightTokenId={spotlightTokenId}
                    resolveImage={resolveTokenImage}
                    canDrag={canDrag}
                    isHiddenByFog={(t) =>
                      isTokenHiddenByFog(t, {
                        fogEnabled: scene.fogEnabled,
                        isPJ,
                        revealedSet,
                      })
                    }
                    onSelect={setSelectedTokenId}
                    onOpenInfo={setOpenedTokenId}
                    onTokenPointerDown={handleTokenPointerDown}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-fog">
                {scene && scene.fogEnabled && (
                  <FogLayer
                    revealedSet={revealedSet}
                    config={scene.config}
                    mapBounds={mapBounds}
                    theme={theme}
                    isPJ={isPJ}
                  />
                )}
              </pixiContainer>
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

      {openedTokenId &&
        scene &&
        worldId &&
        (() => {
          const openedToken = scene.tokens.find((t) => t.id === openedTokenId);
          if (!openedToken) return null;
          const displayName =
            openedToken.instanceName ?? openedToken.characterData?.name ?? "?";
          const editable = canDrag(openedToken);
          const deletable =
            isGlobalAdmin ||
            (userRole !== null && userRole >= WorldRole.PomocnyPJ);
          // Body osudu — Matrix-specific stat. Pro ostatní systémy se badge skryje.
          const fatePoints =
            worldSystemId === "matrix"
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
                  <>
                    {/* 10.2f — „V boji / Mimo boj" toggle (PJ) jen pro NPC/bestie.
                      PC jsou v boji vždy (nelze vyřadit) → bez toggle. */}
                    {!isPcToken(openedToken) && (
                      <button
                        type="button"
                        onClick={() => {
                          const leaving = openedToken.inCombat;
                          tokenUpdate.mutate({
                            tokenId: openedToken.id,
                            patch: { inCombat: !openedToken.inCombat },
                          });
                          // 10.2f — vyřazuji-li token, který je zrovna na tahu,
                          // posuň „na tahu" na dalšího bojovníka (jinak by kolečko
                          // viselo na nepřítomném tokenu).
                          const combat = scene.combat;
                          if (
                            leaving &&
                            combat?.isActive &&
                            combat.currentTokenId === openedToken.id
                          ) {
                            const sorted = sortByInitiativeDesc(
                              scene.tokens.filter(
                                (t) => isPcToken(t) || t.inCombat,
                              ),
                            );
                            const idx = sorted.findIndex(
                              (t) => t.id === openedToken.id,
                            );
                            let nextId: string | null = null;
                            for (let i = 1; i <= sorted.length; i++) {
                              const cand = sorted[(idx + i) % sorted.length];
                              if (cand.id !== openedToken.id) {
                                nextId = cand.id;
                                break;
                              }
                            }
                            if (nextId) {
                              const op: MapOperation = {
                                type: "combat.turn",
                                tokenId: nextId,
                                round: combat.round,
                              };
                              if (worldId) {
                                queryClient.setQueryData(
                                  mapSceneQueryKey(worldId),
                                  (prev: MapScene | null | undefined) =>
                                    prev
                                      ? applyOperationToScene(prev, op)
                                      : prev,
                                );
                              }
                              void postMapOperation(scene.id, op);
                            }
                          }
                        }}
                        style={{
                          padding: "5px 12px",
                          background: openedToken.inCombat
                            ? "rgba(255, 215, 0, 0.18)"
                            : "rgba(160, 170, 200, 0.12)",
                          color: openedToken.inCombat ? "#ffd86b" : "#aab0c8",
                          border: openedToken.inCombat
                            ? "1px solid rgba(255, 215, 0, 0.5)"
                            : "1px solid rgba(160, 170, 200, 0.35)",
                          borderRadius: 5,
                          font: "inherit",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          cursor: "pointer",
                          marginRight: 8,
                        }}
                        title={
                          openedToken.inCombat
                            ? "Vyřadit z boje (zmizí z iniciativní lišty)"
                            : "Zařadit do boje (objeví se v iniciativní liště)"
                        }
                      >
                        {openedToken.inCombat ? "⚔ V boji" : "Mimo boj"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Smazat token „${displayName}"?`)) return;
                        void postMapOperation(scene.id, {
                          type: "token.remove",
                          tokenId: openedToken.id,
                        });
                        setOpenedTokenId(null);
                      }}
                      style={{
                        padding: "5px 12px",
                        background: "rgba(255, 80, 96, 0.18)",
                        color: "#ff9090",
                        border: "1px solid rgba(255, 80, 96, 0.45)",
                        borderRadius: 5,
                        font: "inherit",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                      title={`Odebrat ${displayName} z mapy (postava v DB zůstane)`}
                    >
                      Odstranit z mapy
                    </button>
                  </>
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

      {/* 10.2f — iniciativní lišta (horní full-width). Klik na bojovníka
          = pan-to-token + select; lišta se sama skryje když nikdo není v boji. */}
      {scene && worldId && (
        <InitiativeBar
          scene={scene}
          worldId={worldId}
          systemId={worldSystemId}
          isPj={isPJ}
          myCharacterSlugs={mySlugs}
          resolveTokenImage={resolveTokenImage}
          onOpenInfo={setOpenedTokenId}
          onItemClick={(token) => {
            const p = axialToPixel(token.q, token.r, scene.config.size);
            panZoom.centerOnPoint(
              p.x + scene.config.originX,
              p.y + scene.config.originY,
            );
            setSelectedTokenId(token.id);
            // 10.2f-3 — PJ klik = spotlight (lokálně hned + broadcast ostatním).
            // Hráč jen pan/select (nebroadcastuje).
            if (isPJ) {
              triggerSpotlight(token.id);
              emitSpotlight(token.id);
            }
          }}
        />
      )}

      {/* 10.2g — dva oddělené sbalitelné docky vpravo dole (solid pozadí).
          Kreslení na mapu (efekty, PJ) vs ovládání zobrazení (zoom). Naskládané
          ve stacku — odsazují se doleva od otevřeného deníku. */}
      <MapDockStack>
        {isPJ && scene && (
          <MapToolDock title="🎨 Efekty" storageKey="effects">
            <EffectsPalette
              tool={effectTool}
              effectCount={scene.effects.length}
              onClearAll={handleClearAllEffects}
            />
          </MapToolDock>
        )}
        {isPJ && scene && (
          <MapToolDock title="🌫️ Mlha" storageKey="fog">
            <FogPalette
              tool={fogTool}
              fogEnabled={scene.fogEnabled}
              onToggleFog={handleToggleFog}
              revealedCount={scene.revealedHexes?.length ?? 0}
              onReset={handleResetFog}
            />
          </MapToolDock>
        )}
        <MapToolDock title="🖥️ Zobrazení" storageKey="view">
          <MapZoomControls
            zoom={panZoom.zoom}
            onZoomIn={() => panZoom.setZoom(panZoom.zoom + 0.1)}
            onZoomOut={() => panZoom.setZoom(panZoom.zoom - 0.1)}
            onReset={panZoom.resetZoom}
            fullscreenTargetRef={viewportRef}
          />
        </MapToolDock>
      </MapDockStack>

      {/* 10.2i — vizuální atmosféra počasí (DOM overlay nad canvasem, pod UI). */}
      <MapWeatherAtmosphere
        weather={weather.weather}
        fxEnabled={weather.fxEnabled}
      />

      {/* 10.2i — stav WS spojení (levý horní roh). */}
      <div className={styles.connectionBadgeSlot}>
        <MapConnectionBadge />
      </div>

      {/* 10.2i — počasí na mapě (pravý horní roh, otvírací). */}
      <div className={styles.weatherSlot}>
        <MapWeatherPanel
          weather={weather.weather}
          isPJ={isPJ}
          fxEnabled={weather.fxEnabled}
          toggleFx={weather.toggleFx}
          setWeather={weather.setWeather}
          clearWeather={weather.clearWeather}
          isMutating={weather.isMutating}
        />
      </div>
    </div>
  );
}
