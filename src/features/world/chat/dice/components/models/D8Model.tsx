import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';
import { DieFaceTexture } from './DieFaceTexture';

interface D8ModelProps {
  faceValue: string | number;
  skin?: FateDiceSkin;
}

type D8FaceKey =
  | 'd8_1Img'
  | 'd8_2Img'
  | 'd8_3Img'
  | 'd8_4Img'
  | 'd8_5Img'
  | 'd8_6Img'
  | 'd8_7Img'
  | 'd8_8Img';

const getFaceImg = (
  skin: FateDiceSkin | undefined,
  idx: number,
): string | undefined => {
  if (!skin) return undefined;
  const key = `d8_${idx}Img` as D8FaceKey;
  return skin[key];
};

const Face: React.FC<{
  idx: number;
  target: number;
  skin?: FateDiceSkin;
}> = ({ idx, target, skin }) => {
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
    <div className={`d8-face d8-face-${idx}`} style={faceStyle}>
      <div
        className={`d8-num ${idx === target ? 'glow-win' : ''}`}
        style={textStyle}
      >
        {idx}
      </div>
      <DieFaceTexture src={faceImg} />
    </div>
  );
};

/** Krok 6.3 — D8 osmistěnná kostka. Port D8Model.tsx. */
export const D8Model: React.FC<D8ModelProps> = ({ faceValue, skin }) => {
  const target = parseInt(String(faceValue), 10);
  return (
    <div className="d8-3d-model">
      {Array.from({ length: 8 }, (_, i) => i + 1).map((idx) => (
        <Face key={idx} idx={idx} target={target} skin={skin} />
      ))}
    </div>
  );
};
