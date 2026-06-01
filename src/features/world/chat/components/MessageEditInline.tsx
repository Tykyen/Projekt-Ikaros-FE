import { useEffect, useRef, useState } from 'react';
import { FileText, X, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import s from './MessageEditInline.module.css';
import type { ChatAttachment } from '@/features/chat/lib/types';
import {
  ATTACHMENT_LIMITS,
  ACCEPT_ATTR,
  classifyFile,
} from '@/features/chat/lib/attachments';
import { useUploadWorldAttachment } from '../api/useUploadWorldAttachment';

/**
 * Krok 6.2c + D-NEW-chat-edit-attachments — inline editace zprávy (text + přílohy).
 *
 * Discord-like: `MessageItem` swap content → tato textarea. Enter (bez Shift)
 * = uložit, Shift+Enter = nový řádek, Esc = zrušit. Pod textareou lišta příloh:
 * existující (× = odebrat) + nově přidané (paperclip → upload). Při uložení se
 * pošle diff `attachmentsToAdd` (nově nahrané) + `attachmentsToRemove` (publicId).
 * Pokud se nic nezměnilo (text i přílohy), Uložit jen zavře (bez BE callu).
 */

interface SavePayload {
  /** undefined = nezměnit text (BE odmítá prázdný content; zpráva jen s přílohou). */
  content?: string;
  attachmentsToAdd: ChatAttachment[];
  attachmentsToRemove: string[];
}

interface Props {
  worldId: string;
  initialContent: string;
  initialAttachments: ChatAttachment[];
  onSave: (payload: SavePayload) => Promise<void> | void;
  onCancel: () => void;
}

/** Lokálně vybraný (ještě nenahraný) soubor. */
interface Picked {
  id: string;
  file: File;
  kind: 'image' | 'document';
  previewUrl: string | null;
}

export function MessageEditInline({
  worldId,
  initialContent,
  initialAttachments,
  onSave,
  onCancel,
}: Props) {
  const [text, setText] = useState(initialContent);
  // `kept` = existující přílohy, které zůstávají (× je odebere → attachmentsToRemove).
  const [kept, setKept] = useState<ChatAttachment[]>(initialAttachments);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);
  const upload = useUploadWorldAttachment(worldId);

  // Focus + caret na konec při mountu.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(text.length, text.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-grow (max ~8 řádků).
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  // Revoke objectURL náhledů při unmountu (memory leak prevence).
  useEffect(() => {
    return () => {
      picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keptImages = kept.filter((a) => a.type === 'image').length;
  const keptDocs = kept.filter((a) => a.type === 'document').length;
  const imgCount = keptImages + picked.filter((p) => p.kind === 'image').length;
  const docCount = keptDocs + picked.filter((p) => p.kind === 'document').length;

  const removedPublicIds = initialAttachments
    .filter((a) => !kept.some((k) => k.publicId === a.publicId))
    .map((a) => a.publicId);

  const addFiles = (files: File[]) => {
    let img = imgCount;
    let doc = docCount;
    const next: Picked[] = [];
    for (const file of files) {
      const kind = classifyFile(file);
      if (!kind) {
        toast.error(`Nepodporovaný typ souboru: ${file.name}`);
        continue;
      }
      if (file.size > ATTACHMENT_LIMITS.maxBytes) {
        toast.error(`Soubor je větší než 10 MB: ${file.name}`);
        continue;
      }
      if (kind === 'image' && img >= ATTACHMENT_LIMITS.maxImages) {
        toast.error('Maximálně 10 obrázků na zprávu');
        continue;
      }
      if (kind === 'document' && doc >= ATTACHMENT_LIMITS.maxDocs) {
        toast.error('Maximálně 4 dokumenty na zprávu');
        continue;
      }
      if (kind === 'image') img++;
      else doc++;
      next.push({
        id: `att-${idCounter.current++}`,
        file,
        kind,
        previewUrl: kind === 'image' ? URL.createObjectURL(file) : null,
      });
    }
    if (next.length) setPicked((prev) => [...prev, ...next]);
  };

  const removePicked = (id: string) => {
    setPicked((prev) => {
      const hit = prev.find((p) => p.id === id);
      if (hit?.previewUrl) URL.revokeObjectURL(hit.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const dirty =
    text.trim() !== initialContent.trim() ||
    picked.length > 0 ||
    removedPublicIds.length > 0;

  const save = async () => {
    const t = text.trim();
    // Zpráva nesmí zůstat prázdná (bez textu i bez příloh).
    if (!t && kept.length === 0 && picked.length === 0) {
      toast.error('Zpráva musí mít text nebo přílohu');
      return;
    }
    if (busy) return;
    if (!dirty) {
      onCancel();
      return;
    }
    setBusy(true);
    try {
      let attachmentsToAdd: ChatAttachment[] = [];
      if (picked.length > 0) {
        attachmentsToAdd = await Promise.all(
          picked.map((p) => upload.mutateAsync(p.file)),
        );
      }
      await onSave({
        content: t || undefined,
        attachmentsToAdd,
        attachmentsToRemove: removedPublicIds,
      });
    } catch {
      toast.error('Uložení se nezdařilo, zkus to znovu');
    } finally {
      setBusy(false);
    }
  };

  const hasAttachments = kept.length > 0 || picked.length > 0;

  return (
    <div className={s.wrap}>
      <textarea
        ref={taRef}
        className={s.input}
        value={text}
        rows={1}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void save();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        aria-label="Upravit zprávu"
      />

      {hasAttachments && (
        <div className={s.attachBar}>
          {kept.map((a) => (
            <div key={a.publicId} className={s.attachItem}>
              {a.type === 'image' ? (
                <img src={a.url} alt={a.filename} className={s.attachThumb} />
              ) : (
                <span className={s.attachDoc}>
                  <FileText size={18} aria-hidden />
                  <span className={s.attachDocName}>{a.filename}</span>
                </span>
              )}
              <button
                type="button"
                className={s.attachRemove}
                onClick={() =>
                  setKept((prev) =>
                    prev.filter((k) => k.publicId !== a.publicId),
                  )
                }
                disabled={busy}
                aria-label={`Odebrat ${a.filename}`}
              >
                <X size={10} />
              </button>
            </div>
          ))}
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
                  <FileText size={18} aria-hidden />
                  <span className={s.attachDocName}>{p.file.name}</span>
                </span>
              )}
              <button
                type="button"
                className={s.attachRemove}
                onClick={() => removePicked(p.id)}
                disabled={busy}
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

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />

      <div className={s.actions}>
        <button
          type="button"
          className={s.attachAdd}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title="Přidat přílohu"
          aria-label="Přidat přílohu"
        >
          <Paperclip size={15} />
        </button>
        <button
          type="button"
          className={s.cancel}
          onClick={onCancel}
          disabled={busy}
        >
          Zrušit
        </button>
        <button
          type="button"
          className={s.save}
          onClick={() => void save()}
          disabled={busy}
        >
          {busy ? 'Ukládám…' : 'Uložit'}
        </button>
        <span className={s.hint}>esc zrušit · ↵ uložit</span>
      </div>
    </div>
  );
}
