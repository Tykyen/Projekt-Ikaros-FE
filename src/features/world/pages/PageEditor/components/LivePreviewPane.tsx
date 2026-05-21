import { useEffect, useMemo, useState } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { PageViewer } from '../../PageViewer/PageViewer';
import type { Page } from '../../api/pages.types';
import type { PageEditorFormState } from '../hooks/usePageEditorState';
import s from './LivePreviewPane.module.css';

interface Props {
  state: PageEditorFormState;
  slug: string;
}

/**
 * 7.2j — Live preview pane vedle editoru. Debouncovaný (300ms) render
 * PageViewer s virtuální Page entity z form state.
 *
 * Mobile (<1024px) by se neměl renderovat — editor topbar to už řeší.
 */
export function LivePreviewPane({ state, slug }: Props) {
  const { worldId } = useWorldContext();
  const [debouncedState, setDebouncedState] = useState(state);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedState(state), 300);
    return () => clearTimeout(t);
  }, [state]);

  const virtualPage = useMemo<Page>(
    () => ({
      id: 'preview',
      worldId,
      slug: slug || 'preview',
      type: debouncedState.type,
      title: debouncedState.title || 'Náhled stránky',
      content: debouncedState.content,
      imageUrl: debouncedState.imageUrl || undefined,
      bigImage: debouncedState.bigImage,
      table: debouncedState.table.hasTable ? debouncedState.table : undefined,
      sections: debouncedState.sections,
      galleryImages: debouncedState.galleryImages,
      videos: debouncedState.videos,
      menu: debouncedState.menu,
      plainText: '',
      isWoodWide: debouncedState.isWoodWide,
      accessRequirements: debouncedState.accessRequirements,
      customData: debouncedState.customData,
      order: debouncedState.order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [debouncedState, worldId, slug],
  );

  return (
    <aside className={s.pane} aria-label="Živý náhled">
      <div className={s.header}>
        <span>Náhled</span>
        <small>aktualizuje se s 300ms zpožděním</small>
      </div>
      <div className={s.body}>
        <PageViewer page={virtualPage} />
      </div>
    </aside>
  );
}
