import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadImage } from '@/shared/api';
import { ImageZoomSlider, ImageFitToggle } from '@/shared/ui';
import { getImageStyle, type ImageFit } from '@/shared/lib/imageStyle';
import s from './HeroUploadCard.module.css';

interface Props {
  /** Aktuální URL hero obrázku (prázdné = žádný). */
  value: string;
  onChange: (url: string) => void;
  /** Skryje vlastní label „Hlavní obrázek" — pro vnořené použití (např. AKJ
   *  záložka), kde label řeší rodič. Velikost řídí šířka kontejneru. */
  compact?: boolean;
  /**
   * Výřez obrázku (parita s GameEvent). Focal UI (klik-overlay + zoom + fit)
   * se vykreslí jen když je předán `onFocalChange` a je nahraný obrázek;
   * bez nich se karta chová jako čistý uploader (AKJ tab override beze změny).
   */
  focal?: { x: number; y: number };
  onFocalChange?: (f: { x: number; y: number }) => void;
  zoom?: number | null;
  onZoomChange?: (z: number | null) => void;
  fit?: ImageFit | null;
  onFitChange?: (f: ImageFit) => void;
}

const MAX_MB = 10;

/**
 * 8.3 — Drag-card pro nahrání hero obrázku stránky.
 *
 * Klik nebo drop souboru → upload přes `useUploadImage` (Cloudinary).
 * Po nahrání preview + hover overlay „Změnit". URL fallback (prompt) pro
 * externí obrázky, které nejdou nahrát jako soubor. Parita: volitelný focal
 * point + zoom + fit nad nahraným obrázkem (viz `getImageStyle`).
 */
export function HeroUploadCard({
  value,
  onChange,
  compact = false,
  focal,
  onFocalChange,
  zoom,
  onZoomChange,
  fit,
  onFitChange,
}: Props) {
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

  function onFocalClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onFocalChange?.({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }

  const busy = upload.isPending;
  const fx = focal?.x ?? 50;
  const fy = focal?.y ?? 50;
  // Focal mód = editor předal handler a je nahraný obrázek (jinak čistý uploader).
  const focalMode = !!onFocalChange && !!value;

  return (
    <div className={s.wrap}>
      {!compact && <span className={s.label}>Hlavní obrázek</span>}

      {focalMode ? (
        // Klik na obrázek nastavuje střed výřezu → karta není upload-button
        // (vnořené buttony nejsou validní); upload jde přes „Změnit".
        <div className={`${s.card} ${s.cardFilled}`}>
          <img
            src={value}
            alt=""
            className={s.preview}
            style={getImageStyle(fx, fy, zoom, fit)}
          />
          <button
            type="button"
            className={s.focalOverlay}
            aria-label="Klikni kam má být střed výřezu obrázku"
            onClick={onFocalClick}
          >
            <span
              className={s.focalMarker}
              style={{ left: `${fx}%`, top: `${fy}%` }}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className={s.changeBtn}
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 size={14} className={s.spin} aria-hidden />
            ) : (
              <ImagePlus size={14} aria-hidden />
            )}{' '}
            Změnit
          </button>
        </div>
      ) : (
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
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className={s.fileInput}
        aria-label="Vybrat hero obrázek"
      />

      {focalMode && (
        <div className={s.focalControls}>
          <span className={s.focalHint}>
            Klikni na obrázek tam, kde má být střed výřezu.
          </span>
          <ImageFitToggle value={fit ?? null} onChange={(f) => onFitChange?.(f)} />
          <ImageZoomSlider
            value={zoom ?? null}
            onChange={(z) => onZoomChange?.(z)}
            onReset={() => onZoomChange?.(null)}
          />
        </div>
      )}

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
