import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Newspaper, Plus } from 'lucide-react';
import { Spinner, Button, ConfirmDialog } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole, type WorldNewsItem } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useWorldNews,
  useDeleteWorldNews,
} from '@/features/world/api/useWorldNews';
import { DashColumn } from '../components/DashColumn';
import { WorldNewsCard } from '../components/WorldNewsCard';
import { WorldNewsEditorModal } from '../components/WorldNewsEditorModal';
import s from './column.module.css';

interface Props {
  worldId: string;
}

/** 5.2 — prostřední sloupec: oznámení světa + tvorba (PomocnyPJ+). */
export function NewsColumn({ worldId }: Props) {
  const { userRole } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);
  const { data, isLoading } = useWorldNews(worldId);
  const deleteMut = useDeleteWorldNews(worldId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WorldNewsItem | undefined>(undefined);
  const [toDelete, setToDelete] = useState<WorldNewsItem | null>(null);

  const isGlobalAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;
  const canManage =
    isGlobalAdmin ||
    (userRole ?? WorldRole.Zadatel) >= WorldRole.PomocnyPJ;

  const news = data ?? [];

  return (
    <DashColumn
      icon={<Newspaper size={18} />}
      title="Novinky"
      action={
        canManage ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditing(undefined);
              setEditorOpen(true);
            }}
          >
            <Plus size={14} /> Nové oznámení
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <Spinner center />
      ) : news.length === 0 ? (
        <p className={s.empty}>Zatím žádná oznámení.</p>
      ) : (
        <div className={s.list}>
          {news.map((n) => (
            <WorldNewsCard
              key={n.id}
              news={n}
              /* Globální novinky (worldId null) needituje PJ světa. */
              canManage={canManage && (isGlobalAdmin || n.worldId !== null)}
              onEdit={() => {
                setEditing(n);
                setEditorOpen(true);
              }}
              onDelete={() => setToDelete(n)}
            />
          ))}
        </div>
      )}

      {editorOpen && (
        <WorldNewsEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          worldId={worldId}
          editing={editing}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Smazat oznámení?"
        message={`Oznámení „${toDelete?.title}" bude trvale smazáno.`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteMut.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteMut.mutateAsync(toDelete.id);
            toast.success('Oznámení smazáno.');
          } catch {
            toast.error('Smazání selhalo.');
          }
          setToDelete(null);
        }}
      />
    </DashColumn>
  );
}
