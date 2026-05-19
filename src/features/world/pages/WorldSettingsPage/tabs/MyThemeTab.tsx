import { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { worldThemePreviewAtom } from '@/themes/state';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { useUpdateMyWorldTheme } from '@/features/world/api/useUpdateMyWorldTheme';
import { SettingsPanel } from '../components/SettingsPanel';
import { ThemeCustomEditor } from '../components/ThemeCustomEditor';
import s from './ThemeTab.module.css';

/**
 * 5.9 — „Můj vzhled": per-uživatel doladění vzhledu světa (přístupnost).
 * Skin a písmo určuje PJ a nemění se; člen si ladí jen jas, kontrast a barvy.
 * Náhled vrství přes `worldThemePreviewAtom`; opuštění tabu náhled vyčistí.
 */
export default function MyThemeTab() {
  const { world } = useWorldContext();
  const { membership } = useWorldStatus(world?.id ?? '');
  const mutation = useUpdateMyWorldTheme(world?.id ?? '');
  const setPreview = useSetAtom(worldThemePreviewAtom);

  const [brightness, setBrightness] = useState(
    membership?.themeAdjust?.brightness ?? 1,
  );
  const [contrast, setContrast] = useState(
    membership?.themeAdjust?.contrast ?? 1,
  );
  const [overrides, setOverrides] = useState<Record<string, string>>(
    membership?.themeUserOverrides ?? {},
  );

  // Živý náhled — sdílený skin PJ + uživatelské úpravy.
  useEffect(() => {
    if (!world) return;
    setPreview({
      themeId: world.themeId ?? 'ikaros',
      overrides: { ...world.themeOverrides, ...overrides },
      backgroundUrl: world.themeBackgroundUrl,
      adjust: { brightness, contrast },
    });
  }, [world, overrides, brightness, contrast, setPreview]);

  useEffect(() => () => setPreview(null), [setPreview]);

  if (!world) return null;

  const isDirty =
    brightness !== 1 || contrast !== 1 || Object.keys(overrides).length > 0;

  async function save() {
    try {
      await mutation.mutateAsync({
        themeAdjust: { brightness, contrast },
        themeUserOverrides: overrides,
      });
      toast.success('Tvůj vzhled byl uložen.');
    } catch {
      toast.error('Uložení se nezdařilo.');
    }
  }

  function reset() {
    setBrightness(1);
    setContrast(1);
    setOverrides({});
  }

  return (
    <SettingsPanel
      title="Můj vzhled"
      description="Úpravy jen pro tebe — skin a písmo určuje PJ a nemění se. Dolaď si jas, kontrast a barvy pro svou čitelnost."
      action={
        <Button type="button" onClick={save} loading={mutation.isPending}>
          Uložit můj vzhled
        </Button>
      }
    >
      <div className={s.field}>
        <span className={s.fieldLabel}>
          Jas — {Math.round(brightness * 100)} %
        </span>
        <input
          type="range"
          min={0.7}
          max={1.3}
          step={0.05}
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          aria-label="Jas"
        />
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>
          Kontrast — {Math.round(contrast * 100)} %
        </span>
        <input
          type="range"
          min={0.7}
          max={1.3}
          step={0.05}
          value={contrast}
          onChange={(e) => setContrast(Number(e.target.value))}
          aria-label="Kontrast"
        />
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Barvy</span>
        <ThemeCustomEditor
          themeId={world.themeId ?? 'ikaros'}
          overrides={overrides}
          onChange={setOverrides}
        />
      </div>

      {isDirty && (
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Zpět na vzhled PJ
        </Button>
      )}
    </SettingsPanel>
  );
}
