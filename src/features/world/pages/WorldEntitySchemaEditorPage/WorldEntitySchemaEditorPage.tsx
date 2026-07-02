/**
 * 16.2g F2 — `/svet/:slug/nastaveni#sablona-bestie` (PJ+, jen „Vlastní Systém").
 * Editor per-svět schématu bestie (`entity_schema_versions`). Statblok se z něj
 * renderuje na taktické mapě i v chatu (přes `useResolvedEntitySchema`).
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Spinner } from '@/shared/ui';
import { parseApiError } from '@/shared/api';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { genericBestieSchema } from '@/features/world/tactical-map/schemas/generic';
import {
  useActiveEntitySchema,
  useCreateEntitySchemaVersion,
} from '@/features/world/tactical-map/schemas/useEntitySchemaVersions';
import type { SchemaSection } from '@/features/world/tactical-map/schemas/types';
import { EntitySchemaEditor } from './EntitySchemaEditor';
import s from './WorldEntitySchemaEditorPage.module.css';

function cloneSections(src: SchemaSection[]): SchemaSection[] {
  return JSON.parse(JSON.stringify(src)) as SchemaSection[];
}

export default function WorldEntitySchemaEditorPage() {
  const { worldId, world } = useWorldContext();
  const activeQ = useActiveEntitySchema(worldId, 'bestie');
  const createMut = useCreateEntitySchemaVersion(worldId);

  if (activeQ.isLoading) return <Spinner center />;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Šablona bestie</h1>
        <p className={s.subtle}>
          Nadefinuj pole bestie pro tenhle svět — statblok se z nich vykreslí v
          bestiáři, na taktické mapě i v chatu. Uložení vytvoří novou verzi
          (předchozí se archivuje).
        </p>
      </header>
      <EditorSection
        key={activeQ.data?.version ?? 'empty'}
        initialSections={activeQ.data?.sections ?? null}
        system={world?.system ?? 'vlastni'}
        isSaving={createMut.isPending}
        onSubmit={(sections) =>
          createMut.mutate(
            { entityType: 'bestie', sections },
            {
              onSuccess: () => toast.success('Šablona bestie uložena'),
              onError: (e) => toast.error(parseApiError(e)),
            },
          )
        }
      />
    </div>
  );
}

interface EditorSectionProps {
  initialSections: SchemaSection[] | null;
  system: string;
  isSaving: boolean;
  onSubmit: (sections: SchemaSection[]) => void;
}

function EditorSection({
  initialSections,
  system,
  isSaving,
  onSubmit,
}: EditorSectionProps) {
  const [sections, setSections] = useState<SchemaSection[]>(
    () => initialSections ?? [],
  );
  const isDirty = useMemo(
    () =>
      JSON.stringify(sections) !== JSON.stringify(initialSections ?? []),
    [sections, initialSections],
  );

  if (sections.length === 0) {
    return (
      <div className={s.empty}>
        <p>Svět zatím nemá vlastní šablonu bestie. Vyber start:</p>
        <div className={s.emptyActions}>
          <Button
            onClick={() =>
              setSections(cloneSections(genericBestieSchema.sections))
            }
          >
            Základní šablona (HP, zbroj, pohyb, iniciativa)
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setSections([{ key: 'staty', label: 'Staty', fields: [] }])
            }
          >
            Prázdná
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={s.actions}>
        <Button
          onClick={() => onSubmit(sections)}
          disabled={!isDirty || isSaving}
          loading={isSaving}
        >
          Uložit šablonu
        </Button>
      </div>
      <EntitySchemaEditor
        sections={sections}
        onChange={setSections}
        systemId={system}
        entityType="bestie"
      />
    </>
  );
}
