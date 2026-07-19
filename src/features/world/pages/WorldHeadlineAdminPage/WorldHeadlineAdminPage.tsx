import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Spinner, ErrorState } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import type { HeadlineNode, MenuTemplate } from '@/shared/types';
import { HIDEABLE_NAV_IDS } from '@/features/world/lib/worldNavConfig';
import { NavVisibilitySection } from './components/NavVisibilitySection';
import { CustomHeadlineBuilder } from './components/CustomHeadlineBuilder';
import { MenuTemplatesSection } from './components/MenuTemplatesSection';
import { LastInfoSection } from './components/LastInfoSection';
import { HeadlinePreview } from './components/HeadlinePreview';
import s from './WorldHeadlineAdminPage.module.css';

/** Lokální editovatelný stav „Last info" (bez serverového `updatedAt`). */
export interface LastInfoDraft {
  text: string;
  visible: boolean;
}

function sanitizeHidden(input: readonly string[] | undefined): string[] {
  return (input ?? []).filter((id) => HIDEABLE_NAV_IDS.has(id));
}

/**
 * 12.2 — Hlavní lišta světa (PJ+). Jedno místo pro řízení headline:
 * viditelnost modulů + vlastní navigace + šablony menu + „Last info" box.
 * Vlevo editor (sekce), vpravo živý náhled. Jedno „Uložit" (dirty-tracking).
 */
export default function WorldHeadlineAdminPage() {
  const { worldId, worldSlug, world } = useWorldContext();
  const settingsQ = useWorldSettings(worldId);
  const mutation = useUpdateWorldSettings(worldId);

  // Server snapshot → lokální draft. Re-sync při změně serverových dat.
  const initial = useMemo(
    () => ({
      hiddenNavItems: sanitizeHidden(settingsQ.data?.hiddenNavItems),
      customHeadline: settingsQ.data?.customHeadline ?? [],
      menuTemplates: settingsQ.data?.menuTemplates ?? [],
      lastInfo: settingsQ.data?.lastInfo
        ? {
            text: settingsQ.data.lastInfo.text,
            visible: settingsQ.data.lastInfo.visible,
          }
        : null,
    }),
    [settingsQ.data],
  );

  const [hidden, setHidden] = useState<string[]>(initial.hiddenNavItems);
  const [headline, setHeadline] = useState<HeadlineNode[]>(
    initial.customHeadline,
  );
  const [templates, setTemplates] = useState<MenuTemplate[]>(
    initial.menuTemplates,
  );
  const [lastInfo, setLastInfo] = useState<LastInfoDraft | null>(
    initial.lastInfo,
  );

  // Re-sync draftu když dorazí čerstvá serverová data (změna reference initial).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setHidden(initial.hiddenNavItems);
    setHeadline(initial.customHeadline);
    setTemplates(initial.menuTemplates);
    setLastInfo(initial.lastInfo);
  }

  if (!world) return null;
  if (settingsQ.isLoading) return <Spinner center />;
  // `useWorldSettings` na chybě vrací `data === undefined` → `initial` výše
  // spadne na prázdné hodnoty (navigace/menu/lastInfo vypadají smazané) a po
  // jakékoli editaci by `save()` přepsal reálnou hlavní lištu v DB. Editor proto
  // nad chybou vůbec nepouštíme (stejný kontrakt jako opravený SettingsPanel).
  if (settingsQ.isError)
    return (
      <div className={s.page}>
        <ErrorState
          size="panel"
          title="Hlavní lištu se nepodařilo načíst"
          description="Editor radši neukazujeme — mohl by zobrazit prázdné hodnoty místo tvé navigace a uložením ji přepsat. Zkus to prosím znovu."
          onRetry={() => void settingsQ.refetch()}
        />
      </div>
    );

  const dirty = JSON.stringify({ hidden, headline, templates, lastInfo })
    !== JSON.stringify({
      hidden: initial.hiddenNavItems,
      headline: initial.customHeadline,
      templates: initial.menuTemplates,
      lastInfo: initial.lastInfo,
    });
  const saving = mutation.isPending;

  async function save() {
    try {
      await mutation.mutateAsync({
        hiddenNavItems: hidden,
        customHeadline: headline,
        menuTemplates: templates,
        lastInfo: lastInfo
          ? { text: lastInfo.text, visible: lastInfo.visible }
          : null,
      });
      toast.success('Hlavní lišta uložena.');
    } catch {
      toast.error('Uložení selhalo.');
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Hlavní lišta světa</h1>
          <p className={s.subtitle}>
            Skryj nepoužívané moduly, postav vlastní navigaci a nastav oznámení
            pro členy. Změny se projeví v horní liště po uložení.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={save}
          loading={saving}
          disabled={!dirty}
        >
          Uložit
        </Button>
      </header>

      <div className={s.layout}>
        <div className={s.editor}>
          <NavVisibilitySection value={hidden} onChange={setHidden} />
          <CustomHeadlineBuilder
            worldId={worldId}
            worldSlug={worldSlug}
            value={headline}
            onChange={setHeadline}
          />
          <MenuTemplatesSection
            worldId={worldId}
            worldSlug={worldSlug}
            value={templates}
            onChange={setTemplates}
            onInsert={(group) => setHeadline((prev) => [...prev, group])}
          />
          <LastInfoSection value={lastInfo} onChange={setLastInfo} />
        </div>

        <aside className={s.previewPane}>
          <HeadlinePreview
            worldName={world.name}
            hidden={hidden}
            headline={headline}
            isPJ
            lastInfo={lastInfo}
          />
        </aside>
      </div>
    </div>
  );
}
