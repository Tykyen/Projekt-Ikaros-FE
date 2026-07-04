import { useEffect, useRef, useState } from 'react';
import { Send, X, CornerUpLeft, Paperclip, FileText, Smile } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  ATTACHMENT_LIMITS,
  ACCEPT_ATTR,
  classifyFile,
  validatePick,
} from '@/features/chat/lib/attachments';
import type { ChatAttachment, ChatMessage } from '@/features/chat/lib/types';
import { EmojiPickerPopover } from '@/features/chat/components/EmojiPickerPopover';
import { useCoarsePointer } from '@/features/world/chat/lib/useCoarsePointer';
import s from './AdminChatComposer.module.css';

/**
 * 20.5 — composer interního chatu správy platformy. Generické jádro převzaté
 * z `ChannelComposer` světového chatu, ale bez world-specifik (kostky, NPC
 * maska, mentions, world emoty, RP datum, sticky draft, sound):
 *   • auto-grow textarea (1–6 řádků),
 *   • Enter odešle / Shift+Enter nový řádek (na dotyku Enter = nový řádek,
 *     odeslání jen tlačítkem),
 *   • Ctrl+V obrázků / GIF ze schránky,
 *   • přílohy (obrázky + dokumenty) přes `attachments.ts`, upload-on-send,
 *   • reply card + zrušení,
 *   • emoji picker (čistá emoji, bez worldId),
 *   • typing indikátor (emit přes `onTypingStart` / `onTypingStop`).
 */

/** Rozepsaná příloha (před uploadem) — náhled drží blob URL do odeslání. */
interface PickedAttachment {
  id: string;
  file: File;
  kind: 'image' | 'document';
  previewUrl: string | null;
}

export interface AdminComposerSendPayload {
  content?: string;
  attachments?: ChatAttachment[];
  replyToId?: string;
}

interface Props {
  disabled: boolean;
  /** Zpráva, na kterou se odpovídá (reply card). */
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  /** Upload jedné přílohy (`useUploadAdminAttachment`). */
  onUploadAttachment: (file: File) => Promise<ChatAttachment>;
  /** Finální send — text + přílohy + reply. */
  onSend: (payload: AdminComposerSendPayload) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  placeholder?: string;
}

/** Idle prahů pro typing stop (bez psaní se „píše" po této době vypne). */
const TYPING_IDLE_MS = 3000;
/** Max výška textarea (~6 řádků) — pak scroll uvnitř. */
const MAX_TEXTAREA_PX = 148;

