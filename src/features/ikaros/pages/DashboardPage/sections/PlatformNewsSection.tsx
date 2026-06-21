import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Plus } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { IkarosCard, EmptyState, ErrorState } from '@/shared/ui';
import { useIkarosNews } from '@/features/ikaros/api/useIkarosNews';
import { NewsFormModal } from '@/features/ikaros/components/NewsFormModal';
import { NewsCard } from '@/features/ikaros/components/NewsCard';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SectionHeader } from '../components/SectionHeader';
import s from './PlatformNewsSection.module.css';

export function PlatformNewsSection() {
  const { data, isError, refetch } = useIkarosNews();
  // Spec 3.1b — dashboard ukazuje jen první 3, zbytek na `/ikaros/novinky`.
  const items = data?.slice(0, 3) ?? [];
  const currentUser = useAtomValue(currentUserAtom);
  const canCreate =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Superadmin;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <IkarosCard
      variant="news"
      header={
        <SectionHeader
          title="Novinky"
          icon={<Newspaper size={20} aria-hidden="true" />}
          action={
            canCreate ? (
              <button
                type="button"
                className={s.addBtn}
                aria-label="Nová novinka"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            ) : null
          }
        />
      }
    >
      {isError ? (
        <ErrorState
          size="panel"
          title="Nepodařilo se načíst novinky."
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="panel"
          illustration="messages"
          title="Zatím žádné novinky"
        />
      ) : (
        <>
          <div className={s.list}>
            {items.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
          <Link to="/ikaros/novinky" className={s.moreLink}>
            Všechny novinky →
          </Link>
        </>
      )}

      {canCreate && (
        <NewsFormModal
          mode="create"
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </IkarosCard>
  );
}
