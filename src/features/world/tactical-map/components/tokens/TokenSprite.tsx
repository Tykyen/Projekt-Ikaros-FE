/**
 * 10.2d → 10.2c-edit-9d — TokenSprite (per-token vizuál na mapě).
 *
 * Layers:
 *   - ring Graphics (selected / active / default barvy z theme)
 *   - circle background + clipped sprite (Texture z token.characterData.imageUrl)
 *     NEBO fallback kruh + iniciály
 *   - label Text (instanceName ?? characterData.name)
 *   - HP bar pod label
 *   - 'i' info badge (top-left) — klik = open token modal (== select)
 *
 * Pozice: `axialToPixel(token.q, token.r) + origin + stagger`.
 *
 * 10.2c-edit-9d (2026-05-28): port klíčových UX prvků ze starého Matrixu:
 *   - TOKEN_SIZE dynamic = `config.size * 0.75` (ne fixed 28; reaguje na
 *     změnu hex size přes zoom palety)
 *   - sprite clipped do kruhu (matchuje Matrix `clipPath` circle)
 *   - 'i' badge top-left tokenu pro otevření deníku/info
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C2 + C4; fix-pack 10.2c-edit-9d.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTick } from '@pixi/react';
import { Circle } from 'pixi.js';
import type {
  Graphics as PixiGraphics,
  Container as PixiContainer,
  Ticker,
  FederatedPointerEvent,
} from 'pixi.js';
import { axialToPixel } from '../../hexUtils';
import type {
  HexConfig,
  MapThemeColors,
  MapToken,
  Point,
} from '../../types';
import { useTokenTexture } from '../../hooks/useTokenTexture';
import { getInitials } from '../../utils/getInitials';
import { TokenHpBar } from './TokenHpBar';
import { systemEntitySchemaRegistry } from '../../schemas/registry';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { resolveHpWithFallback } from '../../utils/hpTier';
import { tokenIsBestie } from '../../utils/tokenIsBestie';
import { resolveCharacterHp } from '../../utils/resolveCharacterHp';

interface Props {
  token: MapToken;
  config: HexConfig;
  theme: MapThemeColors;
  staggerOffset: Point;
  isSelected: boolean;
  isActiveTurn: boolean;
  /** 10.2f-3 — PJ na token ukázal (červený spotlight ring, dočasný). */
  isSpotlight?: boolean;
  /** Resolvuje obrázek tokenu (bestie z bestiáře přes templateId) — fresh
   *  při každém renderu, ať bestie obrázek nezmizí kvůli stale memo. */
  resolveImage?: (token: MapToken) => string | undefined;
  canDrag: boolean;
  /**
   * Klik na token tělo = jen SELECT (highlight ring; click-to-place pattern
   * jako v Matrixu — `MapPage.tsx:1310 handleTokenClick`). Žádný modal.
   */
  onSelect: (tokenId: string) => void;
  /**
   * 10.2c-edit-9e — klik na 'i' info badge = otevřít deník/info modal
   * (Matrix `MapPage.tsx:1315 handleOpenDiary`). Separate prop od `onSelect`
   * aby selection (move target) byla nezávislá od modal open.
   */
  onOpenInfo: (tokenId: string) => void;
  onPointerDown?: (e: FederatedPointerEvent, token: MapToken) => void;
}

