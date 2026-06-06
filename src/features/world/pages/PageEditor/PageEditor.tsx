import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { EditorTopBar } from './components/EditorTopBar';
import { EditorStickyBar } from './components/EditorStickyBar';
import { RestoreDraftModal } from './components/RestoreDraftModal';
import { IdentityPanel } from './panels/IdentityPanel';
import { ContentPanel } from './panels/ContentPanel';
import { SectionsPanel } from './panels/SectionsPanel';
import { DataTemplatePanel } from './panels/DataTemplatePanel';
import { TablePanel } from './panels/TablePanel';
import { GalleryPanel } from './panels/GalleryPanel';
import { VideosPanel } from './panels/VideosPanel';
import { MenuPanel } from './panels/MenuPanel';
import { CustomDataPanel } from './panels/CustomDataPanel';
import { AkjTabsPanel } from './panels/AkjTabsPanel';
import { PostavaPanel } from './panels/PostavaPanel';
import { TypeSwitchWarningModal } from './components/TypeSwitchWarningModal';
import { LivePreviewPane } from './components/LivePreviewPane';
import { ConflictModal } from './components/ConflictModal';
import { DeletePageModal } from './components/DeletePageModal';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/shared/ui';
import { useKeyboardShortcut } from '../PageViewer/hooks/useKeyboardShortcut';
import { pagesQueryKey } from '../api/usePage';
import { usePagesDirectory } from '../api/usePagesDirectory';
import { useDeletePage } from '../api/useDeletePage';
import {
  usePageEditorState,
  pageToFormState,
  INITIAL_PAGE_STATE,
  type PageEditorFormState,
} from './hooks/usePageEditorState';
import { useSlugAutoGen } from './hooks/useSlugAutoGen';
import { useFormDraftAutoSave } from './hooks/useFormDraftAutoSave';
import { detectLostData, type LostDataDescriptor } from './hooks/useTypeSwitchGuard';
import { useCreatePage } from '../api/useCreatePage';
import { useUpdatePage } from '../api/useUpdatePage';
import type { Page, PageType } from '../api/pages.types';
import s from './PageEditor.module.css';

interface Props {
  /** Edit mode: existující stránka, jinak undefined = new. */
  page?: Page;
  /**
   * 9.1 — New mode: předvyplněný `type` z wizardu (`?type=PostavaHrace|NPC|…`).
   * Ignoruje se v edit mode (typ stránky určuje BE entity).
   */
  initialType?: PageType;
  /**
   * 9.1 C — New mode: předvyplněný `ownerUserId` pro PC (z `?owner=<id>`,
   * typicky z WorldSettings „Vytvořit postavu pro hráče"). Ignoruje se
   * v edit mode i pro non-PC typy.
   */
  initialOwnerUserId?: string;
}

/**
 * 7.2 — Presenter. Spravuje form state, draft auto-save, save flow.
 * 9.1 — `initialType` z wizardu (new mode) předvyplní type ve formuláři.
 */
