/**
 * Spec 26.3 (D6 FE) — stav Vypravěče: localStorage-first + BE sync.
 *
 * Pravidla (04 §5.3):
 * - localStorage se zapisuje VŽDY první (synchronně; zdroj obnovy i anonym).
 * - BE PATCH debounced 2 s, delty se koalescují do jedné (BE merge je
 *   idempotentní — set-union/$min/LWW), pending fronta přežívá v localStorage
 *   a re-POSTne se při dalším loadu.
 * - Flush při `pagehide`/`visibilitychange: hidden` přes fetch `keepalive`
 *   (sendBeacon umí jen POST bez hlaviček — keepalive PATCH je ekvivalent
 *   s auth headerem; zavření tabu do 2 s po splnění kroku nesmí ztratit zápis).
 * - Anonym: jen localStorage (`vypravec:anon`); po přihlášení jednorázový
 *   delta merge do BE a vyčištění anon klíče.
 * - Backfill (04 §5.4): GET → `{state:null, legacy:true}` ⇒ seed seenRoutes
 *   ze VŠECH rout registru + `backfilled:true` (žádné „poprvé tady" pro
 *   veterány; seed dělá FE — BE nezná FE routy).
 */
import { getDefaultStore } from 'jotai';
import { api } from '@/shared/api';
import { currentUserAtom } from '@/shared/store/authStore';
import { ROUTES } from '@/app/routeRegistry';

export type VypravecPersona = 'pj' | 'hrac' | 'worldbuilder';
export type VypravecMode = 'active' | 'onCall';

export interface JourneyProgressFE {
  startedAt: string;
  contextWorldId?: string;
  steps: Record<string, string>;
  pausedAt?: string | null;
  dismissedAt?: string | null;
}

export interface OnboardingStateFE {
  persona: VypravecPersona | null;
  journeys: Record<string, JourneyProgressFE>;
  seenRoutes: string[];
  dismissed: string[];
  milestones: Record<string, string>;
  mode: VypravecMode;
  lastSeenChangelog?: string;
  backfilled: boolean;
}

/** Delta = tvar PATCH těla BE (spec-26.3). */
export interface OnboardingDelta {
  persona?: VypravecPersona | null;
  mode?: VypravecMode;
  lastSeenChangelog?: string;
  backfilled?: boolean;
  seenRoutesAdd?: string[];
  dismissedAdd?: string[];
  milestones?: Record<string, string>;
  journeys?: Record<
    string,
    {
      startedAt?: string;
      contextWorldId?: string;
      steps?: Record<string, string>;
      pausedAt?: string | null;
      dismissedAt?: string | null;
    }
  >;
}

const PRAZDNY: OnboardingStateFE = {
  persona: null,
  journeys: {},
  seenRoutes: [],
  dismissed: [],
  milestones: {},
  mode: 'active',
  backfilled: false,
};

const DEBOUNCE_MS = 2000;

function uid(): string {
  return getDefaultStore().get(currentUserAtom)?.id ?? 'anon';
}
const stateKey = (u: string) => `vypravec:${u}`;
const pendingKey = (u: string) => `vypravec:${u}:pending`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* plný/blokovaný storage — stav přežije jen v paměti */
  }
}

