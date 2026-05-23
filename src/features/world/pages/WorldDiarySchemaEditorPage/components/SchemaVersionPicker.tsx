import type { DiarySchemaVersionMeta } from '../../api/diarySchema.types';
import s from './DiarySchemaEditor.module.css';

interface Props {
  versions: DiarySchemaVersionMeta[] | undefined;
  selectedVersion: number | undefined;
  onSelect: (version: number) => void;
}

/**
 * 8.5 — dropdown s historií verzí. Aktivní verze (`archivedAt === null`)
 * je nahoře a označena jako (aktivní); archivované pod ní.
 */
export function SchemaVersionPicker({
  versions,
  selectedVersion,
  onSelect,
}: Props) {
  const sorted = [...(versions ?? [])].sort((a, b) => b.version - a.version);
  const activeVersion = sorted.find((v) => v.archivedAt === null)?.version;

  return (
    <label className={s.versionPicker}>
      <span>Verze:</span>
      <select
        value={selectedVersion ?? activeVersion ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {sorted.map((v) => (
          <option key={v.version} value={v.version}>
            v{v.version}{' '}
            {v.archivedAt === null
              ? '(aktivní)'
              : `(archiv ${new Date(v.archivedAt).toLocaleDateString('cs-CZ')})`}
          </option>
        ))}
      </select>
    </label>
  );
}
