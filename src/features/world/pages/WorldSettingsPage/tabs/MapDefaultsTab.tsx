import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Spinner } from '@/shared/ui';
import type { MapDefaults } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import { SettingsPanel } from '../components/SettingsPanel';
import s from './MapDefaultsTab.module.css';

/** Plně vyplněné defaulty (UI vždy pracuje s konkrétními hodnotami). */
function normalize(src: MapDefaults | null | undefined): Required<MapDefaults> {
  return {
    gridType: src?.gridType ?? 'hex',
    size: src?.size ?? 40,
    unitsPerCell: src?.unitsPerCell ?? 1,
    unitLabel: src?.unitLabel ?? 'm',
    showScale: src?.showScale ?? true,
    showHpPc: src?.showHpPc ?? true,
    showHpNpc: src?.showHpNpc ?? true,
    showHpBestie: src?.showHpBestie ?? true,
    allowPlayerDrawing: src?.allowPlayerDrawing ?? false,
  };
}

const GRID_TYPES: {
  value: NonNullable<MapDefaults['gridType']>;
  label: string;
}[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'square', label: 'Čtverec' },
  { value: 'none', label: 'Žádná' },
];

/**
 * 15.4 (E) — výchozí nastavení map světa. PJ nastaví jednou; každá NOVÁ scéna je
 * zdědí (BE seed při create), scéna pak může vše přepsat v „Upravit scénu".
 */
export default function MapDefaultsTab() {
  const { world } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');
  const mutation = useUpdateWorldSettings(world?.id ?? '');

  const initial = useMemo(
    () => normalize(settingsQ.data?.mapDefaults),
    [settingsQ.data?.mapDefaults],
  );
  const [local, setLocal] = useState<Required<MapDefaults>>(initial);
  const [prevInitial, setPrevInitial] =
    useState<Required<MapDefaults>>(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setLocal(initial);
  }

  if (!world) return null;

  const dirty = JSON.stringify(local) !== JSON.stringify(initial);
  const saving = mutation.isPending;

  function patch<K extends keyof MapDefaults>(
    key: K,
    value: Required<MapDefaults>[K],
  ): void {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  async function save(): Promise<void> {
    try {
      await mutation.mutateAsync({ mapDefaults: local });
      toast.success('Výchozí nastavení map uloženo');
    } catch {
      toast.error('Uložení selhalo');
    }
  }

  return (
    <SettingsPanel
      title="Výchozí nastavení map"
      description="Co se nastaví u každé nově založené scény. Existující scény zůstávají; každou scénu lze pak individuálně přepsat v „Upravit scénu“."
    >
      {settingsQ.isLoading ? (
        <Spinner center />
      ) : (
        <div className={s.form}>
          <div className={s.field}>
            <span className={s.label}>Typ mřížky</span>
            <div className={s.segmented}>
              {GRID_TYPES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={
                    local.gridType === g.value
                      ? `${s.segBtn} ${s.segBtnActive}`
                      : s.segBtn
                  }
                  onClick={() => patch('gridType', g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className={s.row}>
            <label className={s.field}>
              <span className={s.label}>Velikost buňky (px)</span>
              <input
                type="number"
                min={10}
                max={120}
                value={local.size}
                onChange={(e) => patch('size', Number(e.target.value))}
                className={s.input}
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Jednotek na buňku</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={local.unitsPerCell}
                onChange={(e) => patch('unitsPerCell', Number(e.target.value))}
                className={s.input}
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Jednotka</span>
              <input
                type="text"
                maxLength={8}
                value={local.unitLabel}
                onChange={(e) => patch('unitLabel', e.target.value)}
                className={s.input}
              />
            </label>
          </div>

          <div className={s.checks}>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showScale}
                onChange={(e) => patch('showScale', e.target.checked)}
              />
              Zobrazit stupnici
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showHpPc}
                onChange={(e) => patch('showHpPc', e.target.checked)}
              />
              HP u postav (PC)
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showHpNpc}
                onChange={(e) => patch('showHpNpc', e.target.checked)}
              />
              HP u NPC
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.showHpBestie}
                onChange={(e) => patch('showHpBestie', e.target.checked)}
              />
              HP u bestií
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={local.allowPlayerDrawing}
                onChange={(e) => patch('allowPlayerDrawing', e.target.checked)}
              />
              Hráči smí kreslit anotace
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
      )}
    </SettingsPanel>
  );
}