/** Lokální aplikace delty — STEJNÁ sémantika jako BE (union/min/FWW/LWW). */
export function aplikujDeltuLokalne(
  s: OnboardingStateFE,
  d: OnboardingDelta,
): OnboardingStateFE {
  const out: OnboardingStateFE = structuredClone(s);
  if (d.persona !== undefined) out.persona = d.persona;
  if (d.mode !== undefined) out.mode = d.mode;
  if (d.lastSeenChangelog !== undefined) out.lastSeenChangelog = d.lastSeenChangelog;
  if (d.backfilled !== undefined) out.backfilled = d.backfilled;
  if (d.seenRoutesAdd)
    out.seenRoutes = [...new Set([...out.seenRoutes, ...d.seenRoutesAdd])];
  if (d.dismissedAdd)
    out.dismissed = [...new Set([...out.dismissed, ...d.dismissedAdd])];
  if (d.milestones)
    for (const [k, v] of Object.entries(d.milestones)) {
      const cur = out.milestones[k];
      if (!cur || v < cur) out.milestones[k] = v;
    }
  if (d.journeys)
    for (const [jId, j] of Object.entries(d.journeys)) {
      const cur = out.journeys[jId] ?? { startedAt: j.startedAt ?? '', steps: {} };
      if (j.startedAt && (!cur.startedAt || j.startedAt < cur.startedAt))
        cur.startedAt = j.startedAt;
      if (j.contextWorldId && !cur.contextWorldId)
        cur.contextWorldId = j.contextWorldId; // first-write-wins
      if (j.steps)
        for (const [sId, at] of Object.entries(j.steps)) {
          const c = cur.steps[sId];
          if (!c || at < c) cur.steps[sId] = at;
        }
      if (j.pausedAt !== undefined) cur.pausedAt = j.pausedAt;
      if (j.dismissedAt !== undefined) cur.dismissedAt = j.dismissedAt;
      out.journeys[jId] = cur;
    }
  return out;
}

/** Koalescence front — dvě delty do jedné (pořadí zachováno: b PO a). */
export function sloucitDelty(a: OnboardingDelta, b: OnboardingDelta): OnboardingDelta {
  const out: OnboardingDelta = { ...a, ...b };
  if (a.seenRoutesAdd || b.seenRoutesAdd)
    out.seenRoutesAdd = [
      ...new Set([...(a.seenRoutesAdd ?? []), ...(b.seenRoutesAdd ?? [])]),
    ];
  if (a.dismissedAdd || b.dismissedAdd)
    out.dismissedAdd = [
      ...new Set([...(a.dismissedAdd ?? []), ...(b.dismissedAdd ?? [])]),
    ];
  if (a.milestones || b.milestones)
    out.milestones = { ...(a.milestones ?? {}), ...(b.milestones ?? {}) };
  if (a.journeys || b.journeys) {
    const merged: NonNullable<OnboardingDelta['journeys']> = {
      ...(a.journeys ?? {}),
    };
    for (const [jId, j] of Object.entries(b.journeys ?? {})) {
      const prev = merged[jId];
      merged[jId] = prev
        ? { ...prev, ...j, steps: { ...(prev.steps ?? {}), ...(j.steps ?? {}) } }
        : j;
    }
    out.journeys = merged;
  }
  return out;
}

type Listener = () => void;

class OnboardingStore {
  private state: OnboardingStateFE = PRAZDNY;
  private ctxUid = 'nenacteno';
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private syncBezi = false;
  /** Roste s každým úspěšným PATCHem — resync s ním hlídá stale GET. */
  private syncGen = 0;
  private initDone = false;
  /** N4: init BĚŽÍ ≠ init HOTOVÝ — brány (C11) čekají na doběhnutí GETu. */
  private initLetJiz = false;
  /** GET doběhl a uživatel je čerstvý (žádný state, ne legacy) — moment 1 (26.4). */
  jeNovy = false;
  /** Init (GET) doběhl — moment 2 u přihlášeného čeká na tohle (C11). */
  get initHotovo(): boolean {
    return this.initDone;
  }

