/**
 * Spec 26.9 (03 §8.2) — „Ukázání": po navigaci zvýrazni cílový prvek.
 * MVP: pulzující obrys + scroll-into-view; `pointer-events: none` overlay
 * neexistuje — třída jde PŘÍMO na prvek (nikdy neblokuje interakci).
 * Konec: klik kamkoli nebo 8 s. Prvek nenalezen (role/mobil) → bublina
 * s fallbackText — slovní navigace je rovnocenná (a11y 03 §7).
 */
import { KOTVY, type AnchorId } from '../registry/anchors';
import { bublinaStore } from '../ui/bublinaStore';

const TRIDA = 'vypravec-highlight';
const HLEDANI_MS = 3000;
const TRVANI_MS = 8000;

let uklid: (() => void) | null = null;

function ukonci(): void {
  uklid?.();
  uklid = null;
}

/** Zvýrazni kotvu na AKTUÁLNÍ stránce (volat až po navigaci). */
export function zvyrazni(id: AnchorId): void {
  ukonci();
  const start = performance.now();

  function zkus(): void {
    const el = document.querySelector<HTMLElement>(`[data-vypravec="${id}"]`);
    if (!el) {
      if (performance.now() - start < HLEDANI_MS) {
        const raf = requestAnimationFrame(zkus);
        uklid = () => cancelAnimationFrame(raf);
        return;
      }
      // slovní fallback — prvek pro tuto roli/viewport neexistuje
      bublinaStore.show({ text: KOTVY[id].fallbackText });
      return;
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add(TRIDA);
    // dočasný slovní ekvivalent pro čtečky (03 §7)
    const puvodniDesc = el.getAttribute('aria-description');
    el.setAttribute('aria-description', 'Sem tě vede Vypravěč.');

    const konec = () => {
      el.classList.remove(TRIDA);
      if (puvodniDesc == null) el.removeAttribute('aria-description');
      else el.setAttribute('aria-description', puvodniDesc);
      document.removeEventListener('pointerdown', konec, true);
      clearTimeout(timer);
      uklid = null;
    };
    const timer = setTimeout(konec, TRVANI_MS);
    document.addEventListener('pointerdown', konec, true);
    uklid = konec;
  }

  zkus();
}
