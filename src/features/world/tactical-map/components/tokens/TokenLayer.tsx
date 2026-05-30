/**
 * 10.2d — TokenLayer (vrstva všech tokenů na scéně).
 *
 * Iteruje `scene.tokens` → `TokenSprite`. Multi-token stagger přes
 * `computeStaggerOffsets`. Selection state + canDrag callback od parent.
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C2.
 */
import { useMemo } from 'react';
import type { FederatedPointerEvent } from 'pixi.js';
import { computeStaggerOffsets } from '../../utils/tokenStaggerOffset';
import { TokenSprite } from './TokenSprite';
import type {
  HexConfig,
  MapThemeColors,
  MapToken,
} from '../../types';

interface Props {
  tokens: MapToken[];
  config: HexConfig;
  theme: MapThemeColors;
  selectedTokenId: string | null;
  activeTurnTokenId?: string | null;
  /** 10.2f-3 — token, na který PJ ukázal (červený spotlight ring). */
  spotlightTokenId?: string | null;
  /** Resolvuje obrázek tokenu (bestie přes templateId, fresh každý render). */
  resolveImage?: (token: MapToken) => string | undefined;
  canDrag: (token: MapToken) => boolean;
  onSelect: (tokenId: string) => void;
  /** 10.2c-edit-9e — 'i' badge → open modal (separate od select highlight). */
  onOpenInfo: (tokenId: string) => void;
  onTokenPointerDown?: (e: FederatedPointerEvent, token: MapToken) => void;
}

export function TokenLayer({
  tokens,
  config,
  theme,
  selectedTokenId,
  activeTurnTokenId,
  spotlightTokenId,
  resolveImage,
  canDrag,
  onSelect,
  onOpenInfo,
  onTokenPointerDown,
}: Props): React.ReactElement {
  const offsets = useMemo(() => computeStaggerOffsets(tokens), [tokens]);
  return (
    <pixiContainer label="tokens-layer">
      {tokens.map((t) => (
        <TokenSprite
          key={t.id}
          token={t}
          config={config}
          theme={theme}
          staggerOffset={offsets[t.id] ?? { x: 0, y: 0 }}
          isSelected={t.id === selectedTokenId}
          isActiveTurn={t.id === activeTurnTokenId}
          isSpotlight={t.id === spotlightTokenId}
          resolveImage={resolveImage}
          canDrag={canDrag(t)}
          onSelect={onSelect}
          onOpenInfo={onOpenInfo}
          onPointerDown={onTokenPointerDown}
        />
      ))}
    </pixiContainer>
  );
}
