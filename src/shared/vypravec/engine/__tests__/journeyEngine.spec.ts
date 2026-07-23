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
  zkontrolujCekaniHrace,
  zpracujNavstevu,
  zrusitCestu,
} from '../journeyEngine';
import { bublinaStore } from '../../ui/bublinaStore';
import { onboardingStore } from '../../state/onboardingStore';
import { ZMENY, pocetNovychZmen } from '../../registry/changelog';

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
  sessionStorage.clear();
  // Fronta bublin je modulový singleton — bez resetu prosakuje mezi testy
  // (serializační sémantika 07/23: show nepřepisuje, řadí do fronty).
  bublinaStore.vycistiProUzivatele();
  bublinaStore.nastavKolizni(false);
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

  it('D-078: VLASTNÍK navštíví svůj svět bez fixace → probe zafixuje + odškrtne krok 1', () => {
    // žádný world.created event (zavřený tab / jiné zařízení)
    probeResync({
      worldId: 'w-probe',
      worldSlug: 'probe-svet',
      accessMode: 'private',
      isPJ: true,
      isOwner: true,
    });
    const akt = aktivniCesta();
    expect(akt?.contextWorldId).toBe('w-probe');
    expect(akt?.hotovo.has('pj.zaloz-svet')).toBe(true);
  });

  it('D-078: návštěva CIZÍHO světa (ne-PJ) nefixuje', () => {
    probeResync({ worldId: 'w-cizi', worldSlug: 'cizi', isPJ: false });
    expect(aktivniCesta()?.contextWorldId).toBeUndefined();
  });

  it('D-078: PomocnýPJ v CIZÍM světě (isPJ, ne owner) NEfixuje — checklist nesmí lhát', () => {
    probeResync({
      worldId: 'w-cizi',
      worldSlug: 'cizi',
      isPJ: true,
      isOwner: false,
      hasNpcPage: true,
    });
    const akt = aktivniCesta();
    expect(akt?.contextWorldId).toBeUndefined();
    expect(akt?.hotovo.size).toBe(0);
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

describe('cesta 26.2 — Hráč (spec 26.7)', () => {
  beforeEach(() => {
    zrusitCestu('pj-start');
    startCesty('hrac-start');
  });

  it('visit vesmiry NEBO nabory splní krok 1 (alt routy)', () => {
    zpracujNavstevu('/ikaros/nabory');
    expect(aktivniCesta()?.hotovo.has('hrac.najdi-stul')).toBe(true);
  });

  it('zpráva v Putyce SPLNÍ krok 2 (altEvents — sociální akce nesmí čekat na PJ)', () => {
    vypravecEmit('message.sent', { channelKind: 'putyka' });
    const s = onboardingStore.getSnapshot().journeys['hrac-start'];
    expect(s?.steps?.['hrac.ozvi-se']).toBeDefined();
    // bez žádosti není contextWorldId
    expect(s?.contextWorldId).toBeUndefined();
  });

  it('join.requested splní krok 2 A zafixuje svět cesty', () => {
    vypravecEmit('join.requested', { worldId: 'w-join' });
    const s = onboardingStore.getSnapshot().journeys['hrac-start'];
    expect(s?.steps?.['hrac.ozvi-se']).toBeDefined();
    expect(s?.contextWorldId).toBe('w-join');
  });

  it('dokončení (2/2) → oslava bublinou; postava na světě → bublina s CTA', () => {
    zpracujNavstevu('/ikaros/vesmiry');
    vypravecEmit('join.requested', { worldId: 'w-join' });
    expect(bublinaStore.getSnapshot()?.text).toContain('řada na PJ');
    bublinaStore.zmiz();
    // čekací stav: postava přidělena
    zkontrolujCekaniHrace({ worldId: 'w-join', hasCharacter: true });
    expect(bublinaStore.getSnapshot()?.text).toContain('Postava je na světě');
  });

  it('timeout 7 dní bez postavy → tip na nábory (1×)', () => {
    zpracujNavstevu('/ikaros/vesmiry');
    // ozvi-se před 8 dny
    const pred8dny = new Date(Date.now() - 8 * 86_400_000).toISOString();
    vypravecEmit('join.requested', { worldId: 'w-cekam' });
    onboardingStore.aplikuj({
      journeys: { 'hrac-start': { steps: { 'hrac.ozvi-se': pred8dny } } },
    });
    bublinaStore.zmiz();
    zkontrolujCekaniHrace();
    expect(bublinaStore.getSnapshot()?.text).toContain('nábory');
    // dismiss → už nikdy
    bublinaStore.zavrit();
    zkontrolujCekaniHrace();
    expect(bublinaStore.getSnapshot()).toBeNull();
  });
});

describe('cesta 26.3 — Worldbuilder (spec 26.7)', () => {
  beforeEach(() => {
    zrusitCestu('pj-start');
    startCesty('wb-start');
  });

  it('world.created fixuje; stránka + subjekt jen ve světě cesty', () => {
    vypravecEmit('world.created', { worldId: 'w-at', worldSlug: 'atelier' });
    expect(aktivniCesta()?.hotovo.has('wb.zaloz-atelier')).toBe(true);
    vypravecEmit('page.created', { worldId: 'w-cizi', pageType: 'Lokace' });
    expect(aktivniCesta()?.hotovo.has('wb.prvni-stranka')).toBe(false);
    vypravecEmit('page.created', { worldId: 'w-at', pageType: 'Lokace' });
    expect(aktivniCesta()?.hotovo.has('wb.prvni-stranka')).toBe(true);
    vypravecEmit('subject.created', { worldId: 'w-at' });
    expect(aktivniCesta()?.hotovo.has('wb.pavucina')).toBe(true);
  });

  it('probe publicShowcaseOn odškrtne „Ukaž to světu" (i zpětně)', () => {
    vypravecEmit('world.created', { worldId: 'w-at', worldSlug: 'atelier' });
    probeResync({ worldId: 'w-at', worldSlug: 'atelier', publicShowcase: false });
    expect(
      onboardingStore.getSnapshot().journeys['wb-start']?.steps?.['wb.ukaz-to'],
    ).toBeUndefined();
    probeResync({ worldId: 'w-at', worldSlug: 'atelier', publicShowcase: true });
    expect(
      onboardingStore.getSnapshot().journeys['wb-start']?.steps?.['wb.ukaz-to'],
    ).toBeDefined();
  });
});

describe('D-079 — generace progresu + start s vybraným světem', () => {
  it('restart zrušené cesty startuje ČISTÝ progres (nová generace)', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    expect(aktivniCesta()?.hotovo.size).toBe(1);
    zrusitCestu('pj-start');
    expect(aktivniCesta()).toBeNull();
    startCesty('pj-start');
    const akt = aktivniCesta();
    expect(akt?.klic).toBe('pj-start~1');
    expect(akt?.hotovo.size).toBe(0); // NE zděděný krok 1
    expect(akt?.contextWorldId).toBeUndefined(); // NE zděděná fixace
    // starý progres zůstává archivem pod původním klíčem
    expect(
      onboardingStore.getSnapshot().journeys['pj-start']?.steps?.['pj.zaloz-svet'],
    ).toBeDefined();
  });

  it('další zrušení a restart zvyšuje generaci (~2)', () => {
    zrusitCestu('pj-start');
    startCesty('pj-start');
    zrusitCestu('pj-start');
    startCesty('pj-start');
    expect(aktivniCesta()?.klic).toBe('pj-start~2');
  });

  it('start s vybraným světem zafixuje kontext a odškrtne krok 1', () => {
    zrusitCestu('pj-start');
    startCesty('pj-start', { id: 'w-42', slug: 'existujici' });
    const akt = aktivniCesta();
    expect(akt?.contextWorldId).toBe('w-42');
    expect(akt?.contextWorldSlug).toBe('existujici');
    expect(akt?.hotovo.has('pj.zaloz-svet')).toBe(true);
    expect(akt?.dalsiKrok?.id).toBe('pj.rozhledni-se');
  });

  it('eventy i probe zapisují do generačního klíče, ne do base', () => {
    zrusitCestu('pj-start');
    startCesty('pj-start');
    vypravecEmit('world.created', { worldId: 'w-2', worldSlug: 'druhy' });
    const s = onboardingStore.getSnapshot();
    expect(s.journeys['pj-start~1']?.steps?.['pj.zaloz-svet']).toBeDefined();
    expect(s.journeys['pj-start~1']?.contextWorldId).toBe('w-2');
  });
});

describe('D-078 — probe hasNpcPage', () => {
  it('directory s NPC odškrtne „První NPC" i bez eventu', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    probeResync({ worldId: 'w-1', worldSlug: 'muj-svet', hasNpcPage: false });
    expect(aktivniCesta()?.hotovo.has('pj.prvni-npc')).toBe(false);
    probeResync({ worldId: 'w-1', worldSlug: 'muj-svet', hasNpcPage: true });
    expect(aktivniCesta()?.hotovo.has('pj.prvni-npc')).toBe(true);
  });

  it('cizí svět NPC krok neodškrtne', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    probeResync({ worldId: 'w-cizi', worldSlug: 'cizi', hasNpcPage: true });
    expect(aktivniCesta()?.hotovo.has('pj.prvni-npc')).toBe(false);
  });
});