export function AdminChatComposer({
  disabled,
  replyTo,
  onCancelReply,
  onUploadAttachment,
  onSend,
  onTypingStart,
  onTypingStop,
  placeholder,
}: Props) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<PickedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const typing = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounter = useRef(0);
  // Aktuální výběr příloh pro unmount cleanup (jinak by cleanup s prázdnými
  // deps revokoval jen počáteční prázdný seznam a náhledy by unikly).
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  // Mobil (dotyk): Enter = odstavec, odeslání jen tlačítkem.
  const isCoarsePointer = useCoarsePointer();

  const stopTyping = () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (typing.current) {
      typing.current = false;
      onTypingStop();
    }
  };

  // Auto-grow textarea (1–6 řádků).
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [text]);

  // Cleanup při unmount — typing stop + uvolnit blob náhledy příloh.
  useEffect(
    () => () => {
      stopTyping();
      pickedRef.current.forEach(
        (p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleChange = (v: string) => {
    setText(v);
    if (v.trim() && !typing.current) {
      typing.current = true;
      onTypingStart();
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  /** Vloží text na aktuální pozici kurzoru v textarea (emoji picker). */
  const insertAtCursor = (insertion: string) => {
    const ta = taRef.current;
    if (!ta) {
      setText((t) => t + insertion);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + insertion + text.slice(end);
    setText(next);
    queueMicrotask(() => {
      ta.focus();
      const pos = start + insertion.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  // ── Attach handling ──────────────────────────────────────────────────
  /** Sdílená vrstva pro input change i Ctrl+V. Vrací počet přidaných položek. */
  const addFiles = (files: File[]): number => {
    let added = 0;
    setPicked((prev) => {
      const next = [...prev];
      for (const file of files) {
        const err = validatePick(
          next.map((p) => p.file),
          file,
        );
        if (err) {
          toast.error(err);
          continue;
        }
        const kind = classifyFile(file) as 'image' | 'document';
        next.push({
          id: `att-${idCounter.current++}`,
          file,
          kind,
          previewUrl: kind === 'image' ? URL.createObjectURL(file) : null,
        });
        added++;
      }
      return next;
    });
    return added;
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    addFiles(files);
  };

  /**
   * Ctrl+V — vložení ze schránky (screenshot, GIF, soubor z file manageru).
   * Pokud něco vložíme jako přílohu, `preventDefault` zabrání paste textu.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const cd = e.clipboardData;
    if (!cd) return;
    const collected: File[] = [];
    if (cd.files && cd.files.length > 0) {
      collected.push(...Array.from(cd.files));
    }
    if (collected.length === 0 && cd.items) {
      for (const item of Array.from(cd.items)) {
        if (item.kind !== 'file') continue;
        const f = item.getAsFile();
        if (f) collected.push(f);
      }
    }
    if (collected.length === 0) return; // nic relevantního → paste textu
    const added = addFiles(collected);
    if (added > 0) {
      e.preventDefault();
      toast.success(
        added === 1
          ? 'Příloha vložena ze schránky'
          : `${added} příloh vloženo ze schránky`,
      );
    }
  };

  const removePicked = (id: string) => {
    setPicked((prev) => {
      const it = prev.find((p) => p.id === id);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearPicked = () => {
    picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    setPicked([]);
  };

  // ── Send ─────────────────────────────────────────────────────────────
  const send = async () => {
    const t = text.trim();
    if (disabled || uploading) return;
    if (!t && picked.length === 0) return;

    let attachments: ChatAttachment[] = [];
    if (picked.length > 0) {
      setUploading(true);
      try {
        attachments = await Promise.all(
          picked.map((p) => onUploadAttachment(p.file)),
        );
      } catch {
        toast.error('Nahrání přílohy selhalo, zkus to znovu');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSend({
      content: t || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToId: replyTo?.id,
    });
    setText('');
    clearPicked();
    if (replyTo) onCancelReply();
    stopTyping();
  };

  const imgCount = picked.filter((p) => p.kind === 'image').length;
  const docCount = picked.filter((p) => p.kind === 'document').length;
  const nothingToSend = !text.trim() && picked.length === 0;

  return (
    <div className={s.composer} onPaste={handlePaste}>
      {/* Reply card */}
      {replyTo && (
        <div className={s.replyCard}>
          <CornerUpLeft size={13} className={s.replyIcon} />
          <span className={s.replyName}>{replyTo.senderName}</span>
          <span className={s.replyExcerpt}>{replyTo.content}</span>
          <button
            type="button"
            className={s.replyCancel}
            onClick={onCancelReply}
            aria-label="Zrušit odpověď"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attach preview lišta */}
      {picked.length > 0 && (
        <div className={s.attachBar}>
          {picked.map((p) => (
            <div key={p.id} className={s.attachItem}>
              {p.kind === 'image' && p.previewUrl ? (
                <img
                  src={p.previewUrl}
                  alt={p.file.name}
                  className={s.attachThumb}
                />
              ) : (
                <span className={s.attachDoc}>
                  <FileText size={20} />
                  <span className={s.attachDocName}>{p.file.name}</span>
                </span>
              )}
              <button
                type="button"
                className={s.attachRemove}
                onClick={() => removePicked(p.id)}
                aria-label={`Odebrat ${p.file.name}`}
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <span className={s.attachLimit}>
            {imgCount}/{ATTACHMENT_LIMITS.maxImages} obr · {docCount}/
            {ATTACHMENT_LIMITS.maxDocs} doc
          </span>
        </div>
      )}

      {/* Psací pole + lišta akcí */}
      <div className={clsx(s.box, disabled && s.boxDisabled)}>
        <textarea
          ref={taRef}
          className={s.input}
          value={text}
          rows={1}
          disabled={disabled || uploading}
          placeholder={
            disabled ? 'Vyber konverzaci…' : placeholder ?? 'Napiš zprávu…'
          }
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => stopTyping()}
          onKeyDown={(e) => {
            // Desktop: Enter odešle, Shift+Enter = nový řádek.
            // Dotyk: Enter = nový řádek (odeslání jen tlačítkem).
            if (e.key === 'Enter' && !e.shiftKey && !isCoarsePointer) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className={s.toolbar}>
          <button
            type="button"
            className={clsx(s.stamp, picked.length > 0 && s.stampActive)}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            title="Připojit přílohu"
            aria-label="Připojit přílohu"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className={s.fileInput}
            onChange={onPickFiles}
          />

          <div className={s.stampWrap}>
            <button
              ref={emojiBtnRef}
              type="button"
              className={clsx(s.stamp, emojiOpen && s.stampActive)}
              onClick={() => setEmojiOpen((v) => !v)}
              disabled={disabled}
              title="Vložit emoji"
              aria-label="Vložit emoji"
            >
              <Smile size={18} />
            </button>
            {emojiOpen && (
              <EmojiPickerPopover
                anchorRef={emojiBtnRef}
                onSelect={(emoji) => {
                  insertAtCursor(emoji);
                  setEmojiOpen(false);
                }}
                onClose={() => setEmojiOpen(false)}
              />
            )}
          </div>

          <span className={s.spacer} />

          <button
            type="button"
            className={s.send}
            onClick={() => void send()}
            disabled={disabled || uploading || nothingToSend}
            aria-label="Odeslat"
          >
            <Send size={15} />
            <span className={s.sendLabel}>Odeslat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
