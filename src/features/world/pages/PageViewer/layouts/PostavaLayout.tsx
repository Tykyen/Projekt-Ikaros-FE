import { useMemo, useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  User,
  Skull,
  Lock,
  UserCircle,
  BookOpen,
  Coins,
  Backpack,
  StickyNote,
  CalendarDays,
  Pencil,
} from 'lucide-react';
import { Tabs, type TabItem, ConfirmDialog } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { currentUserAtom } from '@/shared/store/authStore';
import { WorldRole, type CharacterTabId } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { getVisibleTabs } from '@/features/world/lib/characterTabVisibility';
import { DiaryTab } from '../../CharacterDetailPage/components/DiaryTab';
import { FinanceTab } from '../../CharacterDetailPage/components/FinanceTab';
import { InventoryTab } from '../../CharacterDetailPage/components/InventoryTab';
import { NotesTab } from '../../CharacterDetailPage/components/NotesTab';
import { CalendarTab } from '../../CharacterDetailPage/components/CalendarTab';
import { useCharacter } from '../../api/useCharacter';
import { AkjBanner } from '../components/AkjBanner';
import { SoukromeTab } from './SoukromeTab';
import type { Page, InfoBlock } from '../../api/pages.types';
import s from './PostavaLayout.module.css';

interface Props {
  page: Page;
}

type PendingNav = { type: 'tab'; id: string } | { type: 'exit' };

/**
 * 9.1 — Layout pro typ `PostavaHrace` (PC) a `NPC`. Page-driven viewer
 * se 6 taby:
 *
 *   • Profil (Bio) — z `Page.content` + `Page.table` + (PJ/owner) `privateContent`/`privateInfoBlocks`
 *   • Deník/Finance/Výbava/Kalendář/Poznámky — z `Character` entity (přes
 *     `characterRef.characterId` → subdoc API). Edit mode toggle, discard
 *     guard pro neuložené změny.
 *
 * Bio nemá inline edit — editace přes „Upravit Bio" navádí na `/edit/<slug>`
 * (PageEditor s PostavaPanel + ContentPanel + TablePanel).
 *
 * Fallback: pokud `Character` ještě neexistuje (legacy Page bez migrace),
 * subdoc taby skryjeme a ukážeme jen Bio.
 */