export function TokenSprite({
  token,
  config,
  theme,
  staggerOffset,
  isSelected,
  isActiveTurn,
  isSpotlight = false,
  resolveImage,
  canDrag,
  onSelect,
  onOpenInfo,
  onPointerDown,
}: Props): React.ReactElement {
  // 10.2c-edit-9d: token radius derivovaný z hex velikosti (matrix uzanc:
  // gridSize * 0.75 — viz C:/Matrix/Matrix/frontend/src/components/Map/MapToken.tsx:71).
  const tokenSize = Math.round(config.size * 0.75);

  const center = axialToPixel(token.q, token.r, config.size);
  const x = center.x + config.originX + staggerOffset.x;
  const y = center.y + config.originY + staggerOffset.y;

  const imageUrl = resolveImage?.(token) ?? token.characterData?.imageUrl;
  const { texture } = useTokenTexture(imageUrl);

  const displayName =
    token.instanceName ?? token.characterData?.name ?? '?';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const ringColor = isSelected
    ? theme.tokenRingSelected
    : isActiveTurn
      ? theme.tokenRingActiveTurn
      : theme.tokenRingDefault;

  const drawRing = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, tokenSize + 2);
      g.stroke({ color: ringColor, width: isSelected ? 3 : 2, alpha: 1 });
    },
    [ringColor, isSelected, tokenSize],
  );

  // 10.2f — „na tahu" glow: dvě širší poloprůhledné vrstvy kolem tokenu
  // (měkký glow bez filtru). Alpha pulzuje přes useTick (mutace containeru).
  const drawActiveTurnGlow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, tokenSize + 11);
      g.stroke({ color: theme.tokenRingActiveTurnGlow, width: 7, alpha: 0.5 });
      g.circle(0, 0, tokenSize + 6);
      g.stroke({ color: theme.tokenRingActiveTurn, width: 3, alpha: 0.95 });
    },
    [theme.tokenRingActiveTurnGlow, theme.tokenRingActiveTurn, tokenSize],
  );

  // 10.2f-3 — spotlight glow (červený, širší než „na tahu", ať jsou vidět
  // oba současně když token na tahu + PJ na něj ukáže).
  const drawSpotlightGlow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, tokenSize + 15);
      g.stroke({ color: theme.tokenRingSpotlightGlow, width: 8, alpha: 0.5 });
      g.circle(0, 0, tokenSize + 9);
      g.stroke({ color: theme.tokenRingSpotlight, width: 3, alpha: 0.95 });
    },
    [theme.tokenRingSpotlight, theme.tokenRingSpotlightGlow, tokenSize],
  );

  // Pulse: mutuje alpha glow containerů přímo (žádný React re-render/frame).
  // Hook se volá vždy (pravidla hooků); když ref null / stav neaktivní, skip.
  const glowRef = useRef<PixiContainer | null>(null);
  const spotlightGlowRef = useRef<PixiContainer | null>(null);
  const pulseTimeRef = useRef(0);
  useTick((ticker: Ticker) => {
    pulseTimeRef.current += ticker.deltaMS;
    const a = 0.55 + 0.45 * Math.sin(pulseTimeRef.current / 360);
    if (glowRef.current && isActiveTurn) glowRef.current.alpha = a;
    if (spotlightGlowRef.current && isSpotlight) spotlightGlowRef.current.alpha = a;
  });

  // 10.2c-edit-9d: pozadí kruhu + circle mask pro sprite (matchuje
  // Matrix `clipPath` circle — token musí být kulatý, ne čtvercový sprite).
  const drawBackground = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, tokenSize);
      g.fill({ color: 0x1a1a1a, alpha: 1 });
    },
    [tokenSize],
  );

  const drawFallback = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, tokenSize);
      g.fill({ color: 0x2a1f55, alpha: 0.85 });
    },
    [tokenSize],
  );

  // 10.2c-edit-9f — kruhová maska pro sprite (sprite je čtvercový texture,
  // bez masky vidíme čtverec nikoli kruh). Matrix to dělal přes SVG `clipPath`;
  // PixiJS v8 mask = jiný Container v scene graphu, který slouží jako alpha
  // klip. Render mask jako pixiGraphics + uložit jeho instance přes ref
  // callback do state → použít jako sprite `mask` prop.
  const [spriteMask, setSpriteMask] = useState<PixiGraphics | null>(null);
  const drawSpriteMask = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, tokenSize);
      g.fill({ color: 0xffffff, alpha: 1 });
    },
    [tokenSize],
  );

  // 10.2c-edit-9d: 'i' info badge — port Matrix MapToken.tsx:209-235.
  // Klikatelný kruh top-left tokenu, klik = otevře modal (onOpenInfo).
  // Matrix proporce: radius * 0.25, offset radius * 0.8.
  const infoBadgeRadius = Math.round(tokenSize * 0.25);
  const infoBadgeOffset = Math.round(tokenSize * 0.8);
  const infoBadgeHitArea = useMemo(
    () => new Circle(0, 0, infoBadgeRadius),
    [infoBadgeRadius],
  );

  // 10.2c-edit-9f — kontrastnější (větší alpha + výraznější border) jako
  // Matrix MapToken.tsx — `rgba(0, 0, 0, 0.7)` + `rgba(29, 78, 216, 0.4)`.
  // 10.2g — modrý obrys odstraněn (rušil); tmavý chip má sám dost kontrastu.
  const drawInfoBadge = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, infoBadgeRadius);
      g.fill({ color: 0x000000, alpha: 0.85 });
    },
    [infoBadgeRadius],
  );

  // 10.2c-edit-9e — distance-based drag detection.
  // Time-based (< 250ms) selhával: rychlý drag = vyvolal jak drag tak select.
  // Teď: ukládáme start coords, při pointerup počítáme distance — pokud > 5px,
  // byl to drag (cancel select), jinak click (select).
  const downCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // 10.2g — stopPropagation z badge handlerů v této @pixi/react verzi
  // nezabrání rodičovskému handleru → klik na 'i' jinak spustí i drag.
  // Deterministická obrana: pokud event vznikl uvnitř info-badge subtree,
  // rodič ho ignoruje.
  const isInfoBadgeTarget = (e: FederatedPointerEvent): boolean => {
    let node = e.target as PixiContainer | null;
    while (node) {
      if (node.label === 'token-info-badge') return true;
      node = node.parent as PixiContainer | null;
    }
    return false;
  };

  const handlePointerDown = (e: FederatedPointerEvent): void => {
    if (isInfoBadgeTarget(e)) return;
    downCoordsRef.current = { x: e.client.x, y: e.client.y };
    if (canDrag && onPointerDown) onPointerDown(e, token);
  };

  const handlePointerUp = (e: FederatedPointerEvent): void => {
    if (isInfoBadgeTarget(e)) return;
    const down = downCoordsRef.current;
    downCoordsRef.current = null;
    if (!down) return;
    const dx = e.client.x - down.x;
    const dy = e.client.y - down.y;
    // Drag = pohyb > 5px → no select (drag handler v useTokenDrag řeší move)
    if (Math.abs(dx) >= 5 || Math.abs(dy) >= 5) return;
    onSelect(token.id);
  };

  const handleInfoBadgeDown = (e: FederatedPointerEvent): void => {
    // stopPropagation — chceme JEN open modal, ne select / drag start
    e.stopPropagation();
    onOpenInfo(token.id);
  };

  // 10.2g — pointerup musí taky stopnout propagaci, jinak parent handlePointerUp
  // / window drag-up dostane event po kliku na badge.
  const handleInfoBadgeUp = (e: FederatedPointerEvent): void => {
    e.stopPropagation();
  };

  return (
    <pixiContainer
      label={`token-${token.id}`}
      x={x}
      y={y}
      eventMode="static"
      cursor={canDrag ? 'grab' : 'pointer'}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* 10.2f-3 — spotlight glow (červený, úplně vespod); pulzuje. */}
      {isSpotlight && (
        <pixiContainer
          label="token-spotlight-glow"
          ref={(c: PixiContainer | null) => {
            spotlightGlowRef.current = c;
          }}
        >
          <pixiGraphics draw={drawSpotlightGlow} />
        </pixiContainer>
      )}
      {/* 10.2f — glow „na tahu" (pod hlavním ringem); pulzuje. */}
      {isActiveTurn && (
        <pixiContainer
          label="token-active-glow"
          ref={(c: PixiContainer | null) => {
            glowRef.current = c;
          }}
        >
          <pixiGraphics draw={drawActiveTurnGlow} />
        </pixiContainer>
      )}
      <pixiGraphics label="token-ring" draw={drawRing} />
      <pixiGraphics label="token-bg" draw={drawBackground} />
      {texture ? (
        <>
          {/* 10.2c-edit-9f — mask musí být v scene graphu (ne mimo).
              Ref callback uloží instance do state → použije se jako sprite.mask. */}
          <pixiGraphics
            label="token-sprite-mask"
            draw={drawSpriteMask}
            ref={(g: PixiGraphics | null) => {
              if (g && g !== spriteMask) setSpriteMask(g);
            }}
          />
          <pixiSprite
            texture={texture}
            width={tokenSize * 2}
            height={tokenSize * 2}
            anchor={0.5}
            mask={spriteMask ?? undefined}
          />
        </>
      ) : (
        <>
          <pixiGraphics label="token-fallback" draw={drawFallback} />
          <pixiText
            text={initials}
            anchor={0.5}
            style={{
              fontFamily: 'monospace',
              fontSize: Math.max(10, Math.round(tokenSize * 0.6)),
              fill: 0xffffff,
              fontWeight: 'bold',
            }}
          />
        </>
      )}

      {/* 10.2c-edit-9d — 'i' info badge top-left, klikatelný */}
      <pixiContainer
        label="token-info-badge"
        x={-infoBadgeOffset}
        y={-infoBadgeOffset}
        eventMode="static"
        cursor="pointer"
        hitArea={infoBadgeHitArea}
        onPointerDown={handleInfoBadgeDown}
        onPointerUp={handleInfoBadgeUp}
      >
        <pixiGraphics label="info-badge-bg" draw={drawInfoBadge} />
        <pixiText
          text="i"
          anchor={0.5}
          style={{
            fontFamily: 'serif',
            fontSize: Math.max(9, Math.round(infoBadgeRadius * 1.2)),
            fontStyle: 'italic',
            fill: 0xaeccff,
            fontWeight: 'bold',
          }}
        />
      </pixiContainer>

      {/* 10.2c-edit-9f — jméno tokenu odstraněno (user request).
          Tokeny mají vlastní avatar a jméno se ukáže v info modálu /
          při hover tooltip (TBD). */}
      <HpBarForToken token={token} config={config} size={tokenSize} />
    </pixiContainer>
  );
}

