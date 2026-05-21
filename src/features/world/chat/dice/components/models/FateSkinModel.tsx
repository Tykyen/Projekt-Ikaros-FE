import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';

export interface FateSkinModelProps {
  skin: FateDiceSkin;
  /** `'+'`, `'-'`, `'0'` — konkrétní výsledek na přední tváři (jinak vzor 6-tváří). */
  faceValue?: string;
  /** Šířka / výška kostky v px (default 80 pro rolling). */
  size?: number;
}

/**
 * Krok 6.3 — Fate kostka s konkrétním skinem.
 * Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/models/FateSkinModel.tsx`.
 *
 * 6 CSS 3D tváří v krychli s `transformStyle: preserve-3d`. Pokud
 * `skin.facePlusImg` / `faceMinusImg` / `faceBlankImg` existuje, použije
 * texturu, jinak gradient + symbol glyf.
 */
export const FateSkinModel: React.FC<FateSkinModelProps> = ({
  skin,
  faceValue,
  size = 80,
}) => {
  const faces = faceValue
    ? {
        front: faceValue,
        back: '0',
        right: '0',
        left: '0',
        top: '0',
        bottom: '0',
      }
    : {
        front: '+',
        back: '-',
        right: '+',
        left: '-',
        top: '0',
        bottom: '0',
      };

  const halfSize = size / 2;

  // Matrix verze rozšířena o dva fallbacky pro robustnost:
  // 1. Layered background — pokud texture URL silently selže (CORS,
  //    mixed content, transient network), pod ní je `bgGradient` jako
  //    fallback. Plus.webp / minus.webp / blank.webp jsou všechny RGB
  //    (žádný alpha) s ozdobným orange/red obsahem (RGB 255,181,126
  //    středy ověřeno PIL inspectem) — bgGradient prosvítá pouze pokud
  //    texture nenačte.
  // 2. Always-visible border — i s overrideImg drobný okraj v
  //    `borderColor`, aby kostka měla kontrast s pozadím i v případě
  //    selhání textury.
  const getFaceStyle = (fVal: string): React.CSSProperties => {
    let overrideImg = '';
    if (fVal === '+' && skin.facePlusImg) overrideImg = skin.facePlusImg;
    if (fVal === '-' && skin.faceMinusImg) overrideImg = skin.faceMinusImg;
    if (fVal === '0' && skin.faceBlankImg) overrideImg = skin.faceBlankImg;

    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: overrideImg
        ? `url(${overrideImg}) center/cover, ${skin.bgGradient || '#1a1a1a'}`
        : skin.bgGradient,
      border: overrideImg
        ? `${size * 0.025}px solid ${skin.borderColor || 'rgba(100,100,180,0.5)'}`
        : `${size * 0.05}px solid ${skin.borderColor}`,
      borderRadius: skin.borderRadius || '20%',
      boxShadow: overrideImg
        ? `inset 0 0 ${size * 0.2}px rgba(0,0,0,0.9)`
        : `inset 0 0 ${size * 0.125}px ${skin.shadowColor}, inset 0 0 2px rgba(255,255,255,0.2)`,
      color: overrideImg ? 'transparent' : skin.symbolColor,
      textShadow: overrideImg
        ? 'none'
        : skin.symbolShadow ||
          '0px 1px 2px rgba(0,0,0,0.8), inset 0px 1px 1px rgba(0,0,0,0.5)',
      fontSize: `${size * 0.35}px`,
      fontWeight: 900,
      fontFamily: skin.fontFamily || 'monospace',
      lineHeight: '1',
      backfaceVisibility: 'hidden',
    };
  };

  const getSymbol = (val: string) => {
    if (val === '+') return '✚';
    if (val === '-') return '▬';
    if (val === '0') return skin.ornamentChar || '';
    return val;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Vnitřní jádro proti průhledným mezerám na zakulacených hranách.
          1 plane (Matrix-style) — moje 3 planes (z/y/x) překrývaly faces
          v rotaci rx=-90 a způsobovaly že kostka s '0' tváří byla skryta
          za inner plane. */}
      <div
        style={{
          position: 'absolute',
          width: '90%',
          height: '90%',
          left: '5%',
          top: '5%',
          background: skin.coreColor || '#000',
          transform: 'translateZ(0px)',
          borderRadius: skin.borderRadius || '20%',
        }}
      />
      <div
        style={{
          ...getFaceStyle(faces.front),
          transform: `rotateY(0deg) translateZ(${halfSize}px)`,
        }}
      >
        {getSymbol(faces.front)}
      </div>
      <div
        style={{
          ...getFaceStyle(faces.right),
          transform: `rotateY(90deg) translateZ(${halfSize}px)`,
        }}
      >
        {getSymbol(faces.right)}
      </div>
      <div
        style={{
          ...getFaceStyle(faces.back),
          transform: `rotateY(180deg) translateZ(${halfSize}px)`,
        }}
      >
        {getSymbol(faces.back)}
      </div>
      <div
        style={{
          ...getFaceStyle(faces.left),
          transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
        }}
      >
        {getSymbol(faces.left)}
      </div>
      <div
        style={{
          ...getFaceStyle(faces.top),
          transform: `rotateX(90deg) translateZ(${halfSize}px)`,
        }}
      >
        {getSymbol(faces.top)}
      </div>
      <div
        style={{
          ...getFaceStyle(faces.bottom),
          transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
        }}
      >
        {getSymbol(faces.bottom)}
      </div>
    </div>
  );
};
