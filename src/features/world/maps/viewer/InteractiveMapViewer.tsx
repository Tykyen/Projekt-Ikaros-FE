import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  X,
  Pencil,
  Send,
  ListTree,
  Link2,
  Navigation,
  Plus,
  Minus,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMaps } from '../api/useWorldMaps';
import {
  useCreatePin,
  useUpdatePin,
  useDeletePin,
} from '../api/useWorldMapPins';
import { useUpdateWorldMap } from '../api/useWorldMapMutations';
import { clusterPins, type PinClusterItem } from './lib/clusterPins';
import { pinIcon, pinColor, DEAD_PIN_COLOR } from '../constants/pinAppearance';
import { PinLayer } from './PinLayer';
import { PinEditorPopover } from './PinEditorPopover';
import { PinListPanel } from './PinListPanel';
import { SceneLinkPopover } from './SceneLinkPopover';
import { SendToChatPopover } from './SendToChatPopover';
import type { CreatePinInput, WorldMapPin } from '../types';
import s from './viewer.module.css';

interface Props {
  worldId: string;
  mapId: string;
  onClose: () => void;
}

interface Interaction {
  kind: 'pan' | 'pin';
  pin?: WorldMapPin;
  startX: number;
  startY: number;
  origTx: number;
  origTy: number;
  moved: boolean;
}

interface EditorState {
  editing: WorldMapPin | null;
  pending: { x: number; y: number } | null;
  pos: { left: number; top: number };
}

const MAX_SCALE = 4;

/**
 * 16.5 — interaktivní prohlížeč mapy s vlaječkami. Čte mapu z `useWorldMaps`
 * dle `mapId` → po pin mutaci se sám překreslí. Zoom/pan, tooltip, čtecí
 * bublina, PJ editor (klik = nový, klik na pin = úprava, tažení = přesun),
 * shlukování při odzoomu, panel „Vlaječky", propojení scény, poslat do chatu.
 */
