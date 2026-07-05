import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import { PageHeader } from './components/PageHeader';
import { AkjDecryptedBanner } from './components/AkjDecryptedBanner';
import { WithAkjTabs } from './components/WithAkjTabs';
import { GalleryLightbox } from './components/GalleryLightbox';
import { QuoteSelectionPopup } from './components/QuoteSelectionPopup';
import { PagePalette } from './components/PagePalette';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { BacklinksPanel } from './components/BacklinksPanel';
import { OstatniLayout } from './layouts/OstatniLayout';
import { LokaceLayout } from './layouts/LokaceLayout';
import { NovinyLayout } from './layouts/NovinyLayout';
import { SeznamLayout } from './layouts/SeznamLayout';
import { GalerieLayout } from './layouts/GalerieLayout';
import { ZoomLayout } from './layouts/ZoomLayout';
import { ObrazovkaLayout } from './layouts/ObrazovkaLayout';
import { PostavaLayout } from './layouts/PostavaLayout';
import { RulebookHub } from './layouts/RulebookHub';
import { useBrokenLinks } from './hooks/useBrokenLinks';
import { useAutoLink } from './hooks/useAutoLink';
import { useInlineImageLightbox } from './hooks/useInlineImageLightbox';
import {
  useKeyboardShortcut,
  useKeyboardSequence,
} from './hooks/useKeyboardShortcut';
import { useFavoritePages } from '../api/useFavoritePages';
import type { Page, PageType } from '../api/pages.types';
import s from './PageViewer.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1 — Typ-agnostic presenter. Volí konkrétní layout podle `page.type`,
 * dělá pre-render výpočty sdílené napříč typy (read-time).
 *
 * Layouty se přidávají ve Fázi 2 (Lokace, Noviny, Seznam, Galerie, Zoom,
 * Obrazovka). Default = `OstatniLayout` pro typ „Ostatní" a fallback pro
 * nepoznané typy.
 */
const LAYOUTS: Record<PageType, React.ComponentType<{ page: Page }>> = {
  Lokace: LokaceLayout,
  Noviny: NovinyLayout,
  Seznam: SeznamLayout,
  Galerie: GalerieLayout,
  Zoom: ZoomLayout,
  Obrazovka: ObrazovkaLayout,
  Ostatní: OstatniLayout,
  // 9.1 — sjednocení Character → Page
  'Postava hráče': PostavaLayout,
  NPC: PostavaLayout,
};

export function PageViewer({ page }: Props) {
  const navigate = useNavigate();
  const { worldId, worldSlug, world, userRole } = useWorldContext();
  const containerRef = useRef<HTMLElement>(null);
  const favorites = useFavoritePages(worldId);
  const canEdit = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const readTimeMinutes = useMemo(() => {
    if (page.type === 'Galerie') return null;
    const words = page.plainText.trim().split(/\s+/).filter(Boolean).length;
    if (words === 0) return null;
    return Math.max(1, Math.ceil(words / 220));
  }, [page.plainText, page.type]);

  // Hash deeplink na mount: pokud URL obsahuje #anchor, skroluj na něj.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    // AutoTOC id-injektor běží v useEffect — počkáme tick.
    const t = setTimeout(() => {
      document
        .getElementById(decodeURIComponent(hash))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => clearTimeout(t);
  }, [page.slug]);

  // F5 (migrace) — auto-link zmínek entit (běží před broken-links, který pak
  // vloženým odkazům dodá SPA navigaci)
  useAutoLink(containerRef, worldId, worldSlug, page.slug, page.content);

  // 7.1d — broken-link detekce
  useBrokenLinks(containerRef, worldId, worldSlug, page.content);

  // 7.1f — inline image lightbox
  const inlineLightbox = useInlineImageLightbox(containerRef, page.content);

  // 7.1k — keyboard shortcuts
  useKeyboardShortcut('k', (e) => {
    e.preventDefault();
    setPaletteOpen(true);
  }, { ctrl: true });
  useKeyboardShortcut('f', () => favorites.toggle(page.slug));
  useKeyboardShortcut('e', () => {
    if (canEdit) navigate(`/svet/${worldSlug}/edit/${page.slug}`);
  });
  useKeyboardShortcut('?', () => setHelpOpen(true), { shift: true });
  useKeyboardSequence(['g', 's'], () =>
    navigate(`/svet/${worldSlug}/stranky`),
  );

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  // Pravidlová kniha — hub Pravidla (matrix) dostane „kodex" layout místo
  // generického SeznamLayoutu. Kapitoly jedou přes OstatniLayout (+ QuickRef HUD).
  const isRulebookHub =
    world?.system === 'matrix' &&
    page.type === 'Seznam' &&
    (page.slug === 'pravidla' || page.slug === 'magicka-pravidla');
  const Layout = isRulebookHub
    ? RulebookHub
    : (LAYOUTS[page.type] ?? OstatniLayout);
  // Lokace/Postava/NPC vsazují AKJ záložky do vlastní lišty (vedle Kalendáře);
  // ostatní (flat) typy obalíme univerzálním WithAkjTabs.
  const handlesOwnAkjTabs =
    page.type === 'Lokace' ||
    page.type === 'Postava hráče' ||
    page.type === 'NPC';

  return (
    <>
      <article ref={containerRef} className={s.article} data-print-scope>
        <PageHeader page={page} readTimeMinutes={readTimeMinutes} />
        <AkjDecryptedBanner
          worldId={worldId}
          accessRequirements={page.accessRequirements}
          isWoodWide={page.isWoodWide}
        />
        {handlesOwnAkjTabs ? (
          <Layout page={page} />
        ) : (
          <WithAkjTabs page={page}>
            <Layout page={page} />
          </WithAkjTabs>
        )}
        {/* „Odkazuje sem" = PJ nástroj pro správu lore — skryté hráčům/čtenářům
            (může prozradit meta-vazby). Viditelné jen PomocnyPJ+ (canEdit). */}
        {canEdit && <BacklinksPanel pageSlug={page.slug} />}
        <GalleryLightbox
          images={inlineLightbox.images}
          index={inlineLightbox.index}
          onClose={inlineLightbox.close}
          onIndexChange={inlineLightbox.setIndex}
        />
        <QuoteSelectionPopup
          containerRef={containerRef}
          pageTitle={page.title}
        />
      </article>
      <PagePalette open={paletteOpen} onClose={closePalette} />
      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={closeHelp}
        canEdit={canEdit}
      />
    </>
  );
}
