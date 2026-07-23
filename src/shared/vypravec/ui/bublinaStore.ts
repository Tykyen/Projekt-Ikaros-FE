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
  /** Zavření platí jen pro session (chybová vysvětlení — chyba se vrací). */
  sessionDismiss?: boolean;
  /** Interní: routa vzniku (zavírání při odchodu z routy, ne při příchodu). */
  route?: string;
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

  /**
   * Zobraz bublinu — respektuje dismissed + režim spí (mimo rozlučku).
   * Vrací true jen při skutečném zobrazení (telemetrie nesmí lhát).
   * Priorita: oslava NIKDY nepřepíše zobrazený tip/chybu s CTA.
   */
  show(b: Bublina): boolean {
    const s = onboardingStore.getSnapshot();
    if (b.dismissKey && !b.sessionDismiss && s.dismissed.includes(b.dismissKey))
      return false;
    if (b.dismissKey && b.sessionDismiss && this.sessionDismissed().has(b.dismissKey))
      return false;
    if (s.mode === 'onCall' && !b.oslava) return false;
    if (b.oslava && this.aktualni?.akce) return false; // priorita rady nad oslavou
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.aktualni = { ...b, route: window.location.pathname };
    if (b.oslava) this.hideTimer = setTimeout(() => this.zmiz(), 8000);
    this.notify();
    return true;
  }

  private sessionDismissed(): Set<string> {
    try {
      return new Set(
        JSON.parse(sessionStorage.getItem('vypravec:sess-dismiss') ?? '[]'),
      );
    } catch {
      return new Set();
    }
  }

  /** Zavření při ODCHODU z routy (03 §3) — příchozí bublinu nezabíjí. */
  zavriPriOdchodu(pathname: string): void {
    if (this.aktualni && this.aktualni.route !== pathname) this.zmiz();
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
    if (b.dismissKey && b.sessionDismiss) {
      try {
        const set = [...this.sessionDismissed(), b.dismissKey];
        sessionStorage.setItem('vypravec:sess-dismiss', JSON.stringify(set));
      } catch {
        /* noop */
      }
    } else if (b.dismissKey) onboardingStore.zavritTip(b.dismissKey);
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
      try {
        localStorage.setItem(CITAC_KEY, '0'); // reset — po znovuzapnutí zase 3
      } catch {
        /* noop */
      }
      onboardingStore.nastavRezim('onCall');
      // rozlučka — oslava=true, ať projde režimem spí a nepočítá se
      this.show({ text: ROZLUCKA, oslava: true });
    }
  }
}

export const bublinaStore = new BublinaStore();
