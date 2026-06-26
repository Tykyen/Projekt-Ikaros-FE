import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  Reply,
  SmilePlus,
  CornerUpLeft,
  Pencil,
  Theater,
  MoreVertical,
} from 'lucide-react';
import clsx from 'clsx';
import type { ChatMessage } from '../lib/types';
import { parseEmotes } from '../lib/emotes';
import { resolveTombstone } from '@/shared/lib/tombstone';
import { guardChatColor } from '../lib/chatColorGuard';
import { formatTime, formatChatStamp, formatChatFull } from '../lib/format';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { KebabMenu, type KebabMenuItem } from '@/shared/ui/KebabMenu/KebabMenu';
import { MessageAttachments } from './MessageAttachments';
import { DiceMessage } from '@/features/world/chat/dice/components/DiceMessage';
import s from './MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  /** Po sobě jdoucí zpráva téhož autora — skryje hlavičku (jméno + čas). */
  grouped: boolean;
  /** Poslední zpráva ve skupině — uzavře rámeček skupiny (spodní hrana). */
  groupEnd: boolean;
  /** Computed `--theme-surface` pro kontrast guard barvy textu. */
  surfaceColor: string;
  /** Admin/Superadmin → zobrazí tlačítko smazat. */
  canDelete: boolean;
  /** userId → username, pro popisek cíle whisperu. */
  usersById: Map<string, string>;
  /** Krátké zvýraznění po skoku z citace na originál (4.3a). */
  highlighted: boolean;
  onDelete: (messageId: string) => void;
  /** Začít odpověď na tuto zprávu. */
  onReply: (message: ChatMessage) => void;
  /** Skok na citovaný originál (klik na citaci). */
  onJumpToMessage: (messageId: string) => void;
  /** Toggle emoji reakce. */
  onToggleReaction: (messageId: string, emoji: string) => void;
  /** Registrace root elementu do mapy `MessageList` (pro scroll-to). */
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  /** 6.1 — skryje tlačítko Odpovědět (world chat shell; reply až 6.2). Default true. */
  allowReply?: boolean;
  /** 6.1 — skryje přidávání emoji reakcí (reakce až 6.2). Default true. */
  allowReactions?: boolean;
  /**
   * 6.2 — vlastní render funkce obsahu (mention spans, world emote img).
   * Dostává celou zprávu, ať může číst `mentions[]` pro highlight self.
   * Globální chat ji nepředává → fallback na `parseEmotes` string transform.
   */
  renderContent?: (message: ChatMessage) => React.ReactNode;
  /**
   * 6.2c — editace zpráv. `editing` = jsme uvnitř MessageEditInline (composer
   * překryje obsah). `onStartEdit` schová tlačítko ✎ pokud není předáno.
   */
  editing?: boolean;
  onStartEdit?: (message: ChatMessage) => void;
  /** 6.2c — render-prop pro inline edit komponentu (pokud `editing === true`). */
  renderEditor?: (message: ChatMessage) => React.ReactNode;
  /**
   * 6.2h — optimistic UI akce pro failed zprávu. Pokud nedodáno, failed bar
   * se nezobrazí (global chat featurou nezatížen).
   */
  onRetry?: (message: ChatMessage) => void;
  onDiscard?: (message: ChatMessage) => void;
  /** 6.2d — render RP datum badge (world chat předává RpDateBadge). */
  renderRpDate?: (rpDate: string) => React.ReactNode;
  /** 6.2f — resolver per-svět fontu (klíč → CSS font-family stack). */
  resolveFont?: (key: string | null | undefined) => string | undefined;
  /** 6.2f — resolver velikosti písma (klíč → CSS rem hodnota). */
  resolveFontSize?: (key: string | null | undefined) => string | undefined;
  /**
   * Avatar fallback. Hierarchie:
   *   1. `message.overrideAvatarUrl` (NPC mód, 6.2e)
   *   2. `message.senderAvatarUrl` (membership v daném světě)
   *   3. tento resolver — typicky globální `User.avatarUrl` ze členů světa
   *   4. interní fallback — kruh s prvním písmenem
   * Volá se jen pokud 1 i 2 chybí.
   */
  resolveAccountAvatar?: (senderId: string) => string | undefined;
  /**
   * 6.8 — PJ persona. Pokud je odesílatel vedení světa (role ≥ PomocnyPJ) a
   * zpráva NENÍ NPC override, zobrazí jednotnou identitu „PJ" + per-svět avatar
   * místo přihlašovacího jména. `null` = běžné jméno/avatar. Předává jen world
   * chat (role jsou world-scoped). Priorita: NPC override > PJ persona > jméno.
   */
  resolvePjDisplay?: (
    senderId: string,
  ) => { name: string; avatarUrl: string | null } | null;
  /** 6.8 — jméno PJ persony pro citaci odpovědi (`replyToId` → „PJ"). */
  resolveReplyPjName?: (replyToId: string) => string | null;
  /**
   * 6.2-followup — maska s vazbou na kartu. Pokud zpráva má `overridePageSlug`
   * a tento resolver je dodán (jen world chat), jméno NPC je odkaz na kartu.
   * Globální chat resolver nepředá → jméno zůstává prostý text.
   */
  resolveOverrideHref?: (slug: string) => string;
}

