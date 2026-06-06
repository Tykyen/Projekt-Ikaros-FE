import { HELP_MEDIA, type HelpMediaKey } from '../media';
import s from '../HelpPage.module.css';

/**
 * Dekorativní obrázek (atmosféra) z registru `media.ts`.
 * Bez `src` → nevykreslí NIC (layout nesmí spadnout, žádný placeholder).
 */
export function IllustrationSlot({ media }: { media: HelpMediaKey }) {
  const m = HELP_MEDIA[media];
  if (!m.src) return null;
  return <img className={s.illustration} src={m.src} alt={m.alt} loading="lazy" />;
}
