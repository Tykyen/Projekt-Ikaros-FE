import { Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { SettingsPanel } from '../components/SettingsPanel';
import { PjChatPersonaEditor } from '../components/PjChatPersonaEditor';
import { MyPjAvatarEditor } from '../components/MyPjAvatarEditor';

/**
 * 6.8 / 6.8-followup — PJ identita v chatu (i headeru).
 *
 * Přepínač režimu (Anonymně/Rozpoznatelně) + sdílená persona = **PJ-only**
 * (politika světa). „Můj obrázek vedení" = **PomocnyPJ+ self-service** (každý svůj).
 * Proto je tab viditelný od PomocnyPJ (minRole), ale uvnitř se gateuje po sekcích.
 */
export default function PjChatTab() {
  const { world, userRole } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');
  const { membership } = useWorldStatus(world?.id ?? '');

  if (!world) return null;

  const isPJ = userRole === WorldRole.PJ;
  const isLeader = (userRole ?? -1) >= WorldRole.PomocnyPJ;
  const mode = settingsQ.data?.pjChatPersona?.mode ?? 'unified';

  return (
    <SettingsPanel
      title="PJ v chatu"
      description="Jak vystupuje vedení světa v chatu i v hlavičce."
    >
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-muted)',
          margin: '0 0 16px',
        }}
      >
        Vedení (PJ i Pomocný PJ) buď vystupuje <strong>anonymně</strong> jako
        jedno „PJ", nebo <strong>rozpoznatelně</strong> — každý se svým obrázkem a
        rolí. Nastavení se projeví <strong>zpětně</strong> i na starších zprávách.
        Když PJ píše „za bytost" (NPC režim), zůstává tou bytostí.
      </p>

      {settingsQ.isLoading || !settingsQ.data ? (
        <Spinner center />
      ) : (
        <>
          {isPJ && (
            <PjChatPersonaEditor worldId={world.id} settings={settingsQ.data} />
          )}
          {isLeader && (
            <MyPjAvatarEditor
              worldId={world.id}
              role={userRole as WorldRole}
              mode={mode}
              currentAvatarUrl={membership?.pjPersonaAvatarUrl ?? null}
            />
          )}
        </>
      )}
    </SettingsPanel>
  );
}
