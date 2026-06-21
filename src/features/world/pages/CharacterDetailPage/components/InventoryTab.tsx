import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner, EmptyState } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { usePrintMode } from '@/features/world/export/print';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useCharacterInventory } from '../../api/useCharacterSubdocs';
import { useUpdateCharacterInventory } from '../../api/useCharacterMutations';
import type { CharacterInventory } from '../../api/characters.types';
import type { Page, PageSection } from '../../api/pages.types';
import { EditStickyBar } from './EditStickyBar';
import { EditModeBanner } from './EditModeBanner';
import { SectionListEditor } from './editors/SectionListEditor';
import { SubdocErrorState } from './SubdocErrorState';
import s from './subdocs.module.css';

interface Props {
  page: Page;
  mode: 'view' | 'edit';
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  /** Hráč bez `canEdit` nevidí inline qty stepper ani edit režim. */
  canEdit: boolean;
}

/**
 * 8.1-FIR — Výbava postavy (Matrix-style redesign).
 *
 * View: 2-sloupcový. Main = collapsible sekce (default zavřené, klikem se
 * rozbalí); každý item s inline qty stepperem ⊖ N ⊕ (optimistic save, jen
 * pokud `canEdit`). „Rozepsané" RichText karta dole. Aside = portrait postavy
 * + jméno + „Osobní výbava" + stats (počet sekcí | počet položek).
 *
 * Edit: SectionListEditor pro sekce/items + RichTextEditor pro `notes`.
 */
