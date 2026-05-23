import { Table as TableIcon, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { SmartCellInput } from '../components/SmartCellInput';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import type { PageTable } from '../../api/pages.types';
import s from './TablePanel.module.css';

interface Props {
  table: PageTable;
  onChange: (table: PageTable) => void;
}

/**
 * 7.2c → 8.5 — Editor řádků datové tabulky (atributy & metadata).
 *
 * Klíče i hodnoty jsou rich-text buňky (`SmartCellInput`) — libovolný úsek
 * textu může být odkaz na stránku světa nebo URL, v jedné buňce i víc
 * odkazů. Šablony se vybírají v `DataTemplatePanel` nad tímto panelem.
 */
export function TablePanel({ table, onChange }: Props) {
  const { worldId } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(worldId);

  const headers = table.headers ?? [];
  const values = table.values ?? [];
  const rowCount = Math.max(headers.length, values.length);

  function setRow(idx: number, header: string, value: string) {
    const newHeaders = [...headers];
    const newValues = [...values];
    while (newHeaders.length <= idx) newHeaders.push('');
    while (newValues.length <= idx) newValues.push('');
    newHeaders[idx] = header;
    newValues[idx] = value;
    onChange({
      ...table,
      hasTable: true,
      headers: newHeaders,
      values: newValues,
    });
  }

  function addRow() {
    onChange({
      ...table,
      hasTable: true,
      headers: [...headers, ''],
      values: [...values, ''],
    });
  }

  function removeRow(idx: number) {
    onChange({
      ...table,
      headers: headers.filter((_, i) => i !== idx),
      values: values.filter((_, i) => i !== idx),
    });
  }

  function moveRow(idx: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= rowCount) return;
    const newHeaders = [...headers];
    const newValues = [...values];
    while (newHeaders.length < rowCount) newHeaders.push('');
    while (newValues.length < rowCount) newValues.push('');
    [newHeaders[idx], newHeaders[target]] = [newHeaders[target], newHeaders[idx]];
    [newValues[idx], newValues[target]] = [newValues[target], newValues[idx]];
    onChange({
      ...table,
      hasTable: true,
      headers: newHeaders,
      values: newValues,
    });
  }

  function clearTable() {
    onChange({ hasTable: false, title: '', headers: [], values: [] });
  }

  return (
    <CollapsiblePanel
      title="Atributy & metadata"
      icon={<TableIcon size={18} aria-hidden />}
      badge={rowCount > 0 ? `${rowCount}` : undefined}
    >
      <div className={s.controls}>
        <div className={s.titleField}>
          <span className={s.fieldLabel}>Název sekce</span>
          <SmartCellInput
            value={table.title ?? ''}
            onChange={(html) =>
              onChange({ ...table, hasTable: true, title: html })
            }
            directory={directory}
            placeholder="Hlavička tabulky…"
          />
        </div>
      </div>

      {rowCount === 0 ? (
        <div className={s.empty}>
          <p>Žádné řádky. Vyber šablonu výše, nebo přidej řádek ručně.</p>
          <button type="button" onClick={addRow} className={s.addBtn}>
            <Plus size={14} aria-hidden /> Přidat řádek
          </button>
        </div>
      ) : (
        <>
          <table className={s.editor}>
            <thead>
              <tr>
                <th>Klíč</th>
                <th>Hodnota</th>
                <th aria-label="Akce" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <SmartCellInput
                      value={headers[i] ?? ''}
                      onChange={(html) => setRow(i, html, values[i] ?? '')}
                      directory={directory}
                      placeholder="Klíč"
                    />
                  </td>
                  <td>
                    <SmartCellInput
                      value={values[i] ?? ''}
                      onChange={(html) => setRow(i, headers[i] ?? '', html)}
                      directory={directory}
                      placeholder="Hodnota"
                    />
                  </td>
                  <td>
                    <div className={s.rowActions}>
                      <button
                        type="button"
                        onClick={() => moveRow(i, 'up')}
                        disabled={i === 0}
                        aria-label={`Posunout řádek ${i + 1} nahoru`}
                        className={s.iconBtn}
                      >
                        <ArrowUp size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(i, 'down')}
                        disabled={i === rowCount - 1}
                        aria-label={`Posunout řádek ${i + 1} dolů`}
                        className={s.iconBtn}
                      >
                        <ArrowDown size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        aria-label={`Smazat řádek ${i + 1}`}
                        className={s.removeBtn}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={s.actions}>
            <button type="button" onClick={addRow} className={s.addBtn}>
              <Plus size={14} aria-hidden /> Přidat řádek
            </button>
            <button type="button" onClick={clearTable} className={s.clearBtn}>
              <Trash2 size={14} aria-hidden /> Zrušit tabulku
            </button>
          </div>
        </>
      )}
    </CollapsiblePanel>
  );
}
