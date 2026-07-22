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
import { CESTY, type Journey, type JourneyStep } from '../registry/journeys/pjStart';

export interface AktivniCesta {
  cesta: Journey;
  contextWorldId?: string;
  contextWorldSlug?: string;
  hotovo: Set<string>;
  dalsiKrok: JourneyStep | null;
  poradi: { hotovo: number; celkem: number };
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

export function startCesty(jId: string): void {
  const cesta = CESTY[jId];
  if (!cesta) return;
  const uz = onboardingStore.getSnapshot().journeys[jId];
  if (uz && !uz.dismissedAt) return; // idempotentní
  onboardingStore.aplikuj({
    journeys: { [jId]: { startedAt: new Date().toISOString(), dismissedAt: null, pausedAt: null } },
  });
}

export function pauzaCesty(jId: string, pauza: boolean): void {
  onboardingStore.aplikuj({
    journeys: { [jId]: { pausedAt: pauza ? new Date().toISOString() : null } },
  });
}

export function zrusitCestu(jId: string): void {
  onboardingStore.aplikuj({
    journeys: { [jId]: { dismissedAt: new Date().toISOString() } },
  });
}

export function krokSplnen(jId: string, stepId: string, at?: string): void {
  onboardingStore.aplikuj({
    journeys: { [jId]: { steps: { [stepId]: at ?? new Date().toISOString() } } },
  });
}

/** Přeskočit = odškrtnout teď (skipAllowed je u všech kroků MVP). */
export const preskocitKrok = (jId: string, stepId: string): void =>
  krokSplnen(jId, stepId);

function matchuje(
  step: JourneyStep,
  e: VypravecEvent,
  contextWorldId: string | undefined,
): boolean {
  if (step.done.kind !== 'fe-event' || step.done.event !== e.name) return false;
  const m = step.done.match;
  if (!m) return true;
  if (m.worldId === 'contextWorldId') {
    if (!contextWorldId || e.payload.worldId !== contextWorldId) return false;
  }
  if (m.channelKind && e.payload.channelKind !== m.channelKind) return false;
  if (m.pageType && e.payload.pageType !== m.pageType) return false;
  return true;
}

/** Aktivní cesta = nejnovější nastartovaná, nezrušená, nedokončená. */
export function aktivniCesta(): AktivniCesta | null {
  const s = onboardingStore.getSnapshot();
  let nej: { jId: string; startedAt: string } | null = null;
  for (const [jId, p] of Object.entries(s.journeys)) {
    if (p.dismissedAt || !CESTY[jId]) continue;
    if (!nej || p.startedAt > nej.startedAt) nej = { jId, startedAt: p.startedAt };
  }
  if (!nej) return null;
  const cesta = CESTY[nej.jId];
  const prog = s.journeys[nej.jId];
  const kroky = cesta.phases.flatMap((f) => f.steps);
  const hotovo = new Set(Object.keys(prog.steps ?? {}));
  if (hotovo.size >= kroky.length) return null; // dokončená → lišta pryč
  const dalsiKrok = kroky.find((k) => !hotovo.has(k.id)) ?? null;
  return {
    cesta,
    contextWorldId: prog.contextWorldId,
    contextWorldSlug: ctiSlug(nej.jId),
    hotovo,
    dalsiKrok,
    poradi: { hotovo: hotovo.size, celkem: kroky.length },
  };
}

/** Doplnění `:worldSlug` do CTA z contextu cesty. */
export function doplnSlug(to: string, slug?: string): string {
  return slug ? to.replace(':worldSlug', slug) : to;
}

/** Zpracování jednoho eventu proti aktivní cestě. */
function zpracujEvent(e: VypravecEvent): void {
  const akt = aktivniCesta();
  if (!akt || onboardingStore.getSnapshot().journeys[akt.cesta.id]?.pausedAt)
    return;
  const jId = akt.cesta.id;

  // fixace světa cesty (worldBinding 'creates'): první world.created
  if (
    e.name === 'world.created' &&
    akt.cesta.worldBinding === 'creates' &&
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
    (e.name === 'world.created' ? e.payload.worldId : undefined);
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
  if (!akt) return;
  for (const krok of akt.cesta.phases.flatMap((f) => f.steps)) {
    if (akt.hotovo.has(krok.id) || krok.done.kind !== 'visit') continue;
    const cil = doplnSlug(krok.done.route, akt.contextWorldSlug);
    if (krok.done.scoped && !akt.contextWorldSlug) continue; // bez fixace nevíme
    if (pathname === cil) krokSplnen(akt.cesta.id, krok.id);
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
}): void {
  const akt = aktivniCesta();
  if (!akt || !ctx.worldId || ctx.worldId !== akt.contextWorldId) return;
  ulozSlug(akt.cesta.id, ctx.worldSlug); // slug se mohl ztratit (jiné zařízení)
  for (const krok of akt.cesta.phases.flatMap((f) => f.steps)) {
    if (akt.hotovo.has(krok.id) || krok.done.kind !== 'probe') continue;
    if (
      krok.done.key === 'gateOpened' &&
      ctx.accessMode &&
      ctx.accessMode !== 'private'
    )
      krokSplnen(akt.cesta.id, krok.id);
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
  if (krok && !akt.hotovo.has(krok.id)) krokSplnen(akt.cesta.id, krok.id, e.at);
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