export function InventoryTab({
  page,
  mode,
  onExitEdit,
  onDirtyChange,
  canEdit,
}: Props) {
  const { worldId } = useWorldContext();
  const { data, isLoading, isError, error, refetch } = useCharacterInventory(
    worldId,
    page.slug,
  );

  if (isLoading) return <Spinner center />;
  if (isError) {
    return (
      <SubdocErrorState
        error={error}
        resourceLabel="výbavu"
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return <Spinner center />;

  if (mode === 'edit') {
    return (
      <InventoryTabEdit
        inventory={data}
        page={page}
        worldId={worldId}
        onExitEdit={onExitEdit}
        onDirtyChange={onDirtyChange}
      />
    );
  }
  return <InventoryTabView page={page} data={data} canEdit={canEdit} />;
}

// ── Aside (sdílené view + edit) ───────────────────────────────────

function InventoryAside({
  page,
  sections,
}: {
  page: Page;
  sections: PageSection[];
}) {
  const totalItems = sections.reduce(
    (acc, sec) =>
      acc + (sec.items?.reduce((c, i) => c + (i.quantity ?? 1), 0) ?? 0),
    0,
  );
  return (
    // V tisku skryté — portrét i jméno už nese hero PostavaLayoutu (jinak by
    // aside vytiskl skoro prázdnou stránku navíc).
    <aside className={`${s.invAside} print-hide`}>
      {page.imageUrl && (
        <div className={s.asidePortraitWrap}>
          <img
            src={page.imageUrl}
            alt={page.title}
            className={s.asidePortrait}
            loading="lazy"
          />
        </div>
      )}
      <h2 className={s.invAsideName}>{page.title || 'Neznámý batoh'}</h2>
      <div className={s.invAsideSubtitle}>Osobní výbava</div>
      <div className={s.invAsideStats}>
        <span>
          <strong>{sections.length}</strong> sekce
        </span>
        <span className={s.invStatsDivider}>|</span>
        <span>
          <strong>{totalItems}</strong> položek
        </span>
      </div>
    </aside>
  );
}

// ── View ───────────────────────────────────────────────────────────

function CollapsibleSection({
  section,
  canEdit,
  onQtyChange,
}: {
  section: PageSection;
  canEdit: boolean;
  onQtyChange: (sectionId: string, itemId: string, diff: number) => void;
}) {
  // Matrix-style: default collapsed, klikem se otevře.
  const [collapsed, setCollapsed] = useState(true);
  // Tisk rozbalí všechny sekce (jinak by obsah nebyl v DOM → nevytiskl se).
  const printMode = usePrintMode();
  const showBody = printMode || !collapsed;
  const totalQty =
    section.items?.reduce((c, i) => c + (i.quantity ?? 1), 0) ?? 0;

  return (
    <div
      className={`${s.invSectionCard} ${collapsed ? s.invSectionCollapsed : ''}`}
    >
      <button
        type="button"
        className={s.invSectionHeader}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className={s.invSectionHeaderLeft}>
          {collapsed ? (
            <ChevronDown size={16} aria-hidden />
          ) : (
            <ChevronUp size={16} aria-hidden />
          )}
          <span className={s.invSectionTitle}>
            {section.title || 'Bez názvu'}
          </span>
        </span>
        <span className={s.invItemCount}>{totalQty} položek</span>
      </button>

      {/* Header je <button> → v tisku se skryje. Nadpis sekce proto duplikujeme
          jako tiskový text (jen v printMode). */}
      {printMode && (
        <h3 className="print-section-title">
          {section.title || 'Bez názvu'}{' '}
          <span className="print-section-meta">— {totalQty} položek</span>
        </h3>
      )}

      {showBody && (
        <div className={s.invSectionBody}>
          {section.content?.trim() && (
            <div className={s.invSectionContent}>
              <RichTextEditor value={section.content} readOnly />
            </div>
          )}
          {!section.items || section.items.length === 0 ? (
            <EmptyState size="inline" title="Sekce je prázdná" />
          ) : (
            <ul className={s.itemList}>
              {section.items.map((item) => (
                <li key={item.id} className={`${s.itemRow} print-row`}>
                  <span className={s.itemText}>{item.text}</span>
                  <span className={s.itemRight}>
                    {item.note && (
                      <span className={s.itemNote}>{item.note}</span>
                    )}
                    {canEdit ? (
                      <span className={s.qtyControl}>
                        <button
                          type="button"
                          className={s.qtyBtn}
                          onClick={() => onQtyChange(section.id, item.id, -1)}
                          aria-label="Ubrat"
                        >
                          −
                        </button>
                        <span className={s.qtyValue}>{item.quantity ?? 1}</span>
                        <button
                          type="button"
                          className={s.qtyBtn}
                          onClick={() => onQtyChange(section.id, item.id, +1)}
                          aria-label="Přidat"
                        >
                          +
                        </button>
                      </span>
                    ) : (
                      <span className={s.itemQty}>×{item.quantity ?? 1}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CollapsibleNotes({ notes }: { notes: string }) {
  const [collapsed, setCollapsed] = useState(true);
  const printMode = usePrintMode();
  const showBody = printMode || !collapsed;
  return (
    <div className={`${s.notesCard} ${collapsed ? s.notesCollapsed : ''}`}>
      <button
        type="button"
        className={s.notesHeader}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className={s.notesTitle}>Rozepsané</span>
        {collapsed ? (
          <ChevronDown size={16} aria-hidden />
        ) : (
          <ChevronUp size={16} aria-hidden />
        )}
      </button>
      {printMode && <h3 className="print-section-title">Rozepsané</h3>}
      {showBody && (
        <div className={s.notesBody}>
          <RichTextEditor value={notes} readOnly />
        </div>
      )}
    </div>
  );
}

function InventoryTabView({
  page,
  data,
  canEdit,
}: {
  page: Page;
  data: CharacterInventory;
  canEdit: boolean;
}) {
  const { worldId } = useWorldContext();
  const mutation = useUpdateCharacterInventory(worldId, page.slug);

  // Derived z props — žádný local stav. TanStack Query invaliduje cache po
  // mutation success (`useUpdateCharacterInventory`), takže nové `data.sections`
  // dorazí samo. Optimistic UX: viz `handleQtyChange`.
  const sections = [...data.sections].sort((a, b) => a.order - b.order);

  /**
   * Qty change — pošleme PATCH s updated `sections[]`. Mutation hook po success
   * invaliduje cache (`useCharacterInventory` query klíč) → komponenta dostane
   * čerstvá data. Latence ~RTT, ale fail-safe — žádný drift mezi UI a serverem.
   */
  function handleQtyChange(sectionId: string, itemId: string, diff: number) {
    const next = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items?.map((it) => {
          if (it.id !== itemId) return it;
          const newQty = Math.max(0, (it.quantity ?? 1) + diff);
          return { ...it, quantity: newQty };
        }),
      };
    });
    mutation.mutate(
      { sections: next },
      {
        onError: () => toast.error('Změna množství se nezdařila'),
      },
    );
  }

  if (sections.length === 0 && !data.notes?.trim()) {
    return (
      <div className={s.invShell}>
        <div className={s.invMain}>
          <p className={s.empty}>Výbava je prázdná.</p>
        </div>
        <InventoryAside page={page} sections={sections} />
      </div>
    );
  }

  return (
    <div className={s.invShell}>
      <div className={s.invMain}>
        {sections.map((section) => (
          <CollapsibleSection
            key={section.id}
            section={section}
            canEdit={canEdit}
            onQtyChange={handleQtyChange}
          />
        ))}
        {data.notes && data.notes.trim() && (
          <CollapsibleNotes notes={data.notes} />
        )}
      </div>
      <InventoryAside page={page} sections={sections} />
    </div>
  );
}

// ── Edit ───────────────────────────────────────────────────────────

interface EditProps {
  inventory: CharacterInventory;
  page: Page;
  worldId: string;
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

function InventoryTabEdit({
  inventory,
  page,
  worldId,
  onExitEdit,
  onDirtyChange,
}: EditProps) {
  const mutation = useUpdateCharacterInventory(worldId, page.slug);

  const [sections, setSections] = useState<PageSection[]>(() =>
    [...inventory.sections].sort((a, b) => a.order - b.order),
  );
  const [notes, setNotes] = useState(inventory.notes ?? '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  function changeSections(next: PageSection[]) {
    setSections(next);
    setDirty(true);
  }

  function handleSave() {
    mutation.mutate(
      { sections, notes },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success('Výbava uložena');
        },
        onError: () => toast.error('Uložení se nezdařilo'),
      },
    );
  }

  return (
    <div className={s.invShell}>
      <div className={s.invMain}>
        <EditModeBanner label="Výbava" />
        <SectionListEditor sections={sections} onChange={changeSections} />
        <section className={s.notesCard}>
          <h2 className={s.notesTitle}>Rozepsané</h2>
          <RichTextEditor
            value={notes}
            onChange={(v) => {
              setNotes(v);
              setDirty(true);
            }}
          />
        </section>
        <EditStickyBar
          dirty={dirty}
          isPending={mutation.isPending}
          onSave={handleSave}
          onCancel={onExitEdit}
        />
      </div>
      <InventoryAside page={page} sections={sections} />
    </div>
  );
}