describe('v2 — tm-vycvik (Měďák) + milník první hráč', () => {
  it('TM eventy odškrtávají kroky výcviku (worldBinding none, bez worldId)', () => {
    zrusitCestu('pj-start');
    startCesty('tm-vycvik');
    vypravecEmit('scene.created', { worldId: 'w-1' });
    vypravecEmit('token.spawned', {});
    vypravecEmit('fog.used', {});
    vypravecEmit('initiative.started', {});
    const akt = aktivniCesta();
    expect(akt?.hotovo.size).toBe(4);
    expect(akt?.dalsiKrok?.id).toBe('tm.orchestrace');
    // krok 5 = skutečná orchestrace: přiřazení hráče ∨ deaktivace scény
    // (scene.activated NENÍ done — vystřelí už při založení scény v kroku 1)
    vypravecEmit('scene.activated', {});
    expect(aktivniCesta()).not.toBeNull();
    vypravecEmit('scene.assigned', {});
    expect(aktivniCesta()).toBeNull(); // dokončeno
    expect(bublinaStore.getSnapshot()?.text).toContain('Výcvik dokončen');
  });

  it('member.approved zapíše milník prvni.hrac a oslaví JEN poprvé', () => {
    vypravecEmit('member.approved', { worldId: 'w-1' });
    const prvni = onboardingStore.getSnapshot().milestones['prvni.hrac'];
    expect(prvni).toBeDefined();
    expect(bublinaStore.getSnapshot()?.text).toContain('První hráč');
    bublinaStore.zmiz();
    vypravecEmit('member.approved', { worldId: 'w-2' });
    expect(onboardingStore.getSnapshot().milestones['prvni.hrac']).toBe(prvni);
    expect(bublinaStore.getSnapshot()).toBeNull(); // žádná druhá oslava
  });
});

