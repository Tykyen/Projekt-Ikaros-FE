import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Spinner, Button, Modal, ConfirmDialog, Badge } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { PrintButton } from '@/features/world/export/print';
import { parseApiError } from '@/shared/api';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useCharacterDiary } from '../../api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '../../api/useCharacterMutations';
import type {
  CustomDiaryBlock,
  CharacterDiary,
} from '../../api/characters.types';
import type { PageSection } from '../../api/pages.types';
import {
  useActiveDiarySchema,
  useUpdatePersonalDiarySchema,
  useResetPersonalDiarySchema,
} from '../../WorldDiarySchemaEditorPage/api/useDiarySchema';
import { DiarySchemaEditor } from '../../WorldDiarySchemaEditorPage/components/DiarySchemaEditor';
import {
  flattenSchemaBlock,
  nestCustomBlock,
} from '../../WorldDiarySchemaEditorPage/utils/schemaMappers';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import { DiarySystemProvider } from '../diary-systems/DiarySystemProvider';
import { useDiarySystem } from '../diary-systems/DiarySystemContext';
import { EditStickyBar } from './EditStickyBar';
import { EditModeBanner } from './EditModeBanner';
import { SectionListEditor } from './editors/SectionListEditor';
import { SchemaValueEditor } from './editors/SchemaValueEditor';
import { DiaryBlockView } from './DiaryBlockView';
import s from './DiaryTab.module.css';
import ed from './editors/editors.module.css';

interface Props {
  slug: string;
  mode: 'view' | 'edit';
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  /**
   * 10.2c-edit-9g — optional roll handler. Pokud DiaryTab je embeddovaný
   * v tactical-map TokenInfoPanel, konzument provrahuje callback. Per-system
   * sheets (MatrixSheet, ...) ukáží klikatelné rolly. CharacterDetailPage
   * default = undefined → žádné rolly.
   */
  onRoll?: import('../diary-systems/types').SystemSheetProps['onRoll'];
}

/**
 * 8.1b — Deník postavy. View: dynamické bloky + sekce; Edit: úprava hodnot
 * bloků a sekcí. 8.5 přidává:
 *   - fallback na svět-level schéma, pokud postava nemá `personalDiarySchema`
 *   - akce „Vlastní šablona" / „Vrátit ke světové" / „Upravit šablonu"
 *   - inline editor schématu přes Modal (sdílená komponenta `DiarySchemaEditor`)
 */
export function DiaryTab({ slug, mode, onExitEdit, onDirtyChange, onRoll }: Props) {
  const { worldId, worldSlug, world } = useWorldContext();
  const { data: diary, isLoading, isError } = useCharacterDiary(worldId, slug);
  const activeWorldSchema = useActiveDiarySchema(worldId);

  if (isLoading) return <Spinner center />;
  if (isError || !diary) {
    return <p className={s.empty}>Deník se nepodařilo načíst.</p>;
  }

  // 8.5 fallback: bez personal override → svět-level aktivní schéma.
  const effectiveBlocks: CustomDiaryBlock[] = (
    diary.personalDiarySchema ??
    activeWorldSchema.data?.schema.map(flattenSchemaBlock) ??
    []
  ).slice();

  // 8.7a — Provider obalí oba módy. `world.system` určuje preset
  // (dedikovaný sheet vs generic block view). Pokud world ještě
  // neloaded, fallback `undefined` → `generic` preset.
  return (
    <DiarySystemProvider system={world?.system}>
      {mode === 'edit' ? (
        <DiaryTabEdit
          diary={diary}
          worldId={worldId}
          worldSlug={worldSlug}
          slug={slug}
          effectiveBlocks={effectiveBlocks}
          isOverride={diary.personalDiarySchema != null}
          onExitEdit={onExitEdit}
          onDirtyChange={onDirtyChange}
          onRoll={onRoll}
        />
      ) : (
        <div data-print-scope>
          <div className="print-hide" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PrintButton title="Vytisknout / uložit deník jako PDF" />
          </div>
          <DiaryTabView
            diary={diary}
            worldId={worldId}
            worldSlug={worldSlug}
            characterSlug={slug}
            effectiveBlocks={effectiveBlocks}
            onRoll={onRoll}
          />
        </div>
      )}
    </DiarySystemProvider>
  );
}

