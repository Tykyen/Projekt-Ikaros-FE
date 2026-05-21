import { AutoTOC } from '@/features/ikaros/components/AutoTOC';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import { PageSections } from '../components/PageSections';
import { PageSidebar } from '../components/PageSidebar';
import type { Page } from '../../api/pages.types';
import s from './OstatniLayout.module.css';

interface Props {
  page: Page;
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
  return (
    <div className={s.layout}>
      <main className={s.main}>
        {page.bigImage && page.imageUrl && (
          <div className={s.heroBig}>
            <img
              src={page.imageUrl}
              alt={page.title}
              loading="lazy"
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

        <PageSections sections={page.sections} />
      </main>

      <aside className={s.aside}>
        <PageSidebar page={page} />
        <div className={s.tocWrap}>
          <AutoTOC html={page.content} />
        </div>
      </aside>
    </div>
  );
}
