import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import { PageSections } from '../components/PageSections';
import type { Page } from '../../api/pages.types';
import s from './NovinyLayout.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1b — Layout pro typ Noviny. Klíčová odlišnost od Ostatní:
 *  • Full-width hero (vždy, `bigImage` flag ignoruje)
 *  • Metadata HUD pod titulem — `customData.Stát`, `customData.Vydavatel`, `customData.Datum`,
 *    `customData.Číslo vydání`, `customData.Šéfredaktor`
 *  • Bez sidebaru (single column, max-width 880px, centered)
 *
 * Metadata klíče = config-driven (editor 7.2 dá UX formulář; viewer 7.1 jen
 * zobrazí, co je vyplněné). Klíče, které nejsou v `customData`, se neukáží.
 *
 * Hodnoty jsou rich-text HTML z `SmartCellInput` (wikilinky + externí URL).
 * Render přes `dangerouslySetInnerHTML` — stejný pattern jako PageSidebar
 * tabulka (sanitace garantovaná TipTap schématem v editoru).
 */
const META_KEYS = [
  'Stát',
  'Vydavatel',
  'Datum',
  'Číslo vydání',
  'Šéfredaktor',
] as const;

export function NovinyLayout({ page }: Props) {
  const customData = page.customData ?? {};
  const metaEntries = META_KEYS.flatMap((key) =>
    customData[key] ? [{ key, value: customData[key] }] : [],
  );

  return (
    <div className={s.layout}>
      {page.imageUrl && (
        <div className={s.heroFull}>
          <img src={page.imageUrl} alt={page.title} loading="lazy" />
          <div className={s.heroOverlay} aria-hidden />
        </div>
      )}

      {metaEntries.length > 0 && (
        <div className={s.metaHud}>
          {metaEntries.map(({ key, value }, idx) => (
            <span key={key} className={s.metaItem}>
              <span className={s.metaKey}>{key}:</span>{' '}
              <span
                className={s.metaValue}
                dangerouslySetInnerHTML={{ __html: value }}
              />
              {idx < metaEntries.length - 1 && (
                <span className={s.metaSep} aria-hidden>
                  •
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <AkjBanner accessRequirements={page.accessRequirements} />

      <div className={s.proseWrap} data-article-content>
        <RichTextEditor value={page.content} readOnly className={s.prose} />
      </div>

      <PageSections sections={page.sections} />
    </div>
  );
}
