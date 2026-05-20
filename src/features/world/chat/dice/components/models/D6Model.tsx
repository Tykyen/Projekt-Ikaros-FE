import React, { useRef, useLayoutEffect, useState } from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';

const RenderDots: React.FC<{
  n: number;
  color?: string;
  shadowColor?: string;
}> = ({ n, color, shadowColor }) => {
  return (
    <div className={`face-dots dots-${n}`}>
      {Array.from({ length: n }).map((_, idx) => (
        <div
          key={idx}
          className="dot"
          style={{
            backgroundColor: color || '#f4ebff',
            boxShadow: shadowColor
              ? `inset 0px -1px 3px rgba(0,0,0,0.6), inset 0px 2px 4px rgba(255,255,255,0.4), ${shadowColor}`
              : color
                ? `inset 0px -1px 3px rgba(0,0,0,0.6), inset 0px 2px 4px rgba(255,255,255,0.4), 0 0 10px ${color}`
                : 'inset 0px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(180, 100, 255, 0.8)',
          }}
        />
      ))}
    </div>
  );
};

export interface D6ModelProps {
  skin?: FateDiceSkin;
}

/**
 * Krok 6.3 — D6 šestistěnná kostka.
 * Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/models/D6Model.tsx`.
 *
 * Bez skinu = generic fialové tečky. Se skinem = textura per tvář (1..6),
 * fallback teček s `skin.symbolColor`.
 */
export const D6Model: React.FC<D6ModelProps> = ({ skin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [halfSize, setHalfSize] = useState(35);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      if (w > 0) setHalfSize(w / 2);
    }
  }, []);

  if (!skin) {
    return (
      <>
        <div className="fate-die-3d-face front generic-d6-face">
          <RenderDots n={1} />
        </div>
        <div className="fate-die-3d-face back generic-d6-face">
          <RenderDots n={2} />
        </div>
        <div className="fate-die-3d-face right generic-d6-face">
          <RenderDots n={3} />
        </div>
        <div className="fate-die-3d-face left generic-d6-face">
          <RenderDots n={4} />
        </div>
        <div className="fate-die-3d-face top generic-d6-face">
          <RenderDots n={5} />
        </div>
        <div className="fate-die-3d-face bottom generic-d6-face">
          <RenderDots n={6} />
        </div>
      </>
    );
  }

  const getFaceStyle = (d6Val: number): React.CSSProperties => {
    let overrideImg = '';
    if (d6Val === 1 && skin.d6_1Img) overrideImg = skin.d6_1Img;
    else if (d6Val === 2 && skin.d6_2Img) overrideImg = skin.d6_2Img;
    else if (d6Val === 3 && skin.d6_3Img) overrideImg = skin.d6_3Img;
    else if (d6Val === 4 && skin.d6_4Img) overrideImg = skin.d6_4Img;
    else if (d6Val === 5 && skin.d6_5Img) overrideImg = skin.d6_5Img;
    else if (d6Val === 6 && skin.d6_6Img) overrideImg = skin.d6_6Img;
    else if (skin.faceBlankImg) overrideImg = skin.faceBlankImg;

    const sz = halfSize * 2;
    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: overrideImg
        ? `url(${overrideImg}) center/cover`
        : skin.bgGradient,
      border: overrideImg ? 'none' : `${sz * 0.05}px solid ${skin.borderColor}`,
      borderRadius: '4px',
      boxShadow: overrideImg
        ? `inset 0 0 ${sz * 0.2}px rgba(0,0,0,0.9)`
        : `inset 0 0 ${sz * 0.125}px ${skin.shadowColor}, inset 0 0 2px rgba(255,255,255,0.2)`,
      backfaceVisibility: 'hidden',
    };
  };

  const hasOverride = (val: number): boolean => {
    if (val === 1 && skin.d6_1Img) return true;
    if (val === 2 && skin.d6_2Img) return true;
    if (val === 3 && skin.d6_3Img) return true;
    if (val === 4 && skin.d6_4Img) return true;
    if (val === 5 && skin.d6_5Img) return true;
    if (val === 6 && skin.d6_6Img) return true;
    return false;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '98%',
          height: '98%',
          left: '1%',
          top: '1%',
          background: skin.coreColor || '#000',
          transform: 'translateZ(0px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '98%',
          height: '98%',
          left: '1%',
          top: '1%',
          background: skin.coreColor || '#000',
          transform: 'rotateY(90deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '98%',
          height: '98%',
          left: '1%',
          top: '1%',
          background: skin.coreColor || '#000',
          transform: 'rotateX(90deg)',
        }}
      />

      <div
        style={{
          ...getFaceStyle(1),
          transform: `rotateY(0deg) translateZ(${halfSize + 0.5}px)`,
        }}
      >
        {!hasOverride(1) && (
          <RenderDots
            n={1}
            color={skin.symbolColor}
            shadowColor={skin.symbolShadow}
          />
        )}
      </div>
      <div
        style={{
          ...getFaceStyle(2),
          transform: `rotateY(180deg) translateZ(${halfSize + 0.5}px)`,
        }}
      >
        {!hasOverride(2) && (
          <RenderDots
            n={2}
            color={skin.symbolColor}
            shadowColor={skin.symbolShadow}
          />
        )}
      </div>
      <div
        style={{
          ...getFaceStyle(3),
          transform: `rotateY(90deg) translateZ(${halfSize + 0.5}px)`,
        }}
      >
        {!hasOverride(3) && (
          <RenderDots
            n={3}
            color={skin.symbolColor}
            shadowColor={skin.symbolShadow}
          />
        )}
      </div>
      <div
        style={{
          ...getFaceStyle(4),
          transform: `rotateY(-90deg) translateZ(${halfSize + 0.5}px)`,
        }}
      >
        {!hasOverride(4) && (
          <RenderDots
            n={4}
            color={skin.symbolColor}
            shadowColor={skin.symbolShadow}
          />
        )}
      </div>
      <div
        style={{
          ...getFaceStyle(5),
          transform: `rotateX(90deg) translateZ(${halfSize + 0.5}px)`,
        }}
      >
        {!hasOverride(5) && (
          <RenderDots
            n={5}
            color={skin.symbolColor}
            shadowColor={skin.symbolShadow}
          />
        )}
      </div>
      <div
        style={{
          ...getFaceStyle(6),
          transform: `rotateX(-90deg) translateZ(${halfSize + 0.5}px)`,
        }}
      >
        {!hasOverride(6) && (
          <RenderDots
            n={6}
            color={skin.symbolColor}
            shadowColor={skin.symbolShadow}
          />
        )}
      </div>
    </div>
  );
};
