import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatItem, ChatMessage } from '../lib/types';
import { MessageItem } from './MessageItem';
import { formatTime } from '../lib/format';
import s from './MessageList.module.css';

/** Časové okno pro seskupení zpráv téhož autora. */
const GROUP_WINDOW_MS = 3 * 60 * 1000;
/** Vzdálenost od konce, do které ještě auto-scrollujeme na novou zprávu. */
const STICK_THRESHOLD_PX = 140;
/** Jak dlouho po skoku z citace zvýraznit originál. */
const HIGHLIGHT_MS = 1200;

interface MessageListProps {
  items: ChatItem[];
  currentUserId: string;
  surfaceColor: string;
  canDelete: boolean;
  usersById: Map<string, string>;
  onDelete: (messageId: string) => void;
  /** Začít odpověď na zprávu (4.3a). */
  onReply: (message: ChatMessage) => void;
  /** Toggle emoji reakce (4.3a). */
  onToggleReaction: (messageId: string, emoji: string) => void;
  /** Text prázdného stavu. Default Hospoda („Hospoda je tichá…"). */
  emptyText?: string;
  /** 6.1 — skryje reply tlačítka (reply až 6.2). Default true. */
  allowReply?: boolean;
  /** 6.1 — skryje přidávání reakcí (reakce až 6.2). Default true. */
  allowReactions?: boolean;
  /** 6.2 — viz `MessageItem` (passthrough). */
  renderContent?: (message: ChatMessage) => React.ReactNode;
  renderEditor?: (message: ChatMessage) => React.ReactNode;
  editingMessageId?: string | null;
  onStartEdit?: (message: ChatMessage) => void;
  onRetry?: (message: ChatMessage) => void;
  onDiscard?: (message: ChatMessage) => void;
  renderRpDate?: (rpDate: string) => React.ReactNode;
  resolveFont?: (key: string | null | undefined) => string | undefined;
  resolveFontSize?: (key: string | null | undefined) => string | undefined;
  resolveAccountAvatar?: (senderId: string) => string | undefined;
  /** 6.8 — PJ persona resolver (jen world chat). Viz `MessageItem`. */
  resolvePjDisplay?: (
    senderId: string,
  ) => { name: string; avatarUrl: string | null } | null;
  /** 6.2-followup — slug masky → href karty (jen world chat). Viz `MessageItem`. */
  resolveOverrideHref?: (slug: string) => string;
  /** 13.2a — deep-link z notifikačního feedu: po načtení doscrolluj + zvýrazni
   *  tuto zprávu. Pokud není v načteném okně, no-op (jako skok z citace). */
  jumpToMessageId?: string | null;
}

const isWhisper = (m: ChatMessage) => !!m.visibleTo && m.visibleTo.length > 0;
const msgTime = (m: ChatMessage) => new Date(m.createdAt).getTime();

/**
 * Navazuje `cur` na `prev` jako pokračování téže skupiny (stejný autor, stejný
 * whisper-stav, ne reply, do času okna)? Sdílený předpis pro `grouped` (vůči
 * předchozí) i `groupEnd` (vůči následující) — rámeček skupiny zpráv.
 */
const isContinuation = (
  prev: ChatItem | undefined,
  cur: ChatItem,
): boolean =>
  prev?.kind === 'message' &&
  cur.kind === 'message' &&
  prev.message.senderId === cur.message.senderId &&
  isWhisper(prev.message) === isWhisper(cur.message) &&
  !cur.message.replyToId &&
  msgTime(cur.message) - msgTime(prev.message) < GROUP_WINDOW_MS;

