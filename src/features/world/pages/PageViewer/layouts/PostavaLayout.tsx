import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  User,
  Skull,
  Lock,
  Unlock,
  UserCircle,
  BookOpen,
  Coins,
  Backpack,
  StickyNote,
  CalendarDays,
  Pencil,
  Printer,
} from 'lucide-react';
import { Tabs, type TabItem, ConfirmDialog, Button } from '@/shared/ui';
import { usePrint, usePrintMode } from '@/features/world/export/print';
import { getImageStyle } from '@/shared/lib/imageStyle';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { currentUserAtom } from '@/shared/store/authStore';
import { WorldRole, type CharacterTabId } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { getVisibleTabs } from '@/features/world/lib/characterTabVisibility';
import { DiaryTab } from '../../CharacterDetailPage/components/DiaryTab';
import { FinanceTab } from '../../CharacterDetailPage/components/FinanceTab';
import { InventoryTab } from '../../CharacterDetailPage/components/InventoryTab';
import { NotesTab } from '../../CharacterDetailPage/components/NotesTab';
import { CalendarTab } from '../../CharacterDetailPage/components/CalendarTab';
import { useCharacter } from '../../api/useCharacter';
import { AkjBanner } from '../components/AkjBanner';
import { AkjLockedPanel } from '../components/AkjLockedPanel';
import { OstatniLayout } from './OstatniLayout';
import { resolveAkjTabPage, sortedAkjTabs } from '../lib/resolveAkjTab';
import type { Page, InfoBlock } from '../../api/pages.types';
import s from './PostavaLayout.module.css';

interface Props {
  page: Page;
}

type PendingNav = { type: 'tab'; id: string } | { type: 'exit' };

