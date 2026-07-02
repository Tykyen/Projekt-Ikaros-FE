import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button, Spinner, ConfirmDialog } from '@/shared/ui';
import { parseApiError } from '@/shared/api';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { DiarySchemaEditor } from './components/DiarySchemaEditor';
import { SchemaVersionPicker } from './components/SchemaVersionPicker';
import {
  useDiarySchemaVersions,
  useDiarySchemaVersion,
  useCreateDiarySchemaVersion,
  useResetAllPersonalDiarySchemas,
  useRemapAllDiaryKeys,
} from './api/useDiarySchema';
import type { DiarySchemaBlock } from '../api/diarySchema.types';
import {
  validateSchema,
  detectRenamedKeys,
} from './utils/schemaValidation';
import { STARTER_TEMPLATES } from './templates/starterTemplates';
import s from './WorldDiarySchemaEditorPage.module.css';

/**
 * 8.5 — `/svet/:worldSlug/admin/sablona-deniku` (PJ+).
 *
 * 3-panelový editor + version picker + extended akce (bulk reset, JSON export/import).
 */
export default function WorldDiarySchemaEditorPage() {
  const { worldId } = useWorldContext();
  const versionsQ = useDiarySchemaVersions(worldId);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(
    undefined,
  );
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState<
    'discard' | 'restore' | null
  >(null);
  /**
   * D-DIARY-5 — po save schématu se nás zeptá, zda chceme přejmenovat
   * `customData` keys u postav (které nemají vlastní override).
   * Drží `mapping` z `detectRenamedKeys` mezi předchozí a uloženou verzí.
   */
  const [pendingRemap, setPendingRemap] = useState<Record<string, string> | null>(
    null,
  );
  const importFileRef = useRef<HTMLInputElement>(null);

  const activeMeta = useMemo(() => {
    if (!versionsQ.data) return undefined;
    return [...versionsQ.data]
      .sort((a, b) => b.version - a.version)
      .find((v) => v.archivedAt === null);
  }, [versionsQ.data]);

  const viewVersion = selectedVersion ?? activeMeta?.version;
  const detailQ = useDiarySchemaVersion(worldId, viewVersion);
  const isViewingArchive =
    viewVersion != null && viewVersion !== activeMeta?.version;
  const createMut = useCreateDiarySchemaVersion(worldId);
  const bulkResetMut = useResetAllPersonalDiarySchemas(worldId);
  const remapMut = useRemapAllDiaryKeys(worldId);

  const lastVersion = activeMeta?.version ?? 0;
  const nextVersion = lastVersion + 1;

  function handleBulkReset() {
    setConfirmBulk(false);
    bulkResetMut.mutate(undefined, {
      onSuccess: (data) =>
        toast.success(`Resetováno ${data.count} postav`),
      onError: (err) => toast.error(parseApiError(err)),
    });
  }

  function handleSubmit(schema: DiarySchemaBlock[]) {
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return;
    }
    // D-DIARY-5 — detekuj rename keys proti naposledy uložené aktivní verzi.
    const previousSchema = detailQ.data?.schema ?? [];
    const renames = detectRenamedKeys(previousSchema, schema);
    createMut.mutate(
      { schema },
      {
        onSuccess: () => {
          toast.success(`Šablona uložena jako verze ${nextVersion}`);
          setSelectedVersion(undefined);
          if (Object.keys(renames).length > 0) {
            // Otevři dialog — uživatel může remap přeskočit (data se ztratí
            // při příštím čtení deníku přes coerce filter) nebo provést.
            setPendingRemap(renames);
          }
        },
        onError: (err) => toast.error(parseApiError(err)),
      },
    );
  }

  function handleAcceptRemap() {
    if (!pendingRemap) return;
    const mapping = pendingRemap;
    setPendingRemap(null);
    remapMut.mutate(mapping, {
      onSuccess: (data) =>
        toast.success(`Přejmenováno u ${data.count} postav`),
      onError: (err) => toast.error(parseApiError(err)),
    });
  }

  if (versionsQ.isLoading) return <Spinner center />;

  if (versionsQ.isError) {
    return (
      <div className={s.errorBox}>
        Schéma se nepodařilo načíst: {parseApiError(versionsQ.error)}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Šablona deníku světa</h1>
          {versionsQ.data && versionsQ.data.length > 0 && (
            <SchemaVersionPicker
              versions={versionsQ.data}
              selectedVersion={viewVersion}
              onSelect={setSelectedVersion}
            />
          )}
        </div>
      </header>

      {isViewingArchive && (
        <div className={s.archivedNotice}>
          Prohlížíš archivovanou verzi v{viewVersion}. Bloky lze prohlížet,
          ale ne přímo upravovat — pokud chceš pokračovat na této verzi,
          klikni „Obnovit jako v{nextVersion}".
        </div>
      )}

      {detailQ.isLoading && <Spinner center />}

      {detailQ.data && (
        // key={viewVersion} — remount sekce při změně verze, čistě resetuje
        // lokální draft state bez useEffect setState.
        <EditorSection
          key={viewVersion}
          initialSchema={detailQ.data.schema}
          isViewingArchive={isViewingArchive}
          nextVersion={nextVersion}
          isSaving={createMut.isPending}
          onSubmit={handleSubmit}
          onTriggerBulkReset={() => setConfirmBulk(true)}
          onTriggerRestore={() => setConfirmDiscard('restore')}
          importFileRef={importFileRef}
        />
      )}

      {!detailQ.isLoading && !detailQ.data && versionsQ.data?.length === 0 && (
        <div className={s.empty}>
          <p>
            Šablona deníku zatím neexistuje. Vyber startovní šablonu k úpravě,
            nebo začni od nuly.
          </p>
          <div className={s.templateGrid}>
            {STARTER_TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={s.templateCard}
                disabled={createMut.isPending}
                onClick={() => createMut.mutate({ schema: t.build() })}
              >
                <span className={s.templateTitle}>{t.label}</span>
                <span className={s.templateHint}>{t.hint}</span>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            disabled={createMut.isPending}
            onClick={() => createMut.mutate({ schema: [] })}
          >
            Začít od nuly (prázdná)
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmBulk}
        title="Resetovat overridy všech postav?"
        message="Odstraní vlastní šablonu deníku u všech postav ve světě. Postavy začnou používat svět-level šablonu. Tato akce je nevratná."
        confirmLabel="Ano, resetovat"
        confirmVariant="danger"
        onConfirm={handleBulkReset}
        onClose={() => setConfirmBulk(false)}
        isPending={bulkResetMut.isPending}
      />

      <ConfirmDialog
        open={confirmDiscard === 'restore'}
        title={`Obnovit verzi ${viewVersion} jako novou aktivní?`}
        message={`Schéma se uloží jako verze ${nextVersion}, předchozí aktivní se archivuje.`}
        confirmLabel="Obnovit"
        onConfirm={() => {
          // Najdu si aktuální schema z detailQ.data a uložím jako novou aktivní.
          setConfirmDiscard(null);
          if (detailQ.data) handleSubmit(detailQ.data.schema);
        }}
        onClose={() => setConfirmDiscard(null)}
      />

      <ConfirmDialog
        open={pendingRemap !== null}
        title="Přejmenovat existující data postav?"
        message={
          pendingRemap ? (
            <>
              <p>Detekováno přejmenování klíče(ů) bloků:</p>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {Object.entries(pendingRemap).map(([oldK, newK]) => (
                  <li key={oldK}>
                    <code>{oldK}</code> → <code>{newK}</code>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 12 }}>
                Bez přejmenování zůstanou data v <code>customData</code>{' '}
                pod původními klíči — a deník je nezobrazí (filter pak hodnoty
                ignoruje). Přejmenování projde všemi postavami světa, které
                používají šablonu světa (bez vlastního overridu).
              </p>
            </>
          ) : null
        }
        confirmLabel="Přejmenovat"
        cancelLabel="Přeskočit"
        onConfirm={handleAcceptRemap}
        onClose={() => setPendingRemap(null)}
        isPending={remapMut.isPending}
      />
    </div>
  );
}

// ── EditorSection — držitel draft state, remountovaný na změnu verze ──

interface EditorSectionProps {
  initialSchema: DiarySchemaBlock[];
  isViewingArchive: boolean;
  nextVersion: number;
  isSaving: boolean;
  onSubmit: (schema: DiarySchemaBlock[]) => void;
  onTriggerBulkReset: () => void;
  onTriggerRestore: () => void;
  importFileRef: React.RefObject<HTMLInputElement | null>;
}

function EditorSection({
  initialSchema,
  isViewingArchive,
  nextVersion,
  isSaving,
  onSubmit,
  onTriggerBulkReset,
  onTriggerRestore,
  importFileRef,
}: EditorSectionProps) {
  // Lazy init — initialSchema přijde s předchozí verzí; remount zaručí čistý
  // start při změně verze (klíč v parent komponentě = `viewVersion`).
  const [draft, setDraft] = useState<DiarySchemaBlock[]>(initialSchema);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialSchema),
    [draft, initialSchema],
  );

  function handleExport() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-schema-v${nextVersion - 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DiarySchemaBlock[];
        if (!Array.isArray(parsed)) {
          toast.error('Soubor neobsahuje pole bloků');
          return;
        }
        setDraft(parsed);
        toast.success(
          'Schéma naimportováno do pracovního stavu (uložení vyžaduje submit).',
        );
      } catch (err) {
        toast.error('Neplatný JSON soubor');
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <>
      <div className={s.headerActions}>
        <input
          ref={importFileRef}
          type="file"
          accept="application/json"
          className={s.hiddenInput}
          onChange={handleImportFile}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => importFileRef.current?.click()}
          disabled={isViewingArchive}
        >
          ⬆ Import JSON
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          ⬇ Export JSON
        </Button>
        <Button variant="danger" size="sm" onClick={onTriggerBulkReset}>
          Reset overridů
        </Button>
        {isViewingArchive ? (
          <Button onClick={onTriggerRestore}>
            ↺ Obnovit jako v{nextVersion}
          </Button>
        ) : (
          <Button
            onClick={() => onSubmit(draft)}
            disabled={!isDirty || isSaving}
            loading={isSaving}
          >
            Uložit jako v{nextVersion}
          </Button>
        )}
      </div>
      <DiarySchemaEditor
        value={draft}
        onChange={setDraft}
        readOnly={isViewingArchive}
        previousVersion={initialSchema}
        context="world"
      />
    </>
  );
}
