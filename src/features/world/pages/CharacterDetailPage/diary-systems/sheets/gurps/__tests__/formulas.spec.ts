import { describe, it, expect } from 'vitest';
import {
  attributeCost,
  basicLift,
  basicMove,
  basicSpeed,
  dodge,
  encTable,
  int,
  num,
  pointSummary,
  signed,
  swing,
  thrust,
} from '../formulas';

describe('GURPS formulas — parse', () => {
  it('int / num s fallbackem', () => {
    expect(int('14')).toBe(14);
    expect(int('', 10)).toBe(10);
    expect(int('abc', 10)).toBe(10);
    expect(num('6,25')).toBe(6.25);
    expect(num('6.25')).toBe(6.25);
    expect(num('', 5)).toBe(5);
  });

  it('signed přidává znaménko (unicode minus)', () => {
    expect(signed(80)).toBe('+80');
    expect(signed(-40)).toBe('−40');
    expect(signed(0)).toBe('0');
  });
});

describe('GURPS formulas — odvozené charakteristiky', () => {
  it('basicSpeed = (DX+HT)/4', () => {
    expect(basicSpeed(14, 11)).toBe(6.25);
    expect(basicSpeed(10, 10)).toBe(5);
  });

  it('basicMove = floor(speed)', () => {
    expect(basicMove(6.25)).toBe(6);
    expect(basicMove(5)).toBe(5);
  });

  it('dodge = floor(speed) + 3', () => {
    expect(dodge(6.25)).toBe(9);
    expect(dodge(5)).toBe(8);
  });

  it('basicLift = ST²/5', () => {
    expect(basicLift(10)).toBe(20);
    expect(basicLift(14)).toBe(39); // 196/5 = 39.2 → 39
    expect(basicLift(8)).toBe(13); // 64/5 = 12.8 → 13
  });
});

describe('GURPS formulas — tabulka škod (4E)', () => {
  it('mapuje ST na Úder/Mách', () => {
    expect(thrust(10)).toBe('1k-2');
    expect(swing(10)).toBe('1k');
    expect(thrust(8)).toBe('1k-3');
    expect(swing(13)).toBe('2k-1');
  });

  it('clampuje mimo rozsah', () => {
    expect(thrust(0)).toBe('1k-6'); // → ST 1
    expect(thrust(99)).toBe('3k'); // → ST 30
  });
});

describe('GURPS formulas — naložení', () => {
  it('5 úrovní z BL, pohyb ×faktor, úhyb −úroveň', () => {
    const rows = encTable(10, 6, 9);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ limit: 20, move: 6, dodge: 9 });
    expect(rows[1]).toMatchObject({ limit: 40, move: 4, dodge: 8 });
    expect(rows[2]).toMatchObject({ limit: 60, move: 3, dodge: 7 });
    expect(rows[3]).toMatchObject({ limit: 120, move: 2, dodge: 6 });
    expect(rows[4]).toMatchObject({ limit: 200, move: 1, dodge: 5 });
  });
});

describe('GURPS formulas — bodový účet', () => {
  it('cena atributů (4E per-level)', () => {
    // Kaelen: ST10 DX14 IQ12 HT11, Per13, ostatní default
    const cost = attributeCost({
      st: 10,
      dx: 14,
      iq: 12,
      ht: 11,
      will: 12,
      per: 13,
      hp: 10,
      fp: 11,
      speed: basicSpeed(14, 11),
      move: basicMove(basicSpeed(14, 11)),
    });
    // primary: DX +80, IQ +40, HT +10 = 130; secondary: Per +5 = 135
    expect(cost).toBe(135);
  });

  it('default atributy (vše 10) = 0 bodů', () => {
    const cost = attributeCost({
      st: 10, dx: 10, iq: 10, ht: 10, will: 10, per: 10,
      hp: 10, fp: 10, speed: 5, move: 5,
    });
    expect(cost).toBe(0);
  });

  it('pointSummary sečte skupiny (signed)', () => {
    const s = pointSummary({
      attrCost: 135,
      advantages: [{ pts: '15' }, { pts: '15' }],
      disadvantages: [{ pts: '-20' }, { pts: '-20' }],
      quirks: [{ pts: '-1' }, { pts: '-1' }, { pts: '-1' }, { pts: '-1' }, { pts: '-1' }],
      skills: [{ pts: '20' }, { pts: '10' }],
    });
    expect(s.attributes).toBe(135);
    expect(s.advantages).toBe(30);
    expect(s.disadvantages).toBe(-40);
    expect(s.quirks).toBe(-5);
    expect(s.skills).toBe(30);
    expect(s.total).toBe(150);
  });
});
