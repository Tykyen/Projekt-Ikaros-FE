import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { SettingsPanel } from '../components/SettingsPanel';
import { AkjLevelEditor } from '../components/AkjLevelEditor';
import s from './AkjTab.module.css';

/**
 * 5.3d — definice AKJ úrovní (stupňovaná „prověrka" viditelnosti stránek).
 */
export default function AkjTab() {
  const { world } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');

  if (!world) return null;

  return (
    <SettingsPanel
      title="AKJ úrovně"
      description="Stupňovaná prověrka řídící viditelnost wiki stránek."
    >
      <p className={s.note}>
        AKJ je stupňovaná prověrka. Určuje, které stránky světa hráč uvidí a
        jak utajené jsou (uplatní se v kroku 7.2e). Úrovně si libovolně
        pojmenuj dle světa — např. <em>Veřejné → Tajný spis → Nejvyšší
        prověrka</em>. Přiřazení úrovně jednotlivým členům řeší tab Členové.
      </p>

      {settingsQ.isLoading ? (
        <Spinner center />
      ) : (
        <AkjLevelEditor
          worldId={world.id}
          initial={settingsQ.data?.akjTypes ?? []}
        />
      )}
    </SettingsPanel>
  );
}
