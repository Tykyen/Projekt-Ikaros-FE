import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePage } from '../api/usePage';
import { PageViewer } from './PageViewer';
import { PageViewerSkeleton } from './components/PageViewerSkeleton';
import { AccessDenied } from './components/AccessDenied';
import { PageNotFound } from './components/PageNotFound';

/**
 * 7.1 — Entry. Nahrazuje původní stub `PageViewerPage`. Routa
 * `/svet/:worldSlug/:slug` (catch-all, viz [src/app/router.tsx:283]).
 *
 * Tok:
 *  1. `useWorldContext()` poskytuje `worldId` (WorldLayout už ho resolved).
 *  2. `usePage(worldId, slug)` načte stránku (403/404 nepokouší retry).
 *  3. Loading → skeleton, 403 → AccessDenied, 404 → PageNotFound, OK → PageViewer.
 */
export default function PageViewerPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { worldId, loading: worldLoading } = useWorldContext();
  const { data: page, isLoading, error } = usePage(worldId, slug);

  if (worldLoading || isLoading) return <PageViewerSkeleton />;

  if (error) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    if (status === 403) return <AccessDenied slug={slug} />;
    if (status === 404) return <PageNotFound slug={slug} />;
    // Jiná chyba — fallback na NotFound (nejméně frustrující UX).
    return <PageNotFound slug={slug} />;
  }

  if (!page) return <PageNotFound slug={slug} />;

  return <PageViewer page={page} />;
}
