import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';
import { DieFaceTexture } from './DieFaceTexture';

interface D4ModelProps {
  faceValue: string | number;
  skin?: FateDiceSkin;
}

type D4FaceKey = 'd4_1Img' | 'd4_2Img' | 'd4_3Img' | 'd4_4Img';

const getFaceImg = (
  skin: FateDiceSkin | undefined,
  idx: number,
): string | undefined => {
  if (!skin) return undefined;
  const key = `d4_${idx}Img` as D4FaceKey;
  return skin[key];
};

const Face: React.FC<{
  top: number;
  bl: number;
  br: number;
  idx: number;
  target: number;
  skin?: FateDiceSkin;
}> = ({ top, bl, br, idx, target, skin }) => {
  const faceImg = getFaceImg(skin, idx);

  const faceStyle: React.CSSProperties = skin
    ? {
        background: skin.materialImg
          ? `url(${skin.materialImg}) center/cover no-repeat`
          : skin.bgGradient || undefined,
        borderColor: skin.borderColor,
        boxShadow: skin.coreColor
          ? `inset 0 0 10px ${skin.coreColor}`
          : undefined,
      }
    : {};
  const textStyle = skin
    ? {
        color: skin.symbolColor || '#fff',
        textShadow: skin.symbolShadow || 'none',
      }
    : undefined;

  return (
    <div className={`d4-face d4-face-${idx}`} style={faceStyle}>
      <div
        className={`d4-num top-num ${top === target ? 'glow-win' : ''}`}
        style={textStyle}
      >
        {top}
      </div>
      <div
        className={`d4-num bl-num ${bl === target ? 'glow-win' : ''}`}
        style={textStyle}
      >
        {bl}
      </div>
      <div
        className={`d4-num br-num ${br === target ? 'glow-win' : ''}`}
        style={textStyle}
      >
        {br}
      </div>
      <DieFaceTexture src={faceImg} />
    </div>
  );
};

/**
 * Krok 6.3 — D4 tetrahedron.
 * Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/models/D4Model.tsx`.
 */
export const D4Model: React.FC<D4ModelProps> = ({ faceValue, skin }) => {
  const target = parseInt(String(faceValue), 10);
  return (
    <div className="d4-3d-model">
      <Face idx={1} top={1} bl={2} br={3} target={target} skin={skin} />
      <Face idx={2} top={1} bl={3} br={4} target={target} skin={skin} />
      <Face idx={3} top={1} bl={4} br={2} target={target} skin={skin} />
      <Face idx={4} top={2} bl={4} br={3} target={target} skin={skin} />
    </div>
  );
};
