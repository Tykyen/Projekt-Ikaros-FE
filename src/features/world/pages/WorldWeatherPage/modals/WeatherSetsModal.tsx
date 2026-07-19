/**
 * 9.4 — Weather Generator Sets Modal.
 *
 * Hlavní UI pro batch-create generátorů přes setové balíčky.
 *
 * ## Taby
 * - **Globální**: 14 FE-static setů (`GLOBAL_SETS`) — read-only, kdokoli může
 *   aplikovat (PJ+). Hráč vidí jen list bez akcí.
 * - **Mé sety**: per-world custom sety z BE (`useGeneratorSets`). PJ+ může
 *   vytvářet z globálních template, mazat, aplikovat.
 *
 * ## Apply flow
 * 1. PJ klikne „Aplikovat" → confirm dialog s počtem generátorů
 * 2. `resolveSetItems(items, customPresets)` → split na resolved + unresolved
 * 3. Pokud unresolved.length > 0 → warning ukáže neresolvable IDs, ale lze
 *    pokračovat (unresolved se přeskočí)
 * 4. Custom set → `useApplyGeneratorSet` (BE batch insert, increment appliedCount)
 * 5. Globální set → loop `useCreateWeatherGenerator` (no BE id, jen FE config)
 * 6. Toast + zavřít modal
 *
 * ## Role gating
 * - Hráč (Hrac+): read-only — vidí jen Globální tab, žádné Apply button
 * - PomocnyPJ+: Apply z Globální + Mé sety, create z globálního template
 * - PJ+: Delete custom set
 *
 * ## MVP rozsah (následuje dluh)
 * - Build-from-scratch wizard (multi-select presetů z wizardu) — vynechán
 * - Save-from-existing generátorů (config snapshot) — vynechán (BE nemá
 *   reverse mapping config→presetId, vyžaduje schema change)
 * - Jediný custom-create flow v MVP: „Použít globální jako šablonu" → editovat
 *   items (rename/remove) → uložit jako custom
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Package,
  Eye,
  EyeOff,
  Play,
  Plus,
  Trash2,
  X,
  Copy,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import {
  Modal,
  Button,
  Input,
  ConfirmDialog,
  Tabs,
  KebabMenu,
  ErrorState,
  type TabItem,
  type KebabMenuItem,
} from '@/shared/ui';
import { type WeatherGeneratorSet } from '@/shared/types';
import {
  GLOBAL_SETS,
  type GlobalSet,
} from '../data/sets';
import { resolveSetItems } from '../data/sets/resolveSetItems';
import {
  useGeneratorSets,
  useCreateGeneratorSet,
  useDeleteGeneratorSet,
  useApplyGeneratorSet,
} from '@/features/world/api/useGeneratorSets';
import { useCustomPresets } from '@/features/world/api/useCustomPresets';
import { useCreateWeatherGenerator } from '@/features/world/api/useWeatherGenerators';
import s from './WeatherSetsModal.module.css';

type TabId = 'global' | 'mine';
type MineSubTab = 'list' | 'create';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  /** Pokud `true`, modal otevřený jen pro čtení (Hrac) — žádné Apply/Edit/Delete. */
  readOnly?: boolean;
}

/** Common shape pro UI list — sjednocuje GlobalSet a WeatherGeneratorSet. */
interface DisplaySet {
  /** Klíč pro key prop + apply identification. */
  uid: string;
  /** Pokud `null` → globální set. */
  beId: string | null;
  name: string;
  description: string;
  emoji: string;
  items: ReadonlyArray<{ presetId: string; generatorName: string; description?: string }>;
  appliedCount: number | null;
  isCustom: boolean;
}

function asDisplayFromGlobal(g: GlobalSet): DisplaySet {
  return {
    uid: `global:${g.id}`,
    beId: null,
    name: g.name,
    description: g.description,
    emoji: g.emoji,
    items: g.items,
    appliedCount: null,
    isCustom: false,
  };
}

