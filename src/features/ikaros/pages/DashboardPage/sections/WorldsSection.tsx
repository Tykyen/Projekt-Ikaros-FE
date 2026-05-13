import { Link } from 'react-router-dom';
import { Globe, Compass, PlusCircle } from 'lucide-react';
import { IkarosCard } from '@/shared/ui';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { SectionHeader } from '../components/SectionHeader';
import { WorldCard } from '../components/WorldCard';
import s from './WorldsSection.module.css';

export function WorldsSection() {
  const { data, isPending, isError } = useMyWorlds();

  return (
    <IkarosCard
      variant="news"
      header={
        <SectionHeader title="Moje světy" icon={<Globe size={20} aria-hidden="true" />} />
      }
    >
      {isPending && (
        <div className={s.skeleton} aria-label="Načítám světy">
          <div className={s.skeletonCard} />
          <div className={s.skeletonCard} />
        </div>
      )}

      {isError && (
        <p className={s.emptyText}>Nepodařilo se načíst světy.</p>
      )}

      {data && data.length === 0 && (
        <div className={s.empty}>
          <p className={s.emptyText}>Zatím nejsi v žádném světě.</p>
          <div className={s.emptyActions}>
            <Link to="/ikaros/vesmiry" className={`${s.btn} ${s.btnPrimary}`}>
              <Compass size={16} aria-hidden="true" />
              Prozkoumat světy
            </Link>
            <Link to="/ikaros/vytvorit-svet" className={s.btn}>
              <PlusCircle size={16} aria-hidden="true" />
              Vytvořit svět
            </Link>
          </div>
        </div>
      )}

      {data && data.length > 0 && (
        <div className={s.grid}>
          {data.map(({ world, membership }) => (
            <WorldCard key={world.id} world={world} membership={membership} />
          ))}
        </div>
      )}
    </IkarosCard>
  );
}
