import { ImageOff } from 'lucide-react';
import { HELP_MEDIA, type HelpMediaKey } from '../media';
import s from '../HelpPage.module.css';

/**
 * Orámovaný snímek z registru `media.ts`.
 * - `src` doplněn → obrázek s rámečkem a popiskem.
 * - `src` chybí → ZÁMĚRNÝ prázdný stav (dashed rámeček, ikona, výzva).
 *   Cíl: uživatel později jen vyplní `src` v media.ts.
 */
export function ScreenshotSlot({ media }: { media: HelpMediaKey }) {
  const m = HELP_MEDIA[media];
  return (
    <figure className={s.screenshot}>
      {m.src ? (
        <>
          <img className={s.screenshotImg} src={m.src} alt={m.alt} loading="lazy" />
          <figcaption className={s.screenshotCaption}>{m.caption}</figcaption>
        </>
      ) : (
        <div className={s.screenshotEmpty} role="img" aria-label={m.alt}>
          <span className={s.screenshotEmptyIcon}>
            <ImageOff size={28} aria-hidden="true" />
          </span>
          <span className={s.screenshotEmptyText}>
            Sem doplníme snímek: <strong>{m.caption}</strong>
          </span>
        </div>
      )}
    </figure>
  );
}
