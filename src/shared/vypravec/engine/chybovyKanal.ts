/**
 * Spec 26.5 (D9) — bezzávislostní kanál chyb API → Vypravěč.
 * ŽÁDNÉ importy: client.ts (shared/api) ho volá při každé API chybě a
 * vypravec engine se přihlásí k odběru — jinak by vznikl kruh
 * client → vypravec → onboardingStore → client.
 */
export interface ApiChyba {
  code: string | null;
  status: number | null;
  /** pathname v okamžiku chyby (route kontext pro čítač 2× stejné chyby). */
  route: string;
}

type Handler = (ch: ApiChyba) => void;
let handler: Handler | null = null;

/** Volá client.ts response interceptor (fire-and-forget, nikdy nehodí). */
export function ohlasApiChybu(code: string | null, status: number | null): void {
  if (!handler) return;
  try {
    handler({ code, status, route: window.location.pathname });
  } catch {
    /* Vypravěč nesmí shodit error handling aplikace */
  }
}

export function odebirejApiChyby(h: Handler): () => void {
  handler = h;
  return () => {
    if (handler === h) handler = null;
  };
}
