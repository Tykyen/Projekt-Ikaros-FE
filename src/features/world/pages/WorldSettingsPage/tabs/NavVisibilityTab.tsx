import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import {
  HIDEABLE_NAV_ITEMS,
  HIDEABLE_NAV_IDS,
  type HideableNavItem,
} from '@/features/world/lib/worldNavConfig';
import { SettingsPanel } from '../components/SettingsPanel';
import s from './NavVisibilityTab.module.css';

const GROUP_LABELS: Record<HideableNavItem['group'], string> = {
  svet: 'Skupina „Svět"',
  hra: 'Skupina „Hra"',
  top: 'Hlavní lišta',
};

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

function sanitize(input: readonly string[] | undefined): string[] {
  return (input ?? []).filter((id) => HIDEABLE_NAV_IDS.has(id));
}

/**
 * 9.3-followup — checkbox list pro `WorldSettings.hiddenNavItems`.
 *
 * PJ+ tab. Esenciální items (Přehled, Stránky, Novinky, Pravidla) nelze
 * skrýt — nejsou v `HIDEABLE_NAV_ITEMS` whitelistu.
 */
export default function NavVisibilityTab() {
  const { world } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');
  const mutation = useUpdateWorldSettings(world?.id ?? '');

  const initial = useMemo(
    () => sanitize(settingsQ.data?.hiddenNavItems),
    [settingsQ.data?.hiddenNavItems],
  );
  const [local, setLocal] = useState<string[]>(initial);
  const [prevInitial, setPrevInitial] = useState<string[]>(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setLocal(initial);
  }

  if (!world) return null;

  if (settingsQ.isLoading) return <Spinner center />;

  const dirty = !sameSet(local, initial);
  const saving = mutation.isPending;
  const hiddenSet = new Set(local);

  function toggle(id: string) {
    setLocal((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function reset() {
    setLocal([]);
  }

  async function save() {
    try {
      await mutation.mutateAsync({ hiddenNavItems: local });
      toast.success('Viditelnost navigace uložena.');
    } catch {
      toast.error('Uložení selhalo.');
    }
  }

  const groups: HideableNavItem['group'][] = ['svet', 'hra', 'top'];

  return (
    <SettingsPanel
      title="Viditelnost navigace"
      description="Skryj v horní liště položky, které tvůj svět nepoužívá (např. Mapa vesmíru, Pavučina). Esenciální položky (Přehled, Stránky, Novinky, Pravidla) zůstávají vždy viditelné. Hráč může na skrytou stránku stále přijít přes URL — skrytí se týká jen navigace."
    >
      <div className={s.container}>
        {groups.map((group) => {
          const items = HIDEABLE_NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <fieldset key={group} className={s.group}>
              <legend className={s.groupLabel}>{GROUP_LABELS[group]}</legend>
              <ul className={s.list}>
                {items.map((item) => {
                  const isHidden = hiddenSet.has(item.id);
                  return (
                    <li key={item.id}>
                      <label
                        className={`${s.row} ${isHidden ? s.rowHidden : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={() => toggle(item.id)}
                          aria-label={`${item.label} — ${isHidden ? 'zobrazit' : 'skrýt'}`}
                        />
                        <span className={s.icon} aria-hidden>
                          {isHidden ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </span>
                        <span className={s.label}>{item.label}</span>
                        {item.hint && (
                          <span className={s.hint}>{item.hint}</span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}

        <div className={s.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={reset}
            disabled={saving || local.length === 0}
          >
            Zobrazit vše
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={save}
            loading={saving}
            disabled={!dirty}
          >
            Uložit
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}
