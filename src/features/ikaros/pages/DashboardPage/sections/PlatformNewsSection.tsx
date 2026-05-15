import { useState } from 'react';
import { Newspaper, Plus } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { IkarosCard } from '@/shared/ui';
import { useIkarosNews } from '@/features/ikaros/api/useIkarosNews';
import { NewsFormModal } from '@/features/ikaros/components/NewsFormModal';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SectionHeader } from '../components/SectionHeader';
import { NewsCard } from '../components/NewsCard';
import s from './PlatformNewsSection.module.css';

export function PlatformNewsSection() {
  const { data, isError } = useIkarosNews();
  const items = data?.slice(0, 5) ?? [];
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
        <p className={s.empty}>Nepodařilo se načíst novinky.</p>
      ) : items.length === 0 ? (
        <p className={s.empty}>Zatím žádné novinky.</p>
      ) : (
        <div className={s.list}>
          {items.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
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
