import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { useWorldGameEvents } from '@/features/world/api/useGameEvents';
import { DashColumn } from '../components/DashColumn';
import { WorldEventCard } from '../components/WorldEventCard';
import s from './column.module.css';

interface Props {
  worldId: string;
}

/** 5.2 — levý sloupec dashboardu: nadcházející herní akce světa. */
export function EventsColumn({ worldId }: Props) {
  const { data, isLoading } = useWorldGameEvents(worldId, 10);
  const [visible, setVisible] = useState(5);
  const events = data ?? [];

  return (
    <DashColumn icon={<CalendarDays size={18} />} title="Akce">
      {isLoading ? (
        <Spinner center />
      ) : events.length === 0 ? (
        <p className={s.empty}>Žádné nadcházející akce.</p>
      ) : (
        <>
          <div className={s.list}>
            {events.slice(0, visible).map((e) => (
              <WorldEventCard key={e.id} event={e} />
            ))}
          </div>
          {visible < events.length && (
            <button
              type="button"
              className={s.more}
              onClick={() => setVisible((v) => v + 5)}
            >
              Zobrazit další ({events.length - visible})
            </button>
          )}
        </>
      )}
    </DashColumn>
  );
}
