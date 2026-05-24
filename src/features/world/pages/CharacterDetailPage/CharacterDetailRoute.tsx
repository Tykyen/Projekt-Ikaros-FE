import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';

/**
 * 9.1 — Permanent redirect z legacy `/postava/:slug` na sjednocenou
 * URL `/<slug>` (Page entity s typem PostavaHrace / NPC). PostavaLayout
 * v PageViewer renderuje plný character profil včetně subdoc tabů.
 *
 * Tento wrapper existuje jen pro bookmarky uživatelů; cleanup migrace
 * `cleanup-character-duplicates-9.1` smazala bio data z Character entity,
 * takže fallback na legacy CharacterDetailPage už není možný.
 */
export default function CharacterDetailRoute() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { worldSlug, loading } = useWorldContext();

  if (loading) return <Spinner center />;
  return <Navigate to={`/svet/${worldSlug}/${slug}`} replace />;
}
