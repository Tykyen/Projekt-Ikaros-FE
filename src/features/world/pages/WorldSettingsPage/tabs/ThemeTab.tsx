import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { applyTheme } from '@/themes/applyTheme';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useUpdateWorld } from '@/features/world/api/useUpdateWorld';
import { useUploadContentImage } from '@/features/ikaros/api/useUploadContentImage';
import { SettingsPanel } from '../components/SettingsPanel';
import { ThemePresetGrid } from '../components/ThemePresetGrid';
import { ThemeCustomEditor } from '../components/ThemeCustomEditor';
import s from './ThemeTab.module.css';

const DEFAULT_THEME_ID = 'modre-nebe';

/**
 * 5.3f — Vzhled světa: výběr preset motivu + editor vlastních barev s živým
 * náhledem. Náhled vrství přes `:root`; opuštění tabu bez uložení obnoví
 * původní motiv světa (cleanup efektu).
 */
export default function ThemeTab() {
  const { world } = useWorldContext();
  const mutation = useUpdateWorld(world?.id ?? '');
  const upload = useUploadContentImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [themeId, setThemeId] = useState(world?.themeId ?? DEFAULT_THEME_ID);
  const [overrides, setOverrides] = useState<Record<string, string>>(
    world?.themeOverrides ?? {},
  );
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>(
    world?.themeBackgroundUrl,
  );

  // Stav světa při vstupu do tabu — pro obnovu při opuštění bez uložení.
  const originalRef = useRef({
    themeId: world?.themeId ?? DEFAULT_THEME_ID,
    overrides: world?.themeOverrides,
    backgroundUrl: world?.themeBackgroundUrl,
  });

  // Živý náhled — vrství aktuální volbu na :root.
  useEffect(() => {
    void applyTheme(themeId, { overrides, backgroundUrl });
  }, [themeId, overrides, backgroundUrl]);

  // Cleanup — opuštění tabu bez uložení vrátí motiv světa do původního stavu.
  useEffect(() => {
    const orig = originalRef.current;
    return () => {
      void applyTheme(orig.themeId, {
        overrides: orig.overrides,
        backgroundUrl: orig.backgroundUrl,
      });
    };
  }, []);

  if (!world) return null;

  const hasCustom =
    Object.keys(overrides).length > 0 || backgroundUrl !== undefined;

  async function handleBackground(file: File) {
    try {
      const res = await upload.mutateAsync(file);
      setBackgroundUrl(res.url);
      toast.success('Pozadí nahráno.');
    } catch {
      toast.error('Nahrání pozadí selhalo.');
    }
  }

  async function save() {
    try {
      await mutation.mutateAsync({
        themeId,
        themeOverrides: overrides,
        themeBackgroundUrl: backgroundUrl ?? '',
      });
      originalRef.current = { themeId, overrides, backgroundUrl };
      toast.success('Vzhled světa uložen.');
    } catch {
      toast.error('Uložení vzhledu selhalo.');
    }
  }

  return (
    <>
      <SettingsPanel
        title="Motiv světa"
        description="Sdílený vzhled světa — vidí ho všichni členové (mohou si ho lokálně přenastavit)."
        action={
          <Button type="button" onClick={save} loading={mutation.isPending}>
            Uložit vzhled
          </Button>
        }
      >
        <ThemePresetGrid value={themeId} onChange={setThemeId} />
      </SettingsPanel>

      <SettingsPanel
        title="Vlastní úpravy"
        description="Doladění barev nad zvoleným motivem a vlastní pozadí světa."
        action={
          hasCustom ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOverrides({});
                setBackgroundUrl(undefined);
              }}
            >
              Zpět na preset
            </Button>
          ) : undefined
        }
      >
        <div className={s.field}>
          <span className={s.fieldLabel}>Vlastní pozadí</span>
          <div className={s.bgRow}>
            {backgroundUrl ? (
              <img
                src={backgroundUrl}
                alt="Náhled pozadí"
                className={s.bgPreview}
              />
            ) : (
              <div className={s.bgEmpty}>Pozadí z motivu</div>
            )}
            <div className={s.bgActions}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleBackground(f);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={upload.isPending}
                onClick={() => fileRef.current?.click()}
              >
                Nahrát pozadí
              </Button>
              {backgroundUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setBackgroundUrl(undefined)}
                >
                  Odebrat
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={s.field}>
          <span className={s.fieldLabel}>Barvy</span>
          <ThemeCustomEditor
            themeId={themeId}
            overrides={overrides}
            onChange={setOverrides}
          />
        </div>

        <div className={s.preview} aria-label="Náhled motivu">
          <span className={s.previewHeading}>Náhled</span>
          <p className={s.previewText}>
            Takto vypadá text na panelu světa.
          </p>
          <span className={s.previewAccent}>Akcentový prvek</span>
        </div>
      </SettingsPanel>
    </>
  );
}
