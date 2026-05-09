import { useRef, useState, useEffect, type DragEvent } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import styles from './AvatarUploader.module.css';

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  currentUrl?: string | null;
  fallbackUrl: string;
  onUpload: (file: File) => Promise<unknown> | unknown;
  onDelete?: () => Promise<unknown> | unknown;
  isUploading?: boolean;
  isDeleting?: boolean;
  /** Klíč i18n alt textu — pro „avatar postavy" vs „avatar uživatele" */
  label?: string;
}

/**
 * AvatarUploader — drag&drop + file input s auto-uploadem.
 * Vybereš (nebo přetáhneš) soubor → klient-side validace (image/*, ≤ 5 MB)
 * → okamžitě se nahrává. Žádné explicitní „Nahrát" tlačítko, jednoduchý flow.
 *
 * Preview se zobrazí lokálně okamžitě; po dokončení uploadu se přepne
 * na finální URL z BE response (přes prop `currentUrl` z parent re-renderu).
 */
export function AvatarUploader({
  currentUrl,
  fallbackUrl,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
  label = 'Avatar',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const previewSrc = previewUrl ?? currentUrl ?? fallbackUrl;

  // Cleanup object URLs při unmountu (memory leak prevention)
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Pouze obrázky (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Soubor je příliš velký (max 5 MB)');
      return;
    }

    // Lokální preview hned, ať uživatel vidí, že se akce začala
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const newPreview = URL.createObjectURL(file);
    setPreviewUrl(newPreview);

    // Auto-upload — žádné další kliknutí potřeba
    try {
      await onUpload(file);
      // BE vrátil novou avatarUrl → parent re-renderne s `currentUrl` aktuální,
      // smažeme local preview ať se vykreslí finální asset z BE.
      URL.revokeObjectURL(newPreview);
      setPreviewUrl(null);
    } catch {
      // onUpload errorhandler v useProfile už ukázal toast.
      // Preview si necháme — uživatel vidí, co zkusil nahrát; může vybrat jiný soubor.
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={clsx(styles.dropzone, dragOver && styles.dropzoneActive)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <img src={previewSrc} alt={label} className={styles.preview} />
        {dragOver && <div className={styles.dropOverlay}>Pusť obrázek</div>}
        {isUploading && <div className={styles.dropOverlay}>Nahrávám…</div>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(e) => void handleFiles(e.target.files)}
        aria-label={`Vybrat ${label.toLowerCase()}`}
      />

      <div className={styles.controls}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Nahrávám…' : 'Vybrat soubor'}
        </Button>
        {onDelete && currentUrl && (
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete()}
            disabled={isDeleting || isUploading}
          >
            {isDeleting ? 'Mažu…' : 'Odebrat'}
          </Button>
        )}
      </div>
      <p className={styles.hint}>JPG / PNG / WebP / GIF. Max 5 MB. Nahrání proběhne okamžitě po výběru.</p>
    </div>
  );
}