describe('revize 07/23 — nábory + fronta bublin', () => {
  it('nabor.created splní gateOpened krok (alternativa pozvánky)', () => {
    vypravecEmit('world.created', { worldId: 'w-1', worldSlug: 'muj-svet' });
    vypravecEmit('nabor.created', { worldId: 'w-1' });
    expect(aktivniCesta()?.hotovo.has('pj.otevri-branu')).toBe(true);
  });

  it('nabor.responded splní hrac.ozvi-se', () => {
    zrusitCestu('pj-start');
    startCesty('hrac-start');
    zpracujNavstevu('/ikaros/vesmiry');
    vypravecEmit('nabor.responded', {});
    expect(
      onboardingStore.getSnapshot().journeys['hrac-start']?.steps?.[
        'hrac.ozvi-se'
      ],
    ).toBeDefined();
  });

  it('oslava na kolizní ploše čeká ve frontě a doručí se na klidné', () => {
    bublinaStore.zmiz(); // úklid oslavy z předchozího testu
    bublinaStore.nastavKolizni(true);
    bublinaStore.show({ text: 'Oslava z chatu', oslava: true });
    expect(bublinaStore.getSnapshot()).toBeNull(); // nedoručeno hned
    bublinaStore.nastavKolizni(false);
    bublinaStore.zavriPriOdchodu('/jinam');
    expect(bublinaStore.getSnapshot()?.text).toBe('Oslava z chatu');
    bublinaStore.zmiz();
  });

  it('chybové vysvětlení (sessionDismiss) se ukáže i na kolizní ploše', () => {
    bublinaStore.nastavKolizni(true);
    bublinaStore.show({
      dismissKey: 'err-x',
      sessionDismiss: true,
      kolizniOk: true, // vysvětlení chyby patří na místo chyby
      text: 'Vysvětlení chyby',
    });
    expect(bublinaStore.getSnapshot()?.text).toBe('Vysvětlení chyby');
    bublinaStore.zmiz();
    bublinaStore.nastavKolizni(false);
  });
});

