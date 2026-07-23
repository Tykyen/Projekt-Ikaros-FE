/**
 * Spec 26.3/26.4 (D7) — FE event bus Vypravěče.
 * Eventy NESOU payload {worldId?, channelKind?, pageType?} (oprava kritiky —
 * `message.sent` v Putyce nesmí splnit krok „Napiš do SVÉHO světa").
 * Event = okamžitý trigger (oslava, odškrtnutí v UI); zdroj pravdy je stav
 * (probe/visit) — engine odškrtává idempotentně, checklist nikdy nelže.
 *
 * Eager stub s bufferem (04 §4): emity z mutation handlerů běží dřív, než se
 * dohraje lazy engine — buffer drží posledních 50 eventů do připojení odběru.
 */

export type VypravecEventName =
  | 'world.created'
  | 'page.created'
  | 'message.sent'
  | 'invite.created'
  | 'join.requested'
  | 'dice.rolled'
  | 'subject.created'
  | 'rsvp.confirmed'
  | 'persona.chosen'
  // v2 — cesta tm-vycvik (Měďák) + milník „první hráč" (05 §5b, §6):
  | 'scene.created'
  | 'scene.activated'
  | 'token.spawned'
  | 'fog.used'
  | 'initiative.started'
  | 'member.approved';

export interface VypravecEventPayload {
  worldId?: string;
  worldSlug?: string;
  channelKind?: 'world' | 'putyka' | 'camp';
  pageType?: string;
}

export interface VypravecEvent {
  name: VypravecEventName;
  payload: VypravecEventPayload;
  at: string; // ISO
}

type Handler = (e: VypravecEvent) => void;

const BUFFER_MAX = 50;
const buffer: VypravecEvent[] = [];
const handlers = new Set<Handler>();

/** Jednořádkový emit pro mutation-success handlery napříč featurami. */
export function vypravecEmit(
  name: VypravecEventName,
  payload: VypravecEventPayload = {},
): void {
  const e: VypravecEvent = { name, payload, at: new Date().toISOString() };
  if (handlers.size === 0) {
    buffer.push(e);
    if (buffer.length > BUFFER_MAX) buffer.shift();
    return;
  }
  for (const h of handlers) h(e);
}

/** Připojení enginu — nejdřív přehraje buffer (eventy před dohráním chunku). */
export function vypravecSubscribe(h: Handler): () => void {
  handlers.add(h);
  if (buffer.length) {
    const drain = buffer.splice(0, buffer.length);
    for (const e of drain) h(e);
  }
  return () => handlers.delete(h);
}
