import { useRef, useState, type DragEvent } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Button } from '../Button/Button';
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
 * AvatarUploader — drag&drop + file input + preview + upload tlačítko.
 * Klient-side validace typu (image/*) a velikosti (≤ 5 MB).
 * Při selhání volá toast.error; volající mutation řeší další onSuccess/onError.
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const previewSrc = previewUrl ?? currentUrl ?? fallbackUrl;

  function handleFiles(files: FileList | null) {
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPendingFile(file);
  }

  async function commit() {
    if (!pendingFile) return;
    await onUpload(pendingFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
  }

  function cancel() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = '';
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
    handleFiles(e.dataTransfer.files);
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
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(e) => handleFiles(e.target.files)}
        aria-label={`Vybrat ${label.toLowerCase()}`}
      />

      <div className={styles.controls}>
        {pendingFile ? (
          <>
            <Button
              type="button"
              variant="primary"
              onClick={commit}
              disabled={isUploading}
            >
              {isUploading ? 'Nahrávám…' : 'Nahrát'}
            </Button>
            <Button type="button" variant="secondary" onClick={cancel}>
              Zrušit
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              Vybrat soubor
            </Button>
            {onDelete && currentUrl && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? 'Mažu…' : 'Odebrat'}
              </Button>
            )}
          </>
        )}
      </div>
      <p className={styles.hint}>JPG / PNG / WebP / GIF. Max 5 MB.</p>
    </div>
  );
}
