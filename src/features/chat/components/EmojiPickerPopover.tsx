import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { EmojiPicker } from 'frimousse';
import { CZECH_EMOJI, searchCzechEmoji } from './czechEmoji';
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
        <CzechAwareEmojiPicker onSelect={onSelect} onClose={onClose} />
      </div>
    </>,
    document.body,
  );
}

/**
 * D-NEW-emoji-picker-czech — vrchní lišta s českým fulltext search nad
 * lokálním ~120 emoji setem. Pokud query prázdný, ukáže ~16 nejpopulárnějších
 * z CZECH_EMOJI jako quick-pick. Pokud czech search nic nenašel, fallback
 * frimousse picker (anglický).
 */
function CzechAwareEmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? searchCzechEmoji(query) : CZECH_EMOJI.slice(0, 16);
  const useEnglishFallback = query.trim().length > 0 && results.length === 0;

  function pick(emoji: string) {
    onSelect(emoji);
    onClose();
  }

  return (
    <div className={s.root}>
      <input
        type="text"
        className={s.search}
        placeholder="Hledat česky (úsměv, srdce, kostka…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {!useEnglishFallback ? (
        <div className={s.viewport}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '4px',
              padding: '8px',
            }}
          >
            {results.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => pick(e.emoji)}
                title={e.name}
                style={{
                  fontSize: '22px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                {e.emoji}
              </button>
            ))}
          </div>
          {query.trim().length === 0 && (
            <div className={s.hint} style={{ fontSize: '0.85em', padding: '4px 8px' }}>
              💡 Pro úplnou paletu napiš česky nebo anglicky.
            </div>
          )}
        </div>
      ) : (
        <EmojiPicker.Root
          className={s.root}
          onEmojiSelect={({ emoji }) => pick(emoji)}
        >
          <EmojiPicker.Search
            className={s.search}
            placeholder="Hledat anglicky (smile, heart…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <EmojiPicker.Viewport className={s.viewport}>
            <EmojiPicker.Loading className={s.hint}>Načítám…</EmojiPicker.Loading>
            <EmojiPicker.Empty className={s.hint}>Nic nenalezeno.</EmojiPicker.Empty>
            <EmojiPicker.List className={s.list} />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      )}
    </div>
  );
}
