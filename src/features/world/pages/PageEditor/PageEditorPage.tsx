import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import { usePage } from '../api/usePage';
import { PageEditor } from './PageEditor';
import { PageEditorSkeleton } from './PageEditorSkeleton';
import { resolvePageTypeFromUrl, slugToTitle } from '../api/pages.types';

/**
 * 7.2 — Entry. Routes `/svet/:worldSlug/nova-stranka` + `/edit/:slug`.
 * Permissions: `WorldRole >= PomocnyPJ` (BE assertCanWrite + FE guard).
 *
 * V edit mode hydrate z `usePage`; v new mode rovnou prázdný form.
 * 403 (BE odmítl) → redirect na viewer (BE viewer permisivnější, AKJ access);
 * 404 → redirect na stránku „Nová stránka" (slug nepoznán).
 */
export default function PageEditorPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!slug;
  const {
    worldId,
    worldSlug,
    userRole,
    world,
    loading: worldLoading,
  } = useWorldContext();

  if (worldLoading) return <PageEditorSkeleton />;

  // Permission guard — elevation (`world.elevated`) obchází membership stejně
  // jako BE `worldAdminBypass`, jinak by nahozený admin dostal hard redirect
  // pryč z editoru, přestože BE zápis povolí.
  // 15.11 — práh snížen na Hráč: hráč (role ≥ Hrac) smí NAVRHNOUT obsah
  // (whitelist typ → pending) i editovat svůj pending návrh. BE je autoritativní:
  // create odvodí pending/403 (resolveCreateMode), update ověří autora pending
  // (assertCanEditPage). Ne-whitelist / cizí stránka → BE vrátí 403 (friendly toast).
  const isElevatedHere = world?.elevated === true;
  if (!isElevatedHere && (userRole ?? -1) < WorldRole.Hrac) {
    return <Navigate to={`/svet/${worldSlug}`} replace />;
  }

  if (isEdit) {
    return <EditModeWrapper slug={slug} worldId={worldId} worldSlug={worldSlug} />;
  }

  // 9.1 — wizard posílá `?type=<X>` do new mode. Akceptujeme slug klíč
  // (`PostavaHrace`) i display-name (`Postava hráče`) — viz resolver.
  const initialType = resolvePageTypeFromUrl(searchParams.get('type') ?? '');
  // 9.1 C — `?owner=<userId>` předvyplní ownerUserId pro PC (typicky
  // z WorldSettings → Členové → „Vytvořit postavu pro hráče").
  const initialOwnerUserId = searchParams.get('owner') ?? undefined;
  // 7.1 — `?slug=<X>` z 404 „Vytvořit" předvyplní NÁZEV (odvozený ze slugu).
  const initialTitle = slugToTitle(searchParams.get('slug') ?? '') || undefined;

  return (
    <PageEditor
      initialType={initialType}
      initialOwnerUserId={initialOwnerUserId}
      initialTitle={initialTitle}
    />
  );
}

function EditModeWrapper({
  slug,
  worldId,
  worldSlug,
}: {
  slug: string;
  worldId: string;
  worldSlug: string;
}) {
  const { data: page, isLoading, error } = usePage(worldId, slug);

  if (isLoading) return <PageEditorSkeleton />;

  if (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 403) return <Navigate to={`/svet/${worldSlug}/${slug}`} replace />;
    if (status === 404)
      return <Navigate to={`/svet/${worldSlug}/nova-stranka`} replace />;
    return <Navigate to={`/svet/${worldSlug}`} replace />;
  }

  if (!page) return <PageEditorSkeleton />;

  return <PageEditor page={page} />;
}
