import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { SettingsPanel } from '../components/SettingsPanel';
import { PjChatPersonaEditor } from '../components/PjChatPersonaEditor';

/**
 * 6.8 — PJ identita v chatu. Vedení (role ≥ PomocnyPJ) vystupuje pod jednotnou
 * personou „PJ" + per-svět avatar, místo přihlašovacího jména.
 */
export default function PjChatTab() {
  const { world } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');

  if (!world) return null;

  return (
    <SettingsPanel
      title="PJ v chatu"
      description="Jak vystupuje vedení světa v chatu."
    >
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-muted)',
          margin: '0 0 16px',
        }}
      >
        Vedení světa (PJ i Pomocný PJ) může v chatu vystupovat pod jednotnou
        identitou <strong>„PJ"</strong> místo přihlašovacího jména — kvůli
        ponoření a tajemství. Nastavení se projeví <strong>zpětně</strong> i na
        starších zprávách. Když PJ píše „za bytost" (NPC režim), zůstává tou
        bytostí.
      </p>

      {settingsQ.isLoading || !settingsQ.data ? (
        <Spinner center />
      ) : (
        <PjChatPersonaEditor worldId={world.id} settings={settingsQ.data} />
      )}
    </SettingsPanel>
  );
}
