import { useState } from 'react';
import { Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { KebabMenu, type KebabMenuItem } from '@/shared/ui/KebabMenu/KebabMenu';
import s from './ShareButton.module.css';

// Lucide odstranil brand ikony (Facebook/Twitter) z hlavního balíčku → vlastní
// monochrome glyfy (currentColor, dědí barvu z menu položky).
function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.1 24 12.07Z" />
    </svg>
  );
}
function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z" />
    </svg>
  );
}

export interface ShareButtonProps {
  /** Absolutní URL ke sdílení. */
  url: string;
  /** Název (Web Share `title` + text X intentu). */
  title: string;
  /** Delší popis pro nativní share sheet (volitelný). */
  text?: string;
  className?: string;
}

/**
 * 15B.6 — sdílecí tlačítko. Adaptivní:
 *  • mobil/PWA (`navigator.share` dostupné) → nativní share sheet (1 tap),
 *  • desktop → `KebabMenu` (Kopírovat odkaz · Facebook · X).
 *
 * Sdílí se holá URL — žádné API klíče, žádný OAuth; náhled si síť stáhne
 * z OG meta tagů cílové stránky (15B.2). Znovupoužitelný primitiv (vitrína 17.3).
 */
export function ShareButton({ url, title, text, className }: ShareButtonProps) {
  // Callback ref do state (ne useRef.current v renderu) → KebabMenu dostane
  // platný anchor a nehlásí „access ref during render".
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Odkaz zkopírován');
    } catch {
      toast.error('Kopírování selhalo');
    }
  }

  function openSharer(shareUrl: string) {
    // noopener,noreferrer = obrana proti reverse tabnabbingu (otevřená
    // stránka nesmí přes window.opener přesměrovat naši záložku).
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  /** Obalí akci tak, aby po spuštění zavřela menu (KebabMenu sám nezavírá). */
  function withClose(fn: () => void): () => void {
    return () => {
      fn();
      setMenuOpen(false);
    };
  }

  const items: KebabMenuItem[] = [
    {
      key: 'copy',
      label: 'Kopírovat odkaz',
      icon: <LinkIcon size={16} aria-hidden />,
      onClick: withClose(() => void copyLink()),
    },
    {
      key: 'facebook',
      label: 'Sdílet na Facebooku',
      icon: <FacebookGlyph />,
      onClick: withClose(() =>
        openSharer(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        ),
      ),
    },
    {
      key: 'x',
      label: 'Sdílet na X',
      icon: <XGlyph />,
      onClick: withClose(() =>
        openSharer(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        ),
      ),
    },
  ];

  async function handleClick() {
    const canNativeShare =
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' || navigator.canShare({ url }));
    if (canNativeShare) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // Uživatel zrušil systémový sheet → tiše skonči.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Jiná chyba → spadni do menu fallbacku.
      }
    }
    setMenuOpen(true);
  }

  return (
    <>
      <button
        ref={setAnchorEl}
        type="button"
        className={clsx(s.btn, className)}
        onClick={() => void handleClick()}
        aria-label="Sdílet"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <Share2 size={16} aria-hidden />
        <span className={s.label}>Sdílet</span>
      </button>
      <KebabMenu
        anchor={anchorEl}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        ariaLabel="Možnosti sdílení"
      />
    </>
  );
}
