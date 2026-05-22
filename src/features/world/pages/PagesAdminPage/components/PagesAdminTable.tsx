import { Link } from 'react-router-dom';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { pageTypeIcon } from '../../PagesListPage/lib/pageTypeMeta';
import type { PageDirectoryEntry } from '../../api/pages.types';
import s from './PagesAdminTable.module.css';

export type SortCol = 'title' | 'type' | 'order' | 'updatedAt';
export interface SortState {
  col: SortCol;
  dir: 'asc' | 'desc';
}

interface Props {
  entries: PageDirectoryEntry[];
  worldSlug: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  sort: SortState;
  onSortChange: (col: SortCol) => void;
  onDelete: (entry: PageDirectoryEntry) => void;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
}

/**
 * 7.4 — Tabulka správy stránek. Řazení klikem na hlavičku, výběr řádků
 * přes checkboxy (hromadné mazání). Na mobilu se tabulka přeskládá do
 * karet (CSS).
 */
export function PagesAdminTable({
  entries,
  worldSlug,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  sort,
  onSortChange,
  onDelete,
}: Props) {
  function SortHeader({ col, label }: { col: SortCol; label: string }) {
    const active = sort.col === col;
    return (
      <th>
        <button
          type="button"
          className={s.sortBtn}
          onClick={() => onSortChange(col)}
          aria-label={`Řadit dle ${label}`}
        >
          {label}
          {active &&
            (sort.dir === 'asc' ? (
              <ChevronUp size={13} aria-hidden />
            ) : (
              <ChevronDown size={13} aria-hidden />
            ))}
        </button>
      </th>
    );
  }

  return (
    <table className={s.table}>
      <thead>
        <tr>
          <th className={s.checkCol}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              aria-label="Vybrat všechny stránky"
            />
          </th>
          <SortHeader col="title" label="Název" />
          <SortHeader col="type" label="Typ" />
          <th>Slug</th>
          <SortHeader col="order" label="Pořadí" />
          <SortHeader col="updatedAt" label="Upraveno" />
          <th aria-label="Akce" />
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const Icon = pageTypeIcon(entry.type);
          const selected = selectedIds.has(entry.id);
          return (
            <tr key={entry.id} className={selected ? s.rowSelected : ''}>
              <td className={s.checkCol} data-label="Vybrat">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(entry.id)}
                  aria-label={`Vybrat stránku ${entry.title}`}
                />
              </td>
              <td data-label="Název">
                <Link
                  to={`/svet/${worldSlug}/${entry.slug}`}
                  className={s.titleLink}
                >
                  {entry.title}
                </Link>
              </td>
              <td data-label="Typ">
                <span className={s.typeCell}>
                  <Icon size={14} aria-hidden /> {entry.type}
                </span>
              </td>
              <td data-label="Slug">
                <code className={s.slug}>{entry.slug}</code>
              </td>
              <td data-label="Pořadí">{entry.order}</td>
              <td data-label="Upraveno">{fmtDate(entry.updatedAt)}</td>
              <td data-label="Akce">
                <div className={s.actions}>
                  <Link
                    to={`/svet/${worldSlug}/edit/${entry.slug}`}
                    className={s.iconBtn}
                    aria-label={`Upravit ${entry.title}`}
                    title="Upravit"
                  >
                    <Pencil size={14} aria-hidden />
                  </Link>
                  <button
                    type="button"
                    className={`${s.iconBtn} ${s.iconBtnDanger}`}
                    onClick={() => onDelete(entry)}
                    aria-label={`Smazat ${entry.title}`}
                    title="Smazat"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
