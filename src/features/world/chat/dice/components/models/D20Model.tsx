import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';
import { DieFaceTexture } from './DieFaceTexture';

interface D20ModelProps {
  faceValue: string | number;
  skin?: FateDiceSkin;
}

type D20FaceKey =
  | 'd20_1Img'
  | 'd20_2Img'
  | 'd20_3Img'
  | 'd20_4Img'
  | 'd20_5Img'
  | 'd20_6Img'
  | 'd20_7Img'
  | 'd20_8Img'
  | 'd20_9Img'
  | 'd20_10Img'
  | 'd20_11Img'
  | 'd20_12Img'
  | 'd20_13Img'
  | 'd20_14Img'
  | 'd20_15Img'
  | 'd20_16Img'
  | 'd20_17Img'
  | 'd20_18Img'
  | 'd20_19Img'
  | 'd20_20Img';

const getFaceImg = (
  skin: FateDiceSkin | undefined,
  idx: number,
): string | undefined => {
  if (!skin) return undefined;
  const key = `d20_${idx}Img` as D20FaceKey;
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
    <div className={`d20-face d20-face-${idx}`} style={faceStyle}>
      <div
        className={`d20-num ${idx === target ? 'glow-win' : ''}`}
        style={textStyle}
      >
        {idx}
      </div>
      <DieFaceTexture src={faceImg} />
    </div>
  );
};

/** Krok 6.3 — D20 dvacetistěnná kostka. Port D20Model.tsx. */
export const D20Model: React.FC<D20ModelProps> = ({ faceValue, skin }) => {
  const target = parseInt(String(faceValue), 10);
  return (
    <div className="d20-3d-model">
      {Array.from({ length: 20 }, (_, i) => i + 1).map((idx) => (
        <Face key={idx} idx={idx} target={target} skin={skin} />
      ))}
    </div>
  );
};
