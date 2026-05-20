import React from 'react';

/**
 * Krok 6.3 — Fate kostka generická (bez konkrétního skinu).
 * Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/models/FateModel.tsx`.
 *
 * Užito jako fallback v `FateSkinModel` pokud chybí skin / pro picker
 * generický náhled (+/− střídavě po stranách).
 */
export const FateModel: React.FC = () => (
  <>
    <div
      style={{
        position: 'absolute',
        width: '98%',
        height: '98%',
        left: '1%',
        top: '1%',
        background: 'rgba(16, 14, 40, 1)',
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
        background: 'rgba(16, 14, 40, 1)',
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
        background: 'rgba(16, 14, 40, 1)',
        transform: 'rotateX(90deg)',
      }}
    />
    <div className="fate-die-3d-face front">
      <span className="face-plus">+</span>
    </div>
    <div className="fate-die-3d-face back">
      <span className="face-minus">−</span>
    </div>
    <div className="fate-die-3d-face right">
      <span className="face-plus">+</span>
    </div>
    <div className="fate-die-3d-face left">
      <span className="face-minus">−</span>
    </div>
    <div className="fate-die-3d-face top">
      <span className="face-zero">0</span>
    </div>
    <div className="fate-die-3d-face bottom">
      <span className="face-zero">0</span>
    </div>
  </>
);
