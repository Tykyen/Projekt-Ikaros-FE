import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Search, Smile } from 'lucide-react';
import { EmojiPicker } from 'frimousse';
import { useWorldEmotes } from '../api/useWorldEmotes';
import { useGlobalEmotes } from '../api/useGlobalEmotes';
import { buildEmoteUrl } from '../lib/buildEmoteUrl';
import type { WorldEmote } from '../lib/types';
import s from './ChatEmotePickerPopover.module.css';

const PANEL_W = 360;
const PANEL_H = 480;
const GAP = 4;
const MOBILE_BP = 768;

interface ChatEmotePickerPopoverProps {
  worldId: string;
  anchorRef: RefObject<HTMLElement | null>;
  /** Klik na emote → vloží `:shortcode:` (custom) nebo unicode (statické). */
  onInsert: (token: string) => void;
  onClose: () => void;
}

/**
 * Krok 6.4e — picker pro composer světového chatu se 3 sekcemi:
 * - Tohoto světa (custom per-svět emotes)
 * - Globální (custom platform emotes)
 * - Statické (Unicode emoji přes frimousse)
 *
 * Klik na custom tile vloží `:shortcode:`, klik na unicode vloží znak.
 * Search nahoře filtruje napříč sekcemi.
 */
export function ChatEmotePickerPopover({
  worldId,
  anchorRef,
  onInsert,
  onClose,
}: ChatEmotePickerPopoverProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BP;
  const [query, setQuery] = useState('');

  const worldQ = useWorldEmotes(worldId);
  const globalQ = useGlobalEmotes();
  const worldEmotes = worldQ.data ?? [];
  const globalEmotes = globalQ.data ?? [];

  const lowerQuery = query.toLowerCase();
  const filterFn = (e: WorldEmote) =>
    !lowerQuery ||
    e.shortcode.toLowerCase().includes(lowerQuery) ||
    e.name.toLowerCase().includes(lowerQuery);

  const filteredWorld = useMemo(
    () => worldEmotes.filter(filterFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worldEmotes, lowerQuery],
  );
  const filteredGlobal = useMemo(
    () => globalEmotes.filter(filterFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalEmotes, lowerQuery],
  );

  useLayoutEffect(() => {
    if (isMobile) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = rect.bottom + GAP;
    const top =
      below + PANEL_H > window.innerHeight ? rect.top - GAP - PANEL_H : below;
    const left = Math.min(
      Math.max(rect.right - PANEL_W, GAP),
      window.innerWidth - PANEL_W - GAP,
    );
    setPos({ top: Math.max(top, GAP), left });
  }, [anchorRef, isMobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isMobile && !pos) return null;

  const handleEmoteClick = (emote: WorldEmote) => {
    onInsert(`:${emote.shortcode}:`);
  };

  const renderTile = (emote: WorldEmote) => (
    <button
      key={emote.id}
      type="button"
      className={s.tile}
      onClick={() => handleEmoteClick(emote)}
      title={`:${emote.shortcode}: — ${emote.name}`}
      aria-label={`Vložit :${emote.shortcode}:`}
    >
      <img
        className={s.tileImg}
        src={buildEmoteUrl(emote.imageUrl)}
        alt={`:${emote.shortcode}:`}
        loading="lazy"
      />
    </button>
  );

  return createPortal(
    <>
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={s.panel}
        style={isMobile ? undefined : { top: pos!.top, left: pos!.left }}
        role="dialog"
        aria-label="Vložit emote"
      >
        <header className={s.header}>
          <span className={s.ornament}>◆</span>
          <span className={s.headerLine} aria-hidden="true" />
        </header>

        <div className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={s.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat glyf…"
            aria-label="Hledat emote"
          />
        </div>

        <div className={s.scroll}>
          {filteredWorld.length > 0 && (
            <section className={s.section}>
              <h3 className={s.sectionTitle}>
                Tohoto světa
                <span className={s.sectionCount}>· {filteredWorld.length}</span>
              </h3>
              <div className={s.tileGrid}>{filteredWorld.map(renderTile)}</div>
            </section>
          )}

          {filteredGlobal.length > 0 && (
            <section className={s.section}>
              <h3 className={s.sectionTitle}>
                Globální
                <span className={s.sectionCount}>· {filteredGlobal.length}</span>
              </h3>
              <div className={s.tileGrid}>{filteredGlobal.map(renderTile)}</div>
            </section>
          )}

          <section className={s.section}>
            <h3 className={s.sectionTitle}>
              <Smile size={11} aria-hidden="true" />
              <span>Statické</span>
            </h3>
            <EmojiPicker.Root
              className={s.unicodeRoot}
              onEmojiSelect={({ emoji }) => onInsert(emoji)}
            >
              <EmojiPicker.Viewport className={s.unicodeViewport}>
                <EmojiPicker.Loading className={s.unicodeHint}>
                  Načítám…
                </EmojiPicker.Loading>
                <EmojiPicker.Empty className={s.unicodeHint}>
                  Nic nenalezeno.
                </EmojiPicker.Empty>
                <EmojiPicker.List className={s.unicodeList} />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </section>

          {filteredWorld.length === 0 &&
            filteredGlobal.length === 0 &&
            query.length > 0 && (
              <p className={s.emptyQuery}>
                Nic neodpovídá „{query}".
              </p>
            )}
        </div>
      </div>
    </>,
    document.body,
  );
}
