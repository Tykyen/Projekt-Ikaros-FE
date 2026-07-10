import { useState } from 'react';
import { Clock, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  calendarConfigsKey,
  useCalendarConfigs,
  useCreateCalendarConfig,
  useDeleteCalendarConfig,
  useUpdateCalendarDefaults,
} from '@/features/world/api/useCalendarConfigs';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import type { CalendarPreset } from '@/shared/lib/calendarEngine/presets';
import { CalendarConfigEditor } from './CalendarConfigEditor';
import { CalendarPresetPicker } from './components/CalendarPresetPicker';
import s from './CalendarConfigsPage.module.css';

/**
 * 9.2b-IV — Stránka pro správu kalendářů světa (PJ+).
 * Route: `/svet/:worldSlug/admin/kalendare`.
 *
 * Layout: sidebar seznam + editor vybraného configu. Default config
 * označen ⭐ ikonou. Smaž default → 403 lock (BE).
 */
export default function CalendarConfigsPage() {
  const { worldId, world } = useWorldContext();
  const qc = useQueryClient();
  const { data: configs = [], isLoading } = useCalendarConfigs(worldId);
  const create = useCreateCalendarConfig(worldId);
  const deleteMutation = useDeleteCalendarConfig(worldId);
  const setDefaults = useUpdateCalendarDefaults(worldId);

  const defaultSlug = world?.defaultCalendarConfigSlug ?? 'gregorian';
  const { data: settings } = useWorldSettings(worldId);
  const updateSettings = useUpdateWorldSettings(worldId);
  // 9.3-followup-FIX — fallback hierarchie: explicit timeline → world default → configs[0]
  const timelineSlug =
    settings?.timelineCalendarSlug ?? defaultSlug ?? configs[0]?.slug ?? null;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // 9.3-F-I — 2-step wizard: closed → picker → identity (s pre-fill).
  type WizardState =
    | { step: 'closed' }
    | { step: 'picker' }
    | { step: 'identity'; preset: CalendarPreset | null };
  const [wizard, setWizard] = useState<WizardState>({ step: 'closed' });

  function handleSetTimelineConfig(slug: string) {
    updateSettings.mutate(
      { timelineCalendarSlug: slug },
      {
        onSuccess: () =>
          toast.success(`„${slug}" je nyní aktivní pro časovou osu.`),
        onError: () =>
          toast.error('Změna kalendáře pro časovou osu se nezdařila.'),
      },
    );
  }

  // Auto-select default — R19 render-phase setState. Podmínka `!selectedSlug` je
  // self-limiting (po nastavení už nespustí → žádná smyčka), proto bez useEffect.
  if (!selectedSlug && configs.length > 0) {
    const initial =
      configs.find((c) => c.slug === defaultSlug)?.slug ?? configs[0].slug;
    setSelectedSlug(initial);
  }

  const selected = configs.find((c) => c.slug === selectedSlug) ?? null;

  function handleDelete() {
    if (!selected) return;
    if (selected.slug === defaultSlug) {
      toast.error('Nelze smazat výchozí kalendář. Nejprve nastav jiný jako výchozí.');
      return;
    }
    if (!confirm(`Opravdu smazat kalendář „${selected.name}"?`)) return;
    deleteMutation.mutate(selected.slug, {
      onSuccess: () => {
        setSelectedSlug(null);
        toast.success('Kalendář smazán.');
      },
      onError: () => toast.error('Smazání se nezdařilo.'),
    });
  }

  function handleSetDefault() {
    if (!selected || selected.slug === defaultSlug) return;
    setDefaults.mutate(
      { defaultCalendarConfigSlug: selected.slug },
      {
        onSuccess: () => toast.success(`„${selected.name}" je nyní výchozí.`),
        onError: () => toast.error('Změna výchozího kalendáře se nezdařila.'),
      },
    );
  }

  if (isLoading) return <Spinner center />;

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Kalendáře světa</h1>
        <p className={s.subtitle}>
          Spravuj fantasy kalendáře — různé kultury, různé počítání času.
          Hvězda <Star size={12} aria-hidden /> označuje výchozí kalendář
          (dashboardy a novinky). Hodiny <Clock size={12} aria-hidden />{' '}
          označují kalendář pro <strong>časovou osu</strong> — datum
          historických událostí (9.3).
        </p>
        <span className={s.headerLine} aria-hidden="true" />
      </header>

      <div className={s.layout}>
        <aside className={s.list} aria-label="Seznam kalendářů">
          {configs.map((c) => (
            <div
              key={c.slug}
              className={`${s.listItem} ${selectedSlug === c.slug ? s.listItemActive : ''}`}
            >
              <button
                type="button"
                className={s.listItemMain}
                onClick={() => setSelectedSlug(c.slug)}
              >
                {c.slug === defaultSlug && (
                  <Star size={14} className={s.starIcon} aria-label="Výchozí" />
                )}
                {c.slug === timelineSlug && (
                  <Clock
                    size={14}
                    className={s.timelineIcon}
                    aria-label="Aktivní pro časovou osu"
                  />
                )}
                <span className={s.itemName}>{c.name}</span>
                <span className={s.itemSlug}>{c.slug}</span>
              </button>
              {c.slug !== timelineSlug && (
                <button
                  type="button"
                  className={s.setTimelineBtn}
                  onClick={() => handleSetTimelineConfig(c.slug)}
                  title="Použít tento kalendář pro časovou osu"
                  aria-label={`Použít „${c.name}" pro časovou osu`}
                  disabled={updateSettings.isPending}
                >
                  <Clock size={12} aria-hidden />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className={s.addBtn}
            onClick={() => setWizard({ step: 'picker' })}
          >
            <Plus size={14} aria-hidden /> Přidat kalendář
          </button>
        </aside>

        {selected ? (
          <CalendarConfigEditor
            key={selected.slug}
            config={selected}
            isDefault={selected.slug === defaultSlug}
            worldId={worldId}
            onSetDefault={handleSetDefault}
            onDelete={handleDelete}
          />
        ) : (
          <p className={s.editorEmpty}>
            Vyber kalendář ze seznamu, nebo přidej nový.
          </p>
        )}
      </div>

      {wizard.step === 'picker' && (
        <CalendarPresetPicker
          open
          onClose={() => setWizard({ step: 'closed' })}
          onPick={(preset) => setWizard({ step: 'identity', preset })}
          existingSlugs={new Set(configs.map((c) => c.slug))}
        />
      )}

      {wizard.step === 'identity' && (
        <CreateModal
          preset={wizard.preset}
          existingSlugs={new Set(configs.map((c) => c.slug))}
          onBack={() => setWizard({ step: 'picker' })}
          onClose={() => setWizard({ step: 'closed' })}
          onCreate={async (slug, name) => {
            // 9.3-F-I — pokud máme preset, použij jeho template; jinak empty defaults.
            const template = wizard.preset?.template ?? {
              hoursPerDay: 24,
              daysOfWeek: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
              months: [{ name: 'První měsíc', daysCount: 30 }],
              celestialBodies: [],
              seasons: [],
              epochOffset: 0,
            };
            await create.mutateAsync(
              {
                ...template,
                slug,
                name,
              },
              {
                onSuccess: () => {
                  toast.success(`Kalendář „${name}" vytvořen.`);
                  setSelectedSlug(slug);
                  setWizard({ step: 'closed' });
                },
                onError: (err) => {
                  // 9.3-F-II FIX — 409 Conflict (SLUG_TAKEN) = slug v DB skutečně
                  // existuje (možná stale FE cache). Vynuti refetch + ponechá wizard
                  // otevřený s předvyplněnými hodnotami, ať může PJ slug změnit.
                  if (axios.isAxiosError(err) && err.response?.status === 409) {
                    void qc.invalidateQueries({
                      queryKey: calendarConfigsKey(worldId),
                    });
                    toast.error(
                      `Slug „${slug}" už ve světě existuje. Zvol jiný (např. „${slug}-2"). Seznam byl aktualizován.`,
                    );
                    return; // wizard zůstává otevřený, PJ upraví slug
                  }
                  toast.error('Vytvoření se nezdařilo.');
                },
              },
            );
          }}
          pending={create.isPending}
        />
      )}
    </article>
  );
}

/** 9.3-F-I — Auto-suffix `slug` při konfliktu (`gregorian` → `gregorian-2`). */
function resolveSlugConflict(
  slug: string,
  existing: ReadonlySet<string>,
): string {
  if (!existing.has(slug)) return slug;
  let i = 2;
  while (existing.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

interface CreateModalProps {
  preset: CalendarPreset | null;
  existingSlugs: ReadonlySet<string>;
  onClose: () => void;
  onBack: () => void;
  onCreate: (slug: string, name: string) => Promise<void>;
  pending: boolean;
}

function CreateModal({
  preset,
  existingSlugs,
  onClose,
  onBack,
  onCreate,
  pending,
}: CreateModalProps) {
  // 9.3-F-I — pre-fill z preset, auto-suffix slug při konfliktu.
  const initialSlug = preset
    ? resolveSlugConflict(preset.slug, existingSlugs)
    : '';
  const initialName = preset?.name ?? '';
  const [slug, setSlug] = useState(initialSlug);
  const [name, setName] = useState(initialName);
  const slugValid = /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
  const canSubmit = slugValid && name.trim().length > 0 && !pending;

  return (
    <Modal
      open
      onClose={onClose}
      title={preset ? `Nový kalendář — ${preset.name}` : 'Nový kalendář — prázdný'}
      size="sm"
    >
      <div className={s.section}>
        {preset && (
          <p className={s.presetHint}>
            Šablona „{preset.name}" pre-fillne {preset.template.months.length}{' '}
            měsíců, {preset.template.daysOfWeek.length} dní v týdnu
            {preset.template.leapYearRule
              ? `, leap pravidlo ${preset.template.leapYearRule.type}`
              : ''}
            . V editoru můžeš upravit.
          </p>
        )}
        <div>
          <label className={s.label} htmlFor="cc-name">
            Název
          </label>
          {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus */}
          <input
            id="cc-name"
            className={s.field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Např. Elfí kalendář"
            autoFocus
          />
          {/* eslint-enable jsx-a11y/no-autofocus */}
        </div>
        <div>
          <label className={s.label} htmlFor="cc-slug">
            Slug (URL identifikátor)
          </label>
          <input
            id="cc-slug"
            className={s.field}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="elfi-kalendar"
          />
          <p className={s.unit}>
            {existingSlugs.has(slug)
              ? `⚠️ Slug "${slug}" už existuje — uprav.`
              : 'Jen malá písmena, čísla a pomlčky.'}
          </p>
        </div>
      </div>
      <div className={s.actionsBar}>
        <Button variant="ghost" size="md" onClick={onBack} disabled={pending}>
          ← Zpět
        </Button>
        <Button variant="ghost" size="md" onClick={onClose} disabled={pending}>
          Zrušit
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={pending}
          disabled={!canSubmit || existingSlugs.has(slug)}
          onClick={() => void onCreate(slug, name.trim())}
        >
          Vytvořit
        </Button>
      </div>
    </Modal>
  );
}
