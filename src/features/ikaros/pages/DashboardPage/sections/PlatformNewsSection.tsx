import { Newspaper } from 'lucide-react';
import { IkarosCard } from '@/shared/ui';
import { useIkarosNews } from '@/features/ikaros/api/useIkarosNews';
import { SectionHeader } from '../components/SectionHeader';
import { NewsCard } from '../components/NewsCard';
import s from './PlatformNewsSection.module.css';

export function PlatformNewsSection() {
  const { data, isPending, isError } = useIkarosNews();
  const items = data?.slice(0, 5) ?? [];

  return (
    <IkarosCard
      variant="news"
      header={
        <SectionHeader
          title="Novinky"
          icon={<Newspaper size={20} aria-hidden="true" />}
        />
      }
    >
      {isPending && (
        <div className={s.skeleton} aria-label="Načítám novinky">
          <div className={s.skeletonRow} />
          <div className={s.skeletonRow} />
        </div>
      )}

      {isError && <p className={s.empty}>Nepodařilo se načíst novinky.</p>}

      {data && items.length === 0 && (
        <p className={s.empty}>Zatím žádné novinky.</p>
      )}

      {items.length > 0 && (
        <div className={s.list}>
          {items.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      )}
    </IkarosCard>
  );
}
