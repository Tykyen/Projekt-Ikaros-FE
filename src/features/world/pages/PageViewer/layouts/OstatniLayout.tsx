import { AutoTOC } from '@/features/ikaros/components/AutoTOC';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import { LevelSpine } from '../components/LevelSpine';
import { PageSections } from '../components/PageSections';
import { PageSidebar } from '../components/PageSidebar';
import { QuickRef } from '../components/QuickRef';
import type { Page } from '../../api/pages.types';
import { getImageStyle } from '@/shared/lib/imageStyle';
import s from './OstatniLayout.module.css';

interface Props {
  page: Page;
}

/** Stupně magie (kódex páteř) z customData.magicLevels (JSON pole textů). */
function readMagicLevels(page: Page): string[] | null {
  const raw = page.customData?.magicLevels;
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr.map(String) : null;
  } catch {
    return null;
  }
}

/**
 * 7.1b — Default layout pro typy „Ostatní" + „Lokace". Sloupcová struktura:
 *   ┌──────────────────┬──────────┐
 *   │ AKJ banner       │          │
 *   │ Content (TipTap) │ SIDEBAR  │
 *   │ Sections         │ + AutoTOC│
 *   └──────────────────┴──────────┘
 *
 * Container má `data-article-content` atribut — kompatibilita s `AutoTOC`,
 * který injektuje `id` na `<h2>`/`<h3>` přes globální `document.querySelector`.
 * (Viz [src/features/ikaros/components/AutoTOC.tsx:22].)
 *
 * `bigImage=true` → hero obrázek se NEzobrazí v sidebaru. Pro typ Lokace s
 * velkou mapou používá specifický layout (zatím delegováno tomuto default —
 * ZoomableImage napojíme ve Fázi 2 přes RodokmenLayout/wrapper).
 */
export function OstatniLayout({ page }: Props) {
  const magicLevels = readMagicLevels(page);
  return (
    <div className={s.layout}>
      <main className={s.main}>
        {page.bigImage && page.imageUrl && (
          <div className={s.heroBig}>
            <img
              src={page.imageUrl}
              alt={page.title}
              loading="lazy"
              style={getImageStyle(
                page.imageFocalX,
                page.imageFocalY,
                page.imageZoom,
                page.imageFit,
              )}
            />
          </div>
        )}

        <AkjBanner accessRequirements={page.accessRequirements} />

        <div className={s.proseWrap} data-article-content>
          <RichTextEditor
            value={page.content}
            readOnly
            className={s.prose}
          />
        </div>

        {magicLevels && (
          <div className={s.spineWrap}>
            <h3 className={s.spineHeading}>Stupně</h3>
            <LevelSpine levels={magicLevels} />
          </div>
        )}

        <PageSections sections={page.sections} />
      </main>

      <aside className={s.aside}>
        <QuickRef value={page.quickRef} />
        <PageSidebar page={page} />
        <div className={s.tocWrap}>
          <AutoTOC html={page.content} />
        </div>
      </aside>
    </div>
  );
}
