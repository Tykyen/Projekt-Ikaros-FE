import { useEffect, useRef, useState } from 'react';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { worldThemePreviewAtom } from '@/themes/state';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { useUpdateMyWorldTheme } from '@/features/world/api/useUpdateMyWorldTheme';
import { useUploadImage } from '@/shared/api';
import { SettingsPanel } from '../components/SettingsPanel';
import { ThemePresetGrid } from '../components/ThemePresetGrid';
import { ThemeCustomEditor } from '../components/ThemeCustomEditor';
import s from './ThemeTab.module.css';

/**
 * 5.9 / 5.9b — „Můj vzhled": per-uživatel vzhled světa, JEN pro mě.
 * 5.9b otáčí 5.9 §5 (dřív skin uživatel neměnil) — člen si může zvolit vlastní
 * motiv i vlastní pozadí; vše se ukládá na jeho membership a nikdy se nepropisuje
 * do World ani jiným členům. Náhled vrství přes `worldThemePreviewAtom`; opuštění
 * tabu náhled vyčistí.
 *
 * „Follow PJ" sémantika: vlastní motiv se ukládá jen když se LIŠÍ od motivu světa
 * (jinak `null` = clear). Tak člen nezůstane zaseknutý na starém motivu, když PJ
 * změní sdílený motiv světa.
 */
export default function MyThemeTab() {
  const { world } = useWorldContext();
  const { membership } = useWorldStatus(world?.id ?? '');
  const mutation = useUpdateMyWorldTheme(world?.id ?? '');
  const upload = useUploadImage();
  const setPreview = useSetAtom(worldThemePreviewAtom);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sdílený motiv světa (PJ) = výchozí; když ho člen nepřebíjí, „Můj vzhled"
  // automaticky sleduje, co nastaví PJ.
  const worldThemeId = world?.themeId ?? 'ikaros';

  const [themeId, setThemeId] = useState(membership?.themeId ?? worldThemeId);
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>(
    membership?.themeBackgroundUrl ?? undefined,
  );
  const [brightness, setBrightness] = useState(
    membership?.themeAdjust?.brightness ?? 1,
  );
  const [contrast, setContrast] = useState(
    membership?.themeAdjust?.contrast ?? 1,
  );
  const [overrides, setOverrides] = useState<Record<string, string>>(
    membership?.themeUserOverrides ?? {},
  );

  // Zvolil si člen JINÝ motiv než svět? Pak je jeho vrstva samostatná (PJ
  // overrides/pozadí laděné pro skin světa se nevztáhnou); jinak člen jen vrší
  // své úpravy nad sdíleným motivem. Zrcadlí resolveru ve `WorldLayout`.
  const usingOwnMotif = themeId !== worldThemeId;

  // Živý náhled — co uloží, to vidí (parita s WorldLayout).
  useEffect(() => {
    if (!world) return;
    setPreview({
      themeId,
      overrides: usingOwnMotif
        ? overrides
        : { ...world.themeOverrides, ...overrides },
      backgroundUrl: usingOwnMotif
        ? backgroundUrl
        : (backgroundUrl ?? world.themeBackgroundUrl),
      adjust: { brightness, contrast },
    });
  }, [
    world,
    themeId,
    usingOwnMotif,
    overrides,
    backgroundUrl,
    brightness,
    contrast,
    setPreview,
  ]);

  useEffect(() => () => setPreview(null), [setPreview]);

  if (!world) return null;

  const isDirty =
    brightness !== 1 ||
    contrast !== 1 ||
    Object.keys(overrides).length > 0 ||
    usingOwnMotif ||
    !!backgroundUrl;

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
        themeAdjust: { brightness, contrast },
        themeUserOverrides: overrides,
        // Vlastní motiv ukládej jen když se liší od PJ (jinak null = sleduj PJ).
        themeId: usingOwnMotif ? themeId : null,
        themeBackgroundUrl:
          backgroundUrl && backgroundUrl.trim() ? backgroundUrl : null,
      });
      toast.success('Tvůj vzhled byl uložen.');
    } catch {
      toast.error('Uložení se nezdařilo.');
    }
  }

  function reset() {
    setThemeId(worldThemeId);
    setBackgroundUrl(undefined);
    setOverrides({});
    setBrightness(1);
    setContrast(1);
  }

  return (
    <SettingsPanel
      title="Můj vzhled"
      description="Úpravy jen pro tebe — vyber si vlastní motiv a pozadí a dolaď barvy, jas a kontrast. Nic z toho neuvidí ostatní členové ani PJ."
      action={
        <Button type="button" onClick={save} loading={mutation.isPending}>
          Uložit můj vzhled
        </Button>
      }
    >
      <div className={s.field}>
        <span className={s.fieldLabel}>Můj motiv</span>
        <ThemePresetGrid value={themeId} onChange={setThemeId} />
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Moje pozadí</span>
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
          themeId={themeId}
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
