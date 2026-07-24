import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasExperiencedValue,
  markValueExperienced,
  getVisitCount,
  bumpVisitCount,
  VALUE_EVENT,
} from './valueGate';

/** Spec 25.5 ③ — brána „prožitá hodnota" pro PWA install prompt. */
describe('valueGate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('čerstvý uživatel hodnotu nezažil', () => {
    expect(hasExperiencedValue()).toBe(false);
  });

  it('markValueExperienced nastaví trvalý flag', () => {
    markValueExperienced();
    expect(hasExperiencedValue()).toBe(true);
  });

  it('markValueExperienced emituje odemykací event — a jen jednou (idempotence)', () => {
    const spy = vi.fn();
    window.addEventListener(VALUE_EVENT, spy);
    markValueExperienced();
    markValueExperienced(); // už zažito → žádný další event
    window.removeEventListener(VALUE_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('čítač návštěv začíná na 0 a inkrementuje', () => {
    expect(getVisitCount()).toBe(0);
    bumpVisitCount();
    bumpVisitCount();
    expect(getVisitCount()).toBe(2);
  });

  it('gate: 1. návštěva bez milníku = zavřeno, 2. návštěva = odemčeno', () => {
    const open = () => hasExperiencedValue() || getVisitCount() >= 2;
    bumpVisitCount();
    expect(open()).toBe(false); // 1. návštěva, žádný milník
    bumpVisitCount();
    expect(open()).toBe(true); // 2. návštěva → vrátil se
  });

  it('gate: milník odemyká hned na 1. návštěvě', () => {
    const open = () => hasExperiencedValue() || getVisitCount() >= 2;
    bumpVisitCount();
    markValueExperienced();
    expect(open()).toBe(true);
  });
});
