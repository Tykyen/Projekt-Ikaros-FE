import { Images, Plus, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadImage } from '@/shared/api';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import type { GalleryImage } from '../../api/pages.types';
import s from './GalleryPanel.module.css';

interface Props {
  galleryImages: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}

/**
 * 7.2 — Editor `galleryImages[]` pro typ Galerie. Upload via existing
 * `useUploadImage`, caption per image, reorder šipkami (drag-drop
 * je nice-to-have, šipky stačí pro MVP a jsou keyboard-accessible).
 */
export function GalleryPanel({ galleryImages, onChange }: Props) {
  const uploadImage = useUploadImage();
  const sorted = [...galleryImages].sort((a, b) => a.order - b.order);

  function addImage(url: string) {
    onChange([
      ...sorted,
      {
        id: crypto.randomUUID(),
        url,
        caption: '',
        order: sorted.length,
      },
    ]);
  }

  function addManualUrl() {
    const url = window.prompt('URL obrázku:');
    if (url && /^https?:\/\//.test(url)) {
      addImage(url.trim());
    } else if (url) {
      toast.error('Musí být platná URL (http/https)');
    }
  }

  async function handleUpload(file: File) {
    try {
      const result = await uploadImage.mutateAsync(file);
      addImage(result.url);
    } catch {
      toast.error('Nahrání selhalo');
    }
  }

  function updateImage(id: string, patch: Partial<GalleryImage>) {
    onChange(sorted.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }

  function removeImage(id: string) {
    onChange(
      sorted.filter((img) => img.id !== id).map((img, idx) => ({ ...img, order: idx })),
    );
  }

  function moveImage(id: string, direction: 'up' | 'down') {
    const idx = sorted.findIndex((img) => img.id === id);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((img, i) => ({ ...img, order: i })));
  }

  return (
    <CollapsiblePanel
      title="Galerie obrázků"
      icon={<Images size={18} aria-hidden />}
      badge={sorted.length > 0 ? `${sorted.length}` : undefined}
    >
      <div className={s.uploadRow}>
        <label className={s.uploadBtn}>
          <Upload size={14} aria-hidden /> Nahrát obrázek
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;
              Array.from(files).forEach((file) => void handleUpload(file));
              e.target.value = '';
            }}
          />
        </label>
        <button type="button" onClick={addManualUrl} className={s.urlBtn}>
          <Plus size={14} aria-hidden /> Vložit URL
        </button>
        {uploadImage.isPending && (
          <span className={s.uploadStatus}>Nahrávám…</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className={s.empty}>
          <p>Galerie je prázdná. Nahraj obrázky nebo vlož URL.</p>
        </div>
      ) : (
        <ul className={s.grid}>
          {sorted.map((img, idx) => (
            <li key={img.id} className={s.card}>
              <div className={s.preview}>
                <img src={img.url} alt={img.caption ?? ''} loading="lazy" />
              </div>
              <input
                type="text"
                value={img.caption ?? ''}
                onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                placeholder="Popisek"
                className={s.captionInput}
              />
              <div className={s.cardActions}>
                <button
                  type="button"
                  onClick={() => moveImage(img.id, 'up')}
                  disabled={idx === 0}
                  aria-label="Nahoru"
                  className={s.iconBtn}
                >
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(img.id, 'down')}
                  disabled={idx === sorted.length - 1}
                  aria-label="Dolů"
                  className={s.iconBtn}
                >
                  <ArrowDown size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Smazat"
                  className={s.iconBtn}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CollapsiblePanel>
  );
}
