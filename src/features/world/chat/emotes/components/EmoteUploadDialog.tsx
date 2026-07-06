import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
// Světový obsah → content-image upload (PomocnyPJ+ není globální Admin, takže
// admin-gated /upload/image vracel 403). Dialog je gated na world roli.
import { useUploadImage } from '@/shared/api/useUploadImage';
import { parseApiError, parseApiErrorCode } from '@/shared/api/client';
import { useCreateEmote } from '../api/useCreateEmote';
import { useCreateGlobalEmote } from '../api/useCreateGlobalEmote';
import { useUpdateEmote } from '../api/useUpdateEmote';
import { useUpdateGlobalEmote } from '../api/useUpdateGlobalEmote';
import { useWorldEmotes } from '../api/useWorldEmotes';
import { useGlobalEmotes } from '../api/useGlobalEmotes';
import {
  validateEmoteFile,
  ACCEPTED_EMOTE_TYPES,
} from '../lib/validateEmoteFile';
import { SHORTCODE_REGEX, type WorldEmote } from '../lib/types';
import { buildEmoteUrl } from '../lib/buildEmoteUrl';
import s from './EmoteUploadDialog.module.css';

interface BaseProps {
  onClose: () => void;
  /** D-NEW-emote-update — pokud zadán, dialog je v edit módu. */
  editEmote?: WorldEmote;
}
interface WorldVariantProps extends BaseProps {
  variant: 'world';
  worldId: string;
}
interface GlobalVariantProps extends BaseProps {
  variant: 'global';
  worldId?: never;
}
type EmoteUploadDialogProps = WorldVariantProps | GlobalVariantProps;

/**
 * Krok 6.4c/d — modal pro upload nového emote.
 * Kruhový „sigil" drop target, tokenized shortcode input, decorative ornamenty.
 */
