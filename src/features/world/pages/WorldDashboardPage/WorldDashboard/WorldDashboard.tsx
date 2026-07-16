import { Users, MessageSquare } from 'lucide-react';
import type { World } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldChatUnread } from '@/features/world/api/useWorldChat';
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
 * Levý sloupec: dlaždice Hráči + box Akce. Střední: dlaždice Chat + box
 * Novinky. Pravý: Oblíbené stránky přes plnou výšku.
 */
export function WorldDashboard({ world }: Props) {
  const { isPJ } = useWorldContext();
  const members = useWorldMembers(world.id);
  const chatUnread = useWorldChatUnread(world.id);
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
      <DashTile
        className={`${s.cell} ${s.tileChat}`}
        icon={<MessageSquare size={20} />}
        label="Chat"
        to={`/svet/${world.slug}/chat`}
        badge={chatUnread}
        accent
        cta="Otevřít"
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
