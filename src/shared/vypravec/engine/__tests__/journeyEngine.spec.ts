/**
 * Spec 26.4 (D7–D8) — journey engine: fixace contextWorldId, event match
 * (POVINNÝ test 04 §10: `message.sent` v Putyce NEsplní krok „Napiš do svého
 * světa"), visit scoped, probe gateOpened, pauza blokuje odškrtávání.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';
import { vypravecEmit } from '../events';
import {
  aktivniCesta,
  pauzaCesty,
  probeResync,
  startCesty,
  zapojJourneyEngine,
  zpracujNavstevu,
} from '../journeyEngine';
import { onboardingStore } from '../../state/onboardingStore';

const jotai = getDefaultStore();
let uidCounter = 0;

function cerstvyUzivatel(): void {
  // per-test čerstvá identita → izolovaný localStorage stav
  uidCounter += 1;
  jotai.set(currentUserAtom, { id: `je-u${uidCounter}` } as unknown as User);
  void onboardingStore.getSnapshot();
}

beforeEach(() => {
  localStorage.clear();
  zapojJourneyEngine();
  cerstvyUzivatel();
  startCesty('pj-start');
});

describe('journeyEngine — cesta 26.1', () => {
  it('world.created splní krok 1 a zafixuje contextWorldId + slug', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    const akt = aktivniCesta();
    expect(akt?.hotovo.has('pj.zaloz-svet')).toBe(true);
    expect(akt?.contextWorldId).toBe('w-1');
    expect(akt?.contextWorldSlug).toBe('muj-svet');
    expect(akt?.dalsiKrok?.id).toBe('pj.rozhledni-se');
  });

  it('POVINNÝ (04 §10): message.sent v Putyce NEsplní „Napiš do svého světa"', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    vypravecEmit('message.sent', { channelKind: 'putyka' });
    expect(aktivniCesta()?.hotovo.has('pj.napis-do-sveta')).toBe(false);
    // ani chat CIZÍHO světa
    vypravecEmit('message.sent', { worldId: 'w-cizi', channelKind: 'world' });
    expect(aktivniCesta()?.hotovo.has('pj.napis-do-sveta')).toBe(false);
    // chat SVÉHO světa ano
    vypravecEmit('message.sent', { worldId: 'w-1', channelKind: 'world' });
    expect(aktivniCesta()?.hotovo.has('pj.napis-do-sveta')).toBe(true);
  });

  it('page.created matchuje typ NPC + svět cesty', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    vypravecEmit('page.created', { worldId: 'w-1', pageType: 'Lokace' });
    expect(aktivniCesta()?.hotovo.has('pj.prvni-npc')).toBe(false);
    vypravecEmit('page.created', { worldId: 'w-1', pageType: 'NPC' });
    expect(aktivniCesta()?.hotovo.has('pj.prvni-npc')).toBe(true);
  });

  it('visit scoped: dashboard SVÉHO světa splní „Rozhlédni se", cizí ne', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    zpracujNavstevu('/svet/cizi-svet');
    expect(aktivniCesta()?.hotovo.has('pj.rozhledni-se')).toBe(false);
    zpracujNavstevu('/svet/muj-svet');
    expect(aktivniCesta()?.hotovo.has('pj.rozhledni-se')).toBe(true);
  });

  it('D-078: PJ navštíví svůj svět bez fixace → probe zafixuje + odškrtne krok 1', () => {
    // žádný world.created event (zavřený tab / jiné zařízení)
    probeResync({
      worldId: 'w-probe',
      worldSlug: 'probe-svet',
      accessMode: 'private',
      isPJ: true,
    });
    const akt = aktivniCesta();
    expect(akt?.contextWorldId).toBe('w-probe');
    expect(akt?.hotovo.has('pj.zaloz-svet')).toBe(true);
    // ne-PJ svět nefixuje
  });

  it('D-078: návštěva CIZÍHO světa (ne-PJ) nefixuje', () => {
    probeResync({ worldId: 'w-cizi', worldSlug: 'cizi', isPJ: false });
    expect(aktivniCesta()?.contextWorldId).toBeUndefined();
  });

  it('probe gateOpened: accessMode ≠ private splní krok 4 (i zpětně/jinde)', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    probeResync({ worldId: 'w-1', worldSlug: 'muj-svet', accessMode: 'private' });
    expect(aktivniCesta()?.hotovo.has('pj.otevri-branu')).toBe(false);
    probeResync({ worldId: 'w-1', worldSlug: 'muj-svet', accessMode: 'open' });
    expect(aktivniCesta()?.hotovo.has('pj.otevri-branu')).toBe(true);
  });

  it('invite.created pro svět cesty splní gateOpened (alternativa)', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    vypravecEmit('invite.created', { worldId: 'w-jiny' });
    expect(aktivniCesta()?.hotovo.has('pj.otevri-branu')).toBe(false);
    vypravecEmit('invite.created', { worldId: 'w-1' });
    expect(aktivniCesta()?.hotovo.has('pj.otevri-branu')).toBe(true);
  });

  it('pauza blokuje eventové odškrtávání; po obnovení jede dál', () => {
    pauzaCesty('pj-start', true);
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    // pauznutá cesta nezpracovává eventy
    expect(
      onboardingStore.getSnapshot().journeys['pj-start']?.steps?.['pj.zaloz-svet'],
    ).toBeUndefined();
    pauzaCesty('pj-start', false);
    vypravecEmit('world.created', { worldId: 'w-2', worldSlug: 'druhy' });
    expect(aktivniCesta()?.hotovo.has('pj.zaloz-svet')).toBe(true);
  });

  it('dokončení všech kroků → aktivniCesta() = null (lišta zmizí)', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    zpracujNavstevu('/svet/muj-svet');
    vypravecEmit('page.created', { worldId: 'w-1', pageType: 'NPC' });
    vypravecEmit('invite.created', { worldId: 'w-1' });
    vypravecEmit('message.sent', { worldId: 'w-1', channelKind: 'world' });
    expect(aktivniCesta()).toBeNull();
  });
});
