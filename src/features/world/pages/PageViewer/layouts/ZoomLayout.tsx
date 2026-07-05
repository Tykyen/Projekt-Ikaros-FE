import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import { PageSections } from '../components/PageSections';
import { PageSidebar } from '../components/PageSidebar';
import { ZoomableImage } from '../components/ZoomableImage';
import type { Page } from '../../api/pages.types';
import s from './ZoomLayout.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1b — Layout pro typ Zoom (dříve „Rodokmen"). Hero obrázek = velký
 * zoomovatelný (`ZoomableImage`, custom pan/zoom 0.25–5×). Pod ním TipTap
 * content + sekce. Sidebar (table) zachován vpravo.
 *
 * Bez `imageUrl` = degraded fallback do default OstatniLayout chování
 * (žádný hero, jen content).
 */
export function ZoomLayout({ page }: Props) {
  return (
    <div className={s.layout}>
      <main className={s.main}>
        <AkjBanner accessRequirements={page.accessRequirements} />

        {page.imageUrl ? (
          <div className={s.heroWrap}>
            <ZoomableImage src={page.imageUrl} alt={page.title} />
          </div>
        ) : null}

        <div className={s.proseWrap} data-article-content>
          <RichTextEditor value={page.content} readOnly className={s.prose} />
        </div>

        <PageSections sections={page.sections} />
      </main>

      <aside className={s.aside}>
        <PageSidebar page={{ ...page, bigImage: true /* skryj duplicitní hero v sidebaru */ }} />
      </aside>
    </div>
  );
}
