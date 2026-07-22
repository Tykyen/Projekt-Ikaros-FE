/**
 * Spec 26.5 (D9) — bublina: JEDINÁ proaktivní forma Vypravěče (03 §3).
 * Jedna naráz; tip s CTA nemizí sám (trvá do zavření / odchodu z routy),
 * oslava auto-zmizí po 8 s. Zavřené se nikdy neopakuje (dismissKey →
 * onboardingStore.dismissed, BE set-union).
 *
 * Auto-tichý režim (03 §4.1): 3 po sobě zavřené TIPY bez interakce →
 * mode 'onCall' + rozlučková replika. Čítač resetuje klik na CTA;
 * oslavy a rozlučka se nepočítají.
 */
import { onboardingStore } from '../state/onboardingStore';
import { telemetrie } from '../state/telemetry';

export interface Bublina {
  /** dismiss klíč (persistence „nikdy víc"); oslavy klíč nemají. */
  dismissKey?: string;
  text: string;
  akce?: { label: string; to?: string; onClick?: () => void };
  /** oslava = auto-hide 8 s, nepočítá se do auto-tichého čítače. */
  oslava?: boolean;
}

const CITAC_KEY = 'vypravec:zavrene-tipy';
const ROZLUCKA = 'Nebudu rušit. Kdybys mě potřeboval, víš, kde mě najdeš.';

type Listener = () => void;

class BublinaStore {
  private aktualni: Bublina | null = null;
  private listeners = new Set<Listener>();
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  getSnapshot = (): Bublina | null => this.aktualni;
  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  /** Zobraz bublinu — respektuje dismissed + režim spí (mimo rozlučku). */
  show(b: Bublina): void {
    const s = onboardingStore.getSnapshot();
    if (b.dismissKey && s.dismissed.includes(b.dismissKey)) return;
    if (s.mode === 'onCall' && !b.oslava) return;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.aktualni = b;
    if (b.oslava) this.hideTimer = setTimeout(() => this.zmiz(), 8000);
    this.notify();
  }

  /** Odchod z routy — tip zmizí bez penalizace čítače (03 §3). */
  zmiz(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.aktualni = null;
    this.notify();
  }

  /** Uživatel klikl na CTA — interakce resetuje auto-tichý čítač. */
  interakce(): void {
    const b = this.aktualni;
    if (b?.dismissKey) onboardingStore.zavritTip(b.dismissKey);
    try {
      localStorage.setItem(CITAC_KEY, '0');
    } catch {
      /* noop */
    }
    this.zmiz();
  }

  /** Zavření křížkem/tapem — počítá se do auto-tichého režimu. */
  zavrit(): void {
    const b = this.aktualni;
    if (!b) return;
    if (b.dismissKey) onboardingStore.zavritTip(b.dismissKey);
    if (b.dismissKey && !b.oslava)
      telemetrie('dismissed', { refId: b.dismissKey });
    this.zmiz();
    if (b.oslava) return;
    let n = 0;
    try {
      n = Number(localStorage.getItem(CITAC_KEY) ?? '0') + 1;
      localStorage.setItem(CITAC_KEY, String(n));
    } catch {
      /* noop */
    }
    if (n >= 3) {
      onboardingStore.nastavRezim('onCall');
      // rozlučka — oslava=true, ať projde režimem spí a nepočítá se
      this.show({ text: ROZLUCKA, oslava: true });
    }
  }
}

export const bublinaStore = new BublinaStore();
