/**
 * Spec 26.5 (D9) — chybová mapa (2× táž chyba → bublina) + auto-tichý režim
 * (3 zavřené tipy → onCall) + dismiss persistence (zavřené se neopakuje).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';
import { ohlasApiChybu } from '../chybovyKanal';
import { zapojChybovouMapu } from '../chybovaMapa';
import { bublinaStore } from '../../ui/bublinaStore';
import { onboardingStore } from '../../state/onboardingStore';

const jotai = getDefaultStore();
let uidCounter = 100;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  bublinaStore.zmiz();
  zapojChybovouMapu();
  uidCounter += 1;
  jotai.set(currentUserAtom, { id: `ch-u${uidCounter}` } as unknown as User);
  void onboardingStore.getSnapshot();
});

describe('chybová mapa — moment 3b', () => {
  it('1. výskyt mlčí, 2. výskyt téže chyby ukáže bublinu s vysvětlením', () => {
    ohlasApiChybu('NOT_SUPPORTER', 403);
    expect(bublinaStore.getSnapshot()).toBeNull();
    ohlasApiChybu('NOT_SUPPORTER', 403);
    const b = bublinaStore.getSnapshot();
    expect(b?.text).toContain('Podporovatel');
    expect(b?.akce?.to).toBe('/ikaros/podporovatele');
  });

  it('zavřená bublina se pro týž topik už NIKDY neukáže (dismiss persistence)', () => {
    ohlasApiChybu('SOLE_PJ_BLOCK', 409);
    ohlasApiChybu('SOLE_PJ_BLOCK', 409);
    expect(bublinaStore.getSnapshot()).not.toBeNull();
    bublinaStore.zavrit();
    ohlasApiChybu('SOLE_PJ_BLOCK', 409);
    ohlasApiChybu('SOLE_PJ_BLOCK', 409);
    expect(bublinaStore.getSnapshot()).toBeNull();
  });

  it('401 nikdy nebublá (řeší refresh/logout flow)', () => {
    ohlasApiChybu('COKOLIV', 401);
    ohlasApiChybu('COKOLIV', 401);
    expect(bublinaStore.getSnapshot()).toBeNull();
  });

  it('neznámý kód bez status fallbacku mlčí', () => {
    ohlasApiChybu('NEZNAMY_KOD_XYZ', 500);
    ohlasApiChybu('NEZNAMY_KOD_XYZ', 500);
    expect(bublinaStore.getSnapshot()).toBeNull();
  });
});

describe('auto-tichý režim (03 §4.1)', () => {
  it('3 po sobě zavřené tipy → mode onCall + rozlučka; CTA interakce resetuje', () => {
    for (const [i, klic] of ['a', 'b', 'c'].entries()) {
      bublinaStore.show({ dismissKey: `tip-${klic}`, text: `Tip ${klic}` });
      // po 3. zavření nastane onCall — show by další tip už nepustil
      expect(bublinaStore.getSnapshot()?.text).toBe(`Tip ${klic}`);
      bublinaStore.zavrit();
      if (i < 2)
        expect(onboardingStore.getSnapshot().mode).toBe('active');
    }
    expect(onboardingStore.getSnapshot().mode).toBe('onCall');
    // rozlučka prošla i v onCall (oslava=true)
    expect(bublinaStore.getSnapshot()?.text).toContain('Nebudu rušit');
    // v onCall se běžný tip už neukáže
    bublinaStore.zmiz();
    bublinaStore.show({ dismissKey: 'tip-d', text: 'Tip d' });
    expect(bublinaStore.getSnapshot()).toBeNull();
  });

  it('interakce (CTA) čítač resetuje', () => {
    bublinaStore.show({ dismissKey: 'i-a', text: 'A' });
    bublinaStore.zavrit();
    bublinaStore.show({ dismissKey: 'i-b', text: 'B' });
    bublinaStore.zavrit();
    bublinaStore.show({ dismissKey: 'i-c', text: 'C', akce: { label: 'Jo' } });
    bublinaStore.interakce(); // reset
    bublinaStore.show({ dismissKey: 'i-d', text: 'D' });
    bublinaStore.zavrit(); // 1. po resetu
    expect(onboardingStore.getSnapshot().mode).toBe('active');
  });
});
