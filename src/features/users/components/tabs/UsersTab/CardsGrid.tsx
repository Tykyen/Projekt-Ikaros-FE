import { useNavigate } from 'react-router-dom';
import { UserCard } from './UserCard';
import type { PublicUserListItem } from '@/shared/types';
import s from './CardsGrid.module.css';

interface CardsGridProps {
  items: PublicUserListItem[];
  isLoading: boolean;
  isError: boolean;
  onKebab?: (user: PublicUserListItem, anchor: HTMLElement) => void;
}

const SKELETON_COUNT = 8;

export function CardsGrid({
  items,
  isLoading,
  isError,
  onKebab,
}: CardsGridProps) {
  const navigate = useNavigate();

  if (isError) {
    return (
      <div className={s.grid}>
        <div className={s.error}>
          Načítání selhalo. Zkus stránku obnovit nebo se vrátit za chvilku.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={s.grid} aria-busy="true" aria-label="Načítání uživatelů">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className={s.skeleton} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={s.grid}>
        <div className={s.empty}>Žádní uživatelé neodpovídají filtru.</div>
      </div>
    );
  }

  return (
    <div className={s.grid}>
      {items.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          onOpen={(id) => navigate(`/ikaros/uzivatel/${id}`)}
          onKebab={onKebab}
        />
      ))}
    </div>
  );
}
