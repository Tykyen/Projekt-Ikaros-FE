/**
 * Spec 26.4 (D7–D8) — journey engine: napojuje event bus + visit + probe na
 * onboardingStore. Pravidla (04 §4, 05 §2):
 * - event = okamžitý trigger; odškrtnutí je idempotentní ($min na BE, min lokálně)
 * - contextWorldId se zafixuje payloadem `world.created` (worldBinding:'creates')
 * - match: worldId:'contextWorldId' → payload.worldId === contextWorldId cesty;
 *   channelKind/pageType → přesná shoda. `message.sent` v Putyce krok nesplní.
 * - visit scoped: pathname musí odpovídat route se slugem contextWorld
 * - probe gateOpened: derivace z WorldContext (accessMode) + eventy invite/nábor
 */
import { onboardingStore } from '../state/onboardingStore';
import {
  vypravecSubscribe,
  type VypravecEvent,
  type VypravecEventPayload,
} from './events';
import {
  CESTY,
  OSLAVY_DOKONCENI,
  type Journey,
  type JourneyStep,
} from '../registry/journeys';
import { bublinaStore } from '../ui/bublinaStore';
import { telemetrie } from '../state/telemetry';

export interface AktivniCesta {
  /** D-079: klíč progresu v store (`baseId` či `baseId~n`) — pro zápisy. */
  klic: string;
  cesta: Journey;
  contextWorldId?: string;
  contextWorldSlug?: string;
  hotovo: Set<string>;
  dalsiKrok: JourneyStep | null;
  poradi: { hotovo: number; celkem: number };
}

/** Explicitní aktivní cesta (rozhodnutí 14) — lokální; BE pořadí je $min. */
const AKTIVNI_KEY = 'vypravec:aktivniCestaId';
function ulozAktivniId(jId: string): void {
  try {
    localStorage.setItem(AKTIVNI_KEY, jId);
  } catch {
    /* fallback: nejnovější nepauznutá */
  }
}
function ctiAktivniId(): string | null {
  try {
    return localStorage.getItem(AKTIVNI_KEY);
  } catch {
    return null;
  }
}

/** Dokončenost = PRŮNIK s definicí (steps na BE nikdy neubývají). */
function hotoveKroky(cesta: Journey, steps: Record<string, string> | undefined): Set<string> {
  const s = new Set<string>();
  for (const k of cesta.phases.flatMap((f) => f.steps))
    if (steps && k.id in steps) s.add(k.id);
  return s;
}

/** contextWorldSlug žije jen lokálně (BE drží id; slug pro deep-linky). */
const slugKey = (jId: string) => `vypravec:worldSlug:${jId}`;

