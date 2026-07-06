import { useEffect, useRef, useState } from 'react';
import { Send, X, CornerUpLeft, Paperclip, FileText, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import type { ChatAttachment, ChatMessage, ChatUser } from '../lib/types';
import { ACCEPT_ATTR, classifyFile, validatePick } from '../lib/attachments';
import s from './ChatInput.module.css';

/** Po jak dlouhé nečinnosti přestaneme hlásit „píše". */
const TYPING_IDLE_MS = 3000;

/** Jedna vybraná (zatím nenahraná) příloha — viz upload-on-send (4.3b). */
interface PickedFile {
  id: string;
  file: File;
  kind: 'image' | 'document';
  /** Object URL náhledu obrázku; `null` u dokumentů. */
  previewUrl: string | null;
}

interface ChatInputProps {
  disabled: boolean;
  /** 15.8 — host (anonym): jen text, bez příloh a soukromých zpráv. */
  isGuest?: boolean;
  users: ChatUser[];
  currentUserId: string;
  /** Zpráva, na kterou se právě odpovídá (4.3a); `null` = běžná zpráva. */
  replyTo: ChatMessage | null;
  /**
   * FIX-4 — vrací, zda se odeslání skutečně povedlo (`true`/`Promise<true>`).
   * `send()` na `false` NEmaže rozepsaný text/přílohy, ať uživatel o ně
   * nepřijde při selhání (dřív se mazaly hned, bez čekání na výsledek).
   */
  onSendPublic: (
    text: string,
    attachments: ChatAttachment[],
  ) => boolean | Promise<boolean>;
  onSendWhisper: (
    toUserId: string,
    text: string,
    attachments: ChatAttachment[],
  ) => boolean | Promise<boolean>;
  /** Nahrání jedné přílohy na Cloudinary (4.3b) — volá se při odeslání. */
  onUploadAttachment: (file: File) => Promise<ChatAttachment>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  /** Zrušení rozepsané odpovědi. */
  onCancelReply: () => void;
}

/** Vstupní lišta — výběr cíle (Všem / whisper), pole, přílohy, odeslání. */
export function ChatInput({
  disabled,
  isGuest = false,
  users,
  currentUserId,
  replyTo,
  onSendPublic,
  onSendWhisper,
  onUploadAttachment,
  onTypingStart,
  onTypingStop,
  onCancelReply,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('all');
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const isTyping = useRef(false);

  const stopTyping = () => {
    clearTimeout(typingTimer.current);
    if (isTyping.current) {
      isTyping.current = false;
      onTypingStop();
    }
  };

  // Cíl whisperu, který mezitím odešel z místnosti, degraduje zpět na „Všem".
  const effectiveTarget =
    target !== 'all' && users.some((u) => u.userId === target) ? target : 'all';

  // Úklid typing stavu + object URL náhledů při odmountování.
  useEffect(
    () => () => {
      stopTyping();
      picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    if (v.trim()) {
      if (!isTyping.current) {
        isTyping.current = true;
        onTypingStart();
      }
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    } else {
      stopTyping();
    }
  };

  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // ať jde stejný soubor vybrat znovu
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
      }
      return next;
    });
  };

  const removePicked = (id: string) => {
    setPicked((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearPicked = () => {
    picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    setPicked([]);
  };

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

    // FIX-4 — čekáme na výsledek, ať víme, jestli smazat rozepsanou zprávu.
    // Chybový toast řeší volající (mutation onError / disconnected-check);
    // tady jen text/přílohy necháme na místě pro retry.
    const ok =
      effectiveTarget === 'all'
        ? await onSendPublic(t, attachments)
        : await onSendWhisper(effectiveTarget, t, attachments);
    if (ok) {
      setText('');
      clearPicked();
      stopTyping();
    }
  };

  const isWhisper = effectiveTarget !== 'all';
  const canSend =
    !disabled && !uploading && (!!text.trim() || picked.length > 0);

  return (
    <div className={s.wrap}>
      {replyTo && (
        <div className={s.replyBar}>
          <CornerUpLeft size={13} className={s.replyIcon} />
          <span className={s.replyName}>{replyTo.senderName}</span>
          <span className={s.replyText}>{replyTo.content}</span>
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

      {picked.length > 0 && (
        <div className={s.previewBar}>
          {picked.map((p) => (
            <div key={p.id} className={s.previewItem}>
              {p.kind === 'image' && p.previewUrl ? (
                <img
                  src={p.previewUrl}
                  alt={p.file.name}
                  className={s.previewImg}
                />
              ) : (
                <span className={s.previewDoc}>
                  <FileText size={14} className={s.previewDocIcon} />
                  <span className={s.previewDocName}>{p.file.name}</span>
                </span>
              )}
              <button
                type="button"
                className={s.previewRemove}
                onClick={() => removePicked(p.id)}
                aria-label={`Odebrat ${p.file.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={clsx(s.bar, isWhisper && s.barWhisper)}>
        {/* 15.8 — host (anonym) píše jen veřejně (žádný whisper picker). */}
        {!isGuest && (
          <select
            className={s.target}
            value={effectiveTarget}
            onChange={(e) => setTarget(e.target.value)}
            disabled={disabled}
            aria-label="Komu napsat"
          >
            <option value="all">Všem</option>
            {users
              .filter((u) => u.userId !== currentUserId)
              .map((u) => (
                <option key={u.userId} value={u.userId}>
                  → {u.username}
                </option>
              ))}
          </select>
        )}

        {/* 15.8 — host (anonym) nemá přílohy (jen text). */}
        {!isGuest && (
          <>
            <button
              type="button"
              className={s.attach}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              aria-label="Přidat přílohu"
              title="Přidat přílohu"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className={s.fileInput}
              onChange={handlePickFiles}
              aria-label="Vybrat přílohy"
            />
          </>
        )}

        <input
          type="text"
          className={s.input}
          value={text}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          placeholder={isWhisper ? 'Šeptaná zpráva…' : 'Napiš do putyky…'}
          maxLength={4000}
          disabled={disabled}
        />
        <button
          type="button"
          className={s.send}
          onClick={() => void send()}
          disabled={!canSend}
          aria-label="Odeslat"
        >
          {uploading ? (
            <Loader2 size={16} className={s.spin} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