export function PostavaLayout({ page }: Props) {
  const { worldId, worldSlug, userRole } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);

  const isPC = page.type === 'Postava hráče';
  const isOwner =
    isPC && !!page.ownerUserId && page.ownerUserId === currentUser?.id;
  const canSeePrivate = (userRole ?? -1) >= WorldRole.PomocnyPJ || isOwner;
  const canEdit = canSeePrivate;

  // Načti Character entity (jen pokud Page má characterRef). Slug Character
  // se po sjednocení 9.1 shoduje s Page.slug — subdoc API přijímá slug.
  const { data: character } = useCharacter(
    worldId,
    page.characterRef ? page.slug : '',
  );

  // Side-task character-tab-visibility — PJ override viditelnosti subdoc tabů.
  // Aplikuje se na PJ/PomocnyPJ/vlastníka PC; hráč/Korektor sem nikdy nedoputuje
  // (canSeePrivate je false → subdoc taby v `tabs` array vůbec nejsou).
  const { data: worldSettings } = useWorldSettings(worldId);
  const visibleTabs = useMemo(
    () => getVisibleTabs(page.type, worldSettings ?? undefined),
    [page.type, worldSettings],
  );

  const [activeTab, setActiveTab] = useState<string>('profil');
  const [editMode, setEditMode] = useState(false);
  const [activeTabDirty, setActiveTabDirty] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  const blocker = useBlocker(editMode && activeTabDirty);
  const guardOpen = pendingNav !== null || blocker.state === 'blocked';

  function requestTabChange(id: string) {
    if (id === activeTab) return;
    if (editMode && activeTabDirty) {
      setPendingNav({ type: 'tab', id });
      return;
    }
    setActiveTab(id);
    // Při přepnutí mimo subdoc tab vypnout edit mode (Bio nemá inline edit).
    if (id === 'profil') setEditMode(false);
  }

  function requestToggleEdit() {
    if (!editMode) {
      setEditMode(true);
      return;
    }
    if (activeTabDirty) {
      setPendingNav({ type: 'exit' });
      return;
    }
    setEditMode(false);
  }

  function handleExitEdit() {
    setEditMode(false);
    setActiveTabDirty(false);
  }

  function closeGuard() {
    if (blocker.state === 'blocked') blocker.reset();
    setPendingNav(null);
  }

  function confirmGuard() {
    setActiveTabDirty(false);
    if (pendingNav?.type === 'tab') {
      setActiveTab(pendingNav.id);
      if (pendingNav.id === 'profil') setEditMode(false);
      setPendingNav(null);
    } else if (pendingNav?.type === 'exit') {
      setEditMode(false);
      setPendingNav(null);
    }
    if (blocker.state === 'blocked') blocker.proceed();
  }

  // 8.1-FIR — všech 5 subdoc tabů (Deník/Finance/Výbava/Kalendář/Poznámky)
  // je vidí JEN PJ, PomocnyPJ a vlastník postavy. Veřejnost vidí jen Profil.
  // BE assertSubdocAccess to enforcuje serverově (vrátí 403 cizincům);
  // skrytí tabů je čistě UX vrstva.
  //
  // Side-task character-tab-visibility — `visibleTabs` filtr aplikujeme až po
  // role guardu; pro hráče/Korektora nemá efekt (subdoc taby tu stejně nejsou).
  const tabs: TabItem[] = [
    { id: 'profil', label: 'Profil', icon: <UserCircle size={16} /> },
    // D-NEW-soukrome-tab — privátní bio + privateInfoBlocks vlastní záložka.
    // Vidí jen PJ/PomocnyPJ/vlastník postavy.
    ...(canSeePrivate && visibleTabs.has('soukrome')
      ? [{ id: 'soukrome', label: 'Soukromé', icon: <Lock size={16} /> }]
      : []),
    ...(character && canSeePrivate
      ? ([
          visibleTabs.has('denik') && {
            id: 'denik',
            label: 'Deník',
            icon: <BookOpen size={16} />,
          },
          visibleTabs.has('finance') && {
            id: 'finance',
            label: 'Finance',
            icon: <Coins size={16} />,
          },
          visibleTabs.has('vybava') && {
            id: 'vybava',
            label: 'Výbava',
            icon: <Backpack size={16} />,
          },
          visibleTabs.has('kalendar') && {
            id: 'kalendar',
            label: 'Kalendář',
            icon: <CalendarDays size={16} />,
          },
          visibleTabs.has('poznamky') && {
            id: 'poznamky',
            label: 'Poznámky',
            icon: <StickyNote size={16} />,
          },
        ].filter(Boolean) as TabItem[])
      : []),
  ];

  // Auto-switch: pokud PJ schoval aktuální tab, přesuň se na Profil
  // (render-phase, React doc pattern „Adjusting state when something changes").
  if (
    activeTab !== 'profil' &&
    !visibleTabs.has(activeTab as CharacterTabId)
  ) {
    setActiveTab('profil');
    setEditMode(false);
  }

  const tabMode = editMode ? 'edit' : 'view';
  const subdocTabActive = activeTab !== 'profil';

  return (
    <div className={s.layout}>
      <PostavaHero
        page={page}
        canEdit={canEdit && activeTab === 'profil'}
        showEditBtn={subdocTabActive && canEdit}
        editMode={editMode}
        onToggleEdit={requestToggleEdit}
        worldSlug={worldSlug}
      />

      <AkjBanner accessRequirements={page.accessRequirements} />

      <Tabs
        items={tabs}
        activeId={activeTab}
        onChange={requestTabChange}
        orientation="horizontal"
      >
        {activeTab === 'profil' && <BioTab page={page} />}

        {activeTab === 'soukrome' && canSeePrivate && (
          <SoukromeTab
            page={page}
            worldId={worldId}
            worldSlug={worldSlug}
            canEdit={canEdit}
            onDirtyChange={setActiveTabDirty}
          />
        )}

        {activeTab === 'denik' && character && canSeePrivate && (
          <DiaryTab
            slug={page.slug}
            mode={tabMode}
            onExitEdit={handleExitEdit}
            onDirtyChange={setActiveTabDirty}
          />
        )}
        {activeTab === 'finance' && character && canSeePrivate && (
          <FinanceTab
            page={page}
            mode={tabMode}
            onExitEdit={handleExitEdit}
            onDirtyChange={setActiveTabDirty}
            onBackToProfil={() => setActiveTab('profil')}
          />
        )}
        {activeTab === 'vybava' && character && canSeePrivate && (
          <InventoryTab
            page={page}
            mode={tabMode}
            onExitEdit={handleExitEdit}
            onDirtyChange={setActiveTabDirty}
            canEdit={canEdit}
          />
        )}
        {activeTab === 'kalendar' && character && canSeePrivate && (
          <CalendarTab
            slug={page.slug}
            mode={tabMode}
            onExitEdit={handleExitEdit}
            onDirtyChange={setActiveTabDirty}
          />
        )}
        {activeTab === 'poznamky' && character && canSeePrivate && (
          <NotesTab
            slug={page.slug}
            mode={tabMode}
            onExitEdit={handleExitEdit}
            onDirtyChange={setActiveTabDirty}
          />
        )}
      </Tabs>

      <ConfirmDialog
        open={guardOpen}
        onClose={closeGuard}
        title="Neuložené změny"
        message="Máš rozpracované změny, které nejsou uložené. Pokud budeš pokračovat, změny se zahodí."
        confirmLabel="Zahodit změny"
        cancelLabel="Zůstat"
        confirmVariant="danger"
        onConfirm={confirmGuard}
      />
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────── */

function PostavaHero({
  page,
  canEdit,
  showEditBtn,
  editMode,
  onToggleEdit,
  worldSlug,
}: {
  page: Page;
  canEdit: boolean;
  showEditBtn: boolean;
  editMode: boolean;
  onToggleEdit: () => void;
  worldSlug: string;
}) {
  const isPC = page.type === 'Postava hráče';

  return (
    <div className={s.heroRow}>
      {page.imageUrl ? (
        <img
          className={s.avatar}
          src={page.imageUrl}
          alt={page.title}
          loading="lazy"
        />
      ) : (
        <div className={s.avatarFallback} aria-hidden>
          {isPC ? <User size={48} /> : <Skull size={48} />}
        </div>
      )}
      <div className={s.identity}>
        <span className={s.typeBadge}>
          {isPC ? (
            <>
              <User size={12} aria-hidden /> Postava hráče
            </>
          ) : (
            <>
              <Skull size={12} aria-hidden /> NPC
            </>
          )}
        </span>
        <h1 className={s.title}>{page.title}</h1>
        {isPC && page.ownerUserId && (
          <p className={s.owner}>
            Hraje: <span className={s.ownerName}>{page.ownerUserId}</span>
          </p>
        )}
      </div>
      <div className={s.heroActions}>
        {canEdit && (
          <Link
            to={`/svet/${worldSlug}/edit/${page.slug}`}
            className={s.editBioBtn}
          >
            <Pencil size={14} aria-hidden /> Upravit Bio
          </Link>
        )}
        {showEditBtn && (
          <button
            type="button"
            className={s.editTabBtn}
            onClick={onToggleEdit}
            aria-pressed={editMode}
          >
            {editMode ? 'Hotovo' : 'Upravit záložku'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Bio tab (jen veřejná část) ────────────────────────────────────── */

function BioTab({ page }: { page: Page }) {
  const publicBlocks = tableToInfoBlocks(
    page.table?.headers,
    page.table?.values,
  );

  return (
    <div className={s.tabContent}>
      <section className={s.bioSection}>
        {publicBlocks.length > 0 && <InfoBlockList blocks={publicBlocks} />}
        {page.content && page.content.trim() !== '' ? (
          <div className={s.proseWrap} data-article-content>
            <RichTextEditor
              value={page.content}
              readOnly
              className={s.prose}
            />
          </div>
        ) : (
          <p className={s.empty}>Žádné veřejné bio.</p>
        )}
      </section>
    </div>
  );
}

function tableToInfoBlocks(
  headers?: string[],
  values?: string[],
): InfoBlock[] {
  if (!headers || headers.length === 0) return [];
  const out: InfoBlock[] = [];
  for (let i = 0; i < headers.length; i++) {
    const label = headers[i]?.trim();
    const value = values?.[i]?.trim() ?? '';
    if (!label && !value) continue;
    out.push({ label: label ?? '', value });
  }
  return out;
}

function InfoBlockList({ blocks }: { blocks: InfoBlock[] }) {
  return (
    <dl className={s.blocks}>
      {blocks.map((b, i) => (
        <div key={i} className={s.blockRow}>
          <dt
            className={s.blockLabel}
            dangerouslySetInnerHTML={{ __html: b.label }}
          />
          <dd
            className={s.blockValue}
            dangerouslySetInnerHTML={{ __html: b.value || '—' }}
          />
        </div>
      ))}
    </dl>
  );
}