describe('F5 rozšíření — hrac-ve-svete + milník první hod', () => {
  it('start hrac-ve-svete se světem fixuje kontext BEZ odškrtnutí kroku 1', () => {
    zrusitCestu('pj-start');
    startCesty('hrac-ve-svete', { id: 'w-h', slug: 'muj-stul' });
    const akt = aktivniCesta();
    expect(akt?.cesta.id).toBe('hrac-ve-svete');
    expect(akt?.contextWorldId).toBe('w-h');
    expect(akt?.hotovo.size).toBe(0); // 'none' binding nic neodškrtává
    // scoped visit + zpráva ve světě cesty
    zpracujNavstevu('/svet/muj-stul/moje-postava');
    vypravecEmit('message.sent', { worldId: 'w-h', channelKind: 'world' });
    zpracujNavstevu('/svet/muj-stul/stranky');
    expect(aktivniCesta()).toBeNull(); // 3/3 hotovo
  });

  it('dice.rolled zapíše milník prvni.hod a oslaví jen poprvé', () => {
    bublinaStore.zmiz();
    vypravecEmit('dice.rolled', { worldId: 'w-1' });
    expect(
      onboardingStore.getSnapshot().milestones['prvni.hod'],
    ).toBeDefined();
    expect(bublinaStore.getSnapshot()?.text).toContain('kostka');
    bublinaStore.zmiz();
    vypravecEmit('dice.rolled', { worldId: 'w-1' });
    expect(bublinaStore.getSnapshot()).toBeNull();
  });
});