export function PageEditor({ page, initialType, initialOwnerUserId }: Props) {
  const navigate = useNavigate();
  const user = useAtomValue(currentUserAtom);
  const { worldId, worldSlug } = useWorldContext();
  const isEdit = !!page;

  const initialState = useMemo<PageEditorFormState>(
    () =>
      page
        ? pageToFormState(page)
        : {
            ...INITIAL_PAGE_STATE,
            type: initialType ?? INITIAL_PAGE_STATE.type,
            // C — předvyplnit owner jen pokud type=PostavaHrace
            ownerUserId:
              initialType === 'Postava hráče' && initialOwnerUserId
                ? initialOwnerUserId
                : INITIAL_PAGE_STATE.ownerUserId,
            // spec-akj-owner-visibility — nové PC dostanou předpřipravenou
            // záložku „Soukromé" (vidí PJ + vlastník), kam PJ píše soukromé bio.
            akjTabs:
              initialType === 'Postava hráče'
                ? [
                    {
                      id: crypto.randomUUID(),
                      name: 'Soukromé',
                      order: 0,
                      access: [],
                      ownerHidden: false,
                    },
                  ]
                : INITIAL_PAGE_STATE.akjTabs,
          },
    [page, initialType, initialOwnerUserId],
  );
  const { state, setField, patch, reset } = usePageEditorState(initialState);

  const slug = useSlugAutoGen(state.title, isEdit, page?.slug ?? '');

  // Schema-verzovaný klíč. Bump `v2` → `v3` při breaking schema změně
  // PageEditorFormState; useFormDraftAutoSave při loadu zahodí starší verze.
  const draftKey = useMemo(
    () =>
      user
        ? `page-draft:v2:${user.id}:${worldId}:${page?.id ?? 'new'}`
        : undefined,
    [user, worldId, page?.id],
  );
  const { hasUnsavedLocal, restoreCandidate, clearLocalDraft } =
    useFormDraftAutoSave(draftKey, state);

  const [restoreDismissed, setRestoreDismissed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [pendingTypeSwitch, setPendingTypeSwitch] = useState<{
    next: PageType;
    lost: LostDataDescriptor[];
  } | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveExistingOpen, setSaveExistingOpen] = useState(false);
  const qc = useQueryClient();
  const deletePage = useDeletePage(worldId, worldSlug);

  const create = useCreatePage(worldId, worldSlug);
  const update = useUpdatePage(worldId, worldSlug);
  const isPending = create.isPending || update.isPending;

  // Detekce slug-kolize v režimu tvorby — zadaný slug už patří existující
  // stránce světa. Pak se „Vytvořit" mění na „Uložit do <stránka>".
  const { data: directory = [] } = usePagesDirectory(worldId);
  const existingPage = useMemo(
    () =>
      isEdit
        ? null
        : (directory.find((d) => d.slug === slug.slug) ?? null),
    [isEdit, directory, slug.slug],
  );

  // Hydrate from BE on edit mode (jen jednou per page.id)
  useEffect(() => {
    if (!page) return;
    reset(pageToFormState(page));
  }, [page, reset]);

  const restoreOpen = !!restoreCandidate && !restoreDismissed;

  function onTypeChangeRequest(next: PageType) {
    if (next === state.type) return;
    const lost = detectLostData(state.type, next, state);
    if (lost.length > 0) {
      setPendingTypeSwitch({ next, lost });
    } else {
      setField('type', next);
    }
  }

  function confirmTypeSwitch() {
    if (pendingTypeSwitch) {
      setField('type', pendingTypeSwitch.next);
      setPendingTypeSwitch(null);
    }
  }

  const canSave = state.title.trim().length > 0 && slug.slug.length > 0;

  async function handleSave() {
    if (!canSave) {
      toast.error('Vyplň název a slug stránky');
      return;
    }
    // Režim tvorby + slug patří existující stránce → potvrdit přepsání,
    // místo tichého „slug zabraný" selhání.
    if (!isEdit && existingPage) {
      setSaveExistingOpen(true);
      return;
    }
    try {
      if (isEdit && page) {
        const updated = await update.mutateAsync({
          id: page.id,
          previousSlug: page.slug, // N-38 — pro úklid staré cache po rename
          input: {
            slug: slug.slug,
            title: state.title,
            type: state.type,
            content: state.content,
            imageUrl: state.imageUrl || undefined,
            bigImage: state.bigImage,
            imageFocalX: state.imageFocalX,
            imageFocalY: state.imageFocalY,
            imageZoom: state.imageZoom,
            imageFit: state.imageFit,
            isWoodWide: state.isWoodWide,
            order: state.order,
            sections: state.sections,
            table: state.table.hasTable ? state.table : undefined,
            galleryImages: state.galleryImages,
            videos: state.videos,
            menu: state.menu,
            customData: state.customData,
            accessRequirements: state.accessRequirements,
            expectedUpdatedAt: state.expectedUpdatedAt ?? undefined,
            // 9.1 — PC/NPC pole; pro ostatní typy zůstanou prázdné/undefined.
            ownerUserId: state.ownerUserId || undefined,
            akjTabs: state.akjTabs,
          },
        });
        clearLocalDraft();
        toast.success('Stránka uložena');
        // Po uložení rovnou na stránku — uživatel vidí výsledek.
        navigate(`/svet/${worldSlug}/${updated.slug}`);
      } else {
        const created = await create.mutateAsync({
          slug: slug.slug,
          title: state.title,
          type: state.type,
          content: state.content,
          imageUrl: state.imageUrl || undefined,
          bigImage: state.bigImage,
          imageFocalX: state.imageFocalX,
          imageFocalY: state.imageFocalY,
          imageZoom: state.imageZoom,
          imageFit: state.imageFit,
          isWoodWide: state.isWoodWide,
          order: state.order,
          sections: state.sections,
          table: state.table.hasTable ? state.table : undefined,
          galleryImages: state.galleryImages,
          videos: state.videos,
          menu: state.menu,
          customData: state.customData,
          accessRequirements: state.accessRequirements,
          // 9.1 — PC/NPC pole; pro ostatní typy zůstanou prázdné/undefined.
          ownerUserId: state.ownerUserId || undefined,
          akjTabs: state.akjTabs,
        });
        clearLocalDraft();
        toast.success('Stránka vytvořena');
        navigate(`/svet/${worldSlug}/${created.slug}`);
      }
    } catch (err: unknown) {
      const errObj = err as {
        response?: { status?: number; data?: { error?: { code?: string } } };
      };
      const status = errObj?.response?.status;
      const code = errObj?.response?.data?.error?.code;
      if (code === 'PAGE_SLUG_TAKEN') {
        toast.error('Slug už existuje. Zvol jiný.');
      } else if (status === 409 || code === 'PAGE_CONFLICT') {
        setConflictModalOpen(true);
      } else {
        toast.error('Uložení selhalo');
      }
    }
  }

  /** Potvrzené uložení rozepsaného obsahu do existující stránky (slug-kolize). */
  async function confirmSaveExisting() {
    if (!existingPage) return;
    setSaveExistingOpen(false);
    try {
      await update.mutateAsync({
        id: existingPage.id,
        input: {
          slug: slug.slug,
          title: state.title,
          type: state.type,
          content: state.content,
          imageUrl: state.imageUrl || undefined,
          bigImage: state.bigImage,
          imageFocalX: state.imageFocalX,
          imageFocalY: state.imageFocalY,
          imageZoom: state.imageZoom,
          imageFit: state.imageFit,
          isWoodWide: state.isWoodWide,
          order: state.order,
          sections: state.sections,
          table: state.table.hasTable ? state.table : undefined,
          galleryImages: state.galleryImages,
          videos: state.videos,
          menu: state.menu,
          customData: state.customData,
          accessRequirements: state.accessRequirements,
          // 9.1 — PC/NPC pole.
          ownerUserId: state.ownerUserId || undefined,
          akjTabs: state.akjTabs,
          // expectedUpdatedAt vynechán — vědomé přepsání z režimu tvorby.
        },
      });
      clearLocalDraft();
      toast.success('Stránka uložena');
      navigate(`/svet/${worldSlug}/${slug.slug}`);
    } catch {
      toast.error('Uložení selhalo');
    }
  }

  // 7.2k — handlers pro ConflictModal
  function handleRefreshConflict() {
    setConflictModalOpen(false);
    if (page) {
      // Invaliduj detail cache → useQuery refetchne → useEffect (hydrate) updatuje form
      void qc.invalidateQueries({
        queryKey: pagesQueryKey.detail(worldId, page.slug),
      });
    }
  }

  async function handleDelete() {
    if (!isEdit || !page) return;
    try {
      await deletePage.mutateAsync({ id: page.id, slug: page.slug });
      clearLocalDraft();
      toast.success('Stránka smazána');
      navigate(`/svet/${worldSlug}/stranky`);
    } catch {
      toast.error('Smazání selhalo');
    }
  }

  async function handleOverwriteConflict() {
    setConflictModalOpen(false);
    if (!isEdit || !page) return;
    try {
      await update.mutateAsync({
        id: page.id,
        input: {
          slug: slug.slug,
          title: state.title,
          type: state.type,
          content: state.content,
          imageUrl: state.imageUrl || undefined,
          bigImage: state.bigImage,
          imageFocalX: state.imageFocalX,
          imageFocalY: state.imageFocalY,
          imageZoom: state.imageZoom,
          imageFit: state.imageFit,
          isWoodWide: state.isWoodWide,
          order: state.order,
          sections: state.sections,
          table: state.table.hasTable ? state.table : undefined,
          galleryImages: state.galleryImages,
          videos: state.videos,
          menu: state.menu,
          customData: state.customData,
          accessRequirements: state.accessRequirements,
          // expectedUpdatedAt vynechán = bez concurrency check
        },
      });
      setLastSavedAt(Date.now());
      clearLocalDraft();
      toast.success('Stránka přepsána');
    } catch {
      toast.error('Přepsání selhalo');
    }
  }

  // 7.2h — Ctrl/Cmd+S triggers save. Must be defined after canSave/handleSave.
  useKeyboardShortcut(
    's',
    (e) => {
      e.preventDefault();
      if (canSave && !isPending) void handleSave();
    },
    { ctrl: true },
  );

  return (
    <div className={`${s.page} ${previewEnabled ? s.pageWithPreview : ''}`}>
      <EditorTopBar
        isEdit={isEdit}
        title={state.title}
        hasUnsaved={hasUnsavedLocal}
        lastSavedAt={lastSavedAt}
        previewEnabled={previewEnabled}
        onTogglePreview={() => setPreviewEnabled((v) => !v)}
      />

      <div className={s.splitWrap}>
        <main className={s.main}>
        <div className={s.panels}>
          <IdentityPanel
            isEdit={isEdit}
            title={state.title}
            type={state.type}
            imageUrl={state.imageUrl}
            bigImage={state.bigImage}
            imageFocalX={state.imageFocalX}
            imageFocalY={state.imageFocalY}
            imageZoom={state.imageZoom}
            imageFit={state.imageFit}
            isWoodWide={state.isWoodWide}
            order={state.order}
            existingPageTitle={existingPage?.title}
            onChange={patch}
            onTypeChangeRequest={onTypeChangeRequest}
          />

          <DataTemplatePanel
            table={state.table}
            onChange={(table) => setField('table', table)}
          />

          {/* Atributy & metadata hned pod šablonou — šablona předvyplňuje
              hlavičky této tabulky, panely spolu věcně souvisí. */}
          <TablePanel
            table={state.table}
            onChange={(table) => setField('table', table)}
          />

          {/* Typově-specifické panely (Galerie / Videa / Menu / Metadata novin)
              jsou pozice 4 — patří k povaze stránky, ne k jejímu obsahu.
              Renderují se jen pro odpovídající typ. */}
          {state.type === 'Galerie' && (
            <GalleryPanel
              galleryImages={state.galleryImages}
              onChange={(galleryImages) => setField('galleryImages', galleryImages)}
            />
          )}

          {state.type === 'Obrazovka' && (
            <VideosPanel
              videos={state.videos}
              onChange={(videos) => setField('videos', videos)}
            />
          )}

          {state.type === 'Seznam' && (
            <MenuPanel
              menu={state.menu}
              onChange={(menu) => setField('menu', menu)}
              directory={directory}
            />
          )}

          {state.type === 'Noviny' && (
            <CustomDataPanel
              customData={state.customData}
              onChange={(customData) => setField('customData', customData)}
            />
          )}

          {(state.type === 'Postava hráče' || state.type === 'NPC') && (
            <PostavaPanel
              type={state.type}
              ownerUserId={state.ownerUserId}
              onOwnerChange={(userId) => setField('ownerUserId', userId)}
            />
          )}

          <ContentPanel
            content={state.content}
            onChange={(html) => setField('content', html)}
          />

          <SectionsPanel
            sections={state.sections}
            onChange={(sections) => setField('sections', sections)}
          />

          <AkjTabsPanel
            akjTabs={state.akjTabs}
            onChange={(tabs) => setField('akjTabs', tabs)}
            ownerControlled={state.type === 'Postava hráče'}
          />
        </div>
        </main>

        {previewEnabled && <LivePreviewPane state={state} slug={slug.slug} />}
      </div>

      <EditorStickyBar
        isEdit={isEdit}
        isPending={isPending}
        canSave={canSave}
        onSave={handleSave}
        onDelete={isEdit ? () => setDeleteModalOpen(true) : undefined}
        saveLabel={
          existingPage ? `Uložit do „${existingPage.title}"` : undefined
        }
      />

      <RestoreDraftModal
        open={restoreOpen}
        candidate={restoreCandidate}
        onAccept={(restored) => {
          reset(restored);
          setRestoreDismissed(true);
        }}
        onDiscard={() => {
          clearLocalDraft();
          setRestoreDismissed(true);
        }}
      />

      <TypeSwitchWarningModal
        open={!!pendingTypeSwitch}
        currentType={state.type}
        nextType={pendingTypeSwitch?.next ?? null}
        lostData={pendingTypeSwitch?.lost ?? []}
        onConfirm={confirmTypeSwitch}
        onCancel={() => setPendingTypeSwitch(null)}
      />

      <ConflictModal
        open={conflictModalOpen}
        onRefresh={handleRefreshConflict}
        onOverwrite={handleOverwriteConflict}
        onCancel={() => setConflictModalOpen(false)}
      />

      <ConfirmDialog
        open={saveExistingOpen}
        title="Uložit do existující stránky?"
        message={`Stránka „${existingPage?.title ?? ''}" s tímto slugem už ve světě existuje. Uložením přepíšeš její obsah tím, co máš rozepsané v editoru.`}
        confirmLabel="Uložit a přepsat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={confirmSaveExisting}
        onClose={() => setSaveExistingOpen(false)}
        isPending={update.isPending}
      />

      {page && (
        <DeletePageModal
          open={deleteModalOpen}
          pageTitle={page.title}
          pageSlug={page.slug}
          isPending={deletePage.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