  // ── čtení ──────────────────────────────────────────────────────────────
  getSnapshot = (): OnboardingStateFE => {
    this.zajistiKontext();
    return this.state;
  };

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  /** Přepnutí identity (login/logout) + anon→účet delta merge (04 §5.3). */
  private zajistiKontext(): void {
    const u = uid();
    if (u === this.ctxUid) return;
    const predchozi = this.ctxUid;
    this.ctxUid = u;
    this.state = readJson(stateKey(u), PRAZDNY);
    this.initDone = false;
    this.jeNovy = false;

    // anon → přihlášený: jednorázový delta merge anon stop
    if (predchozi === 'anon' && u !== 'anon') {
      const anonState = readJson<OnboardingStateFE>(stateKey('anon'), PRAZDNY);
      const anonPending = readJson<OnboardingDelta[]>(pendingKey('anon'), []);
      const delta: OnboardingDelta = {};
      if (anonState.seenRoutes.length) delta.seenRoutesAdd = anonState.seenRoutes;
      if (anonState.dismissed.length) delta.dismissedAdd = anonState.dismissed;
      const vse = [delta, ...anonPending].reduce(sloucitDelty, {});
      localStorage.removeItem(stateKey('anon'));
      localStorage.removeItem(pendingKey('anon'));
      // aplikuj (setState v cizích komponentách) NESMÍ běžet v render fázi —
      // getSnapshot volá useSyncExternalStore při renderu (E14).
      if (Object.keys(vse).length) queueMicrotask(() => this.aplikuj(vse));
    }
    queueMicrotask(() => this.notify());
  }

  // ── zápis ──────────────────────────────────────────────────────────────
  /** Jediná mutační cesta: localStorage první, pak fronta + debounce sync. */
  aplikuj(delta: OnboardingDelta): void {
    this.zajistiKontext();
    this.state = aplikujDeltuLokalne(this.state, delta);
    writeJson(stateKey(this.ctxUid), this.state);
    if (this.ctxUid !== 'anon') {
      const pending = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
      pending.push(delta);
      writeJson(pendingKey(this.ctxUid), pending);
      this.naplanujSync();
    }
    this.notify();
  }

  zaznamenejRoutu(route: string): void {
    this.zajistiKontext();
    if (this.state.seenRoutes.includes(route)) return;
    this.aplikuj({ seenRoutesAdd: [route] });
  }

  zavritTip(id: string): void {
    if (this.getSnapshot().dismissed.includes(id)) return;
    this.aplikuj({ dismissedAdd: [id] });
  }

  nastavRezim(mode: VypravecMode): void {
    this.aplikuj({ mode });
  }

  nastavPersonu(persona: VypravecPersona | null): void {
    this.aplikuj({ persona });
  }

