import { useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { MapPin, CalendarDays } from 'lucide-react';
import { Tabs, type TabItem, ConfirmDialog } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { CalendarTab } from '../../CharacterDetailPage/components/CalendarTab';
import { useCharacter } from '../../api/useCharacter';
import { OstatniLayout } from './OstatniLayout';
import type { Page } from '../../api/pages.types';
import s from './LokaceLayout.module.css';

type PendingNav = { type: 'tab'; id: string } | { type: 'exit' };

/**
 * Spec 9.2 — Layout pro Page typu `Lokace`. Dva taby:
 *   • Profil — `OstatniLayout` (content + sidebar + AutoTOC + AKJ banner)
 *   • Kalendář — `CalendarTab` (z Character entity přes `characterRef.characterId`)
 *
 * Edit mode (Kalendář) je k dispozici jen pro `WorldRole >= PomocnyPJ`
 * (Lokace nemá owner). Dirty-guard blokuje navigaci s neuloženými změnami.
 *
 * Fallback: pokud Page nemá `characterRef` (legacy Lokace pre-MIG 9.2),
 * tab Kalendář skryjeme a renderujeme jen `OstatniLayout` jako dřív —
 * žádné prázdné taby, žádné FE crashe.
 */
export function LokaceLayout({ page }: { page: Page }) {
  const { worldId, userRole } = useWorldContext();
  const canEdit = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  // Character existuje jen pro Lokace po migraci 9.2 (auto-create v PagesService).
  // Slug Character = slug Page (sjednoceno 9.1).
  const { data: character } = useCharacter(
    worldId,
    page.characterRef ? page.slug : '',
  );

  const [activeTab, setActiveTab] = useState<string>('profil');
  const [editMode, setEditMode] = useState(false);
  const [tabDirty, setTabDirty] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  const blocker = useBlocker(editMode && tabDirty);
  const guardOpen = pendingNav !== null || blocker.state === 'blocked';

  // Legacy fallback — bez characterRef neukazujeme taby vůbec.
  if (!page.characterRef) {
    return <OstatniLayout page={page} />;
  }

  function requestTabChange(id: string) {
    if (id === activeTab) return;
    if (editMode && tabDirty) {
      setPendingNav({ type: 'tab', id });
      return;
    }
    setActiveTab(id);
    if (id === 'profil') setEditMode(false);
  }

  function requestToggleEdit() {
    if (!editMode) {
      setEditMode(true);
      return;
    }
    if (tabDirty) {
      setPendingNav({ type: 'exit' });
      return;
    }
    setEditMode(false);
  }

  function handleExitEdit() {
    setEditMode(false);
    setTabDirty(false);
  }

  function closeGuard() {
    if (blocker.state === 'blocked') blocker.reset();
    setPendingNav(null);
  }

  function confirmGuard() {
    setTabDirty(false);
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

  const tabs: TabItem[] = [
    { id: 'profil', label: 'Profil', icon: <MapPin size={16} /> },
    ...(character
      ? [
          {
            id: 'kalendar',
            label: 'Kalendář',
            icon: <CalendarDays size={16} />,
          },
        ]
      : []),
  ];

  const tabMode = editMode ? 'edit' : 'view';
  const showEditBtn = activeTab === 'kalendar' && canEdit;

  return (
    <div className={s.layout}>
      {showEditBtn && (
        <div className={s.editBar}>
          <button
            type="button"
            className={s.editTabBtn}
            onClick={requestToggleEdit}
            aria-pressed={editMode}
          >
            {editMode ? 'Hotovo' : 'Upravit kalendář'}
          </button>
        </div>
      )}

      <Tabs
        items={tabs}
        activeId={activeTab}
        onChange={requestTabChange}
        orientation="horizontal"
      >
        {activeTab === 'profil' && <OstatniLayout page={page} />}

        {activeTab === 'kalendar' && character && (
          <CalendarTab
            slug={page.slug}
            mode={tabMode}
            onExitEdit={handleExitEdit}
            onDirtyChange={setTabDirty}
          />
        )}
      </Tabs>

      <ConfirmDialog
        open={guardOpen}
        onClose={closeGuard}
        title="Neuložené změny"
        message="Máš rozpracované změny v kalendáři, které nejsou uložené. Pokud budeš pokračovat, změny se zahodí."
        confirmLabel="Zahodit změny"
        cancelLabel="Zůstat"
        confirmVariant="danger"
        onConfirm={confirmGuard}
      />
    </div>
  );
}