/**
 * 9.1 — Layout pro typ `PostavaHrace` (PC) a `NPC`. Page-driven viewer
 * se 6 taby + případnými AKJ chráněnými záložkami:
 *
 *   • Profil (Bio) — z `Page.content` + `Page.table` (veřejné). Soukromý obsah
 *     řeší AKJ chráněné záložky (`Page.akjTabs`, vč. presetu „Soukromé" pro
 *     vlastníka, spec-akj-owner-visibility); pole privateContent byla zrušena.
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

  // „Hraje:" musí ukázat přezdívku hráče, ne jeho userId. Dohledá se přes
  // členy světa (stejný zdroj jako adresář postav).
  const { data: members } = useWorldMembers(worldId);
  const playerName = page.ownerUserId
    ? members?.find((m) => m.userId === page.ownerUserId)?.user?.username
    : undefined;

  const visibleTabs = useMemo(
    () => getVisibleTabs(page.type, worldSettings ?? undefined),
    [page.type, worldSettings],
  );

  const [activeTab, setActiveTab] = useState<string>('profil');
  const [editMode, setEditMode] = useState(false);
  const [activeTabDirty, setActiveTabDirty] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
  const printMode = usePrintMode();
  const { triggerPrint } = usePrint();
  const [printIncludeCalendar, setPrintIncludeCalendar] = useState(false);
  // „Tisk všech záložek" = LOKÁLNÍ přepnutí (ne globální printMode). Tisk
  // jednoho subdocu (deník má vlastní tlačítko) tak nepřepne celý strom a
  // neodmountuje jeho data-print-root → jinak by vyšly prázdné stránky.
  const [printAllTabs, setPrintAllTabs] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const noop = () => {};

  // Nejdřív vyrenderuj všechny taby (printAllTabs), pak teprve tiskni.
  useEffect(() => {
    if (printAllTabs) triggerPrint(layoutRef.current);
  }, [printAllTabs, triggerPrint]);
  // Po dotištění (printMode zhasne) vrať PostavaLayout zpět na záložky.
  useEffect(() => {
    if (!printMode) setPrintAllTabs(false);
  }, [printMode]);

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
    // AKJ chráněné záložky — vedle ostatních. Dostupné se renderují přes
    // OstatniLayout, nedostupné „in-fiction" se ukážou zamčené (locked, BE
    // poslal jen jméno+úroveň) — spec-akj-locked-tabs-visible.
    ...sortedAkjTabs(page).map((t) => ({
      id: t.id,
      label: t.name,
      icon: t.locked ? <Lock size={16} /> : <Unlock size={16} />,
    })),
  ];
  const akjTabs = sortedAkjTabs(page);
  const activeAkjTab = akjTabs.find((t) => t.id === activeTab);

  // Auto-switch: pokud PJ schoval aktuální subdoc tab, přesuň se na Profil
  // (render-phase, React doc pattern „Adjusting state when something changes").
  // AKJ záložky vynech — nejsou CharacterTabId a visibleTabs je nezná.
  if (
    activeTab !== 'profil' &&
    !activeAkjTab &&
    !visibleTabs.has(activeTab as CharacterTabId)
  ) {
    setActiveTab('profil');
    setEditMode(false);
  }

  const tabMode = editMode ? 'edit' : 'view';
  const subdocTabActive = activeTab !== 'profil';

  return (
    <div className={s.layout} data-print-scope ref={layoutRef}>
      <PostavaHero
        page={page}
        playerName={playerName}
        canEdit={canEdit && activeTab === 'profil'}
        showEditBtn={subdocTabActive && !activeAkjTab && canEdit}
        editMode={editMode}
        onToggleEdit={requestToggleEdit}
        worldSlug={worldSlug}
      />

      <AkjBanner accessRequirements={page.accessRequirements} />

      {/* 14.7b — tisk záložek postavy/NPC. Kalendář opt-in (default vypnuto). */}
      <div
        className="print-hide"
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: '0.5rem',
        }}
      >
        {character && canSeePrivate && visibleTabs.has('kalendar') && (
          <label
            style={{
              display: 'inline-flex',
              gap: '0.35rem',
              alignItems: 'center',
              fontSize: '0.85rem',
            }}
          >
            <input
              type="checkbox"
              checked={printIncludeCalendar}
              onChange={(e) => setPrintIncludeCalendar(e.target.checked)}
            />
            Přidat kalendář do tisku
          </label>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="print-hide"
          onClick={() => setPrintAllTabs(true)}
          title="Vytisknout / uložit všechny záložky postavy jako PDF"
        >
          <Printer size={16} aria-hidden /> Tisk všech záložek
        </Button>
      </div>

      {printAllTabs ? (
        /* Tisk: všechny záložky lineárně (kromě kalendáře, ten jen opt-in). */
        <div>
          <BioTab page={page} />
          {character && canSeePrivate && (
            <>
              {visibleTabs.has('denik') && (
                <DiaryTab
                  slug={page.slug}
                  mode="view"
                  onExitEdit={noop}
                  onDirtyChange={noop}
                />
              )}
              {visibleTabs.has('finance') && (
                <FinanceTab
                  page={page}
                  mode="view"
                  onExitEdit={noop}
                  onDirtyChange={noop}
                  onBackToProfil={noop}
                />
              )}
              {visibleTabs.has('vybava') && (
                <InventoryTab
                  page={page}
                  mode="view"
                  onExitEdit={noop}
                  onDirtyChange={noop}
                  canEdit={false}
                />
              )}
              {visibleTabs.has('poznamky') && (
                <NotesTab
                  slug={page.slug}
                  mode="view"
                  onExitEdit={noop}
                  onDirtyChange={noop}
                />
              )}
              {printIncludeCalendar && visibleTabs.has('kalendar') && (
                <CalendarTab
                  slug={page.slug}
                  mode="view"
                  onExitEdit={noop}
                  onDirtyChange={noop}
                />
              )}
            </>
          )}
          {sortedAkjTabs(page)
            .filter((t) => !t.locked)
            .map((t) => (
              <OstatniLayout key={t.id} page={resolveAkjTabPage(page, t)} />
            ))}
        </div>
      ) : (
        <Tabs
          items={tabs}
          activeId={activeTab}
          onChange={requestTabChange}
          orientation="horizontal"
        >
          {activeTab === 'profil' && <BioTab page={page} />}

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

          {activeAkjTab &&
            (activeAkjTab.locked ? (
              <AkjLockedPanel
                worldId={worldId}
                accessRequirements={activeAkjTab.access}
                isWoodWide={page.isWoodWide}
              />
            ) : (
              <OstatniLayout page={resolveAkjTabPage(page, activeAkjTab)} />
            ))}
        </Tabs>
      )}

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
  playerName,
  canEdit,
  showEditBtn,
  editMode,
  onToggleEdit,
  worldSlug,
}: {
  page: Page;
  playerName?: string;
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
          style={getImageStyle(
            page.imageFocalX,
            page.imageFocalY,
            page.imageZoom,
            page.imageFit,
          )}
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
            Hraje:{' '}
            <span className={s.ownerName}>
              {playerName ?? 'Neznámý hráč'}
            </span>
          </p>
        )}
      </div>
      <div className={`${s.heroActions} print-hide`}>
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