  // ── BE sync ────────────────────────────────────────────────────────────
  private naplanujSync(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.sync(), DEBOUNCE_MS);
  }

  /** Odeslat koalescovanou frontu; při úspěchu smazat JEN odeslané delty. */
  async sync(): Promise<void> {
    if (this.syncBezi || this.ctxUid === 'anon' || this.ctxUid === 'nenacteno')
      return;
    const fronta = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
    if (!fronta.length) return;
    this.syncBezi = true;
    const odesilane = fronta.length;
    try {
      await api.patch('/users/me/onboarding', fronta.reduce(sloucitDelty, {}));
      this.syncGen += 1; // zneplatní resync GET rozběhnutý před tímto PATCHem
      const ted = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
      writeJson(pendingKey(this.ctxUid), ted.slice(odesilane));
    } catch {
      /* offline/chyba — fronta zůstává, re-POST příště (BE merge idempotentní) */
    } finally {
      this.syncBezi = false;
      // Delta přišlá BĚHEM PATCHe by jinak čekala na další aktivitu.
      const zbyva = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
      if (zbyva.length > 0) this.naplanujSync();
    }
  }

  /**
   * Init po přihlášení (volat po idle — 04 §6.8): GET stav, merge do lokálu,
   * re-POST pending, backfill legacy účtů.
   */
  async init(): Promise<void> {
    this.zajistiKontext();
    if (
      this.initDone ||
      this.initLetJiz ||
      this.ctxUid === 'anon' ||
      this.ctxUid === 'nenacteno'
    )
      return;
    this.initLetJiz = true;
    try {
      const res = await api.get<{
        state: OnboardingStateFE | null;
        legacy: boolean;
      }>('/users/me/onboarding');
      if (res.state) {
        // server = základ; lokální pending se re-aplikuje (a re-POSTne)
        const pending = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
        this.state = pending.reduce(aplikujDeltuLokalne, res.state);
        writeJson(stateKey(this.ctxUid), this.state);
        // E2/E3: stav může existovat jen díky anon-merge/zaznamenané routě —
        // bez persony, cest a bez zavření dialogu je účet pořád „nový".
        if (
          !this.state.persona &&
          Object.keys(this.state.journeys).length === 0 &&
          !this.state.dismissed.includes('persona-dialog') &&
          !this.state.backfilled
        )
          this.jeNovy = true;
        this.notify();
      } else if (res.legacy) {
        // Backfill 04 §5.4 — veterán: seed všech rout, žádné retro-oslavy.
        this.aplikuj({
          seenRoutesAdd: ROUTES.map((r) => r.pattern),
          backfilled: true,
        });
      } else {
        this.jeNovy = true; // moment 1 (persona dialog) — spotřebuje D7
        this.notify();
      }
      // Hotovo až PO zpracování odpovědi — během letícího GETu se brány
      // (replika 9, „Poprvé tady?") nesmí rozhodovat nad stale lokálem (N4).
      this.initDone = true;
      this.notify();
      await this.sync();
    } catch {
      /* offline start — příští pokus */
    } finally {
      this.initLetJiz = false;
    }
  }

  /**
   * v2 — WS `onboarding:updated` (jiné zařízení PATCHlo): re-GET + merge.
   * Vlastní echo je neškodné (server už náš zápis má; pending re-aplikace
   * je idempotentní — set-union/$min/LWW).
   */
  async resync(): Promise<void> {
    this.zajistiKontext();
    if (this.ctxUid === 'anon' || this.ctxUid === 'nenacteno') return;
    const genPred = this.syncGen;
    try {
      const res = await api.get<{ state: OnboardingStateFE | null }>(
        '/users/me/onboarding',
      );
      if (!res.state) return;
      // Race (revize 07/23, nález 8): pokud BĚHEM GETu doběhl náš PATCH,
      // odpověď je stale — replace by smazal čerstvě odškrtnuté. Zahodit;
      // WS echo vlastního PATCHe stejně přijde a resync poběží znovu.
      if (this.syncGen !== genPred || this.syncBezi) return;
      const pending = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
      this.state = pending.reduce(aplikujDeltuLokalne, res.state);
      writeJson(stateKey(this.ctxUid), this.state);
      this.notify();
    } catch {
      /* offline — příští signál/WS reconnect to dorovná */
    }
  }

  /** Flush při zavírání tabu — fetch keepalive (PATCH s auth hlavičkou). */
  flushKeepalive(): void {
    if (this.ctxUid === 'anon' || this.ctxUid === 'nenacteno') return;
    const fronta = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
    if (!fronta.length) return;
    let token: string | null = null;
    try {
      token = JSON.parse(localStorage.getItem('ikaros.jwt') ?? 'null');
    } catch {
      /* bez tokenu flush nemá smysl */
    }
    if (!token) return;
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    // POZOR: BE má setGlobalPrefix('api') — bez /api je to 404 (revize 07/23).
    void fetch(`${base}/api/users/me/onboarding`, {
      method: 'PATCH',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fronta.reduce(sloucitDelty, {})),
    })
      .then((r) => {
        if (r.ok) {
          const ted = readJson<OnboardingDelta[]>(pendingKey(this.ctxUid), []);
          writeJson(pendingKey(this.ctxUid), ted.slice(fronta.length));
        }
      })
      .catch(() => {
        /* fronta zůstává — re-POST při dalším loadu */
      });
  }
}

export const onboardingStore = new OnboardingStore();

let flushZapojen = false;
/** Zapojit flush listenery (jednou za život appky; volá VypravecRoot). */
export function zapojFlush(): void {
  if (flushZapojen || typeof document === 'undefined') return;
  flushZapojen = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onboardingStore.flushKeepalive();
  });
  window.addEventListener('pagehide', () => onboardingStore.flushKeepalive());
}