/**
 * 10.2g — resolve HP (schéma → fallback na currentHp/maxHp) + per-scéna
 * visibility dle typu tokenu. Vrací `null` (bez baru) když token nemá HP
 * nebo je daný typ v `scene.config` vypnutý. Default (undefined flag) = zobraz.
 */
function HpBarForToken({
  token,
  config,
  size,
}: {
  token: MapToken;
  config: HexConfig;
  size: number;
}): React.ReactElement | null {
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;
  const schema = systemId
    ? systemEntitySchemaRegistry.get(systemId, 'token')
    : null;
  const stats = token.systemStats ?? {};
  const isBestie = tokenIsBestie(token);
  let hp = resolveHpWithFallback(schema, stats, token.currentHp, token.maxHp);
  // PC/NPC nemají systemStats ani token.maxHp — HP žije v deníku postavy
  // (per-system klíč). Bestie už vyřešené výše ze snapshotnutých systemStats.
  if (!hp && !isBestie) {
    const ch = resolveCharacterHp(systemId, token.characterData?.customData);
    if (ch) {
      hp = {
        current: ch.current,
        max: ch.max,
        percent: ch.max > 0 ? Math.max(0, Math.min(1, ch.current / ch.max)) : 0,
      };
    }
  }
  if (!hp) return null;

  // Typ tokenu → odpovídající visibility flag (chybí = true).
  const visible = isBestie
    ? config.showHpBestie
    : token.isNpc
      ? config.showHpNpc
      : config.showHpPc;
  if (visible === false) return null;

  return <TokenHpBar current={hp.current} max={hp.max} size={size} />;
}