export function EmoteUploadDialog(props: EmoteUploadDialogProps) {
  const { onClose, variant, editEmote } = props;
  const isEdit = !!editEmote;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shortcode, setShortcode] = useState(editEmote?.shortcode ?? '');
  const [name, setName] = useState(editEmote?.name ?? '');
  const [dragOver, setDragOver] = useState(false);

  const uploadImage = useUploadImage();
  // Pro world variant potřebujeme worldId — TS narrowing přes variant.
  const createWorldEmote = useCreateEmote(
    variant === 'world' ? props.worldId : '',
  );
  const createGlobalEmote = useCreateGlobalEmote();
  const updateWorldEmote = useUpdateEmote(
    variant === 'world' ? props.worldId : '',
  );
  const updateGlobalEmote = useUpdateGlobalEmote();

  // D-NEW-cloudinary-orphan-cleanup — lokální pre-check kolize shortcode
  // před uploadem na Cloudinary. Pokrývá 99 % případů; pokud cache je stale,
  // BE 409 backstop stejně chytne (orphan = jeden obrázek, akceptujeme).
  const worldEmotesQ = useWorldEmotes(variant === 'world' ? props.worldId : null);
  const globalEmotesQ = useGlobalEmotes();
  const existingShortcodes = useMemo(() => {
    const list =
      variant === 'world'
        ? (worldEmotesQ.data ?? [])
        : (globalEmotesQ.data ?? []);
    // V edit módu vlastní shortcode se sám se sebou nekoliduje.
    return new Set(
      list
        .filter((e) => !editEmote || e.id !== editEmote.id)
        .map((e) => e.shortcode.toLowerCase()),
    );
  }, [variant, worldEmotesQ.data, globalEmotesQ.data, editEmote]);
  const shortcodeTaken =
    shortcode.length > 0 && existingShortcodes.has(shortcode.toLowerCase());

  const isPending =
    uploadImage.isPending ||
    createWorldEmote.isPending ||
    createGlobalEmote.isPending ||
    updateWorldEmote.isPending ||
    updateGlobalEmote.isPending;

  // Vytváříme objectURL pro náhled — uvolnit při unmount / new file. Legitimní
  // effekt (external resource + cleanup revokeObjectURL); setPreviewUrl je jeho
  // nedílná součást, render-phase by nešlo (potřebuje cleanup).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Escape zavírá modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, isPending]);

  const shortcodeValid = useMemo(
    () => SHORTCODE_REGEX.test(shortcode),
    [shortcode],
  );
  // V edit módu file je optional — když user nezvolí, ponechá se původní obrázek.
  const hasImage = isEdit || !!file;
  // Detekce změny v edit módu — alespoň jedno pole musí být odlišné.
  const hasChange = isEdit
    ? shortcode !== editEmote!.shortcode ||
      name.trim() !== editEmote!.name ||
      !!file
    : true;
  const canSubmit =
    hasImage &&
    shortcodeValid &&
    !shortcodeTaken &&
    name.trim().length > 0 &&
    hasChange &&
    !isPending;

  const handleFileSelect = useCallback((selected: File | null) => {
    if (!selected) return;
    const result = validateEmoteFile(selected);
    if (!result.ok) {
      toast.error(result.error?.message ?? 'Neplatný soubor');
      return;
    }
    setFile(selected);
    // Pre-fill name z file (bez extenze) pokud uživatel ještě nic nepsal.
    if (!name) {
      const base = selected.name.replace(/\.[^.]+$/, '');
      setName(base);
    }
  }, [name]);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
    // Reset value ať jde stejný soubor znova (po failed validation).
    e.target.value = '';
  };

  const onDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      // Pokud user nahrál nový soubor → upload; jinak (jen edit) ponechat původní.
      let imageId = editEmote?.imageId;
      let imageUrl = editEmote?.imageUrl;
      if (file) {
        const uploaded = await uploadImage.mutateAsync(file);
        imageId = uploaded.publicId;
        imageUrl = uploaded.url;
      }

      if (isEdit && editEmote) {
        // D-NEW-emote-update — partial PATCH s diff od původního.
        const patch: {
          name?: string;
          shortcode?: string;
          imageId?: string;
          imageUrl?: string;
        } = {};
        if (name.trim() !== editEmote.name) patch.name = name.trim();
        if (shortcode !== editEmote.shortcode) patch.shortcode = shortcode;
        if (file && imageId && imageUrl) {
          patch.imageId = imageId;
          patch.imageUrl = imageUrl;
        }
        if (variant === 'world') {
          await updateWorldEmote.mutateAsync({
            emoteId: editEmote.id,
            patch,
          });
        } else {
          await updateGlobalEmote.mutateAsync({
            emoteId: editEmote.id,
            patch,
          });
        }
        toast.success(`Emote :${shortcode}: upraven.`);
      } else {
        if (!imageId || !imageUrl) return; // bezpečnostní guard
        const dto = {
          name: name.trim(),
          shortcode,
          imageId,
          imageUrl,
        };
        if (variant === 'world') {
          await createWorldEmote.mutateAsync(dto);
        } else {
          await createGlobalEmote.mutateAsync(dto);
        }
        toast.success(`Emote :${shortcode}: nahrán.`);
      }
      onClose();
    } catch (err: unknown) {
      const code = parseApiErrorCode(err);
      if (code === 'EMOTE_SHORTCODE_TAKEN') {
        toast.error('Tenhle shortcode už existuje.');
      } else if (code === 'EMOTE_LIMIT_REACHED') {
        toast.error(parseApiError(err));
      } else {
        toast.error(isEdit ? 'Úprava emote selhala.' : 'Nahrání emote selhalo.');
      }
    }
  }, [
    canSubmit,
    file,
    name,
    shortcode,
    variant,
    isEdit,
    editEmote,
    uploadImage,
    createWorldEmote,
    createGlobalEmote,
    updateWorldEmote,
    updateGlobalEmote,
    onClose,
  ]);

  return (
    <div
      className={s.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
      role="presentation"
    >
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="emote-upload-title"
      >
        <header className={s.header}>
          <span className={s.ornamentLine} aria-hidden="true">
            ◆ <span className={s.headerLine} />
          </span>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            disabled={isPending}
            aria-label="Zavřít"
          >
            <X size={16} />
          </button>
        </header>

        <h2 id="emote-upload-title" className={s.title}>
          {isEdit ? 'Upravit emote' : 'Nový emote'}
        </h2>

        <div className={s.body}>
          <button
            type="button"
            className={clsx(
              s.sigil,
              dragOver && s.sigilDragOver,
              file && s.sigilHasFile,
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            aria-label="Nahrát obrázek emote"
            disabled={isPending}
          >
            {previewUrl ? (
              <img className={s.preview} src={previewUrl} alt="Náhled" />
            ) : isEdit && editEmote ? (
              <img
                className={s.preview}
                src={buildEmoteUrl(editEmote.imageUrl)}
                alt={`:${editEmote.shortcode}:`}
              />
            ) : (
              <UploadCloud size={32} className={s.sigilIcon} />
            )}
          </button>
          <p className={s.sigilHint}>
            {file ? (
              <>
                <span className={s.fileName}>{file.name}</span>
                <span> · </span>
                <span>{Math.round(file.size / 1024)} KB</span>
                <button
                  type="button"
                  className={s.fileReset}
                  onClick={() => setFile(null)}
                  disabled={isPending}
                  aria-label="Zvolit jiný soubor"
                >
                  ✕
                </button>
              </>
            ) : isEdit ? (
              'Klikni pro nahrazení obrázku (volitelné)'
            ) : (
              'Drag-drop nebo klikni'
            )}
          </p>
          <p className={s.formats}>PNG · JPG · GIF · WebP — max 512 KB</p>

          <input
            ref={fileInputRef}
            type="file"
            className={s.fileInput}
            accept={ACCEPTED_EMOTE_TYPES.join(',')}
            onChange={onInputChange}
            tabIndex={-1}
          />

          <div className={s.divider} aria-hidden="true" />

          <label className={s.field}>
            <span className={s.fieldLabel}>Shortcode</span>
            <div
              className={clsx(
                s.shortcodeWrap,
                ((shortcode.length > 0 && !shortcodeValid) || shortcodeTaken) &&
                  s.shortcodeInvalid,
              )}
            >
              <span className={s.colon}>:</span>
              <input
                type="text"
                className={s.shortcodeInput}
                value={shortcode}
                onChange={(e) =>
                  setShortcode(e.target.value.toLowerCase())
                }
                placeholder="smile"
                maxLength={32}
                disabled={isPending}
                aria-invalid={
                  (shortcode.length > 0 && !shortcodeValid) || shortcodeTaken
                }
                aria-describedby="shortcode-help"
              />
              <span className={s.colon}>:</span>
            </div>
            <span id="shortcode-help" className={s.fieldHint}>
              {shortcodeTaken
                ? `Shortcode :${shortcode}: už ${variant === 'world' ? 've světě' : 'globálně'} existuje.`
                : 'a–z · 0–9 · _ · 2 až 32 znaků'}
            </span>
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>Název</span>
            <input
              type="text"
              className={s.nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Smile"
              maxLength={64}
              disabled={isPending}
            />
          </label>
        </div>

        <footer className={s.footer}>
          <button
            type="button"
            className={s.btnGhost}
            onClick={onClose}
            disabled={isPending}
          >
            Zrušit
          </button>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {isPending
              ? isEdit
                ? 'Ukládám…'
                : 'Nahrávám…'
              : isEdit
                ? 'Uložit změny'
                : 'Nahrát emote'}
          </button>
        </footer>

        <span className={s.cornerBL} aria-hidden="true">
          ◆
        </span>
        <span className={s.cornerBR} aria-hidden="true">
          ◆
        </span>
      </div>
    </div>
  );
}
