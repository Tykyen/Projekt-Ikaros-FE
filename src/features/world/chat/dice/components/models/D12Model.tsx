import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';

interface D12ModelProps {
  faceValue: string | number;
  skin?: FateDiceSkin;
}

const getD12FaceImg = (
  skin: FateDiceSkin,
  idx: number,
): string | undefined => {
  switch (idx) {
    case 1:
      return skin.d12_1Img;
    case 2:
      return skin.d12_2Img;
    case 3:
      return skin.d12_3Img;
    case 4:
      return skin.d12_4Img;
    case 5:
      return skin.d12_5Img;
    case 6:
      return skin.d12_6Img;
    case 7:
      return skin.d12_7Img;
    case 8:
      return skin.d12_8Img;
    case 9:
      return skin.d12_9Img;
    case 10:
      return skin.d12_10Img;
    case 11:
      return skin.d12_11Img;
    case 12:
      return skin.d12_12Img;
    default:
      return undefined;
  }
};

const Face: React.FC<{
  idx: number;
  target: number;
  skin?: FateDiceSkin;
}> = ({ idx, target, skin }) => {
  const faceImg = skin ? getD12FaceImg(skin, idx) : undefined;

  const faceStyle = skin
    ? faceImg
      ? {
          background: `url(${faceImg}) center/cover no-repeat`,
          borderColor: skin.borderColor,
          boxShadow: `inset 0 0 10px rgba(0,0,0,0.7)`,
        }
      : {
          background: skin.materialImg
            ? `url(${skin.materialImg})`
            : skin.bgGradient || undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: skin.borderColor,
          boxShadow: skin.coreColor
            ? `inset 0 0 10px ${skin.coreColor}`
            : undefined,
        }
    : undefined;

  const textStyle = skin
    ? {
        color: skin.symbolColor || '#fff',
        textShadow: skin.symbolShadow || 'none',
      }
    : undefined;

  return (
    <div className={`d12-face d12-face-${idx}`} style={faceStyle}>
      {!faceImg && (
        <div
          className={`d12-num ${idx === target ? 'glow-win' : ''}`}
          style={textStyle}
        >
          {idx}
        </div>
      )}
    </div>
  );
};

/** Krok 6.3 — D12 dvanáctistěnná kostka. Port D12Model.tsx. */
export const D12Model: React.FC<D12ModelProps> = ({ faceValue, skin }) => {
  const target = parseInt(String(faceValue), 10);
  return (
    <div className="d12-3d-model">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((idx) => (
        <Face key={idx} idx={idx} target={target} skin={skin} />
      ))}
    </div>
  );
};
