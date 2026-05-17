import { Users, CalendarDays, Newspaper } from 'lucide-react';
import type { World } from '@/shared/types';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldNews } from '@/features/world/api/useWorldNews';
import { useWorldGameEvents } from '@/features/world/api/useGameEvents';
import { EventsColumn } from './columns/EventsColumn';
import { NewsColumn } from './columns/NewsColumn';
import { FavoritePagesColumn } from './columns/FavoritePagesColumn';
import { StatBar } from './components/StatBar';
import s from './WorldDashboard.module.css';

interface Props {
  world: World;
}

/**
 * 5.2 — 3sloupcový dashboard úvodní stránky světa pro členy.
 * Akce / Novinky / Oblíbené stránky + spodní lišta statistik.
 * Dotazy se sdílí přes React Query cache se sloupci (stejné queryKey).
 */
export function WorldDashboard({ world }: Props) {
  const members = useWorldMembers(world.id);
  const news = useWorldNews(world.id);
  const events = useWorldGameEvents(world.id, 10);

  return (
    <div className={s.wrap}>
      <div className={s.grid}>
        <div className={s.col} style={{ animationDelay: '0ms' }}>
          <EventsColumn worldId={world.id} />
        </div>
        <div className={s.col} style={{ animationDelay: '80ms' }}>
          <NewsColumn worldId={world.id} />
        </div>
        <div className={s.col} style={{ animationDelay: '160ms' }}>
          <FavoritePagesColumn world={world} />
        </div>
      </div>
      <StatBar
        stats={[
          {
            icon: <Users size={20} />,
            value: members.data?.length ?? 0,
            label: 'Hráčů',
          },
          {
            icon: <CalendarDays size={20} />,
            value: events.data?.length ?? 0,
            label: 'Nadcházejících akcí',
          },
          {
            icon: <Newspaper size={20} />,
            value: news.data?.length ?? 0,
            label: 'Novinek',
          },
        ]}
      />
    </div>
  );
}
