/**
 * 10.2d-prep-B — BestiarPage (`/svet/:worldId/bestiar`).
 *
 * 3 taby (Můj / Tohoto světa / Systémové), search, create/edit/clone/delete.
 * PJ+ visible (route gate v router.tsx).
 */
import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '@/shared/ui';
import { PrintButton } from '@/features/world/export/print';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useResolvedSystemId } from '@/features/world/useResolvedSystemId';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { useBestiar } from './hooks/useBestiar';
import { useBestieMutations } from './hooks/useBestieMutations';
import { BestieCard } from './components/BestieCard';
import { BestieEditorModal } from './components/BestieEditorModal';
import { CloneBestieModal } from './components/CloneBestieModal';
import type { Bestie, BestieScope } from './types';
import styles from './BestiarPage.module.css';

type Tab = 'user' | 'world' | 'system';

export default function BestiarPage(): React.ReactElement {
  const { worldId, world, userRole } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);
  // Canonical systemId přes sdílený hook (D-SYSTEMID-HOOK).
  const systemId = useResolvedSystemId() || null;
  const query = useBestiar(worldId || null, systemId);
  const { softDelete } = useBestieMutations(worldId || null, systemId);

  // System/user scope = globální/osobní katalog → platform admin. World scope =
  // svět → elevation (admin musí být v tomto světě „nahozený").
  const isPlatformAdmin =
    currentUser?.role === UserRole.Superadmin ||
    currentUser?.role === UserRole.Admin;
  const isElevatedHere = world?.elevated === true;
  const isPjInWorld =
    isElevatedHere || (userRole !== null && userRole >= WorldRole.PomocnyPJ);

  const [tab, setTab] = useState<Tab>('user');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Bestie | 'new' | null>(null);
  const [cloning, setCloning] = useState<Bestie | null>(null);

  const tabCounts = {
    user: query.data?.user.length ?? 0,
    world: query.data?.world.length ?? 0,
    system: query.data?.system.length ?? 0,
  };

  const visibleBestie = useMemo(() => {
    const list = (query.data?.[tab] ?? []) as Bestie[];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q),
    );
  }, [query.data, tab, search]);

  const canEdit = (b: Bestie): boolean => {
    if (b.scope === 'system') return isPlatformAdmin;
    if (b.scope === 'user') return b.ownerUserId === currentUser?.id;
    if (b.scope === 'world') return isPjInWorld;
    return false;
  };

  const handleDelete = (b: Bestie): void => {
    if (!confirm(`Smazat "${b.name}"? (Půjde obnovit z koše)`)) return;
    softDelete.mutate(b.id);
  };

  if (!worldId || !systemId) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Načítání světa…</p>
      </div>
    );
  }

  return (
    <div className={styles.page} data-print-scope>
      <header className={styles.header}>
        <h1 className={styles.title}>Bestiář</h1>
        {/* System scope smí tvořit jen Admin/Superadmin; user/world PJ+. */}
        {(tab === 'system' ? isPlatformAdmin : isPjInWorld) && (
          <Button
            variant="primary"
            className="print-hide"
            onClick={() => setEditing('new')}
          >
            + Nová bestie
          </Button>
        )}
        <PrintButton title="Vytisknout zobrazené bestie" />
      </header>

      <div className={`${styles.tabs} print-hide`}>
        {(['user', 'world', 'system'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {tabLabel(t)} ({tabCounts[t]})
          </button>
        ))}
      </div>

      <input
        type="search"
        className={`${styles.search} print-hide`}
        placeholder="Hledat podle jména…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {query.isLoading && <p className={styles.empty}>Načítání bestiáře…</p>}
      {query.isError && (
        <p className={styles.empty} role="alert">
          Chyba načítání bestiáře.
        </p>
      )}
      {query.data && visibleBestie.length === 0 && (
        <p className={styles.empty}>
          {search
            ? 'Žádná bestie neodpovídá hledání.'
            : tabEmptyMessage(tab, isPjInWorld)}
        </p>
      )}

      <div className={styles.list}>
        {visibleBestie.map((b) => (
          <BestieCard
            key={b.id}
            bestie={b}
            canEdit={canEdit(b)}
            canDelete={canEdit(b)}
            onEdit={() => setEditing(b)}
            onClone={() => setCloning(b)}
            onDelete={() => handleDelete(b)}
          />
        ))}
      </div>

      {editing && (
        <BestieEditorModal
          worldId={worldId}
          systemId={systemId}
          existing={editing === 'new' ? null : editing}
          defaultScope={
            tab === 'world' ? 'world' : tab === 'system' ? 'system' : 'user'
          }
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {cloning && (
        <CloneBestieModal
          source={cloning}
          worldId={worldId}
          systemId={systemId}
          onClose={() => setCloning(null)}
          onCloned={() => setCloning(null)}
        />
      )}
    </div>
  );
}

function tabLabel(t: BestieScope | Tab): string {
  switch (t) {
    case 'user':
      return 'Můj';
    case 'world':
      return 'Tohoto světa';
    case 'system':
      return 'Systémové';
  }
}

function tabEmptyMessage(t: Tab, isPj: boolean): string {
  if (t === 'system')
    return 'Systémový (globální) bestiář pro tento systém zatím prázdný.';
  if (t === 'user')
    return isPj
      ? 'Tvůj osobní bestiář je prázdný. Vytvoř první bestii.'
      : 'Žádná bestie.';
  return isPj
    ? 'Bestiář tohoto světa je prázdný. Vytvoř první bestii.'
    : 'Žádná bestie.';
}
