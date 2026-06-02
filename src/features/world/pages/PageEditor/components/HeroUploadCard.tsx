import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadImage } from '@/shared/api';
import s from './HeroUploadCard.module.css';

interface Props {
  /** Aktuální URL hero obrázku (prázdné = žádný). */
  value: string;
  onChange: (url: string) => void;
  /** Skryje vlastní label „Hlavní obrázek" — pro vnořené použití (např. AKJ
   *  záložka), kde label řeší rodič. Velikost řídí šířka kontejneru. */
  compact?: boolean;
}

const MAX_MB = 10;

/**
 * 8.3 — Drag-card pro nahrání hero obrázku stránky.
 *
 * Klik nebo drop souboru → upload přes `useUploadImage` (Cloudinary).
 * Po nahrání preview + hover overlay „Změnit". URL fallback (prompt) pro
 * externí obrázky, které nejdou nahrát jako soubor.
 */
export function HeroUploadCard({ value, onChange, compact = false }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Soubor musí být obrázek.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Obrázek je větší než ${MAX_MB} MB.`);
      return;
    }
    try {
      const result = await upload.mutateAsync(file);
      onChange(result.url);
    } catch {
      toast.error('Nahrání obrázku selhalo.');
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function promptUrl() {
    const url = window.prompt('URL hlavního obrázku:', value);
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '' || /^https?:\/\//.test(trimmed)) {
      onChange(trimmed);
    } else {
      toast.error('Musí být platná URL (http/https) nebo prázdné.');
    }
  }

  const busy = upload.isPending;

  return (
    <div className={s.wrap}>
      {!compact && <span className={s.label}>Hlavní obrázek</span>}

      <button
        type="button"
        className={`${s.card} ${dragOver ? s.cardDragOver : ''} ${
          value ? s.cardFilled : ''
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-label={value ? 'Změnit hlavní obrázek' : 'Nahrát hlavní obrázek'}
      >
        {value && (
          <img src={value} alt="" className={s.preview} loading="lazy" />
        )}

        <div className={s.overlay}>
          {busy ? (
            <>
              <Loader2 size={26} className={s.spin} aria-hidden />
              <span>Nahrávám…</span>
            </>
          ) : (
            <>
              <ImagePlus size={26} aria-hidden />
              <span>{value ? 'Změnit obrázek' : 'Nahrát hero obrázek'}</span>
            </>
          )}
        </div>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className={s.fileInput}
        aria-label="Vybrat hero obrázek"
      />

      <div className={s.actions}>
        <button type="button" onClick={promptUrl} className={s.urlBtn}>
          <Link2 size={12} aria-hidden /> Vložit URL ručně
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={s.removeBtn}
          >
            <X size={12} aria-hidden /> Odebrat
          </button>
        )}
      </div>
    </div>
  );
}