/** Jedna položka výpisu chatu — veřejná zpráva / whisper / smazaná zpráva. */
export function MessageItem({
  message,
  currentUserId,
  grouped,
  groupEnd,
  surfaceColor,
  canDelete,
  usersById,
  highlighted,
  onDelete,
  onReply,
  onJumpToMessage,
  onToggleReaction,
  registerRef,
  allowReply = true,
  allowReactions = true,
  renderContent,
  editing = false,
  onStartEdit,
  renderEditor,
  onRetry,
  onDiscard,
  renderRpDate,
  resolveFont,
  resolveFontSize,
  resolveAccountAvatar,
  resolvePjDisplay,
  resolveReplyPjName,
  resolveOverrideHref,
}: MessageItemProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  // Dotyk: jedno ⋮ tlačítko → KebabMenu (inline ikony se na mobilu nevešly do
  // rezervovaného sloupce a ležely na textu).
  const [menuOpen, setMenuOpen] = useState(false);
  // Callback ref (ne useRef.current za renderu) — vzor jako ShareButton:
  // zápis elementu do state dá KebabMenu platnou kotvu bez varování.
  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(null);
  const isSelf = message.senderId === currentUserId;
  const isWhisper = !!message.visibleTo && message.visibleTo.length > 0;
  const isNpc = !!message.overrideName;
  // 6.2-followup — maska napojená na kartu → klikací jméno (jen world chat,
  // kde je `resolveOverrideHref` dodán). Smazaná/přesunutá karta = friendly 404.
  const overrideHref =
    isNpc && message.overridePageSlug && resolveOverrideHref
      ? resolveOverrideHref(message.overridePageSlug)
      : null;
  const isPending = message._status === 'pending';
  const isFailed = message._status === 'failed';
  const isDice = !!message.isDiceRoll;
  const time = formatTime(message.createdAt);
  // Datum-aware štítek (stáří příspěvku) + plný tooltip; sdílí oba chaty.
  const stamp = formatChatStamp(message.createdAt);
  const stampFull = formatChatFull(message.createdAt);

  const rawText = message.content ?? '';
  const content = renderContent
    ? renderContent(message)
    : parseEmotes(rawText);
  const textColor = guardChatColor(message.color, surfaceColor);
  const reactions = Object.entries(message.reactions ?? {});
  // Recovery pro historické zprávy: BE měl bug, kdy bez `characterPath` ukládal
  // `requester.id` (MongoDB ObjectID, 24 hex znaků) jako `senderName`. Pokud
  // takovou hodnotu vidíme, zkusíme aktuální username z members mapy.
  const looksLikeObjectId = /^[0-9a-f]{24}$/i.test(message.senderName);
  const resolvedSenderName =
    looksLikeObjectId && usersById.get(message.senderId)
      ? usersById.get(message.senderId)!
      : message.senderName;

  // 6.8 — PJ persona (jen world chat). Vedení vystupuje jako „PJ" + per-svět
  // avatar. NPC override má přednost (PJ mluvící za bytost zůstává bytostí).
  const pjDisplay =
    !isNpc && resolvePjDisplay ? resolvePjDisplay(message.senderId) : null;

  // D-040 — tombstone overlay pro smazané autory; NPC override (overrideName)
  // přebíjí tombstone, autor NPC zprávy zůstane v podobě persony. PJ persona
  // (6.8) přebíjí i tombstone — identita vedení se schovává záměrně.
  const tombstone = isNpc
    ? { displayName: message.overrideName!, avatarUrl: message.overrideAvatarUrl, deleted: false }
    : pjDisplay
      ? { displayName: pjDisplay.name, avatarUrl: pjDisplay.avatarUrl ?? undefined, deleted: false }
      : resolveTombstone({
          isDeleted: message.senderIsDeleted,
          displayName: resolvedSenderName,
          avatarUrl:
            message.senderAvatarUrl ?? resolveAccountAvatar?.(message.senderId),
        });
  const displayName = tombstone.displayName;
  const isAuthorDeleted = tombstone.deleted;

  // Avatar fallback hierarchie — NPC override → membership → account → initial.
  // U tombstone autora má `tombstone.avatarUrl === undefined`, takže padá na initial.
  const avatarUrl = tombstone.avatarUrl || null;
  const avatarInitial = (displayName || '?').slice(0, 1).toUpperCase();

  // 6.3 — smazané zprávy zachovají avatar + jméno autora, aby uživatel
  // viděl kdo zprávu napsal. Dice hod navíc zobrazí hint (např. „hod
  // kostkou +3") pokud BE drží payload i po soft-delete.
  if (message.isDeleted) {
    const dicePayload = message.dicePayload as
      | { total?: number; type?: string }
      | null
      | undefined;
    const diceHint =
      isDice && dicePayload?.total !== undefined
        ? ` (hod kostkou ${dicePayload.total > 0 ? '+' : ''}${dicePayload.total})`
        : isDice
          ? ' (hod kostkou)'
          : '';
    return (
      <div
        ref={(el) => registerRef(message.id, el)}
        className={clsx(s.item, s.deleted, grouped && s.grouped, groupEnd && s.groupEnd)}
      >
        {grouped ? (
          <div className={s.avatarSlotGrouped} aria-hidden="true" />
        ) : (
          <div className={s.avatarSlot}>
            <span className={s.avatar} title={displayName}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" loading="lazy" />
              ) : (
                avatarInitial
              )}
            </span>
          </div>
        )}
        <div className={s.content_col}>
          {!grouped && (
            <div className={s.meta}>
              <span className={s.name}>{displayName}</span>
              {stamp && <time className={s.time} title={stampFull}>{stamp}</time>}
            </div>
          )}
          <span className={s.deletedText}>
            Zpráva byla smazána{diceHint}
          </span>
        </div>
      </div>
    );
  }

  // Popisek whisperu: odesílatel vidí „→ příjemce", příjemce „od odesílatele".
  let whisperLabel = '';
  if (isWhisper) {
    if (isSelf) {
      const toId = message.visibleTo!.find((id) => id !== currentUserId);
      whisperLabel = `→ ${(toId && usersById.get(toId)) || 'někomu'}`;
    } else {
      whisperLabel = `od ${displayName}`;
    }
  }

  // 6.2c — edit dostupný pro vlastníka (ne dice) nebo pro PJ/Admin moderaci.
  const canEdit =
    !!onStartEdit && !isDice && (isSelf || canDelete) && !isPending && !isFailed;

  // Sdílené podmínky viditelnosti pro inline ikony (desktop) i kebab (dotyk).
  const showReply = allowReply && !isPending && !isFailed;
  const showReact = allowReactions && !isPending && !isFailed;
  const showDelete = (canDelete || (isSelf && !isDice)) && !isPending && !isFailed;
  const hasActions = showReply || showReact || canEdit || showDelete;

  // Dotyk: stejné akce jako inline lišta, jen složené do KebabMenu.
  const menuItems: KebabMenuItem[] = [];
  if (showReply)
    menuItems.push({
      key: 'reply',
      label: 'Odpovědět',
      icon: <Reply size={15} />,
      onClick: () => onReply(message),
    });
  if (showReact)
    menuItems.push({
      key: 'react',
      label: 'Přidat reakci',
      icon: <SmilePlus size={15} />,
      onClick: () => setPickerOpen(true),
    });
  if (canEdit)
    menuItems.push({
      key: 'edit',
      label: 'Upravit zprávu',
      icon: <Pencil size={15} />,
      onClick: () => onStartEdit!(message),
    });
  if (showDelete)
    menuItems.push({
      key: 'delete',
      label: 'Smazat zprávu',
      icon: <Trash2 size={15} />,
      variant: 'danger',
      onClick: () => onDelete(message.id),
    });

  return (
    <div
      ref={(el) => registerRef(message.id, el)}
      className={clsx(
        s.item,
        isWhisper && s.whisper,
        grouped && s.grouped,
        groupEnd && s.groupEnd,
        highlighted && s.highlighted,
        isPending && s.pending,
        isFailed && s.failed,
      )}
    >
      {/* Avatar slot — viditelný jen u první zprávy v skupině, jinak placeholder.
          Hierarchy: NPC override → membership → account (z resolver) → initial. */}
      {grouped ? (
        <div className={s.avatarSlotGrouped} aria-hidden="true" />
      ) : (
        <div className={s.avatarSlot}>
          <span
            className={clsx(
              s.avatar,
              isNpc && s.avatarNpc,
              isAuthorDeleted && s.avatarDeleted,
            )}
            title={
              isAuthorDeleted
                ? 'Smazaný účet'
                : isNpc
                  ? `NPC: ${displayName}`
                  : displayName
            }
            aria-label={isAuthorDeleted ? 'Smazaný účet' : undefined}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" />
            ) : (
              avatarInitial
            )}
            {/* D-040 — tombstone band přes avatar smazaného autora. */}
            {isAuthorDeleted && (
              <span className={s.avatarDeletedBand} aria-hidden="true" />
            )}
          </span>
        </div>
      )}

      <div className={s.content_col}>
      {!grouped && message.rpDate && renderRpDate && (
        <div className={s.rpRow}>{renderRpDate(message.rpDate)}</div>
      )}

      {!grouped && (
        <div className={s.meta}>
          {isPending && <span className={s.pendingDot} aria-hidden="true" />}
          <span
            className={s.name}
            style={isNpc ? { fontStyle: 'italic' } : undefined}
          >
            {overrideHref ? (
              <Link
                to={overrideHref}
                className={s.nameLink}
                title={`Otevřít kartu: ${displayName}`}
              >
                {displayName}
              </Link>
            ) : (
              displayName
            )}
          </span>
          {isNpc && (
            <span
              className={s.npcTag}
              title={`NPC napsal ${message.senderName}`}
            >
              <Theater size={10} />
              NPC
            </span>
          )}
          {/* 15.8 — host (anonym): vizuální odlišení od registrovaných. */}
          {message.isAnonymous && (
            <span className={s.hostTag} title="Nepřihlášený host">
              host
            </span>
          )}
          {stamp && <time className={s.time} title={stampFull}>{stamp}</time>}
          {message.isEdited && (
            <span className={s.editedBadge}>(upraveno)</span>
          )}
        </div>
      )}

      {/* Citace zprávy, na kterou se odpovídá (4.3a). */}
      {message.replyToId && (() => {
        // Recovery historického ObjectID v `replyToSenderName` přes mapu
        // usersById (jmen načtených z členů světa). Stejně jako u senderName.
        const rawReplyName = message.replyToSenderName ?? '';
        const replyNameIsObjectId = /^[0-9a-f]{24}$/i.test(rawReplyName);
        // 6.8 — pokud citovaná zpráva je od vedení, zobraz „PJ" personu.
        const pjReplyName = resolveReplyPjName?.(message.replyToId!);
        const replyName =
          pjReplyName ??
          (replyNameIsObjectId
            ? usersById.get(rawReplyName) ?? rawReplyName
            : rawReplyName || 'někdo');
        return (
          <button
            type="button"
            className={s.replyQuote}
            onClick={() => onJumpToMessage(message.replyToId!)}
          >
            <CornerUpLeft size={12} className={s.replyIcon} />
            <span className={s.replyName}>{replyName}</span>
            <span className={s.replyPreview}>{message.replyToPreview}</span>
          </button>
        );
      })()}

      <div className={s.body}>
        {isWhisper && <span className={s.whisperTag}>[šepot {whisperLabel}]</span>}{' '}
        {editing && renderEditor ? (
          renderEditor(message)
        ) : isDice && message.dicePayload ? (
          // Krok 6.3d — rendering hodu kostkou jako tabulka výpočtu + 3D scéna.
          <DiceMessage
            rawPayload={message.dicePayload}
            skinId={message.diceSkin ?? null}
            createdAt={message.createdAt}
            fallbackContent={message.content ?? null}
          />
        ) : (
          <span
            className={s.content}
            style={{
              color: textColor,
              fontFamily: resolveFont
                ? resolveFont(message.customFont)
                : undefined,
              fontSize: resolveFontSize
                ? resolveFontSize(message.customFontSize)
                : undefined,
            }}
          >
            {content}
          </span>
        )}
        {grouped && time && <time className={s.timeHover} title={stampFull}>{time}</time>}

        {!editing && hasActions && (
          <>
            {/* Desktop (hover) — rozbalené ikony. Na dotyku skryté (CSS). */}
            <div className={s.actions}>
              {showReply && (
                <button
                  type="button"
                  className={s.action}
                  onClick={() => onReply(message)}
                  title="Odpovědět"
                  aria-label="Odpovědět"
                >
                  <Reply size={14} />
                </button>
              )}
              {showReact && (
                <button
                  ref={reactionBtnRef}
                  type="button"
                  className={s.action}
                  onClick={() => setPickerOpen((v) => !v)}
                  title="Přidat reakci"
                  aria-label="Přidat reakci"
                >
                  <SmilePlus size={14} />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className={clsx(s.action, s.edit)}
                  onClick={() => onStartEdit!(message)}
                  title="Upravit zprávu"
                  aria-label="Upravit zprávu"
                >
                  <Pencil size={13} />
                </button>
              )}
              {/* Mazání: vlastník smí mazat vlastní NE-dice zprávy (BE
                  chat.service.deleteMessage to povoluje), dice hod jen
                  PJ/Admin (canDelete) — shoda s BE dice guardem. */}
              {showDelete && (
                <button
                  type="button"
                  className={clsx(s.action, s.delete)}
                  onClick={() => onDelete(message.id)}
                  title="Smazat zprávu"
                  aria-label="Smazat zprávu"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Dotyk — jedno ⋮ tlačítko (vejde se do gutteru, neleží na textu). */}
            <button
              ref={setKebabAnchor}
              type="button"
              className={s.kebabTrigger}
              onClick={() => setMenuOpen((v) => !v)}
              title="Akce"
              aria-label="Akce zprávy"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={16} />
            </button>
            <KebabMenu
              anchor={kebabAnchor}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              items={menuItems.map((item) => ({
                ...item,
                onClick: () => {
                  setMenuOpen(false);
                  item.onClick();
                },
              }))}
              ariaLabel="Akce zprávy"
            />
          </>
        )}
        {/* Emoji picker (portál) — společný pro hover ikonu i kebab; na mobilu
            bottom sheet, takže kotvu (reactionBtnRef) ignoruje. */}
        {showReact && pickerOpen && (
          <EmojiPickerPopover
            anchorRef={reactionBtnRef}
            onSelect={(emoji) => onToggleReaction(message.id, emoji)}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      {/* Přílohy zprávy (4.3b). */}
      {message.attachments && message.attachments.length > 0 && (
        <MessageAttachments attachments={message.attachments} />
      )}

      {/* Emoji reakce (4.3a). */}
      {reactions.length > 0 && (
        <div className={s.reactions}>
          {reactions.map(([emoji, userIds]) => (
            <button
              key={emoji}
              type="button"
              className={clsx(
                s.chip,
                userIds.includes(currentUserId) && s.chipMine,
              )}
              onClick={() => onToggleReaction(message.id, emoji)}
              aria-label={`Reakce ${emoji}, ${userIds.length}×`}
            >
              <span className={s.chipEmoji}>{emoji}</span>
              <span className={s.chipCount}>{userIds.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* 6.2h — failed zpráva: inline pruh s Znovu/Smazat. */}
      {isFailed && onRetry && onDiscard && (
        <div className={s.failedBar} role="alert">
          <span>⚠ Nepodařilo se odeslat.</span>
          <button
            type="button"
            className={s.failedAction}
            onClick={() => onRetry(message)}
          >
            Zkusit znovu
          </button>
          <button
            type="button"
            className={s.failedAction}
            onClick={() => onDiscard(message)}
          >
            Smazat
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