/** Scrollovací výpis zpráv — seskupování, auto-scroll, empty stav. */
export function MessageList({
  items,
  currentUserId,
  surfaceColor,
  canDelete,
  usersById,
  onDelete,
  onReply,
  onToggleReaction,
  emptyText = 'Hospoda je tichá… zatím. 🍺',
  allowReply = true,
  allowReactions = true,
  renderContent,
  renderEditor,
  editingMessageId,
  onStartEdit,
  onRetry,
  onDiscard,
  renderRpDate,
  resolveFont,
  resolveFontSize,
  resolveAccountAvatar,
  resolvePjDisplay,
  resolveOverrideHref,
  jumpToMessageId,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);
  // Jsme „přilepení" u dna? Řídí, zda po nárůstu výšky obsahu (dokreslení
  // obrázku přílohy) doskrollovat na konec. Čtení historie ho shodí na false.
  const stickRef = useRef(true);
  // ID zprávy → její root element (pro skok z citace na originál, 4.3a).
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  // Skok na citovaný originál — scroll + krátké zvýraznění. Pokud originál
  // vypadl z načteného okna (starší 50 zpráv), klik nic neudělá.
  const handleJump = useCallback((messageId: string) => {
    const el = itemRefs.current.get(messageId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(
      () => setHighlightedId(null),
      HIGHLIGHT_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(highlightTimer.current), []);

  // 6.8 — mapa id zprávy → senderId, ať citace odpovědi umí dohledat, zda
  // citovaná zpráva je od vedení (→ zobrazit „PJ" místo uloženého jména).
  const senderById = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items)
      if (it.kind === 'message') m.set(it.message.id, it.message.senderId);
    return m;
  }, [items]);
  const resolveReplyPjName = useCallback(
    (replyToId: string): string | null => {
      if (!resolvePjDisplay) return null;
      const sid = senderById.get(replyToId);
      return sid ? resolvePjDisplay(sid)?.name ?? null : null;
    },
    [resolvePjDisplay, senderById],
  );

  // Sleduje poslední viděné ID zprávy — pro detekci „přibyla nová".
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;
    // První naplnění historií — skok na konec bez animace.
    // Najít poslední „skutečnou" zprávu (přeskočit system items).
    const messages = items.flatMap((it) =>
      it.kind === 'message' ? [it.message] : [],
    );
    const lastMsg = messages.at(-1);

    if (!didInit.current) {
      didInit.current = true;
      endRef.current?.scrollIntoView({ behavior: 'auto' });
      lastSeenIdRef.current = lastMsg?.id ?? null;
      return;
    }
    if (!lastMsg) return;
    const isNewMessage = lastMsg.id !== lastSeenIdRef.current;
    lastSeenIdRef.current = lastMsg.id;
    if (!isNewMessage) return;
    // Vlastní zpráva — scroll vždy (uživatel chce vidět, co poslal).
    // Cizí zpráva — jen pokud user není odscrollovaný v historii.
    const isOwn = lastMsg.senderId === currentUserId;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
    if (isOwn || nearBottom) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items, currentUserId]);

  // 13.2a — deep-link skok z notifikačního feedu na konkrétní zprávu. Běží AŽ PO
  // auto-scrollu na konec (effect výše), takže ho přebije a doscrolluje na cíl.
  // Jednorázově per id (ref-guard) — highlight nebliká při každém novém příspěvku.
  // Když zpráva není v načteném okně (`itemRefs` ji nezná), no-op a zkusí to
  // znovu při případném donačtení.
  const jumpedToRef = useRef<string | null>(null);
  useEffect(() => {
    if (!jumpToMessageId || jumpedToRef.current === jumpToMessageId) return;
    if (!itemRefs.current.has(jumpToMessageId)) return;
    jumpedToRef.current = jumpToMessageId;
    handleJump(jumpToMessageId);
  }, [jumpToMessageId, items, handleJump]);

  // Aktualizuj „stick to bottom" při ručním scrollu uživatele.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
  }, []);

  // Drž scroll u dna i když obsah povyroste PO scrollu — typicky dokreslení
  // obrázku přílohy (výšku zná prohlížeč až po stažení; `.single` náhled má
  // `aspect-ratio: auto`, takže do té doby zabírá ~0 px). Bez toho scroll
  // „uskočí" nad zvětšenou poslední zprávu. Respektuje čtení historie.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const ro = new ResizeObserver(() => {
      if (stickRef.current) endRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  if (items.length === 0) {
    return <div className={s.empty}>{emptyText}</div>;
  }

  return (
    <div className={s.scroll} ref={scrollRef} onScroll={handleScroll}>
      <div className={s.content} ref={contentRef}>
        {items.map((item, i) => {
        if (item.kind === 'system') {
          return (
            <div key={item.id} className={s.system}>
              <span className={s.systemTime}>{formatTime(item.at)}</span>{' '}
              {item.text}
            </div>
          );
        }
        const prev = items[i - 1];
        const next = items[i + 1];
        const grouped = isContinuation(prev, item);
        // Konec skupiny = následující zpráva už není pokračováním (nebo nic / system).
        const groupEnd = !(next && isContinuation(item, next));
        return (
          <MessageItem
            key={item.message.id}
            message={item.message}
            currentUserId={currentUserId}
            grouped={grouped}
            groupEnd={groupEnd}
            surfaceColor={surfaceColor}
            canDelete={canDelete}
            usersById={usersById}
            highlighted={highlightedId === item.message.id}
            onDelete={onDelete}
            onReply={onReply}
            onJumpToMessage={handleJump}
            onToggleReaction={onToggleReaction}
            registerRef={registerRef}
            allowReply={allowReply}
            allowReactions={allowReactions}
            renderContent={renderContent}
            renderEditor={renderEditor}
            editing={editingMessageId === item.message.id}
            onStartEdit={onStartEdit}
            onRetry={onRetry}
            onDiscard={onDiscard}
            renderRpDate={renderRpDate}
            resolveFont={resolveFont}
            resolveFontSize={resolveFontSize}
            resolveAccountAvatar={resolveAccountAvatar}
            resolvePjDisplay={resolvePjDisplay}
            resolveReplyPjName={resolveReplyPjName}
            resolveOverrideHref={resolveOverrideHref}
          />
        );
      })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
