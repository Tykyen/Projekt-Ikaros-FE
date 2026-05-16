import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { EmojiPicker } from 'frimousse';
import s from './EmojiPickerPopover.module.css';

/** Rozměry panelu (desktop) — drží se v synchronu s `.root` v CSS. */
const PANEL_W = 300;
const PANEL_H = 320;
const GAP = 4;
const MOBILE_BP = 768;

interface EmojiPickerPopoverProps {
  /** Kotevní prvek (tlačítko reakce) — od něj se počítá pozice. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Klik na emoji → jeho znak (toggle reakce). */
  onSelect: (emoji: string) => void;
  /** Zavření (klik mimo, Escape, výběr emoji). */
  onClose: () => void;
}

/**
 * Emoji picker pro reakce (krok 4.3a) — wrapper nad headless `frimousse`,
 * ostylovaný design tokeny platformy.
 *
 * Renderuje se přes portál do `body` s `position: fixed` — výpis zpráv má
 * `overflow: auto`, takže `absolute` popover uvnitř něj by se u krajních
 * zpráv ořízl. Desktop: panel ukotvený k tlačítku (překlopí se nahoru,
 * když se dolů nevejde). Mobil: spodní sheet přes celou šířku.
 */
export function EmojiPickerPopover({
  anchorRef,
  onSelect,
  onClose,
}: EmojiPickerPopoverProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BP;

  // Pozici počítáme z kotvy po mountu (a tedy po znalosti viewportu).
  useLayoutEffect(() => {
    if (isMobile) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Dolů pod tlačítko; když se panel nevejde, překlopit nahoru.
    const below = rect.bottom + GAP;
    const top =
      below + PANEL_H > window.innerHeight ? rect.top - GAP - PANEL_H : below;
    // Zarovnat pravý okraj panelu k tlačítku, držet v rámci viewportu.
    const left = Math.min(
      Math.max(rect.right - PANEL_W, GAP),
      window.innerWidth - PANEL_W - GAP,
    );
    setPos({ top: Math.max(top, GAP), left });
  }, [anchorRef, isMobile]);

  // Escape zavírá picker.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Desktop čeká na dopočet pozice; mobil ji nepotřebuje (CSS bottom sheet).
  if (!isMobile && !pos) return null;

  return createPortal(
    <>
      {/* Backdrop — klik mimo picker ho zavře. */}
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={s.panel}
        style={isMobile ? undefined : { top: pos!.top, left: pos!.left }}
        role="dialog"
        aria-label="Výběr emoji"
      >
        <EmojiPicker.Root
          className={s.root}
          onEmojiSelect={({ emoji }) => {
            onSelect(emoji);
            onClose();
          }}
        >
          <EmojiPicker.Search className={s.search} placeholder="Hledat emoji…" />
          <EmojiPicker.Viewport className={s.viewport}>
            <EmojiPicker.Loading className={s.hint}>
              Načítám…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className={s.hint}>
              Nic nenalezeno.
            </EmojiPicker.Empty>
            <EmojiPicker.List className={s.list} />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </div>
    </>,
    document.body,
  );
}