// ── View ───────────────────────────────────────────────────────────

function DiaryTabView({
  diary,
  worldId,
  worldSlug,
  characterSlug,
  effectiveBlocks,
  onRoll,
}: {
  diary: CharacterDiary;
  worldId: string;
  worldSlug: string;
  characterSlug: string;
  effectiveBlocks: CustomDiaryBlock[];
  onRoll?: Props['onRoll'];
}) {
  const { preset } = useDiarySystem();

  // 8.7a — dedikovaný sheet má přednost před generic blockovým view.
  // Sections (Zápisky) se renderují vždy pod sheetem, nezávisle na presetu.
  const sections = [...(diary.sections ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  if (preset.SystemSheet) {
    const SystemSheet = preset.SystemSheet;
    return (
      <div className={s.wrap}>
        <SystemSheet
          diary={diary}
          mode="view"
          worldId={worldId}
          worldSlug={worldSlug}
          characterSlug={characterSlug}
          onRoll={onRoll}
        />
        {sections.map((section) => (
          <DiarySectionView key={section.id} section={section} />
        ))}
      </div>
    );
  }

  // Generic flow — současný blockový view.
  const blocks = [...effectiveBlocks].sort((a, b) => a.order - b.order);

  if (blocks.length === 0 && sections.length === 0) {
    return <p className={s.empty}>Deník je zatím prázdný.</p>;
  }

  return (
    <div className={s.wrap}>
      {blocks.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Atributy</h2>
          {/* `print-cols` = stabilní tisková třída: CSS-module grid v tisku
              nestyluje (hash), tahle drží mřížku i v tiskovém okně (printDoc.css). */}
          <div className={`${s.blockGrid} print-cols`}>
            {blocks.map((block) => (
              <DiaryBlockView
                key={block.id}
                block={block}
                value={diary.customData?.[block.id]}
              />
            ))}
          </div>
        </section>
      )}

      {sections.map((section) => (
        <DiarySectionView key={section.id} section={section} />
      ))}
    </div>
  );
}

function DiarySectionView({ section }: { section: PageSection }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{section.title || 'Bez názvu'}</h2>
      {section.content.trim() && (
        <RichTextEditor value={section.content} readOnly className={s.entry} />
      )}
      {section.items.length > 0 && (
        <ul className={s.itemList}>
          {section.items.map((it) => (
            <li key={it.id} className={s.item}>
              <span>{it.text}</span>
              {it.quantity !== undefined && (
                <span className={s.itemQty}>×{it.quantity}</span>
              )}
              {it.note && <span className={s.itemNote}>{it.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Edit ───────────────────────────────────────────────────────────

interface EditProps {
  diary: CharacterDiary;
  worldId: string;
  worldSlug: string;
  slug: string;
  effectiveBlocks: CustomDiaryBlock[];
  isOverride: boolean;
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onRoll?: Props['onRoll'];
}

function DiaryTabEdit({
  diary,
  worldId,
  worldSlug,
  slug,
  effectiveBlocks,
  isOverride,
  onExitEdit,
  onDirtyChange,
  onRoll,
}: EditProps) {
  const { preset } = useDiarySystem();
  const SystemSheet = preset.SystemSheet;
  const isDedicated = Boolean(SystemSheet);

  const mutation = useUpdateCharacterDiary(worldId, slug);
  const updateSchemaMut = useUpdatePersonalDiarySchema(worldId, slug);
  const resetSchemaMut = useResetPersonalDiarySchema(worldId, slug);

  const [sections, setSections] = useState<PageSection[]>(() =>
    [...(diary.sections ?? [])].sort((a, b) => a.order - b.order),
  );
  // 2026-05-24 (D-040-followup) — držíme jen PATCH (změny od edit start),
  // ne celé customData. Při switchi system presetu v jiném prohlížeči /
  // jiném tabu jiný uživatel může přepsat keys; tímto designem se omezí
  // střety na jen reálně editovaný subset.
  // Renderovaná hodnota = `diary.customData ⊕ patch` (merge na display).
  const [customDataPatch, setCustomDataPatch] = useState<
    Record<string, unknown>
  >({});
  const displayCustomData = useMemo<Record<string, unknown>>(
    () => ({ ...(diary.customData ?? {}), ...customDataPatch }),
    [diary.customData, customDataPatch],
  );
  const [dirty, setDirty] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [confirmEnable, setConfirmEnable] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const blocks = useMemo(
    () => [...effectiveBlocks].sort((a, b) => a.order - b.order),
    [effectiveBlocks],
  );

  function changeSections(next: PageSection[]) {
    setSections(next);
    setDirty(true);
  }

  function changeBlockValue(blockId: string, value: unknown) {
    setCustomDataPatch((p) => ({ ...p, [blockId]: value }));
    setDirty(true);
  }

  function handleSave() {
    // D-040-followup: posíláme jen patch (delta), ne celý customData.
    // Prázdný patch je no-op pro customData; sections projdou vždy.
    mutation.mutate(
      {
        sections,
        ...(Object.keys(customDataPatch).length > 0
          ? { customDataPatch }
          : {}),
      },
      {
        onSuccess: () => {
          setDirty(false);
          setCustomDataPatch({}); // po úspěšném save vynulujeme patch — base z BE má novou pravdu
          toast.success('Deník uložen');
        },
        onError: (err) => toast.error(parseApiError(err)),
      },
    );
  }

  function handleEnableOverride() {
    setConfirmEnable(false);
    updateSchemaMut.mutate(effectiveBlocks, {
      onSuccess: () => {
        toast.success('Vlastní šablona aktivována');
        setSchemaModalOpen(true);
      },
      onError: (err) => toast.error(parseApiError(err)),
    });
  }

  function handleResetOverride() {
    setConfirmReset(false);
    resetSchemaMut.mutate(undefined, {
      onSuccess: () =>
        toast.success('Vlastní šablona zrušena. Deník používá šablonu světa.'),
      onError: (err) => toast.error(parseApiError(err)),
    });
  }

  return (
    <div className={s.wrap}>
      <EditModeBanner label="Deník" />

      {/* 8.5/8.7a — sekce „Šablona deníku". Pro dedikovaný systém
          je editor schématu skrytý a místo něj se zobrazí info, že
          šablonu určuje herní systém (viz [[feedback-theme-isolation]]). */}
      <section className={s.section}>
        <div className={s.schemaActionRow}>
          {isDedicated ? (
            <>
              <Badge>📖 {preset.name}</Badge>
              <span className={s.schemaHint}>
                Šablonu deníku určuje herní systém. Vlastní editor
                schématu se pro tento systém nepoužívá.
              </span>
            </>
          ) : isOverride ? (
            <>
              <Badge>🔓 Vlastní šablona aktivní</Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSchemaModalOpen(true)}
              >
                ✏️ Upravit šablonu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmReset(true)}
              >
                ↺ Vrátit ke světové
              </Button>
            </>
          ) : (
            <>
              <span className={s.schemaHint}>
                Postava používá šablonu deníku světa.
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmEnable(true)}
              >
                ✏️ Vlastní šablona
              </Button>
            </>
          )}
        </div>
      </section>

      {/* 8.7a — pro dedikovaný systém renderujeme custom sheet místo
          generic blockového editoru. Sheet edituje `customData` přes
          `onChange`, my pak držíme dirty state a saveujem mutací. */}
      {SystemSheet ? (
        <SystemSheet
          diary={{ ...diary, customData: displayCustomData }}
          mode="edit"
          worldId={worldId}
          worldSlug={worldSlug}
          characterSlug={slug}
          onRoll={onRoll}
          onChange={(next) => {
            // D-040-followup: preferujeme customDataPatch (delta). Pokud sheet
            // stále posílá customData (legacy custom kód), merge ho jako patch
            // — neztratí se data jiných presetů jako dřív.
            if ('customDataPatch' in next) {
              setCustomDataPatch((p) => ({ ...p, ...next.customDataPatch }));
            } else {
              setCustomDataPatch((p) => ({ ...p, ...next.customData }));
            }
            setDirty(true);
          }}
        />
      ) : blocks.length > 0 ? (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Atributy</h2>
          <div className={ed.grid}>
            {blocks.map((block) => (
              <SchemaValueEditor
                key={block.id}
                type={block.type}
                label={block.label}
                value={displayCustomData[block.id]}
                maxValue={block.maxValue}
                minValue={block.minValue}
                defaultImageUrl={block.imageUrl}
                onChange={(value) => changeBlockValue(block.id, value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Zápisky</h2>
        <SectionListEditor sections={sections} onChange={changeSections} />
      </section>

      <EditStickyBar
        dirty={dirty}
        isPending={mutation.isPending}
        onSave={handleSave}
        onCancel={onExitEdit}
      />

      {/* 8.7a — schema editor a override potvrzení jen pro generic systém. */}
      {!isDedicated && (
        <>
          <DiarySchemaEditorModal
            open={schemaModalOpen}
            initial={diary.personalDiarySchema ?? effectiveBlocks}
            onSave={(next) => {
              updateSchemaMut.mutate(next, {
                onSuccess: () => {
                  setSchemaModalOpen(false);
                  toast.success('Šablona postavy uložena');
                },
                onError: (err) => toast.error(parseApiError(err)),
              });
            }}
            onClose={() => setSchemaModalOpen(false)}
            isPending={updateSchemaMut.isPending}
          />

          <ConfirmDialog
            open={confirmEnable}
            title="Aktivovat vlastní šablonu deníku?"
            message="Zkopíruje aktuální šablonu světa do této postavy. Postava poté nebude reagovat na změny šablony světa, dokud override nezrušíš."
            confirmLabel="Aktivovat"
            onConfirm={handleEnableOverride}
            onClose={() => setConfirmEnable(false)}
            isPending={updateSchemaMut.isPending}
          />

          <ConfirmDialog
            open={confirmReset}
            title="Vrátit ke šabloně světa?"
            message="Smaže vlastní šablonu této postavy. Deník začne používat šablonu světa. Hodnoty mimo svět-level schéma se ztratí."
            confirmLabel="Vrátit"
            confirmVariant="danger"
            onConfirm={handleResetOverride}
            onClose={() => setConfirmReset(false)}
            isPending={resetSchemaMut.isPending}
          />
        </>
      )}
    </div>
  );
}

// ── DiarySchemaEditorModal ─────────────────────────────────────────

interface ModalProps {
  open: boolean;
  initial: CustomDiaryBlock[];
  onSave: (next: CustomDiaryBlock[]) => void;
  onClose: () => void;
  isPending?: boolean;
}

function DiarySchemaEditorModal({
  open,
  initial,
  onSave,
  onClose,
  isPending,
}: ModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vlastní šablona deníku"
      size="lg"
      footer={null}
    >
      {open && (
        // key=open + délka pole = remount při změně initialu (nového otevření)
        <ModalBody
          key={`${initial.length}-${initial[0]?.id ?? 'empty'}`}
          initial={initial}
          onSave={onSave}
          onClose={onClose}
          isPending={isPending}
        />
      )}
    </Modal>
  );
}

function ModalBody({
  initial,
  onSave,
  onClose,
  isPending,
}: {
  initial: CustomDiaryBlock[];
  onSave: (next: CustomDiaryBlock[]) => void;
  onClose: () => void;
  isPending?: boolean;
}) {
  // Initial je v CustomDiaryBlock tvaru — uvnitř editoru pracujeme se
  // `DiarySchemaBlock` (nested config). Lazy init z mapperu.
  const [draft, setDraft] = useState<DiarySchemaBlock[]>(() =>
    initial.map(nestCustomBlock),
  );

  function handleSave() {
    const flat: CustomDiaryBlock[] = draft.map(flattenSchemaBlock);
    onSave(flat);
  }

  return (
    <>
      <DiarySchemaEditor
        value={draft}
        onChange={setDraft}
        context="character"
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 16,
        }}
      >
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Zrušit
        </Button>
        <Button onClick={handleSave} loading={isPending}>
          Uložit
        </Button>
      </div>
    </>
  );
}
