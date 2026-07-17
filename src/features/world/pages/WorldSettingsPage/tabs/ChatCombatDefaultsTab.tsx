import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import type { ChatCombatDefaults } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import { SettingsPanel } from '../components/SettingsPanel';
import s from './MapDefaultsTab.module.css';

function normalize(
  src: ChatCombatDefaults | null | undefined,
): Required<ChatCombatDefaults> {
  return {
    showHpPc: src?.showHpPc ?? true,
    showHpNpc: src?.showHpNpc ?? true,
    showHpBestie: src?.showHpBestie ?? true,
  };
}

/**
 * 16.1e — výchozí viditelnost HP v combat rosteru CHATU (per typ). PJ nastaví
 * jednou; každá konverzace ji dědí, dokud ji nepřebije vlastním 👁 přepínačem
 * (v panelu Souboj). Samostatné od map defaults (chat ≠ mapa).
 */
export default function ChatCombatDefaultsTab() {
  const { world } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');
  const mutation = useUpdateWorldSettings(world?.id ?? '');

  const initial = useMemo(
    () => normalize(settingsQ.data?.chatCombatDefaults),
    [settingsQ.data?.chatCombatDefaults],
  );
  const [local, setLocal] = useState<Required<ChatCombatDefaults>>(initial);
  const [prevInitial, setPrevInitial] =
    useState<Required<ChatCombatDefaults>>(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setLocal(initial);
  }

  if (!world) return null;

  const dirty = JSON.stringify(local) !== JSON.stringify(initial);
  const saving = mutation.isPending;

  function patch<K extends keyof ChatCombatDefaults>(
    key: K,
    value: Required<ChatCombatDefaults>[K],
  ): void {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  async function save(): Promise<void> {
    try {
      await mutation.mutateAsync({ chatCombatDefaults: local });
      toast.success('Výchozí viditelnost HP v chatu uložena');
    } catch {
      toast.error('Uložení selhalo');
    }
  }

  return (
    <SettingsPanel
      title="Souboj v chatu — viditelnost HP"
      description="Komu se ukazují životy bojovníků v liště souboje (záložka „Souboj“ v chatu). Výchozí pro nové konverzace; každou konverzaci lze přepnout přímo v jejím panelu Souboj (👁)."
      query={settingsQ}
    >
      <div className={s.form}>
          <div className={s.checks}>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showHpPc}
                onChange={(e) => patch('showHpPc', e.target.checked)}
              />
              HP u postav (PC) vidí hráči
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showHpNpc}
                onChange={(e) => patch('showHpNpc', e.target.checked)}
              />
              HP u NPC vidí hráči
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showHpBestie}
                onChange={(e) => patch('showHpBestie', e.target.checked)}
              />
              HP u bestií vidí hráči
            </label>
          </div>

          <footer className={s.footer}>
            <Button
              variant="secondary"
              onClick={() => setLocal(normalize(null))}
              disabled={saving}
            >
              Resetovat na výchozí
            </Button>
            <Button onClick={save} disabled={!dirty || saving}>
              {saving ? 'Ukládám…' : 'Uložit změny'}
            </Button>
          </footer>
      </div>
    </SettingsPanel>
  );
}