export function InteractiveMapViewer({ worldId, mapId, onClose }: Props) {
  const { worldSlug, isPJ } = useWorldContext();
  const navigate = useNavigate();
  const { data: maps = [] } = useWorldMaps(worldId);

  const [currentMapId, setCurrentMapId] = useState(mapId);
  const map = useMemo(
    () => maps.find((m) => m.id === currentMapId) ?? null,
    [maps, currentMapId],
  );

  const createPin = useCreatePin(worldId, currentMapId);
  const updatePin = useUpdatePin(worldId, currentMapId);
  const deletePin = useDeletePin(worldId, currentMapId);
  const updateMap = useUpdateWorldMap(worldId);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction | null>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [panning, setPanning] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hoverPin, setHoverPin] = useState<WorldMapPin | null>(null);
  const [readPin, setReadPin] = useState<WorldMapPin | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [scenePop, setScenePop] = useState<DOMRect | null>(null);
  const [chatPop, setChatPop] = useState<DOMRect | null>(null);
  const [baseSize, setBaseSize] = useState({ w: 1, h: 1 });
  const [imgRatio, setImgRatio] = useState<number | null>(null);
  const [dragPinId, setDragPinId] = useState<string | null>(null);
  const [dragOverride, setDragOverride] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Měř neškálovanou velikost canvasu (offsetWidth/Height = před transformem).
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setBaseSize({ w: el.offsetWidth || 1, h: el.offsetHeight || 1 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [imgRatio]);

  // Escape zavírá popovery → jinak celý viewer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (editor) setEditor(null);
      else if (readPin) setReadPin(null);
      else if (scenePop || chatPop) {
        setScenePop(null);
        setChatPop(null);
      } else onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editor, readPin, scenePop, chatPop, onClose]);

  const pins = map?.pins ?? [];
  const accessibleMapIds = useMemo(
    () => new Set(maps.map((m) => m.id)),
    [maps],
  );
  const deadIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of pins) {
      if (
        (p.targetType === 'map' &&
          (!p.targetMapId || !accessibleMapIds.has(p.targetMapId))) ||
        (p.targetType === 'page' && !p.targetSlug)
      ) {
        set.add(p.id);
      }
    }
    return set;
  }, [pins, accessibleMapIds]);

  const pinsForRender = useMemo(
    () =>
      dragPinId && dragOverride
        ? pins.map((p) =>
            p.id === dragPinId ? { ...p, x: dragOverride.x, y: dragOverride.y } : p,
          )
        : pins,
    [pins, dragPinId, dragOverride],
  );

  const clusters: PinClusterItem[] = useMemo(() => {
    if (dragPinId) return pinsForRender.map((p) => ({ id: p.id, x: p.x, y: p.y, pins: [p] }));
    return clusterPins(pinsForRender, {
      width: baseSize.w,
      height: baseSize.h,
      scale,
    });
  }, [pinsForRender, dragPinId, baseSize, scale]);

  // ── Souřadnicové převody (přes živý rect canvasu, letterbox-safe) ──────────
  function clientToNorm(cx: number, cy: number): { x: number; y: number } {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (cx - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (cy - r.top) / r.height)),
    };
  }
  function pinStagePos(pin: WorldMapPin): { left: number; top: number } {
    const cr = canvasRef.current?.getBoundingClientRect();
    const sr = stageRef.current?.getBoundingClientRect();
    if (!cr || !sr) return { left: 0, top: 0 };
    return {
      left: cr.left - sr.left + pin.x * cr.width,
      top: cr.top - sr.top + pin.y * cr.height,
    };
  }

  // ── Zoom / focus ───────────────────────────────────────────────────────────
  function resetTransform() {
    setScale(1);
    setTx(0);
    setTy(0);
  }
  function focusOn(cx: number, cy: number, targetScale: number) {
    const ns = Math.max(1, Math.min(MAX_SCALE, targetScale));
    setScale(ns);
    setTx(-(cx - 0.5) * baseSize.w * ns);
    setTy(-(cy - 0.5) * baseSize.h * ns);
  }
  function zoomBy(delta: number) {
    setScale((sc) => {
      const ns = Math.max(1, Math.min(MAX_SCALE, sc + delta));
      if (ns === 1) {
        setTx(0);
        setTy(0);
      }
      return ns;
    });
  }

  // ── Pointer: pan (prázdno) + pin (klik/tažení) ─────────────────────────────
  function onStagePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-control]')) return;
    interaction.current = {
      kind: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      origTx: tx,
      origTy: ty,
      moved: false,
    };
    stageRef.current?.setPointerCapture(e.pointerId);
    setPanning(true);
  }
  function onPinPointerDown(e: React.PointerEvent, pin: WorldMapPin) {
    e.stopPropagation();
    if (e.button !== 0) return;
    interaction.current = {
      kind: 'pin',
      pin,
      startX: e.clientX,
      startY: e.clientY,
      origTx: tx,
      origTy: ty,
      moved: false,
    };
    setDragPinId(pin.id);
    setDragOverride({ x: pin.x, y: pin.y });
    setHoverPin(null);
    stageRef.current?.setPointerCapture(e.pointerId);
  }
  function onStagePointerMove(e: React.PointerEvent) {
    const it = interaction.current;
    if (!it) return;
    const dx = e.clientX - it.startX;
    const dy = e.clientY - it.startY;
    if (!it.moved && Math.hypot(dx, dy) > 4) it.moved = true;
    if (it.kind === 'pan') {
      setTx(it.origTx + dx);
      setTy(it.origTy + dy);
    } else if (it.kind === 'pin' && editMode && isPJ && it.moved) {
      setDragOverride(clientToNorm(e.clientX, e.clientY));
    }
  }
  function onStagePointerUp(e: React.PointerEvent) {
    const it = interaction.current;
    interaction.current = null;
    setPanning(false);
    try {
      stageRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* capture už uvolněná */
    }
    if (!it) return;
    if (it.kind === 'pan') {
      if (!it.moved && editMode && isPJ) {
        const norm = clientToNorm(e.clientX, e.clientY);
        const sr = stageRef.current?.getBoundingClientRect();
        openNewEditor(norm, {
          left: (sr ? e.clientX - sr.left : 0) + 10,
          top: (sr ? e.clientY - sr.top : 0) + 10,
        });
      }
    } else if (it.kind === 'pin' && it.pin) {
      const pin = it.pin;
      if (it.moved && editMode && isPJ && dragOverride) {
        updatePin.mutate({
          pinId: pin.id,
          patch: { x: dragOverride.x, y: dragOverride.y },
        });
      } else if (!it.moved) {
        if (editMode && isPJ) openEditForPin(pin);
        else activatePin(pin);
      }
      setDragPinId(null);
      setDragOverride(null);
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.2 : -0.2);
  }

  // ── Editor ──────────────────────────────────────────────────────────────────
  function clampEditorPos(left: number, top: number) {
    const sr = stageRef.current?.getBoundingClientRect();
    const w = 286;
    const h = 460;
    const maxL = sr ? sr.width - w - 8 : left;
    const maxT = sr ? sr.height - h - 8 : top;
    return {
      left: Math.max(8, Math.min(left, maxL)),
      top: Math.max(8, Math.min(top, maxT)),
    };
  }
  function openNewEditor(norm: { x: number; y: number }, pos: { left: number; top: number }) {
    setReadPin(null);
    setEditor({ editing: null, pending: norm, pos: clampEditorPos(pos.left, pos.top) });
  }
  function openEditForPin(pin: WorldMapPin) {
    setReadPin(null);
    const p = pinStagePos(pin);
    setEditor({
      editing: pin,
      pending: null,
      pos: clampEditorPos(p.left + 12, p.top + 12),
    });
  }
  function handleEditorSave(input: CreatePinInput, editingId: string | null) {
    if (editingId) {
      updatePin.mutate({ pinId: editingId, patch: input });
    } else if (editor?.pending) {
      createPin.mutate({ ...input, x: editor.pending.x, y: editor.pending.y });
    }
    setEditor(null);
  }
  function handleEditorDelete(pinId: string) {
    deletePin.mutate(pinId);
    setEditor(null);
  }

  // ── Aktivace pinu (view mód) ────────────────────────────────────────────────
  function activatePin(pin: WorldMapPin) {
    if (deadIds.has(pin.id)) {
      toast.error('Cíl vlaječky už neexistuje nebo není dostupný.');
      return;
    }
    if (pin.targetType === 'none') {
      setReadPin(pin);
      return;
    }
    if (pin.targetType === 'map' && pin.targetMapId) {
      setCurrentMapId(pin.targetMapId);
      resetTransform();
      setReadPin(null);
      setHoverPin(null);
      return;
    }
    if (pin.targetType === 'page' && pin.targetSlug) {
      onClose();
      navigate(`/svet/${worldSlug}/postava/${pin.targetSlug}`);
    }
  }

  function onClusterClick(c: PinClusterItem) {
    focusOn(c.x, c.y, Math.max(scale * 1.8, 1.8));
  }
  function onListSelect(pin: WorldMapPin) {
    focusOn(pin.x, pin.y, Math.max(scale, 2));
    setHoverPin(pin);
    setListOpen(false);
  }

  if (!map) {
    return (
      <div
        className={s.overlay}
        ref={overlayRef}
        onMouseDown={(e) => e.target === overlayRef.current && onClose()}
      >
        <div className={s.shell}>
          <div className={s.topbar}>
            <span className={s.title}>Mapa není dostupná</span>
            <span className={s.spacer} />
            <button type="button" className={s.btn} onClick={onClose}>
              <X size={16} aria-hidden /> Zavřít
            </button>
          </div>
        </div>
      </div>
    );
  }

  const linked = !!map.linkedSceneId;

  return (
    <div
      className={s.overlay}
      ref={overlayRef}
      onMouseDown={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={s.shell}>
        <div className={s.topbar}>
          <span className={s.title}>
            <span className={s.titleDot} /> {map.title}
          </span>
          <span className={s.spacer} />

          {pins.length > 0 && (
            <button
              type="button"
              className={`${s.btn} ${listOpen ? s.btnOn : ''}`}
              onClick={() => setListOpen((v) => !v)}
            >
              <ListTree size={16} aria-hidden /> Vlaječky ({pins.length})
            </button>
          )}

          <button
            type="button"
            className={s.btn}
            onClick={(e) => {
              setScenePop(null);
              setChatPop(e.currentTarget.getBoundingClientRect());
            }}
          >
            <Send size={16} aria-hidden /> Poslat do chatu
          </button>

          {isPJ && (
            <button
              type="button"
              className={`${s.btn} ${editMode ? s.btnOn : ''}`}
              onClick={() => {
                setEditMode((v) => !v);
                setEditor(null);
              }}
            >
              <Pencil size={16} aria-hidden /> {editMode ? 'Hotovo' : 'Upravit'}
            </button>
          )}

          {isPJ && (
            <button
              type="button"
              className={`${s.btn} ${linked ? s.linkLive : ''}`}
              onClick={(e) => {
                setChatPop(null);
                setScenePop(e.currentTarget.getBoundingClientRect());
              }}
              title="Propojit mapu s taktickou scénou"
            >
              <Link2 size={16} aria-hidden />{' '}
              {linked ? 'Propojeno' : 'Propojit scénu'}
            </button>
          )}

          {linked && (
            <button
              type="button"
              className={`${s.btn} ${s.linkLive}`}
              onClick={() => {
                onClose();
                navigate(`/svet/${worldSlug}/takticka-mapa`);
              }}
              title="Otevřít taktickou mapu propojené scény"
            >
              <Navigation size={16} aria-hidden /> Taktická mapa
            </button>
          )}

          <button
            type="button"
            className={`${s.btn} ${s.iconBtn}`}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div
          className={`${s.stage} ${editMode ? s.stageAdding : ''} ${panning ? s.stagePanning : ''}`}
          ref={stageRef}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onWheel={onWheel}
        >
          <div
            className={`${s.canvas} ${panning || dragPinId ? s.canvasDragging : ''}`}
            ref={canvasRef}
            style={{
              aspectRatio: imgRatio ?? undefined,
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            }}
          >
            <img
              className={s.img}
              src={map.imageUrl}
              alt={map.title}
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth && el.naturalHeight)
                  setImgRatio(el.naturalWidth / el.naturalHeight);
              }}
            />
            <PinLayer
              clusters={clusters}
              deadIds={deadIds}
              onPinPointerDown={onPinPointerDown}
              onPinEnter={(p) => !dragPinId && setHoverPin(p)}
              onPinLeave={() => setHoverPin(null)}
              onClusterClick={onClusterClick}
            />
          </div>

          {/* Zoom dock */}
          <div className={s.zoomDock} data-control>
            <button
              type="button"
              className={s.btn}
              onClick={() => zoomBy(0.25)}
              aria-label="Přiblížit"
            >
              <Plus size={16} aria-hidden />
            </button>
            <button
              type="button"
              className={s.btn}
              onClick={() => zoomBy(-0.25)}
              aria-label="Oddálit"
            >
              <Minus size={16} aria-hidden />
            </button>
            <button
              type="button"
              className={s.btn}
              onClick={resetTransform}
              aria-label="Vycentrovat"
            >
              <RotateCcw size={16} aria-hidden />
            </button>
          </div>

          {/* Tooltip (hover) */}
          {hoverPin && !editor && (
            <MapTooltip pin={hoverPin} dead={deadIds.has(hoverPin.id)} pos={pinStagePos(hoverPin)} />
          )}

          {/* Čtecí bublina (pin „jen informace") */}
          {readPin && (
            <div
              className={s.readPop}
              data-control
              style={
                {
                  ...pinStagePos(readPin),
                  '--pin-c': pinColor(readPin.color),
                } as React.CSSProperties
              }
            >
              <div className={s.rpHead}>
                <span className={s.rpIcon}>
                  <ReadIcon icon={readPin.icon} />
                </span>
                <span className={s.rpTitle}>{readPin.label}</span>
                <button
                  type="button"
                  className={s.rpClose}
                  onClick={() => setReadPin(null)}
                  aria-label="Zavřít"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
              <p className={s.rpBody}>
                {readPin.info || 'Bez dalších informací.'}
              </p>
            </div>
          )}

          {/* Panel Vlaječky */}
          {listOpen && (
            <div data-control>
              <PinListPanel
                pins={pins}
                deadIds={deadIds}
                onSelect={onListSelect}
                onClose={() => setListOpen(false)}
              />
            </div>
          )}

          {/* Editor pinu */}
          {editor && isPJ && (
            <div data-control>
              <PinEditorPopover
                worldId={worldId}
                maps={maps}
                currentMapId={currentMapId}
                editing={editor.editing}
                pos={editor.pos}
                onSave={handleEditorSave}
                onDelete={handleEditorDelete}
                onClose={() => setEditor(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed popovery mimo stage (neruší pointer stage) */}
      {scenePop && (
        <SceneLinkPopover
          worldId={worldId}
          currentSceneId={map.linkedSceneId}
          anchorRect={scenePop}
          onSave={(sceneId) => {
            updateMap.mutate({ id: currentMapId, patch: { linkedSceneId: sceneId } });
            setScenePop(null);
            toast.success(sceneId ? 'Mapa propojena se scénou.' : 'Propojení zrušeno.');
          }}
          onClose={() => setScenePop(null)}
        />
      )}
      {chatPop && (
        <SendToChatPopover
          worldId={worldId}
          map={map}
          anchorRect={chatPop}
          onClose={() => setChatPop(null)}
        />
      )}
    </div>
  );
}

/** Tooltip nad vlaječkou (hover). */
function MapTooltip({
  pin,
  dead,
  pos,
}: {
  pin: WorldMapPin;
  dead: boolean;
  pos: { left: number; top: number };
}) {
  const hint =
    pin.targetType === 'map'
      ? 'klik → otevře mapu'
      : pin.targetType === 'page'
        ? 'klik → otevře stránku'
        : 'klik → zobrazí informace';
  const typeLabel =
    pin.targetType === 'map'
      ? 'mapa'
      : pin.targetType === 'page'
        ? 'stránka'
        : 'jen informace';
  return (
    <div
      className={s.tooltip}
      style={
        {
          ...pos,
          '--pin-c': dead ? DEAD_PIN_COLOR : pinColor(pin.color),
        } as React.CSSProperties
      }
    >
      <div className={s.tipLabel}>{pin.label}</div>
      <div className={s.tipMeta}>
        {(pin.isPublic ? '' : 'tajná · ') + typeLabel}
      </div>
      {pin.info && (
        <div className={s.tipInfo}>
          {pin.info.length > 90 ? `${pin.info.slice(0, 89)}…` : pin.info}
        </div>
      )}
      <div className={s.tipHint}>{dead ? 'cíl už neexistuje' : hint}</div>
    </div>
  );
}

function ReadIcon({ icon }: { icon: string }) {
  const Icon = pinIcon(icon) ?? Info;
  return <Icon size={16} aria-hidden />;
}
