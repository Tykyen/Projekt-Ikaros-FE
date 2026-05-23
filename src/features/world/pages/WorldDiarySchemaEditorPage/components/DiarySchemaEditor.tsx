import { useMemo, useState } from 'react';
import { BlockList } from './BlockList';
import { BlockConfigPanel } from './BlockConfigPanel';
import { SchemaPreview } from './SchemaPreview';
import { SchemaDiffPanel } from './SchemaDiffPanel';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import { slugify } from '../utils/schemaMappers';
import s from './DiarySchemaEditor.module.css';

interface Props {
  value: DiarySchemaBlock[];
  onChange: (next: DiarySchemaBlock[]) => void;
  readOnly?: boolean;
  /** Předchozí (uložená) verze schématu pro diff panel. */
  previousVersion?: DiarySchemaBlock[];
  /** 'world' nebo 'character' — zatím jen pro telemetry, layout shodný. */
  context?: 'world' | 'character';
}

/**
 * 8.5 — sdílená 3-panelová editor komponenta. Použitá v:
 *   - WorldDiarySchemaEditorPage (kontext = svět, full page)
 *   - DiarySchemaEditorModal (kontext = postava, modal wrapper)
 *
 * Stav držený lokálně:
 *   - `activeId`  — který blok je v BlockConfigPanel
 *   - úpravy bloků propagovány nahoru přes `onChange`
 */
export function DiarySchemaEditor({
  value,
  onChange,
  readOnly,
  previousVersion,
}: Props) {
  const sorted = useMemo(
    () => [...value].sort((a, b) => a.order - b.order),
    [value],
  );
  const [activeId, setActiveId] = useState<string | undefined>(
    () => sorted[0]?.id ?? sorted[0]?.key,
  );

  const idOf = (b: DiarySchemaBlock) => b.id ?? b.key;
  const activeBlock = sorted.find((b) => idOf(b) === activeId);

  function commitAll(next: DiarySchemaBlock[]) {
    // Přečíslovat `order` podle pole pozice.
    onChange(next.map((b, i) => ({ ...b, order: i })));
  }

  function handleAdd() {
    // crypto.randomUUID — moderní browser API, bez další dep.
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `b_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const baseKey = `pole_${sorted.length + 1}`;
    const newBlock: DiarySchemaBlock = {
      id,
      key: baseKey,
      label: 'Nový blok',
      type: 'stat',
      order: sorted.length,
      config: { minValue: 0, maxValue: 100 },
    };
    commitAll([...sorted, newBlock]);
    setActiveId(id);
  }

  function handleReorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commitAll(next);
  }

  function handleBlockChange(updated: DiarySchemaBlock) {
    const next = sorted.map((b) => (idOf(b) === idOf(updated) ? updated : b));
    commitAll(next);
  }

  function handleDelete() {
    if (!activeBlock) return;
    const next = sorted.filter((b) => idOf(b) !== idOf(activeBlock));
    commitAll(next);
    setActiveId(next[0] ? idOf(next[0]) : undefined);
  }

  const knownKeys = useMemo(
    () =>
      new Set(
        sorted
          .filter((b) => idOf(b) !== activeId)
          .map((b) => b.key)
          .filter(Boolean),
      ),
    [sorted, activeId],
  );

  return (
    <div className={s.editor}>
      <BlockList
        blocks={sorted}
        activeId={activeId}
        readOnly={readOnly}
        onSelect={setActiveId}
        onReorder={handleReorder}
        onAdd={handleAdd}
      />
      <div>
        <BlockConfigPanel
          block={activeBlock}
          readOnly={readOnly}
          knownKeys={knownKeys}
          onChange={(updated) => {
            // Pokud uživatel přepíše `label` a `key` je auto-derived,
            // FE rule by mohl reslugnout — dnes ne, ať máme kontrolu.
            // Auto-slug jen při create (handleAdd výše).
            // Drobnost: na change `label` doplníme `key` jen pokud blok je úplně nový
            // (label === 'Nový blok' a uživatel ho mění).
            const next = { ...updated };
            if (
              activeBlock &&
              activeBlock.label === 'Nový blok' &&
              next.label !== 'Nový blok' &&
              activeBlock.key.startsWith('pole_')
            ) {
              const newKey = slugify(next.label);
              if (newKey && !knownKeys.has(newKey)) next.key = newKey;
            }
            handleBlockChange(next);
          }}
          onDelete={handleDelete}
        />
        {previousVersion && (
          <SchemaDiffPanel previous={previousVersion} next={sorted} />
        )}
      </div>
      <SchemaPreview blocks={sorted} />
    </div>
  );
}