function ulozSlug(jId: string, slug?: string): void {
  if (!slug) return;
  try {
    localStorage.setItem(slugKey(jId), slug);
  } catch {
    /* bez slugu padnou deep-linky na výběr světa */
  }
}
function ctiSlug(jId: string): string | undefined {
  try {
    return localStorage.getItem(slugKey(jId)) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * D-079: klíč progresu = `baseId` nebo `baseId~n`. Restart zrušené cesty
 * dostane NOVOU generaci (čistý progres) — BE set-union/$min nejde vzít
 * zpět, takže starý klíč zůstává archivem a nová generace startuje od nuly.
 */
export function bazoveId(klic: string): string {
  return klic.split('~')[0];
}
function dejCestu(klic: string): Journey | undefined {
  return CESTY[bazoveId(klic)];
}
/** Nejvyšší existující generace progresu cesty (bez progresu → baseId). */
export function aktualniKlic(baseId: string): string {
  const s = onboardingStore.getSnapshot();
  let nej = baseId;
  let nejN = -1;
  for (const k of Object.keys(s.journeys)) {
    if (bazoveId(k) !== baseId) continue;
    const n = k.includes('~') ? Number(k.split('~')[1]) || 0 : 0;
    if (n > nejN) {
      nejN = n;
      nej = k;
    }
  }
  return nej;
}

export function startCesty(
  jId: string,
  /** D-079: předvolený svět (PJ/WB s existujícími světy) — zafixuje kontext
   *  a odškrtne krok „Založ svět". */
  svet?: { id: string; slug?: string },
): void {
  const cesta = CESTY[jId];
  if (!cesta) return;
  let klic = aktualniKlic(jId);
  const uz = onboardingStore.getSnapshot().journeys[klic];
  if (uz && !uz.dismissedAt) return; // idempotentní (běžící/dokončená)
  if (uz?.dismissedAt) {
    const n = klic.includes('~') ? (Number(klic.split('~')[1]) || 0) + 1 : 1;
    klic = `${jId}~${n}`;
  }
  onboardingStore.aplikuj({
    journeys: { [klic]: { startedAt: new Date().toISOString(), dismissedAt: null, pausedAt: null } },
  });
  if (svet && cesta.worldBinding === 'creates') {
    onboardingStore.aplikuj({
      journeys: { [klic]: { contextWorldId: svet.id } },
    });
    ulozSlug(klic, svet.slug);
    const prvni = cesta.phases[0]?.steps[0];
    if (prvni) krokSplnen(klic, prvni.id);
  }
  ulozAktivniId(klic);
  pauzniOstatni(klic);
  telemetrie('journey_started', { refId: klic });
}

export function pauzaCesty(jId: string, pauza: boolean): void {
  const klic = aktualniKlic(bazoveId(jId)); // UI smí poslat base id i klíč
  onboardingStore.aplikuj({
    journeys: { [klic]: { pausedAt: pauza ? new Date().toISOString() : null } },
  });
  if (!pauza) {
    // „Pokračovat" = převzetí aktivity (rozhodnutí 14: max 1 aktivní)
    ulozAktivniId(klic);
    pauzniOstatni(klic);
  }
}

/** Max 1 aktivní: ostatním rozběhnutým nedokončeným zapiš pauzu. */
function pauzniOstatni(krome: string): void {
  const s = onboardingStore.getSnapshot();
  for (const [jId, p] of Object.entries(s.journeys)) {
    const cesta = dejCestu(jId);
    if (jId === krome || p.dismissedAt || p.pausedAt || !cesta) continue;
    const hotovo = hotoveKroky(cesta, p.steps);
    if (hotovo.size >= cesta.phases.flatMap((f) => f.steps).length) continue;
    onboardingStore.aplikuj({
      journeys: { [jId]: { pausedAt: new Date().toISOString() } },
    });
  }
}

export function zrusitCestu(jId: string): void {
  const klic = aktualniKlic(bazoveId(jId));
  onboardingStore.aplikuj({
    journeys: { [klic]: { dismissedAt: new Date().toISOString() } },
  });
  telemetrie('journey_dismissed', { refId: klic });
}

export function krokSplnen(jId: string, stepId: string, at?: string): void {
  const uz = onboardingStore.getSnapshot().journeys[jId]?.steps?.[stepId];
  onboardingStore.aplikuj({
    journeys: { [jId]: { steps: { [stepId]: at ?? new Date().toISOString() } } },
  });
  if (!uz) {
    telemetrie('step_done', { refId: stepId });
    // Oslava dokončení celé cesty (05 §6 — jen z eventu/akce, ne backfillu).
    const cesta = dejCestu(jId);
    const prog = onboardingStore.getSnapshot().journeys[jId];
    if (cesta && prog) {
      const celkem = cesta.phases.flatMap((f) => f.steps).length;
      if (hotoveKroky(cesta, prog.steps).size >= celkem) {
        const o = OSLAVY_DOKONCENI[bazoveId(jId)];
        if (o)
          bublinaStore.show({
            text:
              prog.contextWorldId || !o.bezKontextu
                ? o.sKontextem
                : o.bezKontextu,
            oslava: true,
          });
      }
    }
  }
}

/** Přeskočit = odškrtnout teď (skipAllowed je u všech kroků MVP). */
export const preskocitKrok = (jId: string, stepId: string): void =>
  krokSplnen(jId, stepId);

function matchujeJeden(
  cond: { event: string; match?: import('../registry/journeys').EventMatch },
  e: VypravecEvent,
  contextWorldId: string | undefined,
): boolean {
  if (cond.event !== e.name) return false;
  const m = cond.match;
  if (!m) return true;
  if (m.worldId === 'contextWorldId') {
    if (!contextWorldId || e.payload.worldId !== contextWorldId) return false;
  }
  if (m.channelKind && e.payload.channelKind !== m.channelKind) return false;
  if (m.pageType && e.payload.pageType !== m.pageType) return false;
  return true;
}

function matchuje(
  step: JourneyStep,
  e: VypravecEvent,
  contextWorldId: string | undefined,
): boolean {
  if (step.done.kind !== 'fe-event') return false;
  if (matchujeJeden(step.done, e, contextWorldId)) return true;
  return (step.done.altEvents ?? []).some((alt) =>
    matchujeJeden(alt, e, contextWorldId),
  );
}

/** Aktivní cesta = nejnovější nastartovaná, nezrušená, nedokončená. */
export function aktivniCesta(): AktivniCesta | null {
  const s = onboardingStore.getSnapshot();
  const kandidat = (jId: string): boolean => {
    const p = s.journeys[jId];
    const c = dejCestu(jId);
    if (!p || p.dismissedAt || p.pausedAt || !c) return false;
    return (
      hotoveKroky(c, p.steps).size < c.phases.flatMap((f) => f.steps).length
    );
  };
  let vybrana = ctiAktivniId();
  if (!vybrana || !kandidat(vybrana)) {
    vybrana = null;
    for (const jId of Object.keys(s.journeys)) {
      if (!kandidat(jId)) continue;
      if (!vybrana || s.journeys[jId].startedAt > s.journeys[vybrana].startedAt)
        vybrana = jId;
    }
  }
  if (!vybrana) return null;
  const cesta = dejCestu(vybrana)!;
  const prog = s.journeys[vybrana];
  const kroky = cesta.phases.flatMap((f) => f.steps);
  const hotovo = hotoveKroky(cesta, prog.steps);
  if (hotovo.size >= kroky.length) return null; // pojistka
  const dalsiKrok = kroky.find((k) => !hotovo.has(k.id)) ?? null;
  return {
    klic: vybrana,
    cesta,
    contextWorldId: prog.contextWorldId,
    contextWorldSlug: ctiSlug(vybrana),
    hotovo,
    dalsiKrok,
    poradi: { hotovo: hotovo.size, celkem: kroky.length },
  };
}

/** Postup cesty pro UI — průnik s definicí (E13); čte aktuální generaci. */
export function postupCesty(jId: string): { hotovo: number; celkem: number } {
  const cesta = dejCestu(jId);
  const prog = onboardingStore.getSnapshot().journeys[aktualniKlic(bazoveId(jId))];
  const celkem = cesta ? cesta.phases.flatMap((f) => f.steps).length : 0;
  return { hotovo: cesta ? hotoveKroky(cesta, prog?.steps).size : 0, celkem };
}

/** Doplnění `:worldSlug` do CTA z contextu cesty. */
export function doplnSlug(to: string, slug?: string): string {
  return slug ? to.replace(':worldSlug', slug) : to;
}

/** Zpracování jednoho eventu proti aktivní cestě. */
function zpracujEvent(e: VypravecEvent): void {
  // Fixace světa i pro DOKONČENOU joins cestu (Putykou hotová, žádost až pak)
  if (e.name === 'join.requested' && e.payload.worldId) {
    const s = onboardingStore.getSnapshot();
    for (const [jId, p] of Object.entries(s.journeys)) {
      if (p.dismissedAt || p.contextWorldId || dejCestu(jId)?.worldBinding !== 'joins')
        continue;
      onboardingStore.aplikuj({
        journeys: { [jId]: { contextWorldId: e.payload.worldId } },
      });
      ulozSlug(jId, e.payload.worldSlug);
    }
  }
  const akt = aktivniCesta();
  if (!akt || onboardingStore.getSnapshot().journeys[akt.klic]?.pausedAt)
    return;
  const jId = akt.klic;

  // fixace světa cesty dle worldBinding: 'creates' → world.created,
  // 'joins' → join.requested (05 §4: payload.worldId → contextWorldId).
  const fixacniEvent =
    akt.cesta.worldBinding === 'creates'
      ? 'world.created'
      : akt.cesta.worldBinding === 'joins'
        ? 'join.requested'
        : null;
  if (
    fixacniEvent &&
    e.name === fixacniEvent &&
    !akt.contextWorldId &&
    e.payload.worldId
  ) {
    onboardingStore.aplikuj({
      journeys: { [jId]: { contextWorldId: e.payload.worldId } },
    });
    ulozSlug(jId, e.payload.worldSlug);
  }

  const ctx =
    akt.contextWorldId ??
    (fixacniEvent && e.name === fixacniEvent ? e.payload.worldId : undefined);
  for (const krok of akt.cesta.phases.flatMap((f) => f.steps)) {
    if (akt.hotovo.has(krok.id)) continue;
    if (matchuje(krok, e, ctx)) krokSplnen(jId, krok.id, e.at);
  }
}

/**
 * Visit podmínky — volá VypravecRoot při změně routy.
 * `scoped` → pathname musí obsahovat slug contextWorld cesty.
 */
export function zpracujNavstevu(pathname: string): void {
  const akt = aktivniCesta();
  if (!akt || onboardingStore.getSnapshot().journeys[akt.klic]?.pausedAt)
    return;
  for (const krok of akt.cesta.phases.flatMap((f) => f.steps)) {
    if (akt.hotovo.has(krok.id) || krok.done.kind !== 'visit') continue;
    if (krok.done.scoped && !akt.contextWorldSlug) continue; // bez fixace nevíme
    const cile = [krok.done.route, ...(krok.done.alt ?? [])].map((r) =>
      doplnSlug(r, akt.contextWorldSlug),
    );
    if (cile.includes(pathname)) krokSplnen(akt.klic, krok.id);
  }
}

/**
 * Probe rekonsiliace (04 §4) — volá VypravecRoot ve world scope; derivace z
 * WorldContext dat, která FE už má. Probe = zdroj pravdy (auto-odškrtnutí
 * i zpětně: akce mimo tutoriál / jiné zařízení).
 */
export function probeResync(ctx: {
  worldId?: string;
  worldSlug?: string;
  accessMode?: string;
  isPJ?: boolean;
  publicShowcase?: boolean;
  /** D-078: svět už má NPC stránku (z pages directory cache). */
  hasNpcPage?: boolean;
}): void {
  let akt = aktivniCesta();
  if (!akt || !ctx.worldId) return;

  // D-078 (částečné uzavření): ušlý `world.created` (zavřený tab, jiné
  // zařízení) — PJ navštíví SVŮJ svět bez fixace cesty → zafixuj a odškrtni
  // krok 1 (probe = zdroj pravdy, checklist nesmí lhát).
  const prvniKrok = akt.cesta.phases[0]?.steps[0];
  if (
    !akt.contextWorldId &&
    akt.cesta.worldBinding === 'creates' &&
    ctx.isPJ &&
    prvniKrok &&
    akt.dalsiKrok?.id === prvniKrok.id
  ) {
    onboardingStore.aplikuj({
      journeys: { [akt.klic]: { contextWorldId: ctx.worldId } },
    });
    krokSplnen(akt.klic, prvniKrok.id);
    ulozSlug(akt.klic, ctx.worldSlug);
    zpracujNavstevu(window.location.pathname);
    akt = aktivniCesta();
    if (!akt) return;
  }

  if (ctx.worldId !== akt.contextWorldId) return;
  ulozSlug(akt.klic, ctx.worldSlug); // slug se mohl ztratit (jiné zařízení)
  for (const krok of akt.cesta.phases.flatMap((f) => f.steps)) {
    if (akt.hotovo.has(krok.id) || krok.done.kind !== 'probe') continue;
    if (
      krok.done.key === 'gateOpened' &&
      ctx.accessMode &&
      ctx.accessMode !== 'private'
    )
      krokSplnen(akt.klic, krok.id);
    if (krok.done.key === 'publicShowcaseOn' && ctx.publicShowcase)
      krokSplnen(akt.klic, krok.id);
  }

  // D-078 dokončení: krok „První NPC" je fe-event, ale při ušlém eventu
  // (zavřený tab před flushí, druhé zařízení) ho zpětně odškrtne directory
  // cache — probe = zdroj pravdy i tady.
  if (ctx.hasNpcPage) {
    for (const krok of akt.cesta.phases.flatMap((f) => f.steps)) {
      if (akt.hotovo.has(krok.id) || krok.done.kind !== 'fe-event') continue;
      if (
        krok.done.event === 'page.created' &&
        krok.done.match?.pageType === 'NPC'
      )
        krokSplnen(akt.klic, krok.id);
    }
  }
}

/** gateOpened alternativy: pozvánka/nábor pro svět cesty (05 §3 krok 4). */
function zpracujGateEventy(e: VypravecEvent): void {
  if (e.name !== 'invite.created') return;
  const akt = aktivniCesta();
  if (!akt || !akt.contextWorldId || e.payload.worldId !== akt.contextWorldId)
    return;
  const krok = akt.cesta.phases
    .flatMap((f) => f.steps)
    .find((k) => k.done.kind === 'probe' && k.done.key === 'gateOpened');
  if (krok && !akt.hotovo.has(krok.id)) krokSplnen(akt.klic, krok.id, e.at);
}

let zapojeno = false;
/** Napojení na event bus (jednou; idempotentní pro dvojí mount). */
export function zapojJourneyEngine(): void {
  if (zapojeno) return;
  zapojeno = true;
  vypravecSubscribe((e) => {
    zpracujEvent(e);
    zpracujGateEventy(e);
  });
}

export type { VypravecEventPayload };

/**
 * Čekací stav cesty hráče (05 §4 — NENÍ JourneyStep): po „hotovo z tvé
 * strany" hlídá (a) postava přidělena → bublina s CTA na Moje postava,
 * (b) 7 dní bez schválení → tip na nábory (1×, zavíratelný). Volá
 * VypravecRoot: ve world scope s ctx, na platformě bez něj (jen timeout).
 */
export function zkontrolujCekaniHrace(ctx?: {
  worldId?: string;
  hasCharacter?: boolean;
}): void {
  const s = onboardingStore.getSnapshot();
  const hsKlic = aktualniKlic('hrac-start');
  const prog = s.journeys[hsKlic];
  if (!prog || prog.dismissedAt || !prog.contextWorldId) return;
  const celkem = CESTY['hrac-start'].phases.flatMap((f) => f.steps).length;
  if (hotoveKroky(CESTY['hrac-start'], prog.steps).size < celkem) return; // běží

  // (a) postava je na světě — jen ve světě cesty
  if (ctx?.worldId === prog.contextWorldId && ctx.hasCharacter) {
    bublinaStore.show({
      dismissKey: 'hrac.postava-na-svete',
      text: 'Postava je na světě. Najdeš ji pod Moje postava — pojď se na ni podívat.',
      akce: {
        label: 'Moje postava',
        to: doplnSlug('/svet/:worldSlug/moje-postava', ctiSlug(hsKlic)),
      },
    });
    return;
  }

  // (b) timeout 7 dní bez postavy (žádost nerušíme za uživatele)
  const ozvalSe = prog.steps?.['hrac.ozvi-se'];
  if (!ozvalSe || ctx?.hasCharacter) return;
  const dny = (Date.now() - new Date(ozvalSe).getTime()) / 86_400_000;
  if (dny >= 7)
    bublinaStore.show({
      dismissKey: 'hrac.cekani-timeout',
      text: 'PJ se zatím neozval — to se stává. Zkus jiný svět, nebo pověs lístek na nábory.',
      akce: { label: 'Otevřít nábory', to: '/ikaros/nabory' },
    });
}
