import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { useWorldGameEvents } from '@/features/world/api/useGameEvents';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { DashColumn } from '../components/DashColumn';
import { WorldEventCard } from '../components/WorldEventCard';
import s from './column.module.css';

interface Props {
  worldId: string;
}

/** 5.2 — levý sloupec dashboardu: nadcházející herní akce světa (max 3). */
export function EventsColumn({ worldId }: Props) {
  const { worldSlug } = useWorldContext();
  const { data, isLoading } = useWorldGameEvents(worldId, 3);
  const events = data ?? [];

  return (
    <DashColumn
      icon={<CalendarDays size={18} />}
      title="Akce"
      footer={
        <Link className={s.moreLink} to={`/svet/${worldSlug}/kalendar`}>
          Kalendář akcí →
        </Link>
      }
    >
      {isLoading ? (
        <Spinner center />
      ) : events.length === 0 ? (
        <p className={s.empty}>Žádné nadcházející akce.</p>
      ) : (
        <div className={s.list}>
          {events.map((e) => (
            <WorldEventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </DashColumn>
  );
}
