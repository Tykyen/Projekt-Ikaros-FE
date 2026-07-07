/**
 * 10.2a/c — Hlavní komponenta taktické mapy.
 *
 * Mountuje PixiJS `<Application>` přes `@pixi/react` v8. Vrstvy v určeném
 * z-order (background → grid → effects → tokens → fog → scale → pings → ruler
 * → drawings).
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
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import axios from "axios";
import { useWorldContext } from "@/features/world/context/WorldContext";
import { WorldVoiceButton } from "@/features/voice/components/WorldVoiceButton";
import {
  worldVoiceSessionAtom,
  worldVoiceMinimizedAtom,
  worldVoiceDockedAtom,
} from "@/features/voice/store";
import { currentUserAtom } from "@/shared/store/authStore";
import { InputModal } from "@/features/admin/chat/components/InputModal";
import { WorldRole } from "@/shared/types";
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
import { PingsLayer, type PingMarker } from "./components/pings/PingsLayer";
import { screenToMap } from "./utils/screenToMap";
import { movedTooFar, isDoubleTap, type TapPoint } from "./utils/doubleTap";
import {
  effectivelyRevealed,
  fogBrushHexes,
  isTokenHiddenByFog,
} from "./components/fog/fogUtils";
import { getGridAdapter, type GridAdapter } from "./grid";
import { computeVisionReveal } from "./vision/raycast";
import { MapZoomControls } from "./components/MapZoomControls";
import { MapMeasureControls } from "./components/MapMeasureControls";
import { MapDrawingControls } from "./components/MapDrawingControls";
import { MapDrawingLayer } from "./components/MapDrawingLayer";
import { WallsLayer } from "./components/WallsLayer";
import { LightsLayer } from "./components/LightsLayer";
import { useDrawingTool } from "./hooks/useDrawingTool";
import { MapToolDock, MapDockStack } from "./components/MapToolDock";
import { MapEmptyState } from "./components/MapEmptyState";
import { MapPlacementBanner } from "./components/MapPlacementBanner";
import { HexGrid, type MapBounds } from "./components/HexGrid";
import { MapScaleFrame } from "./components/MapScaleFrame";
import {
  MapRulerLayer,
  type RulerLine,
  type RemoteRuler,
} from "./components/MapRulerLayer";
import { MapBackground } from "./components/MapBackground";
import { MapHiddenOverlay } from "./components/MapHiddenOverlay";
import { MapLockedOverlay } from "./components/MapLockedOverlay";
import { MapPjPanel } from "./components/pj-panel/MapPjPanel";
import { TokenLayer } from "./components/tokens/TokenLayer";
import type { TokenImageCrop } from "./components/tokens/TokenSprite";
import { InitiativeBar } from "./components/initiative/InitiativeBar";
import { MapConnectionBadge } from "./components/MapConnectionBadge";
import { MapWeatherPanel } from "./components/weather/MapWeatherPanel";
import { MapWeatherAtmosphere } from "./components/weather/MapWeatherAtmosphere";
import { StoryMapPill } from "./components/StoryMapPill";
import { useMapWeather } from "./hooks/useMapWeather";
import { DiceLogPanel } from "./components/dice/DiceLogPanel";
import { MapDock, type DockPanelMeta } from "./workspace/MapDock";
import { MapTidyButton } from "./workspace/MapTidyButton";
import { useMapWorkspace } from "./workspace/workspaceStore";
import { KebabMenu, type KebabMenuItem } from "@/shared/ui/KebabMenu/KebabMenu";
import { DiarySkinScope } from "@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope";
import { DiceRollButton } from "./components/dice/DiceRollButton";
import { AmbientSoundPanel } from "./components/sound/AmbientSoundPanel";
import { SceneSoundPlayer } from "./components/sound/SceneSoundPlayer";
import { useMapDiceRoll } from "./hooks/useMapDiceRoll";
import { canSeeRoll } from "./utils/diceVisibility";
import { useDiceSkinMapping } from "@/features/world/chat/dice/api/useDiceSkinMapping";
import {
  DiceRollOverlay,
  type DiceRollEvent,
} from "@/features/world/chat/dice/components/DiceRollOverlay";
import type { DicePayload } from "@/features/world/chat/dice/lib/dicePayload";
import { TokenInfoPanel } from "./components/token-panel/TokenInfoPanel";
import { TokenSystemSheet } from "./components/token-panel/TokenSystemSheet";
import { useResolvedSystemId } from "@/features/world/useResolvedSystemId";
import { useMyCharacterSlugs } from "./hooks/useMyCharacterSlugs";
import { MapNotebookButton } from "./components/notebook/MapNotebookButton";
import { MapNotebookOverlay } from "./components/notebook/MapNotebookOverlay";
import { WorldHelpModal, TacticalMapHelp } from "@/features/world/help";
import { useGmNotes, useUpdateGmNotes } from "./api/useGmNotes";
import { useCharacterNotes } from "@/features/world/pages/api/useCharacterSubdocs";
import { useUpdateCharacterNotes } from "@/features/world/pages/api/useCharacterMutations";
import { useTokenPermissions } from "./hooks/useTokenPermissions";
import { useTokenUpdate } from "./hooks/useTokenUpdate";
import { useTokenDrag } from "./hooks/useTokenDrag";
import { applyOperationToScene } from "./utils/applyOperationToScene";
import { effectiveHidden, effectiveLocked } from "./utils/sceneAccess";
import { findFirstFreeHex } from "./utils/findFirstFreeHex";
import { screenToHex } from "./utils/screenToHex";
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
import { bestiarQueryKey, useBestiar } from "@/features/world/bestiar/hooks/useBestiar";
import type { BestiarResponse, Bestie } from "@/features/world/bestiar/types";
import type {
  MapOperation,
  MapToken,
  MapScene,
  MapDiceRoll,
  MapEffect,
  MapDrawing,
  HexCoord,
  Point,
} from "./types";
import { templateCells } from "./utils/templateGeometry";
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
function effectCoversHex(
  e: MapEffect,
  q: number,
  r: number,
  adapter: GridAdapter,
): boolean {
  if (e.type === "explosion") {
    const center = e.hexes[0];
    if (!center || !e.rings?.length) return false;
    if (e.excludedHexes?.some((ex) => ex.q === q && ex.r === r)) return false;
    const maxR = Math.max(...e.rings.map((ri) => ri.radius));
    return adapter.distance(center, { q, r }) <= maxR;
  }
  return e.hexes.some((h) => h.q === q && h.r === r);
}

// 17.10 A2 — metadata čipů spodní lišty „Zmenšené" (registr drží jen stav).
// Zatím herní panely; nástroje/počasí přibudou po restrukturalizaci hlaviček.
const DOCK_META: readonly DockPanelMeta[] = [
  { id: "dice-log", title: "Hody", icon: "🎲" },
  { id: "pj", title: "Orchestrace", icon: "⚙" },
  { id: "tools-effects", title: "Efekty & kreslení", icon: "🎨" },
  { id: "tools-fog", title: "Mlha", icon: "🌫️" },
  { id: "tools-view", title: "Zobrazení", icon: "🖥️" },
  { id: "tools-ambient", title: "Ambient", icon: "🎵" },
  { id: "weather", title: "Počasí", icon: "⛅" },
  { id: "notebook", title: "Deník", icon: "✎" },
];

export function TacticalMapView(): React.ReactElement {
  const { worldId, world, userRole, loading, character } = useWorldContext();
  // Canonical systemId přes sdílený hook (D-SYSTEMID-HOOK) — žádný ruční
  // resolveSystemId(world?.system) roztroušený po komponentách.
  const worldSystemId = useResolvedSystemId() || "drd2";
  const currentUser = useAtomValue(currentUserAtom);
  // 17.10 A2 — registr workspace panelů (minimalizace do spodní lišty).
  const { workspace, setPanelState } = useMapWorkspace();
  // 17.10 — sbalený hovor jako čip v liště „Zmenšené". `docked` signál řekne
  // WorldVoiceHostu, ať skryje plovoucí pruh (čip ho na mapě zastoupí).
  const voiceSession = useAtomValue(worldVoiceSessionAtom);
  const [voiceMinimized, setVoiceMinimized] = useAtom(worldVoiceMinimizedAtom);
  const setVoiceDocked = useSetAtom(worldVoiceDockedAtom);
  useEffect(() => {
    setVoiceDocked(true);
    return () => setVoiceDocked(false);
  }, [setVoiceDocked]);
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

  // 10.2m — pingy (ephemeral „blik" na ploše). Lokální stav markerů; přidání
  // z double-clicku (vlastní) i z WS `map:pinged` (cizí). `addPing` definováno
  // před useMapScene, ať může přijmout `onPing` callback. Expiraci řeší
  // PingsLayer přes TTL (onExpire odebere marker).
  const [pings, setPings] = useState<PingMarker[]>([]);
  // 15.3 — sdílené pravítko. `rulerActive` (toggle nástroje) musí být PŘED
  // panZoom (suppress pan při měření). `remoteRulers` = cizí měření keyed userId,
  // `onRuler` přijímá WS callback (před useMapScene). `localRuler` + emit níž.
  const [rulerActive, setRulerActive] = useState(false);
  const [localRuler, setLocalRuler] = useState<RulerLine | null>(null);
  const [remoteRulers, setRemoteRulers] = useState<Map<string, RemoteRuler>>(
    () => new Map(),
  );
  const rulerDownRef = useRef<{ x: number; y: number } | null>(null);
  const rulerEmitRef = useRef(0);
  const onRuler = useCallback(
    (userId: string, userName: string, line: RulerLine | null): void => {
      setRemoteRulers((prev) => {
        const next = new Map(prev);
        if (line) next.set(userId, { userName, line });
        else next.delete(userId);
        return next;
      });
    },
    [],
  );
  const addPing = useCallback(
    (x: number, y: number, userName: string): void => {
      setPings((prev) => [
        ...prev,
        { id: crypto.randomUUID(), x, y, userName, born: performance.now() },
      ]);
    },
    [],
  );
  const removePing = useCallback((id: string): void => {
    setPings((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // 10.2j G3 — 3D dice overlay (6.3). Lokální state + přímý <DiceRollOverlay>
  // (NE chat DiceRollOverlayProvider — ten wrappuje jen chat stránku, mapu ne;
  // lokální state je robustnější a decoupled). `triggerOverlay` injektujeme do
  // useMapDiceRoll (vlastní hod) i do onLiveDiceRoll (cizí viditelný hod).
  const [diceOverlay, setDiceOverlay] = useState<DiceRollEvent | null>(null);
  const triggerOverlay = useCallback(
    (payload: DicePayload, skinId: string | null, rollerName: string) =>
      setDiceOverlay({ payload, skinId, rollerName, timestamp: Date.now() }),
    [],
  );
  const { getSkin } = useDiceSkinMapping(worldId || "");

  // 10.2j G3 — onLiveDiceRoll čte čerstvé `isPJ`/`currentUser`/`diceVisibility`,
  // které se počítají AŽ pod useMapScene. Ref drží aktuální hodnoty, stabilní
  // handler tak nere-subscribuje WS listener každý render.
  const liveDiceCtxRef = useRef({
    userId: currentUser?.id ?? "",
    isPj: false,
    visibility: world?.diceVisibility,
  });
  const handleLiveDiceRoll = useCallback(
    (roll: MapDiceRoll): void => {
      const ctx = liveDiceCtxRef.current;
      if (!ctx.userId) return;
      if (roll.byUserId === ctx.userId) return; // vlastní už spustil lokálně
      // Anti-stale: po reconnectu by catch-up nevolal, ale chrání i proti
      // opožděnému live eventu (WS lag) — staré hody nepřehráváme.
      if (Date.now() - new Date(roll.rolledAt).getTime() > 10_000) return;
      if (
        !canSeeRoll(
          roll,
          { userId: ctx.userId, isPj: ctx.isPj },
          ctx.visibility,
        )
      )
        return;
      triggerOverlay(
        roll.dicePayload,
        getSkin(roll.dicePayload.type),
        roll.rollerName,
      );
    },
    [triggerOverlay, getSkin],
  );

  // 10.2c — scene fetch + WS + cross-scene reassignment listener.
  // POZOR: `useMapScene` musí být před `useViewportPanZoom`, aby hook
  // dostal `scene.id` pro per-scéna LS klíče (10.2c-edit-5).
  const {
    scene,
    isError: isMapSceneError,
    error: mapSceneError,
    emitSpotlight,
    emitPing,
    emitRuler,
    rollDice,
  } = useMapScene(worldId || null, {
    onSpotlight: triggerSpotlight,
    onLiveDiceRoll: handleLiveDiceRoll,
    onPing: addPing,
    onRuler,
  });
  // 403 (odebrán ze scény / nemá oprávnění) vs. jiná chyba (500, síť…) — obojí
  // dřív vypadalo jako legitimní „no active scene" (viz `showEmptyState` níže).
  const mapSceneErrorStatus = axios.isAxiosError(mapSceneError)
    ? mapSceneError.response?.status
    : undefined;
  useReassignmentListener(worldId || null);

  // 10.2j — bestie tokeny dotahují obrázek z bestiar cache (resolveTokenImage →
  // lookupBestie). Cache jinak plní jen BestiePalette (PJ panel), takže při
  // sbaleném panelu — a pro hráče, který panel nemá vůbec — bestie ztrácí
  // obrázek (monogram). Načteme ji tady vždy, když scéna obsahuje bestii.
  const sceneHasBestie = scene?.tokens.some((t) => !!t.templateId) ?? false;
  useBestiar(worldId || null, worldSystemId || null, sceneHasBestie);

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
  // 15.4 — kreslicí nástroj (anotace). Aktivní = left-drag kreslí čáru/…
  const drawingTool = useDrawingTool();
  // 10.2h — poslední hex pod fog brushem (dedup při tažení, výkon).
  const lastFogHexRef = useRef<string | null>(null);
  // 10.2g — master id rozpracované brush bariéry (jeden tah = jedna bariéra).
  // Ref (ne state) → synchronní, imunní vůči staleness při rychlém tažení.
  // Reset na null při pointerup (konec tahu) a změně nástroje.
  const brushBarrierIdRef = useRef<string | null>(null);

  // 17.4 — sdílený flag „táhne se token"; useTokenDrag ho nastavuje,
  // useViewportPanZoom čte (gate 1-prstového panu). Ref vzniká PŘED oběma hooky,
  // protože panZoom je deklarován před useTokenDrag.
  const isTokenDraggingRef = useRef(false);
  const isTokenDragActive = useCallback(() => isTokenDraggingRef.current, []);

  const panZoom = useViewportPanZoom(
    viewportRef,
    scene?.id ?? null,
    effectTool.activeTool !== null ||
      placement.state.active ||
      fogTool.active ||
      rulerActive ||
      drawingTool.activeKind !== null,
    isTokenDragActive,
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
  // Elevation — admin má world bypass (MapPjPanel/ops) jen když je v tomto světě
  // „nahozený" (world.elevated); mirror BE `worldAdminBypass`. De-elevated admin
  // se na mapě chová jako jeho world role.
  const isElevatedHere = world?.elevated === true;
  // N-16 / R-AUDIT — isPJ MUSÍ zahrnout owner-bypass (world.ownerId === currentUser.id),
  // stejně jako WorldLayout/WorldContext. Bez něj owner, jehož membership dočasně
  // chybí/nedoteklo (např. Matrix svět seedovaný bez membershipu), ztratil na mapě
  // PJ nástroje (orchestraci), i když ho nav pořád bral jako PJ.
  const isPJ =
    world?.ownerId === currentUser?.id ||
    isElevatedHere ||
    (userRole !== null && userRole >= WorldRole.PomocnyPJ);

  // 10.2j G3 — drž ref pro onLiveDiceRoll aktuální (počítá se pod useMapScene).
  // Sync v effectu (ne za renderu) — `handleLiveDiceRoll` ref čte až ve WS
  // callbacku, takže effect-timed update je dost čerstvý a splňuje lint.
  useEffect(() => {
    liveDiceCtxRef.current = {
      userId: currentUser?.id ?? "",
      isPj: isPJ,
      visibility: world?.diceVisibility,
    };
  }, [currentUser?.id, isPJ, world?.diceVisibility]);

  // 10.2j G3 — orchestrace hodu (F2). Spojuje persist (rollDice z useMapScene)
  // + lokální overlay + skin resolver. Display name = postava ve světě, jinak
  // displayName / username účtu (fallback).
  const diceRollerName =
    character?.name ??
    currentUser?.displayName ??
    currentUser?.username ??
    "Hráč";

  // 10.2m — herní identita pro ping: NIKDY jméno účtu. PJ ve světě = „PJ"
  // (priorita role), jinak jméno postavy, kterou hraje (fallback „Hráč").
  const pingLabel = isPJ ? "PJ" : (character?.name ?? "Hráč");
  const mapDice = useMapDiceRoll({
    viewer: {
      userId: currentUser?.id ?? "",
      isPj: isPJ,
      displayName: diceRollerName,
    },
    rollDice,
    triggerOverlay,
    getSkin,
  });

  // 10.2d — selection state (UI-only, lokální).
  // 10.2c-edit-9e — rozděleno na 2 nezávislé states:
  //   - selectedTokenId = highlight ring (click-to-place: další klik na hex = move)
  //   - openedTokenId = otevřený modal s deníkem (přes 'i' badge)
  // V Matrixu (`MapPage.tsx:1310/1315`) jsou tyto stavy nezávislé. Klik na
  // token = SELECT. Klik na 'i' = OPEN MODAL.
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [openedTokenId, setOpenedTokenId] = useState<string | null>(null);
  // 17.10 A5 — kontextové menu (pravý klik na token/mapu) u kurzoru.
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tokenId?: string;
  } | null>(null);
  // 17.10 A4 fix — otevření karty (klik na „i"/token, pravý klik) VŽDY zruší
  // případný `minimized` stav token-card v registru; jinak gate kartu skryje
  // (po „Uklidit" / minimalizaci karty přestal klik na „i" otevírat deník v boku).
  const openTokenCard = useCallback(
    (tokenId: string): void => {
      setOpenedTokenId(tokenId);
      setPanelState("token-card", "open");
    },
    [setPanelState],
  );

  // 10.2d — permission gate pro drag.
  const mySlugs = useMyCharacterSlugs(worldId || null, currentUser?.id ?? null);
  const canDrag = useTokenPermissions({
    scene,
    isGlobalAdmin: isElevatedHere,
    isPj: userRole !== null && userRole >= WorldRole.PomocnyPJ,
    mySlugs,
    userId: currentUser?.id ?? "",
  });

  // 10.2j — poznámkový blok na mapě (tlačítko pod počasím). PJ → world gm-notes
  // (per-PJ), hráč → notes jeho jediné postavy (propisuje se do tabu Poznámky
  // na stránce postavy). Oba hooky volány vždy, gated přes `enabled`/slug.
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const playerSlug = mySlugs[0] ?? "";
  const gmNotes = useGmNotes(worldId ?? "", isPJ);
  const gmNotesMut = useUpdateGmNotes(worldId ?? "");
  const charNotes = useCharacterNotes(worldId ?? "", isPJ ? "" : playerSlug);
  const charNotesMut = useUpdateCharacterNotes(worldId ?? "", playerSlug);
  const hasNotebook = isPJ || !!playerSlug;
  const notebookData = isPJ ? gmNotes.data : charNotes.data;
  const saveNotebook = (content: string) =>
    isPJ
      ? gmNotesMut.mutateAsync(content)
      : charNotesMut.mutateAsync({ content });

  // 10.2f — token.update pro „V boji / Mimo boj" toggle v panelu tokenu.
  const tokenUpdate = useTokenUpdate(scene?.id ?? "", worldId ?? "");

  // 10.2d-B — optimistic token.move mutation s rollback.
  const queryClient = useQueryClient();

  // 10.2k — ambient playlist broadcast (op `sound.playlist`). Optimistic přes
  // applyOperationToScene + rollback (stejný pattern jako effectMutation).
  // POZOR: musí být AŽ za `const queryClient` (TDZ — jinak runtime
  // „Cannot access 'queryClient' before initialization").
  const broadcastSounds = useCallback(
    (soundIds: string[]): void => {
      if (!scene || !worldId) return;
      const op: MapOperation = { type: "sound.playlist", soundIds };
      const prev = queryClient.getQueryData<MapScene>(
        mapSceneQueryKey(worldId),
      );
      if (prev) {
        queryClient.setQueryData(
          mapSceneQueryKey(worldId),
          applyOperationToScene(prev, op),
        );
      }
      void postMapOperation(scene.id, op).catch((err) => {
        if (prev) queryClient.setQueryData(mapSceneQueryKey(worldId), prev);
        toast.error(`Hudba selhala: ${parseApiError(err)}`);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scene?.id, worldId, queryClient],
  );

  // 17.1 — PJ přepíná dveře (open/closed) → dynamická LoS se přepočítá
  // (memo dep = scene.walls). Optimistic + rollback (vzor broadcastSounds).
  const handleToggleDoor = useCallback(
    (doorId: string): void => {
      if (!scene || !worldId || !isPJ) return;
      const walls = (scene.walls ?? []).map((w) =>
        w.id === doorId && w.type === "door"
          ? {
              ...w,
              door: { open: !(w.door?.open ?? false), locked: w.door?.locked },
            }
          : w,
      );
      const op: MapOperation = { type: "scene.walls.replace", walls };
      const prev = queryClient.getQueryData<MapScene>(
        mapSceneQueryKey(worldId),
      );
      if (prev) {
        queryClient.setQueryData(
          mapSceneQueryKey(worldId),
          applyOperationToScene(prev, op),
        );
      }
      void postMapOperation(scene.id, op).catch((err) => {
        if (prev) queryClient.setQueryData(mapSceneQueryKey(worldId), prev);
        toast.error(`Dveře selhaly: ${parseApiError(err)}`);
      });
    },
     
    [scene, worldId, isPJ, queryClient],
  );
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

  // C-24 — smazání tokenu: optimistic patch + rollback + toast (stejný pattern
  // jako moveMutation). Dřív raw post bez efektu → token držel na ploše do WS
  // echa a selhání bylo tiché (modal se zavřel = dojem „smazáno").
  const removeMutation = useMutation({
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
      toast.error(`Smazání tokenu selhalo: ${parseApiError(err)}`);
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
  // 17.1 — vstupy LoS reveal vytažené jako lokální hodnoty, ať useMemo deps
  // odpovídají 1:1 tomu, co se uvnitř používá (jinak react-compiler ESLint
  // pravidlo memoizaci „nezachová" — member-access vs. optional deps).
  const sceneConfig = scene?.config;
  const sceneTokens = scene?.tokens;
  const sceneWalls = scene?.walls;
  const sceneLights = scene?.lights;
  const sceneRevealedHexes = scene?.revealedHexes;
  const revealedSet = useMemo(() => {
    // 17.1 — dynamická viditelnost: mlha odvozená z LoS PC tokenů + zdí.
    if (sceneConfig?.visionMode === 'dynamic' && mapBounds && sceneTokens) {
      return computeVisionReveal(
        sceneTokens,
        sceneWalls ?? [],
        sceneLights ?? [],
        sceneConfig,
        mapBounds,
      );
    }
    return effectivelyRevealed(sceneRevealedHexes ?? [], sceneTokens ?? []);
  }, [
    sceneConfig,
    sceneRevealedHexes,
    sceneTokens,
    sceneWalls,
    sceneLights,
    mapBounds,
  ]);

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
          hexes: fogBrushHexes(
            q,
            r,
            fogTool.brushSize,
            getGridAdapter(scene.config.gridType),
          ),
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
    isDraggingRef: isTokenDraggingRef,
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

  // D-NEW-BESTIE-FOCAL — výřez obrázku jen pro bestie tokeny (obrázek z
  // bestiáře). characterData (PC/NPC) focal nenese → undefined = původní render.
  const resolveTokenImageCrop = useCallback(
    (t: MapToken): TokenImageCrop | undefined => {
      if (t.characterData?.imageUrl) return undefined;
      const b = t.templateId ? lookupBestie(t.templateId) : undefined;
      if (!b) return undefined;
      return {
        focalX: b.imageFocalX,
        focalY: b.imageFocalY,
        zoom: b.imageZoom,
        fit: b.imageFit,
      };
    },
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
        ? findFirstFreeHex(
            scene.tokens,
            { q: targetQ, r: targetR },
            getGridAdapter(scene.config.gridType).neighbors,
          )
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
                hexes: getGridAdapter(scene.config.gridType).cellsInRadius(
                  q,
                  r,
                  effectTool.barrierRadius,
                ),
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
      const coverAdapter = getGridAdapter(fresh.config.gridType);
      const hits = fresh.effects.filter((e) =>
        effectCoversHex(e, q, r, coverAdapter),
      );
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

  // 10.2m — double-tap kdekoli na ploše = ping (PJ i hráč). Pointer-based
  // (NE onDoubleClick — ten je na dotyku s `touch-action: none` nespolehlivý).
  // pointerdown uloží start, pointerup vyhodnotí: tap (malý posun, ne pan) +
  // navázání na předchozí tap = double-tap → ping přesně pod prstem/kurzorem.
  const tapDownRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<TapPoint | null>(null);
  const handlePingPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      tapDownRef.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );
  const handlePingPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const down = tapDownRef.current;
      tapDownRef.current = null;
      if (!scene || !viewportRef.current) return;
      if ((e.target as HTMLElement).tagName !== "CANVAS") return;
      // Posunul se → byl to pan/drag, ne tap.
      if (!down || movedTooFar(down, { x: e.clientX, y: e.clientY })) {
        lastTapRef.current = null;
        return;
      }
      const tap: TapPoint = { t: performance.now(), x: e.clientX, y: e.clientY };
      if (isDoubleTap(lastTapRef.current, tap)) {
        lastTapRef.current = null;
        const rect = viewportRef.current.getBoundingClientRect();
        const { x, y } = screenToMap(e.clientX, e.clientY, rect, panZoom);
        addPing(x, y, pingLabel);
        emitPing(x, y, pingLabel);
      } else {
        lastTapRef.current = tap;
      }
    },
    [scene, panZoom, addPing, emitPing, pingLabel],
  );
  // 15.3 — pravítko (hráč i PJ). Drag A→B; throttled emit ostatním (~16/s);
  // release vyčistí (emit null). Aktivní jen když rulerActive (jinak no-op).
  const handleRulerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      rulerDownRef.current = p;
      setLocalRuler({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    },
    [panZoom],
  );
  const handleRulerPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const down = rulerDownRef.current;
      if (!down || !viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      const line: RulerLine = { x1: down.x, y1: down.y, x2: p.x, y2: p.y };
      setLocalRuler(line);
      const now = performance.now();
      if (now - rulerEmitRef.current > 60) {
        rulerEmitRef.current = now;
        emitRuler(line, pingLabel);
      }
    },
    [panZoom, emitRuler, pingLabel],
  );
  const handleRulerPointerUp = useCallback((): void => {
    if (!rulerDownRef.current) return;
    rulerDownRef.current = null;
    setLocalRuler(null);
    emitRuler(null, pingLabel);
  }, [emitRuler, pingLabel]);

  // 15.3 — vypnutí nástroje uprostřed měření: vyčisti lokálně + řekni ostatním
  // (jinak by cizím klientům viselo poslední měření). Guard = jen přechod
  // aktivní→neaktivní (ne při mountu).
  const rulerWasActiveRef = useRef(false);
  useEffect(() => {
    if (rulerWasActiveRef.current && !rulerActive) {
      rulerDownRef.current = null;
      setLocalRuler(null);
      emitRuler(null, pingLabel);
    }
    rulerWasActiveRef.current = rulerActive;
  }, [rulerActive, emitRuler, pingLabel]);

  // 15.3 — šablona oblasti (PJ effect tool 'template'): tažení origin→target
  // → color effect. Preview se počítá při tažení; release vytvoří effect.
  const templateOriginRef = useRef<Point | null>(null);
  const [templatePreview, setTemplatePreview] = useState<HexCoord[] | null>(
    null,
  );
  const handleTemplatePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      templateOriginRef.current = screenToMap(
        e.clientX,
        e.clientY,
        rect,
        panZoom,
      );
      setTemplatePreview([]);
    },
    [panZoom],
  );
  const handleTemplatePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const origin = templateOriginRef.current;
      if (!origin || !viewportRef.current || !scene) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      setTemplatePreview(
        templateCells(effectTool.templateShape, origin, p, scene.config),
      );
    },
    [panZoom, scene, effectTool.templateShape],
  );
  const handleTemplatePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const origin = templateOriginRef.current;
      templateOriginRef.current = null;
      setTemplatePreview(null);
      if (!origin || !viewportRef.current || !scene) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      const cells = templateCells(
        effectTool.templateShape,
        origin,
        p,
        scene.config,
      );
      if (cells.length === 0) return;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `effect-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      effectMutation.mutate({
        sceneId: scene.id,
        op: {
          type: "effect.add",
          effect: {
            id,
            type: "color",
            hexes: cells,
            color: effectTool.selectedColor,
          },
        },
      });
    },
    [
      panZoom,
      scene,
      effectTool.templateShape,
      effectTool.selectedColor,
      effectMutation,
    ],
  );

  // 15.4 — kreslení anotací (PJ vždy; hráč když scéna povolí). Reuse
  // effectMutation (generická op mutace s optimistic + rollback).
  const drawingOriginRef = useRef<Point | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<MapDrawing | null>(null);
  const drawId = (): string =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commitDrawing = useCallback(
    (kind: MapDrawing["kind"], points: number[], text?: string): void => {
      if (!scene) return;
      const drawing: MapDrawing = {
        id: drawId(),
        kind,
        points,
        color: drawingTool.color,
        createdByUserId: currentUser?.id ?? "",
        visibility: drawingTool.visibility,
        ...(text ? { text } : {}),
      };
      effectMutation.mutate({
        sceneId: scene.id,
        op: { type: "drawing.add", drawing },
      });
    },
    [
      scene,
      effectMutation,
      drawingTool.color,
      drawingTool.visibility,
      currentUser,
    ],
  );
  // Text anotace — nahrazuje nativní `window.prompt` (neskinovaný OS dialog) za
  // sdílený InputModal (portál i do fullscreenu mapy). Drží map-space bod, kam se
  // text umístí po potvrzení.
  const [textAnchor, setTextAnchor] = useState<{ x: number; y: number } | null>(
    null,
  );
  const handleDrawingPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!viewportRef.current || !scene || !drawingTool.activeKind) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      if (drawingTool.activeKind === "text") {
        setTextAnchor({ x: p.x, y: p.y });
        return;
      }
      drawingOriginRef.current = p;
      setDrawingPreview({
        id: "__draw_preview__",
        kind: drawingTool.activeKind,
        points: [p.x, p.y, p.x, p.y],
        color: drawingTool.color,
        createdByUserId: currentUser?.id ?? "",
        visibility: drawingTool.visibility,
      });
    },
    [
      scene,
      panZoom,
      drawingTool.activeKind,
      drawingTool.color,
      drawingTool.visibility,
      currentUser,
    ],
  );
  const handleDrawingPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const origin = drawingOriginRef.current;
      if (!origin || !viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      setDrawingPreview((prev) =>
        prev ? { ...prev, points: [origin.x, origin.y, p.x, p.y] } : prev,
      );
    },
    [panZoom],
  );
  const handleDrawingPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const origin = drawingOriginRef.current;
      drawingOriginRef.current = null;
      setDrawingPreview(null);
      if (
        !origin ||
        !viewportRef.current ||
        !drawingTool.activeKind ||
        drawingTool.activeKind === "text"
      )
        return;
      const rect = viewportRef.current.getBoundingClientRect();
      const p = screenToMap(e.clientX, e.clientY, rect, panZoom);
      // Bez tažení (klik) → nevytvářej degenerovanou kresbu.
      if (Math.hypot(p.x - origin.x, p.y - origin.y) < 4) return;
      commitDrawing(drawingTool.activeKind, [origin.x, origin.y, p.x, p.y]);
    },
    [panZoom, drawingTool.activeKind, commitDrawing],
  );
  const handleRemoveDrawing = useCallback(
    (id: string): void => {
      if (!scene) return;
      effectMutation.mutate({
        sceneId: scene.id,
        op: { type: "drawing.remove", drawingId: id },
      });
    },
    [scene, effectMutation],
  );
  const handleClearMyDrawings = useCallback((): void => {
    if (!scene) return;
    for (const d of scene.drawings ?? []) {
      if (d.createdByUserId === currentUser?.id) {
        effectMutation.mutate({
          sceneId: scene.id,
          op: { type: "drawing.remove", drawingId: d.id },
        });
      }
    }
  }, [scene, effectMutation, currentUser]);
  const handleClearAllDrawings = useCallback((): void => {
    if (!scene) return;
    effectMutation.mutate({
      sceneId: scene.id,
      op: { type: "drawing.clear" },
    });
  }, [scene, effectMutation]);

  // PJ brush-konec + ping detekce v jednom pointerup (ping má všechny role).
  const handleViewportPointerUpAll = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (isPJ) handleViewportPointerUp();
      handlePingPointerUp(e);
    },
    [isPJ, handleViewportPointerUp, handlePingPointerUp],
  );

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
      // 15.3 — `template` se umisťuje tažením (pointer down/move/up), NE klikem.
      if (
        effectTool.activeTool &&
        effectTool.activeTool !== "template" &&
        isPJ
      ) {
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

  // Empty state: world ready ale scéna chybí (hráč není přiřazený). Rozlišujeme
  // 403 (odebrán ze scény / bez oprávnění) a jinou chybu (500, síť…) od
  // skutečně prázdného stavu — jinak by obě chyby tiše vypadaly jako "čekej,
  // až tě PJ přiřadí" (FIX-1).
  const showForbiddenState = !loading && isMapSceneError && mapSceneErrorStatus === 403;
  const showMapErrorState = !loading && isMapSceneError && mapSceneErrorStatus !== 403;
  const showEmptyState =
    !loading && !isMapSceneError && (!worldId || !scene);

  // Hidden overlay jen pro hráče (PJ vidí scénu vždy).
  // 10.2n — efektivní skrytí: per-hráč override ?? per-scéna default.
  const showHidden =
    !!scene && !isPJ && effectiveHidden(scene, currentUser?.id ?? "");

  // Locked banner jen pro hráče (PJ může pokračovat).
  const showLocked =
    !!scene && !isPJ && effectiveLocked(scene, currentUser?.id ?? "");

  // 15.3 — šablona oblasti je aktivní (PJ + nástroj 'template') → tažení po
  // mapě má přednost před ping/effect-click.
  const templateActive = isPJ && effectTool.activeTool === "template";
  // 15.4 — kreslení aktivní (vybraný druh + oprávnění: PJ vždy, hráč jen když
  // scéna povolí). Hráč může i 'pj' kresbu (soukromá poznámka PJ).
  const canDraw = isPJ || (scene?.config.allowPlayerDrawing ?? false);
  const drawingActive = canDraw && drawingTool.activeKind !== null;

  // 17.10 A5 — pravý klik: hit-test hexu pod kurzorem → token vs. prázdná mapa.
  const handleContextMenu = (e: React.MouseEvent): void => {
    if (!scene || !viewportRef.current) return;
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const hex = screenToHex(e.clientX, e.clientY, rect, panZoom, scene.config);
    const token = scene.tokens.find((t) => t.q === hex.q && t.r === hex.r);
    setContextMenu({ x: e.clientX, y: e.clientY, tokenId: token?.id });
  };

  const contextItems: KebabMenuItem[] = contextMenu?.tokenId
    ? [
        {
          key: "open",
          label: "Otevřít kartu",
          icon: "📜",
          onClick: () => {
            const tid = contextMenu?.tokenId;
            if (tid) {
              setOpenedTokenId(tid);
              setPanelState("token-card", "open");
            }
            setContextMenu(null);
          },
        },
      ]
    : [
        {
          key: "measure",
          label: "Změřit vzdálenost",
          icon: "📏",
          onClick: () => {
            setRulerActive(true);
            setContextMenu(null);
          },
        },
      ];

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- viewport je event-capture plocha nad PixiJS canvasem (pan/zoom/klik na figurky řeší canvas), ne interaktivní DOM prvek
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-testid="tactical-map-viewport"
      onContextMenu={handleContextMenu}
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
      onPointerDown={(e) => {
        // 15.3 — pravítko (všichni) a šablona (PJ) mají přednost; jinak ping.
        if (rulerActive) {
          handleRulerPointerDown(e);
          return;
        }
        if (templateActive) {
          handleTemplatePointerDown(e);
          return;
        }
        if (drawingActive) {
          handleDrawingPointerDown(e);
          return;
        }
        handlePingPointerDown(e);
      }}
      onPointerMove={(e) => {
        if (rulerActive) {
          handleRulerPointerMove(e);
          return;
        }
        if (templateActive) {
          handleTemplatePointerMove(e);
          return;
        }
        if (drawingActive) {
          handleDrawingPointerMove(e);
          return;
        }
        if (isPJ) handleViewportPointerMove(e);
      }}
      onPointerUp={(e) => {
        if (rulerActive) {
          handleRulerPointerUp();
          return;
        }
        if (templateActive) {
          handleTemplatePointerUp(e);
          return;
        }
        if (drawingActive) {
          handleDrawingPointerUp(e);
          return;
        }
        handleViewportPointerUpAll(e);
      }}
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
              {/* 15.3 — živý náhled šablony oblasti (přes EffectsLayer jako
                  dočasný color effect; necommitnuto dokud PJ nepustí). */}
              <pixiContainer label="layer-template-preview">
                {scene && templatePreview && templatePreview.length > 0 && (
                  <EffectsLayer
                    effects={[
                      {
                        id: "__template_preview__",
                        type: "color",
                        hexes: templatePreview,
                        color: effectTool.selectedColor,
                      },
                    ]}
                    config={scene.config}
                    theme={theme}
                    canEdit={false}
                    onRemoveEffect={() => {}}
                  />
                )}
              </pixiContainer>
              {/* 17.1 — glow světel (jen temná scéna); pod tokeny a mlhou. */}
              <pixiContainer label="layer-lighting">
                {scene && (
                  <LightsLayer
                    lights={scene.lights ?? []}
                    visible={scene.config.darkness === true}
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
                    resolveImageCrop={resolveTokenImageCrop}
                    canDrag={canDrag}
                    isHiddenByFog={(t) =>
                      isTokenHiddenByFog(t, {
                        fogEnabled: scene.fogEnabled,
                        isPJ,
                        revealedSet,
                      })
                    }
                    onSelect={setSelectedTokenId}
                    onOpenInfo={openTokenCard}
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
              {/* 17.2 — zdi/dveře z importu UVTT (jen PJ; „spící data" pro 17.1). */}
              <pixiContainer label="layer-walls">
                {scene && (
                  <WallsLayer
                    walls={scene.walls ?? []}
                    visible={isPJ}
                    onToggleDoor={isPJ ? handleToggleDoor : undefined}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-scale">
                {scene && (
                  <MapScaleFrame
                    config={scene.config}
                    theme={theme}
                    mapBounds={mapBounds}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-pings">
                {scene && (
                  <PingsLayer
                    pings={pings}
                    config={scene.config}
                    theme={theme}
                    onExpire={removePing}
                  />
                )}
              </pixiContainer>
              <pixiContainer label="layer-ruler">
                {scene &&
                  (localRuler || remoteRulers.size > 0) && (
                    <MapRulerLayer
                      local={localRuler}
                      remotes={[...remoteRulers.values()]}
                      config={scene.config}
                      theme={theme}
                    />
                  )}
              </pixiContainer>
              {/* 15.4 — anotace (kresby) + živý náhled rozkreslené. */}
              <pixiContainer label="layer-drawings">
                {scene && (
                  <MapDrawingLayer
                    drawings={scene.drawings ?? []}
                    theme={theme}
                    isPJ={isPJ}
                    currentUserId={currentUser?.id ?? null}
                    removable={drawingActive}
                    onRemove={handleRemoveDrawing}
                  />
                )}
                {drawingPreview && (
                  <MapDrawingLayer
                    drawings={[drawingPreview]}
                    theme={theme}
                    isPJ={isPJ}
                    currentUserId={currentUser?.id ?? null}
                    removable={false}
                    onRemove={() => {}}
                  />
                )}
              </pixiContainer>
            </pixiContainer>
          </Application>
        </div>
      )}

      {(showEmptyState || showForbiddenState || showMapErrorState) && (
        <MapEmptyState
          variant={
            showForbiddenState ? "forbidden" : showMapErrorState ? "error" : "empty"
          }
          isPJ={isPJ}
          worldId={worldId ?? undefined}
          currentUserId={currentUser?.id}
        />
      )}
      {showHidden && <MapHiddenOverlay />}
      {showLocked && <MapLockedOverlay />}

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
            isElevatedHere ||
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
              // Klíč = id tokenu → při přepnutí na jiný token se panel REMOUNTuje
              // a vnitřní stav (BestiePanelView/combat sheety drží useState ze
              // snapshotu tokenu) se reinicializuje. Bez toho ukazoval pořád
              // prvního (musel se zavřít a otevřít znovu).
              key={openedToken.id}
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
                            ? "rgb(var(--map-ui-gold-rgb) / 0.18)"
                            : "rgb(var(--map-ui-muted-rgb) / 0.12)",
                          color: openedToken.inCombat ? "var(--map-ui-gold-text)" : "var(--map-ui-muted-solid)",
                          border: openedToken.inCombat
                            ? "1px solid rgb(var(--map-ui-gold-rgb) / 0.5)"
                            : "1px solid rgb(var(--map-ui-muted-rgb) / 0.35)",
                          borderRadius: 5,
                          font: "inherit",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          cursor: "pointer",
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
                    {/* D-066 — per-token lock toggle (PJ). Zamčený token hráč
                      nemůže táhnout (nezávisle na zámku scény). */}
                    <button
                      type="button"
                      onClick={() =>
                        tokenUpdate.mutate({
                          tokenId: openedToken.id,
                          patch: { isLocked: !openedToken.isLocked },
                        })
                      }
                      style={{
                        padding: "5px 12px",
                        background: openedToken.isLocked
                          ? "rgb(var(--map-ui-locked-rgb) / 0.18)"
                          : "rgb(var(--map-ui-muted-rgb) / 0.12)",
                        color: openedToken.isLocked ? "var(--map-ui-locked-solid)" : "var(--map-ui-muted-solid)",
                        border: openedToken.isLocked
                          ? "1px solid rgb(var(--map-ui-locked-rgb) / 0.5)"
                          : "1px solid rgb(var(--map-ui-muted-rgb) / 0.35)",
                        borderRadius: 5,
                        font: "inherit",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                      title={
                        openedToken.isLocked
                          ? "Odemknout token (hráč jím opět může pohnout)"
                          : "Zamknout token (hráč jím nepohne, jen PJ)"
                      }
                    >
                      {openedToken.isLocked ? "🔒 Zamčen" : "🔓 Zamknout"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Smazat token „${displayName}"?`)) return;
                        // C-24 — optimistic remove + rollback (viz removeMutation).
                        removeMutation.mutate({
                          sceneId: scene.id,
                          op: {
                            type: "token.remove",
                            tokenId: openedToken.id,
                          },
                        });
                        setOpenedTokenId(null);
                      }}
                      style={{
                        padding: "5px 12px",
                        background: "rgb(var(--map-ui-danger-rgb) / 0.18)",
                        color: "var(--map-ui-danger-solid)",
                        border: "1px solid rgb(var(--map-ui-danger-rgb) / 0.45)",
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
                // 10.2j Task H — sheet hody (skill + iniciativa) směruj do map
                // dice systému (3D overlay + map log). Gate dle `editable`
                // (= canDrag: PJ na všechno, hráč jen vlastní token) → hráč
                // nehází za cizí token (BE authorizer by to stejně 403).
                onMapRoll={editable ? mapDice.roll : undefined}
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
          onOpenInfo={openTokenCard}
          onHelp={() => setHelpOpen(true)}
          onItemClick={(token) => {
            const p = getGridAdapter(scene.config.gridType).toPixel(
              token.q,
              token.r,
              scene.config.size,
            );
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
        {/* 17.10 A2.3 — Uklidit/Vrátit (nad nástroji; kostky = výjimka). */}
        <MapTidyButton panels={DOCK_META} />
        {scene && currentUser && worldId && (
          <DiceRollButton
            worldId={worldId}
            worldSlug={world?.slug ?? ""}
            worldDice={world?.dice ?? []}
            canManageWorld={isPJ}
            onRoll={(dicePayload) =>
              mapDice.roll({ category: "custom", dicePayload })
            }
          />
        )}
        {/* 15.4 — kreslení je SOUČÁSTÍ docku Efekty (PJ efekty + kresby; hráč
            jen kresby, když scéna povolí). */}
        {scene &&
          (isPJ || canDraw) &&
          workspace["tools-effects"].state !== "minimized" && (
            <MapToolDock
              title="🎨 Efekty & kreslení"
              storageKey="effects"
              defaultCollapsed
            >
            {isPJ && (
              <EffectsPalette
                tool={effectTool}
                effectCount={scene.effects.length}
                onClearAll={handleClearAllEffects}
              />
            )}
            {canDraw && (
              <>
                {isPJ && <div className={styles.dockDivider}>✏️ Kreslení</div>}
                <MapDrawingControls
                  tool={drawingTool}
                  isPJ={isPJ}
                  onClearMine={handleClearMyDrawings}
                  onClearAll={handleClearAllDrawings}
                />
              </>
            )}
          </MapToolDock>
        )}
        {isPJ && scene && workspace["tools-fog"].state !== "minimized" && (
          <MapToolDock title="🌫️ Mlha" storageKey="fog" defaultCollapsed>
            <FogPalette
              tool={fogTool}
              fogEnabled={scene.fogEnabled}
              onToggleFog={handleToggleFog}
              revealedCount={scene.revealedHexes?.length ?? 0}
              onReset={handleResetFog}
            />
          </MapToolDock>
        )}
        {/* 15.3 — měření (pravítko) je SOUČÁSTÍ docku Zobrazení (hráč i PJ). */}
        {workspace["tools-view"].state !== "minimized" && (
          <MapToolDock title="🖥️ Zobrazení" storageKey="view" defaultCollapsed>
            <MapZoomControls
              zoom={panZoom.zoom}
              onZoomIn={() => panZoom.setZoom(panZoom.zoom + 0.1)}
              onZoomOut={() => panZoom.setZoom(panZoom.zoom - 0.1)}
              onReset={panZoom.resetZoom}
              fullscreenTargetRef={viewportRef}
            />
            {scene && <div className={styles.dockDivider}>📏 Měření</div>}
            {scene && (
              <MapMeasureControls
                active={rulerActive}
                onToggle={() => setRulerActive((v) => !v)}
              />
            )}
          </MapToolDock>
        )}
        {/* 10.2n — ambient ovládání (PJ) pod Zobrazením v pravém dolním stacku.
            Vlastní sbalitelná hlavička (· vysílá indikátor) + cyan sound-accent. */}
        {isPJ && scene && workspace["tools-ambient"].state !== "minimized" && (
          <AmbientSoundPanel scene={scene} onBroadcast={broadcastSounds} />
        )}
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
        {/* 17.10 — NALEVO: počasí + deník (+ ambient přehrávač). */}
        <div className={styles.slotLeft}>
          {workspace["weather"].state !== "minimized" && (
            <MapWeatherPanel
              weather={weather.weather}
              isPJ={isPJ}
              fxEnabled={weather.fxEnabled}
              toggleFx={weather.toggleFx}
              setWeather={weather.setWeather}
              clearWeather={weather.clearWeather}
              isMutating={weather.isMutating}
            />
          )}
          {/* 10.2j — poznámkový blok. PJ = deník napříč světem, hráč = poznámky
              jeho postavy. Hráč bez postavy → skryto. */}
          {hasNotebook && workspace["notebook"].state !== "minimized" && (
            <MapNotebookButton
              label={isPJ ? "Deník" : "Poznámky"}
              onClick={() => setNotebookOpen(true)}
            />
          )}
          {/* 10.2n — „co hraje" (ambient přehrávač). Sám se skryje, když nic
              nehraje (vrací null). */}
          {scene && <SceneSoundPlayer scene={scene} />}
        </div>
        {/* 17.10 — NAPRAVO: hovor + mapa. */}
        <div className={styles.slotRight}>
          {/* 17.6 — připojit se k hlasovému hovoru světa (sdílený s chatem). */}
          <WorldVoiceButton worldId={worldId} />
          {/* 16.5b — příběhová mapa propojená s aktivní scénou (jen když existuje
              a je přístupná; jinak vrací null). */}
          <StoryMapPill worldId={worldId} sceneId={scene?.id ?? null} />
        </div>
      </div>

      {/* 13.6 — modal s nápovědou k taktické mapě. */}
      <WorldHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Nápověda — Taktická mapa"
        size="lg"
      >
        <TacticalMapHelp audience={isPJ ? "pj" : "hrac"} />
      </WorldHelpModal>

      {/* Text anotace (kreslicí nástroj „Text") — náhrada nativního window.prompt
          za sdílený, skinovaný InputModal (portál i do fullscreenu mapy). */}
      <InputModal
        open={textAnchor !== null}
        onClose={() => setTextAnchor(null)}
        title="Text anotace"
        label="Text anotace:"
        placeholder="Napiš text…"
        confirmLabel="OK"
        onConfirm={(value) => {
          if (textAnchor)
            commitDrawing("text", [textAnchor.x, textAnchor.y], value);
        }}
      />

      {/* 10.2j — overlay přes celý viewport (uvnitř fullscreenu mapy). Mountuje
          se až jsou data načtená, aby initialContent nebyl prázdný. */}
      {notebookOpen && hasNotebook && notebookData && (
        <MapNotebookOverlay
          title={isPJ ? "Deník PJ" : "Poznámky"}
          subtitle={isPJ ? world?.name : character?.name}
          initialContent={notebookData.content}
          onSave={saveNotebook}
          onClose={() => setNotebookOpen(false)}
        />
      )}

      {/* 10.2j — sjednocený sloupec vlevo dole: tlačítko „vlastní hod" + log hodů
          + orchestrace (PJ). Log sedí PŘÍMO nad orchestrací a hýbe se s jejím
          rozbalením (společný bottom-anchored flex kontejner). Kostky vyžadují
          aktivní scénu; orchestrace se zobrazí i bez ní (PJ přes ni scény
          aktivuje), proto je kontejner podmíněn `scene || isPJ`. */}
      {worldId && currentUser && (scene || isPJ) && (
        // 16.2c-F3 — celý levý sloupec (log hodů + orchestrace) v JEDNOM
        // DiarySkinScope → oba panely nesou deníkový skin (data-diary-system +
        // dědičnost --dd-*/--mx-*). display:contents = nemění layout stacku.
        <DiarySkinScope worldId={worldId} style={{ display: "contents" }}>
          <div className={styles.bottomLeftStack}>
            {scene && workspace["dice-log"].state !== "minimized" && (
              <DiceLogPanel
                rolls={scene.diceRolls ?? []}
                viewer={{ userId: currentUser.id, isPj: isPJ }}
                visibility={world?.diceVisibility}
                sceneId={scene.id}
                onMinimize={() => setPanelState("dice-log", "minimized")}
              />
            )}
            {isPJ && workspace["pj"].state !== "minimized" && (
              <MapPjPanel
                worldId={worldId}
                currentScene={scene}
                currentUserId={currentUser.id}
                onStartPlacement={placement.start}
                onMinimize={() => setPanelState("pj", "minimized")}
              />
            )}
          </div>
        </DiarySkinScope>
      )}

      {/* 10.2j G3 — fullscreen 3D dice overlay (lokální hod + cizí viditelný).
          warmup: přednahřeje 3D engine při otevření mapy → první hod se zobrazí
          napoprvé (jinak studený engine spolkne první hod, viz „hodit dvakrát"). */}
      <DiarySkinScope worldId={worldId} style={{ display: "contents" }}>
        <DiceRollOverlay
          warmup
          roll={diceOverlay}
          onDone={() => setDiceOverlay(null)}
        />
      </DiarySkinScope>

      {/* 17.10 A2 — spodní lišta „Zmenšené": čipy minimalizovaných panelů
          (klik = nahodí). Sama se skryje, když není nic minimalizované. */}
      <MapDock
        panels={DOCK_META}
        extraChips={
          voiceSession?.worldId === worldId && voiceMinimized
            ? [
                {
                  key: "voice",
                  title: "Hovor",
                  icon: "📞",
                  onClick: () => setVoiceMinimized(false),
                },
              ]
            : []
        }
      />

      {/* 17.10 A5 — kontextové menu pravého kliku (token / mapa) u kurzoru. */}
      <KebabMenu
        anchor={null}
        anchorPoint={
          contextMenu ? { x: contextMenu.x, y: contextMenu.y } : undefined
        }
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        items={contextItems}
        ariaLabel="Akce na mapě"
      />
    </div>
  );
}
