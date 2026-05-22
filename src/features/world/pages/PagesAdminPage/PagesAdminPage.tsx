import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FilePlus2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../api/usePagesDirectory';
import { useDeletePage } from '../api/useDeletePage';
import { ALL_PAGE_TYPES, type PageDirectoryEntry } from '../api/pages.types';
import {
  PagesAdminTable,
  type SortCol,
  type SortState,
} from './components/PagesAdminTable';
import { BulkActionBar } from './components/BulkActionBar';
import s from './PagesAdminPage.module.css';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * 7.4 — Správa stránek světa. PJ/admin: tabulkový přehled, řazení,
 * hledání/filtr, mazání (jednotlivé i hromadné), proklik do editoru.
 */
export default function PagesAdminPage() {
  const { worldId, worldSlug, loading } = useWorldContext();
  const { data: directory = [], isLoading } = usePagesDirectory(worldId);
  const deletePage = useDeletePage(worldId, worldSlug);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortState>({ col: 'order', dir: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingEntry, setDeletingEntry] = useState<PageDirectoryEntry | null>(
    null,
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const visibleEntries = useMemo(() => {
    const q = normalize(search.trim());
    const list = directory.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (!q) return true;
      return normalize(e.title).includes(q) || normalize(e.slug).includes(q);
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sort.col) {
        case 'title':
          return a.title.localeCompare(b.title, 'cs') * dir;
        case 'type':
          return a.type.localeCompare(b.type, 'cs') * dir;
        case 'updatedAt':
          return (
            (new Date(a.updatedAt).getTime() -
              new Date(b.updatedAt).getTime()) *
            dir
          );
        default:
          return (a.order - b.order) * dir;
      }
    });
  }, [directory, search, typeFilter, sort]);

  const allSelected =
    visibleEntries.length > 0 &&
    visibleEntries.every((e) => selectedIds.has(e.id));

  function onSortChange(col: SortCol) {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' },
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(() =>
      allSelected ? new Set() : new Set(visibleEntries.map((e) => e.id)),
    );
  }

  async function confirmDeleteSingle() {
    if (!deletingEntry) return;
    try {
      await deletePage.mutateAsync({
        id: deletingEntry.id,
        slug: deletingEntry.slug,
      });
      toast.success(`Stránka „${deletingEntry.title}" smazána.`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingEntry.id);
        return next;
      });
      setDeletingEntry(null);
    } catch {
      toast.error('Smazání stránky selhalo.');
    }
  }

  async function confirmDeleteBulk() {
    const targets = directory.filter((e) => selectedIds.has(e.id));
    const results = await Promise.allSettled(
      targets.map((e) =>
        deletePage.mutateAsync({ id: e.id, slug: e.slug }),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed === 0) {
      toast.success(`Smazáno ${targets.length} stránek.`);
    } else {
      toast.error(`${failed} z ${targets.length} stránek se nepodařilo smazat.`);
    }
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  }

  if (loading) return <Spinner center />;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.heading}>Správa stránek</h1>
          <p className={s.sub}>
            {directory.length}{' '}
            {directory.length === 1 ? 'stránka' : 'stránek'} ve světě
          </p>
        </div>
        <Link to={`/svet/${worldSlug}/nova-stranka`} className={s.newBtn}>
          <FilePlus2 size={15} aria-hidden /> Nová stránka
        </Link>
      </header>

      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Search size={16} className={s.searchIcon} aria-hidden />
          <input
            type="search"
            className={s.search}
            placeholder="Najít stránku…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Hledat stránku"
          />
        </div>
        <div className={s.chips} role="group" aria-label="Filtr typu">
          <button
            type="button"
            className={clsx(s.chip, typeFilter === 'all' && s.chipActive)}
            onClick={() => setTypeFilter('all')}
            aria-pressed={typeFilter === 'all'}
          >
            Vše
          </button>
          {ALL_PAGE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={clsx(s.chip, typeFilter === t && s.chipActive)}
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setBulkDeleteOpen(true)}
      />

      {isLoading ? (
        <Spinner center />
      ) : directory.length === 0 ? (
        <div className={s.empty}>
          <FileText size={40} aria-hidden />
          <p>Tento svět zatím nemá žádné stránky.</p>
          <Link to={`/svet/${worldSlug}/nova-stranka`} className={s.newBtn}>
            <FilePlus2 size={15} aria-hidden /> Vytvořit první stránku
          </Link>
        </div>
      ) : visibleEntries.length === 0 ? (
        <p className={s.noMatch}>Žádná stránka neodpovídá hledání ani filtru.</p>
      ) : (
        <PagesAdminTable
          entries={visibleEntries}
          worldSlug={worldSlug}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelected={allSelected}
          sort={sort}
          onSortChange={onSortChange}
          onDelete={setDeletingEntry}
        />
      )}

      <ConfirmDialog
        open={deletingEntry !== null}
        title="Smazat stránku?"
        message={`Stránka „${deletingEntry?.title ?? ''}" bude trvale smazána. Odkazy na ni z jiných stránek zůstanou, ale povedou na neexistující cíl.`}
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={confirmDeleteSingle}
        onClose={() => setDeletingEntry(null)}
        isPending={deletePage.isPending}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Smazat vybrané stránky?"
        message={`Trvale smazat ${selectedIds.size} ${
          selectedIds.size === 1 ? 'stránku' : 'stránek'
        }? Akce je nevratná.`}
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={confirmDeleteBulk}
        onClose={() => setBulkDeleteOpen(false)}
        isPending={deletePage.isPending}
      />
    </div>
  );
}
