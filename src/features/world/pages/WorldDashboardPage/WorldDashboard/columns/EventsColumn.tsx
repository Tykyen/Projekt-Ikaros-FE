import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { useWorldGameEvents } from '@/features/world/api/useGameEvents';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { WorldRole } from '@/shared/types';
import { GameEventModal } from '@/features/world/components/GameEventModal/GameEventModal';
import { GameEventCard } from '@/features/world/components/GameEventCard/GameEventCard';
import { DashColumn } from '../components/DashColumn';
import s from './column.module.css';

interface Props {
  worldId: string;
}

/**
 * 5.2 — levý sloupec dashboardu: nadcházející herní akce světa (max 3).
 *
 * 9.1-I (2026-05-25 follow-up): „+ Nová akce" button v hlavičce pro PJ+
 * (paralela s Ikaros 2.1b dashboard), footer link vede na `/akce`
 * (stránka s archivem a správou), ne na `/kalendar`.
 */
export function EventsColumn({ worldId }: Props) {
  const { worldSlug, userRole, world } = useWorldContext();
  const { data, isLoading } = useWorldGameEvents(worldId, 3);
  const events = data ?? [];
  const settingsQ = useWorldSettings(worldId);
  const customGroups = settingsQ.data?.customGroups ?? [];
  const groupColors = settingsQ.data?.groupColors ?? {};

  // Elevation — nahozený admin dostává plnou PJ moc v tomto světě; `viewerRole`
  // se pak předává i do `GameEventCard` (canManage), takže OR stačí zavést tady.
  const isElevatedHere = world?.elevated === true;
  const viewerRole = isElevatedHere
    ? WorldRole.PJ
    : (userRole ?? WorldRole.Zadatel);
  const canCreate = viewerRole >= WorldRole.PomocnyPJ;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <DashColumn
      icon={<CalendarDays size={18} />}
      title="Akce"
      action={
        canCreate ? (
          <button
            type="button"
            className={s.addBtn}
            aria-label="Nová akce"
            title="Nová akce"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        ) : null
      }
      footer={
        <Link className={s.moreLink} to={`/svet/${worldSlug}/akce`}>
          {canCreate ? 'Všechny akce a archiv →' : 'Všechny akce →'}
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
            <GameEventCard
              key={e.id}
              event={e}
              viewerRole={viewerRole}
              worldId={worldId}
              customGroups={customGroups}
              groupColors={groupColors}
            />
          ))}
        </div>
      )}

      {canCreate && createOpen && (
        <GameEventModal
          open
          onClose={() => setCreateOpen(false)}
          worldId={worldId}
          customGroups={customGroups}
          groupColors={groupColors}
        />
      )}
    </DashColumn>
  );
}
