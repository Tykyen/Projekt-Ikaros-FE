import { Users } from 'lucide-react';
import type { World } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldPendingActions } from '@/features/world/api/useWorldPendingActions';
import { isWorldPlayer } from '@/features/world/lib/isWorldPlayer';
import { EventsColumn } from './columns/EventsColumn';
import { NewsColumn } from './columns/NewsColumn';
import { FavoritePagesColumn } from './columns/FavoritePagesColumn';
import { DashTile } from './components/DashTile';
import s from './WorldDashboard.module.css';

interface Props {
  world: World;
}

/**
 * 5.2 + side-task layout — dashboard úvodní stránky světa.
 * Levý sloupec: dlaždice Hráči + box Akce. Střední: box Novinky přes plnou
 * výšku. Pravý: Oblíbené stránky přes plnou výšku.
 */
export function WorldDashboard({ world }: Props) {
  const { isPJ } = useWorldContext();
  const members = useWorldMembers(world.id);
  // 15.10 — badge s počtem čekajících žádostí (jen PJ/co-PJ).
  const pending = useWorldPendingActions(world.id, isPJ);

  return (
    <div className={s.grid}>
      <DashTile
        className={`${s.cell} ${s.tileHraci}`}
        icon={<Users size={20} />}
        label="Hráči"
        to={`/svet/${world.slug}/hraci`}
        value={members.data?.filter(isWorldPlayer).length ?? 0}
        badge={isPJ ? pending.data?.length : undefined}
      />
      <div className={`${s.cell} ${s.colAkce}`}>
        <EventsColumn worldId={world.id} />
      </div>
      <div className={`${s.cell} ${s.colNovinky}`}>
        <NewsColumn worldId={world.id} />
      </div>
      <div className={`${s.cell} ${s.colOblibene}`}>
        <FavoritePagesColumn world={world} />
      </div>
    </div>
  );
}
