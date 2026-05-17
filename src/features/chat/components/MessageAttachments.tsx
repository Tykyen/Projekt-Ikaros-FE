import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import clsx from 'clsx';
import { ImageLightbox, type LightboxImage } from '@/shared/ui';
import { cloudinaryThumb } from '@/shared/lib/cloudinary';
import { formatBytes } from '../lib/attachments';
import type { ChatAttachment } from '../lib/types';
import s from './MessageAttachments.module.css';

interface MessageAttachmentsProps {
  attachments: ChatAttachment[];
}

/**
 * Přílohy zprávy chatu (krok 4.3b) — obrázky v mřížce (klik → lightbox),
 * dokumenty jako chip s odkazem ke stažení.
 */
export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const images = attachments.filter((a) => a.type === 'image');
  const docs = attachments.filter((a) => a.type === 'document');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className={s.wrap}>
      {images.length > 0 && (
        <div className={clsx(s.grid, images.length === 1 && s.single)}>
          {images.map((img, i) => (
            <button
              key={img.publicId}
              type="button"
              className={s.imageBtn}
              onClick={() => setLightboxIndex(i)}
              aria-label={`Zobrazit obrázek ${img.filename}`}
            >
              <img
                src={cloudinaryThumb(img.url, 400)}
                alt={img.filename}
                className={s.image}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {docs.map((doc) => (
        <a
          key={doc.publicId}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className={s.doc}
        >
          <FileText size={16} className={s.docIcon} />
          <span className={s.docName}>{doc.filename}</span>
          <span className={s.docSize}>{formatBytes(doc.size)}</span>
          <Download size={14} className={s.docDownload} aria-hidden />
        </a>
      ))}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images.map<LightboxImage>((img) => ({
            url: img.url,
            alt: img.filename,
          }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
