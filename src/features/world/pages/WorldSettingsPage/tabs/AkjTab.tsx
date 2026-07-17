import { useMemo } from 'react';
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
  // FIX-5 companion — `AkjLevelEditor` teď resetuje svůj lokální state při
  // změně `initial` reference (FIX-5). `?? []` by bez memoizace vytvořilo
  // NOVÉ prázdné pole při KAŽDÉM re-renderu (dokud svět nemá žádné akjTypes
  // uložené), což by reset spouštělo pořád dokola a mazalo rozepsané úpravy.
  const akjTypes = useMemo(
    () => settingsQ.data?.akjTypes ?? [],
    [settingsQ.data?.akjTypes],
  );

  if (!world) return null;

  return (
    <SettingsPanel
      title="AKJ úrovně"
      description="Stupňovaná prověrka řídící viditelnost wiki stránek."
      query={settingsQ}
    >
      <p className={s.note}>
        AKJ je stupňovaná prověrka. Určuje, které stránky světa hráč uvidí a
        jak utajené jsou (uplatní se v kroku 7.2e). Úrovně si libovolně
        pojmenuj dle světa — např. <em>Veřejné → Tajný spis → Nejvyšší
        prověrka</em>. Přiřazení úrovně jednotlivým členům řeší tab Členové.
      </p>

      <AkjLevelEditor worldId={world.id} initial={akjTypes} />
    </SettingsPanel>
  );
}
