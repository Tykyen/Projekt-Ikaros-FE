import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ImagePlus, Loader2 } from 'lucide-react';
import s from './RTEToolbar.module.css';

interface Props {
  editor: Editor;
  /** Nahraje soubor a vrátí URL obrázku. Bez něj se tlačítko nezobrazí. */
  onImageUpload: (file: File) => Promise<string>;
}

const MAX_MB = 10;

/**
 * 3.3x — toolbar nad editorem. Akce, které nepracují se selekcí (na rozdíl
 * od bubble menu) — zatím jen vložení obrázku.
 */
export function RTEToolbar({ editor, onImageUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // umožní vybrat stejný soubor znovu
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      window.alert(`Obrázek je větší než ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    try {
      const src = await onImageUpload(file);
      editor.chain().focus().setImage({ src }).run();
    } catch {
      window.alert('Nahrání obrázku selhalo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.toolbar}>
      <button
        type="button"
        className={s.btn}
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        title="Vložit obrázek"
        aria-label="Vložit obrázek"
      >
        {busy ? (
          <Loader2 size={14} className={s.spin} />
        ) : (
          <ImagePlus size={14} />
        )}
        <span>Obrázek</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className={s.fileInput}
        aria-label="Vybrat obrázek k vložení"
      />
    </div>
  );
}
