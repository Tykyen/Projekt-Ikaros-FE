import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';

interface D10ModelProps {
  faceValue: string | number;
  skin?: FateDiceSkin;
}

type D10FaceKey =
  | 'd10_1Img'
  | 'd10_2Img'
  | 'd10_3Img'
  | 'd10_4Img'
  | 'd10_5Img'
  | 'd10_6Img'
  | 'd10_7Img'
  | 'd10_8Img'
  | 'd10_9Img'
  | 'd10_0Img';

const getFaceImg = (
  skin: FateDiceSkin | undefined,
  idx: number,
): string | undefined => {
  if (!skin) return undefined;
  // idx 1..9 → d10_1Img..d10_9Img, idx 10 → d10_0Img
  const faceNum = idx === 10 ? 0 : idx;
  const key = `d10_${faceNum}Img` as D10FaceKey;
  return skin[key];
};

const Face: React.FC<{
  idx: number;
  target: number;
  skin?: FateDiceSkin;
}> = ({ idx, target, skin }) => {
  const displayValue = idx === 10 ? 0 : idx;
  const faceImg = getFaceImg(skin, idx);

  const faceStyle: React.CSSProperties = skin
    ? {
        background: faceImg
          ? `url(${faceImg}) center/cover no-repeat`
          : skin.materialImg
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
    <div className={`d10-face d10-face-${idx}`} style={faceStyle}>
      {!faceImg && (
        <div
          className={`d10-num ${idx === target ? 'glow-win' : ''}`}
          style={textStyle}
        >
          {displayValue}
        </div>
      )}
    </div>
  );
};

/** Krok 6.3 — D10 desetistěnná kostka. Port D10Model.tsx. */
export const D10Model: React.FC<D10ModelProps> = ({ faceValue, skin }) => {
  const target = parseInt(String(faceValue), 10);
  return (
    <div className="d10-3d-model">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((idx) => (
        <Face key={idx} idx={idx} target={target} skin={skin} />
      ))}
    </div>
  );
};