describe('verifikace 07/23 — serializace bublin', () => {
  it('show na obsazené klidné ploše NEpřepisuje — řadí do fronty', () => {
    bublinaStore.zmiz();
    bublinaStore.show({ text: 'První' });
    bublinaStore.show({ text: 'Druhá' });
    expect(bublinaStore.getSnapshot()?.text).toBe('První'); // žádný přepis
    bublinaStore.zmiz(); // zavření doručí frontu
    expect(bublinaStore.getSnapshot()?.text).toBe('Druhá');
    bublinaStore.zmiz();
  });

  it('priZobrazeni se volá až při SKUTEČNÉM zobrazení, ne při zařazení', () => {
    bublinaStore.zmiz();
    let zobrazeno = 0;
    bublinaStore.show({ text: 'Visící' });
    bublinaStore.show({ text: 'Čekající', priZobrazeni: () => zobrazeno++ });
    expect(zobrazeno).toBe(0); // jen ve frontě
    bublinaStore.zmiz();
    expect(zobrazeno).toBe(1); // doručeno z fronty
    bublinaStore.zmiz();
  });

  it('plná fronta → show vrací false (drop se přiznává)', () => {
    bublinaStore.zmiz();
    bublinaStore.show({ text: 'A' }); // zobrazena
    for (let i = 0; i < 5; i++)
      expect(bublinaStore.show({ text: `F${i}` })).toBe(true);
    expect(bublinaStore.show({ text: 'přeteklá' })).toBe(false);
    bublinaStore.vycistiProUzivatele();
  });

  it('oslava blokovaná zobrazenou radou se zařadí, neztratí (N6)', () => {
    bublinaStore.zmiz();
    bublinaStore.show({ text: 'Rada', akce: { label: 'CTA', to: '/x' } });
    expect(bublinaStore.show({ text: 'Oslava', oslava: true })).toBe(true);
    bublinaStore.zmiz(); // rada pryč → oslava z fronty
    expect(bublinaStore.getSnapshot()?.text).toBe('Oslava');
    bublinaStore.vycistiProUzivatele();
  });

  it('dedup: týž dismissKey se do fronty nezařadí dvakrát', () => {
    bublinaStore.zmiz();
    bublinaStore.show({ text: 'Visící' });
    bublinaStore.show({ dismissKey: 'k1', text: 'tip verze 1' });
    bublinaStore.show({ dismissKey: 'k1', text: 'tip verze 2' });
    bublinaStore.zmiz();
    expect(bublinaStore.getSnapshot()?.text).toBe('tip verze 1');
    bublinaStore.zmiz();
    expect(bublinaStore.getSnapshot()).toBeNull(); // druhá se nezařadila
    bublinaStore.vycistiProUzivatele();
  });
});

describe('audit kolo 5 — per-uid klíče + čítač + badge', () => {
  it('auto-tichý čítač NEpočítá chybová vysvětlení (nález 5)', () => {
    bublinaStore.vycistiProUzivatele();
    // 3× zavřená chybová bublina (kolizniOk/sessionDismiss) nesmí umlčet
    for (let i = 0; i < 3; i++) {
      bublinaStore.show({
        dismissKey: `err.x${i}`,
        sessionDismiss: true,
        kolizniOk: true,
        text: `chyba ${i}`,
      });
      bublinaStore.zavrit();
    }
    expect(onboardingStore.getSnapshot().mode).toBe('active');
    // ale 3 zavřené TIPY umlčí
    for (let i = 0; i < 3; i++) {
      bublinaStore.show({ text: `tip ${i}`, akce: { label: 'x', to: '/y' } });
      bublinaStore.zavrit();
    }
    expect(onboardingStore.getSnapshot().mode).toBe('onCall');
    onboardingStore.nastavRezim('active');
    bublinaStore.vycistiProUzivatele();
  });
});

describe('audit kolo 5 verifikace — changelog badge hybrid', () => {
  it('index řeší i více změn TÉHOŽ dne (viděný uprostřed → počet novějších)', () => {
    onboardingStore.aplikuj({ lastSeenChangelog: ZMENY[2].id });
    expect(pocetNovychZmen()).toBe(2);
  });
  it('smazaný viděný záznam → fallback na datum (nález 6)', () => {
    onboardingStore.aplikuj({ lastSeenChangelog: 'zm-2000-01-01-pryc' });
    expect(pocetNovychZmen()).toBe(ZMENY.length);
  });
  it('viděná nejnovější → badge 0', () => {
    onboardingStore.aplikuj({ lastSeenChangelog: ZMENY[0].id });
    expect(pocetNovychZmen()).toBe(0);
  });
});
