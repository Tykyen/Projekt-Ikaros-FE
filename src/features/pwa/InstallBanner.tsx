import { useEffect, useRef } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useInstallPrompt } from './useInstallPrompt';
import s from './InstallBanner.module.css';

/**
 * Spec 15.1 — nenápadný spodní banner s pobídkou k instalaci PWA.
 * Logika (kdy zobrazit, jak nainstalovat) je v `useInstallPrompt`.
 */
export function InstallBanner() {
  const { shouldShow, canPrompt, isIos, install, dismiss } = useInstallPrompt();

  // Spec 26.1 — bottom-stack kontrakt: na mobilu (≤768 px) banner šířkou
  // zasahuje do pravého rohu → hlásí výšku přes `--pwa-banner-h`, FAB
  // Vypravěče si o ni zvedne bottom. Desktop (bottom-center) roh nezasahuje.
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const el = bannerRef.current;
    const mq = window.matchMedia('(max-width: 768px)');
    if (!shouldShow || !el) {
      root.style.removeProperty('--pwa-banner-h');
      return;
    }
    function apply() {
      if (mq.matches && el)
        root.style.setProperty('--pwa-banner-h', `${el.offsetHeight + 12}px`);
      else root.style.removeProperty('--pwa-banner-h');
    }
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      root.style.removeProperty('--pwa-banner-h');
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <div
      ref={bannerRef}
      className={s.banner}
      role="dialog"
      aria-label="Nainstalovat aplikaci Ikaros"
    >
      <img src="/icons/icon-192.png" alt="" className={s.icon} />
      <div className={s.text}>
        <strong>Nainstaluj Ikaros</strong>
        {isIos && !canPrompt ? (
          <span>
            Klepni na <Share size={14} aria-label="Sdílet" /> a zvol „Přidat na plochu".
          </span>
        ) : (
          <span>Měj appku na ploše — rychlejší start a notifikace.</span>
        )}
      </div>
      {canPrompt && (
        <Button size="sm" onClick={install} className={s.cta}>
          <Download size={16} /> Nainstalovat
        </Button>
      )}
      <button className={s.close} onClick={dismiss} aria-label="Zavřít" type="button">
        <X size={18} />
      </button>
    </div>
  );
}