function asDisplayFromCustom(g: WeatherGeneratorSet): DisplaySet {
  return {
    uid: `custom:${g.id}`,
    beId: g.id,
    name: g.name,
    description: g.description ?? '',
    emoji: g.emoji ?? '📦',
    items: g.items,
    appliedCount: g.appliedCount,
    isCustom: true,
  };
}

const TABS: TabItem[] = [
  { id: 'global', label: 'Globální' },
  { id: 'mine', label: 'Mé sety' },
];

export function WeatherSetsModal({
  open,
  onClose,
  worldId,
  readOnly = false,
}: Props) {
  // Přístup gate-uje parent (WorldWeatherPage) — modal otevře jen když smí
  // spravovat (PomocnyPJ+ nebo elevated admin); tady stačí `readOnly`.

  const [activeTab, setActiveTab] = useState<TabId>('global');
  const [mineSubTab, setMineSubTab] = useState<MineSubTab>('list');

  // Data
  const setsQuery = useGeneratorSets(worldId);
  const customPresetsQuery = useCustomPresets(worldId);
  const customPresets = useMemo(
    () => customPresetsQuery.data ?? [],
    [customPresetsQuery.data],
  );

  // Mutations
  const applyMut = useApplyGeneratorSet(worldId);
  const createGenMut = useCreateWeatherGenerator(worldId);
  const createSetMut = useCreateGeneratorSet(worldId);
  const deleteSetMut = useDeleteGeneratorSet(worldId);

  // Confirm dialog state
  const [pendingApply, setPendingApply] = useState<DisplaySet | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DisplaySet | null>(null);

  // Preview expand toggle
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  // Create-from-template form state
  const [templateName, setTemplateName] = useState('');
  const [templateEmoji, setTemplateEmoji] = useState('📦');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateItems, setTemplateItems] = useState<
    Array<{ presetId: string; generatorName: string }>
  >([]);
  const [templateNameError, setTemplateNameError] = useState<string | null>(
    null,
  );

  const globalDisplays = useMemo(
    () => GLOBAL_SETS.map(asDisplayFromGlobal),
    [],
  );
  const customDisplays = useMemo(
    () => (setsQuery.data ?? []).map(asDisplayFromCustom),
    [setsQuery.data],
  );

  function togglePreview(uid: string) {
    setExpandedUid((cur) => (cur === uid ? null : uid));
  }

  async function executeApply(set: DisplaySet, force = false) {
    const { resolved, unresolved } = resolveSetItems(
      set.items,
      customPresets,
    );

    if (unresolved.length > 0 && !force) {
      // Stay on confirm — UI shows warning, user must click Apply again
      // to acknowledge (we mutate state.force on next confirm).
      return { needsForce: true, unresolved };
    }

    if (resolved.length === 0) {
      toast.error('Set neobsahuje žádné resolvovatelné presety.');
      return { needsForce: false, unresolved };
    }

    try {
      if (set.isCustom && set.beId) {
        await applyMut.mutateAsync({
          id: set.beId,
          resolvedItems: resolved,
        });
      } else {
        // Globální set → loop create. Sekvenčně, aby BE neměl race na displayOrder.
        for (const item of resolved) {
          await createGenMut.mutateAsync({
            name: item.name,
            description: item.description,
            config: item.config,
          });
        }
      }
      const skipped = unresolved.length > 0
        ? ` (${unresolved.length} přeskočeno)`
        : '';
      toast.success(
        `Vytvořeno ${resolved.length} generátorů z setu „${set.name}"${skipped}.`,
      );
      setPendingApply(null);
      onClose();
    } catch {
      toast.error('Vytvoření generátorů ze setu selhalo.');
    }
    return { needsForce: false, unresolved };
  }

  function handleStartApply(set: DisplaySet) {
    setPendingApply(set);
  }

  async function handleConfirmApply() {
    if (!pendingApply) return;
    const result = await executeApply(pendingApply, false);
    if (result.needsForce) {
      // Stay open — confirm dialog re-renders with warning, second click forces.
      setPendingApply({ ...pendingApply, __force: true } as DisplaySet & {
        __force: true;
      });
    }
  }

  async function handleConfirmApplyForced() {
    if (!pendingApply) return;
    await executeApply(pendingApply, true);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete?.beId) return;
    try {
      await deleteSetMut.mutateAsync(pendingDelete.beId);
      toast.success(`Set „${pendingDelete.name}" smazán.`);
      setPendingDelete(null);
    } catch {
      toast.error('Smazání selhalo.');
    }
  }

  function handleStartCreateFromTemplate(global: GlobalSet) {
    setTemplateName(`${global.name} (kopie)`);
    setTemplateEmoji(global.emoji);
    setTemplateDescription(global.description);
    setTemplateItems(
      global.items.map((it) => ({
        presetId: it.presetId,
        generatorName: it.generatorName,
      })),
    );
    setMineSubTab('create');
    setActiveTab('mine');
  }

  function handleStartBlankCreate() {
    setTemplateName('');
    setTemplateEmoji('📦');
    setTemplateDescription('');
    setTemplateItems([]);
    setMineSubTab('create');
  }

  async function handleSaveTemplate() {
    const trimmed = templateName.trim();
    if (!trimmed) {
      setTemplateNameError('Zadej název setu.');
      return;
    }
    if (trimmed.length > 80) {
      setTemplateNameError('Název je příliš dlouhý (max 80).');
      return;
    }
    if (templateItems.length === 0) {
      setTemplateNameError(
        'Set musí obsahovat alespoň 1 položku. Použij globální šablonu.',
      );
      return;
    }
    setTemplateNameError(null);
    try {
      await createSetMut.mutateAsync({
        name: trimmed,
        description: templateDescription.trim() || undefined,
        emoji: templateEmoji.trim() || undefined,
        items: templateItems
          .filter((it) => it.generatorName.trim().length > 0)
          .map((it) => ({
            presetId: it.presetId,
            generatorName: it.generatorName.trim(),
          })),
      });
      toast.success('Set uložen do „Mé sety".');
      setMineSubTab('list');
      setTemplateName('');
      setTemplateEmoji('📦');
      setTemplateDescription('');
      setTemplateItems([]);
    } catch {
      toast.error('Uložení setu selhalo.');
    }
  }

  const canManage = !readOnly; // parent otevírá modal jen pokud uživatel smí spravovat
  const canDelete = !readOnly; // PJ+ — parent musí přepnout readOnly nebo nesvázat delete (TODO: jemnější role flag).

  const pendingApplyForce = (pendingApply as (DisplaySet & { __force?: true }) | null)?.__force === true;
  const pendingApplyResolved = useMemo(() => {
    if (!pendingApply) return null;
    return resolveSetItems(pendingApply.items, customPresets);
  }, [pendingApply, customPresets]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Sety generátorů počasí"
        size="xl"
        footer={
          <Button variant="ghost" onClick={onClose}>
            Zavřít
          </Button>
        }
      >
        <Tabs
          items={TABS}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
          orientation="horizontal"
        >
          {activeTab === 'global' && (
            <div className={s.tabPanel} data-testid="sets-tab-global">
              <p className={s.headerHint}>
                Předpřipravené balíčky generátorů — 1 klik = vytvoří{' '}
                <strong>N regionů</strong> najednou. Vyber set a klikni
                „Aplikovat".
              </p>
              <div className={s.grid}>
                {globalDisplays.map((set) => (
                  <SetCard
                    key={set.uid}
                    set={set}
                    expanded={expandedUid === set.uid}
                    onTogglePreview={() => togglePreview(set.uid)}
                    onApply={
                      canManage ? () => handleStartApply(set) : undefined
                    }
                    onUseAsTemplate={
                      canManage
                        ? () => {
                            const global = GLOBAL_SETS.find(
                              (g) => `global:${g.id}` === set.uid,
                            );
                            if (global) handleStartCreateFromTemplate(global);
                          }
                        : undefined
                    }
                    onDelete={undefined}
                    onEdit={undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'mine' && (
            <div className={s.tabPanel} data-testid="sets-tab-mine">
              {!readOnly && (
                <div className={s.subTabBar}>
                  <button
                    type="button"
                    className={s.subTabBtn}
                    data-active={mineSubTab === 'list'}
                    onClick={() => setMineSubTab('list')}
                  >
                    Moje sety ({customDisplays.length})
                  </button>
                  <button
                    type="button"
                    className={s.subTabBtn}
                    data-active={mineSubTab === 'create'}
                    onClick={handleStartBlankCreate}
                  >
                    <Plus
                      size={12}
                      aria-hidden="true"
                      style={{ marginRight: 4 }}
                    />
                    Nový set
                  </button>
                </div>
              )}

              {mineSubTab === 'list' && setsQuery.isError && (
                <div className={s.emptyState}>
                  <ErrorState
                    size="panel"
                    title="Vlastní sety se nepodařilo načíst"
                    description="Neznamená to, že žádné nemáš. Zkus to prosím znovu."
                    onRetry={() => void setsQuery.refetch()}
                  />
                </div>
              )}

              {mineSubTab === 'list' &&
                !setsQuery.isError &&
                customDisplays.length === 0 && (
                <div className={s.emptyState} data-testid="sets-mine-empty">
                  <Package
                    size={48}
                    aria-hidden="true"
                    style={{ opacity: 0.6 }}
                  />
                  <h3 className={s.emptyTitle}>Zatím žádný vlastní set</h3>
                  <p className={s.emptyText}>
                    Vlastní sety si vytvoříš zkopírováním globální šablony
                    nebo prázdnou novou (musí mít alespoň 1 položku z globální
                    šablony). Vlastní sety jsou per-svět — viditelné jen tady.
                  </p>
                  {canManage && (
                    <Button
                      variant="primary"
                      onClick={() => setActiveTab('global')}
                    >
                      <Copy size={14} aria-hidden="true" />
                      <span>Vybrat globální šablonu</span>
                    </Button>
                  )}
                </div>
              )}

              {mineSubTab === 'list' && customDisplays.length > 0 && (
                <div className={s.grid}>
                  {customDisplays.map((set) => (
                    <SetCard
                      key={set.uid}
                      set={set}
                      expanded={expandedUid === set.uid}
                      onTogglePreview={() => togglePreview(set.uid)}
                      onApply={
                        canManage ? () => handleStartApply(set) : undefined
                      }
                      onUseAsTemplate={undefined}
                      onDelete={
                        canDelete ? () => setPendingDelete(set) : undefined
                      }
                      onEdit={undefined}
                    />
                  ))}
                </div>
              )}

              {mineSubTab === 'create' && canManage && (
                <CreateSetForm
                  name={templateName}
                  emoji={templateEmoji}
                  description={templateDescription}
                  items={templateItems}
                  nameError={templateNameError}
                  pending={createSetMut.isPending}
                  onNameChange={(v) => {
                    setTemplateName(v);
                    if (templateNameError) setTemplateNameError(null);
                  }}
                  onEmojiChange={setTemplateEmoji}
                  onDescriptionChange={setTemplateDescription}
                  onItemsChange={setTemplateItems}
                  onCancel={() => setMineSubTab('list')}
                  onSave={() => void handleSaveTemplate()}
                />
              )}
            </div>
          )}
        </Tabs>
      </Modal>

      {/* Apply confirm */}
      <ConfirmDialog
        open={!!pendingApply}
        onClose={() => setPendingApply(null)}
        title={`Aplikovat set „${pendingApply?.name ?? ''}"?`}
        message={
          <ApplyConfirmMessage
            set={pendingApply}
            resolved={pendingApplyResolved}
            showUnresolvedWarning={pendingApplyForce}
          />
        }
        confirmLabel={
          pendingApplyForce
            ? `Pokračovat (přeskočit ${pendingApplyResolved?.unresolved.length ?? 0})`
            : 'Aplikovat'
        }
        confirmVariant={pendingApplyForce ? 'danger' : 'primary'}
        isPending={applyMut.isPending || createGenMut.isPending}
        onConfirm={
          pendingApplyForce
            ? () => void handleConfirmApplyForced()
            : () => void handleConfirmApply()
        }
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Smazat set?"
        message={`Set „${pendingDelete?.name ?? ''}" bude trvale smazán. Generátory, které z něj byly vytvořeny, zůstanou.`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteSetMut.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}

// ── SetCard ───────────────────────────────────────────────────────────

interface SetCardProps {
  set: DisplaySet;
  expanded: boolean;
  onTogglePreview: () => void;
  onApply?: () => void;
  onUseAsTemplate?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

function SetCard({
  set,
  expanded,
  onTogglePreview,
  onApply,
  onUseAsTemplate,
  onDelete,
  onEdit,
}: SetCardProps) {
  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
    null,
  );
  const [kebabOpen, setKebabOpen] = useState(false);

  const kebabItems: KebabMenuItem[] = [];
  if (onEdit) {
    kebabItems.push({
      key: 'edit',
      label: 'Upravit',
      onClick: () => {
        setKebabOpen(false);
        onEdit();
      },
    });
  }
  if (onDelete) {
    kebabItems.push({
      key: 'delete',
      label: 'Smazat set',
      variant: 'danger',
      icon: <Trash2 size={14} aria-hidden="true" />,
      onClick: () => {
        setKebabOpen(false);
        onDelete();
      },
    });
  }

  return (
    <article
      className={s.card}
      data-testid={`sets-card-${set.uid}`}
    >
      {kebabItems.length > 0 && (
        <div className={s.kebabSlot}>
          <button
            ref={setKebabAnchor}
            type="button"
            className={s.kebabBtn}
            aria-label="Akce setu"
            aria-haspopup="menu"
            aria-expanded={kebabOpen}
            onClick={() => setKebabOpen((v) => !v)}
          >
            <MoreVertical size={16} aria-hidden="true" />
          </button>
          <KebabMenu
            anchor={kebabAnchor}
            open={kebabOpen}
            onClose={() => setKebabOpen(false)}
            items={kebabItems}
          />
        </div>
      )}
      <div className={s.cardHead}>
        <span className={s.glyph} aria-hidden="true">
          {set.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className={s.cardTitle}>{set.name}</h3>
          <div className={s.cardMeta}>
            {set.items.length} generátorů
            {set.appliedCount !== null && set.appliedCount > 0 && (
              <span className={s.usageBadge}>
                Použito {set.appliedCount}×
              </span>
            )}
          </div>
        </div>
      </div>
      <p className={s.cardDesc}>{set.description}</p>

      {expanded && (
        <ul className={s.previewList} aria-label="Položky setu">
          {set.items.map((it, idx) => (
            <li
              key={`${it.presetId}-${idx}`}
              className={s.previewItem}
            >
              <strong>{it.generatorName}</strong>
              <code>{it.presetId}</code>
            </li>
          ))}
        </ul>
      )}

      <div className={s.cardActions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePreview}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <EyeOff size={14} aria-hidden="true" /> Skrýt
            </>
          ) : (
            <>
              <Eye size={14} aria-hidden="true" /> Náhled
            </>
          )}
        </Button>
        {onApply && (
          <Button size="sm" onClick={onApply}>
            <Play size={14} aria-hidden="true" /> Aplikovat
          </Button>
        )}
        {onUseAsTemplate && (
          <Button variant="ghost" size="sm" onClick={onUseAsTemplate}>
            <Copy size={14} aria-hidden="true" /> Šablona
          </Button>
        )}
      </div>
    </article>
  );
}

// ── ApplyConfirmMessage ───────────────────────────────────────────────

interface ApplyConfirmMessageProps {
  set: DisplaySet | null;
  resolved: ReturnType<typeof resolveSetItems> | null;
  showUnresolvedWarning: boolean;
}

function ApplyConfirmMessage({
  set,
  resolved,
  showUnresolvedWarning,
}: ApplyConfirmMessageProps) {
  if (!set || !resolved) return null;
  const willCreate = showUnresolvedWarning
    ? resolved.resolved.length
    : set.items.length;
  return (
    <div>
      <p>
        Vytvoříš <strong>{willCreate}</strong>{' '}
        {willCreate === 1
          ? 'generátor'
          : willCreate < 5
            ? 'generátory'
            : 'generátorů'}{' '}
        ve světě. Tuto akci nelze automaticky vrátit (museli bys generátory
        smazat ručně).
      </p>
      {resolved.unresolved.length > 0 && (
        <div className={s.warning} role="alert">
          <strong>
            <AlertTriangle
              size={14}
              aria-hidden="true"
              style={{ verticalAlign: 'middle', marginRight: 4 }}
            />
            Upozornění:
          </strong>{' '}
          {resolved.unresolved.length}{' '}
          {resolved.unresolved.length === 1
            ? 'položka setu'
            : 'položek setu'}{' '}
          nemá resolvovatelný preset (např. smazaný custom preset). Při potvrzení
          se přeskočí.
          <ul>
            {resolved.unresolved.slice(0, 5).map((id) => (
              <li key={id}>
                <code>{id}</code>
              </li>
            ))}
            {resolved.unresolved.length > 5 && (
              <li>… a {resolved.unresolved.length - 5} dalších</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── CreateSetForm ─────────────────────────────────────────────────────

interface CreateSetFormProps {
  name: string;
  emoji: string;
  description: string;
  items: Array<{ presetId: string; generatorName: string }>;
  nameError: string | null;
  pending: boolean;
  onNameChange: (v: string) => void;
  onEmojiChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onItemsChange: (
    items: Array<{ presetId: string; generatorName: string }>,
  ) => void;
  onCancel: () => void;
  onSave: () => void;
}

function CreateSetForm({
  name,
  emoji,
  description,
  items,
  nameError,
  pending,
  onNameChange,
  onEmojiChange,
  onDescriptionChange,
  onItemsChange,
  onCancel,
  onSave,
}: CreateSetFormProps) {
  return (
    <div className={s.createForm} data-testid="sets-create-form">
      <div className={s.createHead}>
        <strong>Vytvořit vlastní set</strong>
        <button
          type="button"
          className={s.kebabBtn}
          onClick={onCancel}
          aria-label="Zrušit"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <p className={s.createFormHint}>
        Položky se přidávají zkopírováním z globální šablony — vrať se na
        „Globální" tab, klikni „Šablona" na vybraný set a vrátí tě sem s
        položkami. Pak můžeš jednotlivé generátory přejmenovat nebo odebrat.
      </p>

      <div className={s.createFormRow}>
        <Input
          label="Název setu"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={80}
          error={nameError ?? undefined}
          placeholder="Např. Můj evropský tour"
        />
        <Input
          label="Ikona (emoji)"
          value={emoji}
          onChange={(e) => onEmojiChange(e.target.value)}
          maxLength={8}
        />
      </div>

      <Input
        label="Popisek"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        maxLength={500}
        placeholder="Krátký kontext setu…"
      />

      {items.length === 0 ? (
        <p className={s.createFormHint}>
          Set zatím nemá žádné položky. Použij „Šablona" na nějakém globálním
          setu.
        </p>
      ) : (
        <ul className={s.createItemsList}>
          {items.map((it, idx) => (
            <li
              key={`${it.presetId}-${idx}`}
              className={s.createItemRow}
            >
              <input
                type="text"
                className={s.smallInput}
                value={it.generatorName}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...it, generatorName: e.target.value };
                  onItemsChange(next);
                }}
                placeholder="Název generátoru"
                aria-label={`Název generátoru ${idx + 1}`}
              />
              <code style={{ fontSize: 11, opacity: 0.7 }}>{it.presetId}</code>
              <button
                type="button"
                className={s.iconBtn}
                onClick={() =>
                  onItemsChange(items.filter((_, i) => i !== idx))
                }
                aria-label="Odebrat položku"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={s.createActions}>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Zrušit
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          loading={pending}
          disabled={items.length === 0}
        >
          Uložit set
        </Button>
      </div>
    </div>
  );
}
