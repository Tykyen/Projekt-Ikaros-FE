import React from 'react';
import type { FateDiceSkin } from '../../lib/diceSkins';

interface D100TensModelProps {
  /** Hodnota desítkové kostky: '0', '10', '20', ..., '90'. */
  faceValue: string | number;
  skin?: FateDiceSkin;
}

type D100FaceKey =
  | 'd100_00Img'
  | 'd100_10Img'
  | 'd100_20Img'
  | 'd100_30Img'
  | 'd100_40Img'
  | 'd100_50Img'
  | 'd100_60Img'
  | 'd100_70Img'
  | 'd100_80Img'
  | 'd100_90Img';

const getFaceImg = (
  skin: FateDiceSkin | undefined,
  idx: number,
): string | undefined => {
  if (!skin) return undefined;
  // idx 1..9 → d100_10Img..d100_90Img, idx 10 → d100_00Img
  const faceLabel = idx === 10 ? '00' : String(idx * 10);
  const key = `d100_${faceLabel}Img` as D100FaceKey;
  return skin[key];
};

const Face: React.FC<{
  idx: number;
  target: number;
  skin?: FateDiceSkin;
}> = ({ idx, target, skin }) => {
  const displayValue = idx === 10 ? '00' : String(idx * 10);
  const faceImg = getFaceImg(skin, idx);
  const isWinner = idx === target;

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
    <div
      className={`d10-face d10-face-${idx} d100-tens-face`}
      style={faceStyle}
    >
      {!faceImg && (
        <div
          className={`d10-num d100-tens-num ${isWinner ? 'glow-win glow-win-tens' : ''}`}
          style={textStyle}
        >
          {displayValue}
        </div>
      )}
    </div>
  );
};

/** Krok 6.3 — D100 desítková kostka. Port D100TensModel.tsx. */
export const D100TensModel: React.FC<D100TensModelProps> = ({
  faceValue,
  skin,
}) => {
  const parsed = parseInt(String(faceValue), 10);
  const target = parsed === 0 ? 10 : parsed / 10;

  return (
    <div className="d10-3d-model d100-tens-3d-model">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((idx) => (
        <Face key={idx} idx={idx} target={target} skin={skin} />
      ))}
    </div>
  );
};
