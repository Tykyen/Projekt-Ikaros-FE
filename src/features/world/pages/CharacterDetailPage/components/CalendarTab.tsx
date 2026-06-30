import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal, Spinner } from '@/shared/ui';
import {
  GREGORIAN_DEFAULT_CONFIG,
  formatFantasyDate,
} from '@/shared/lib/calendarEngine';
import type { CalendarConfig, FantasyDate } from '@/shared/lib/calendarEngine';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import { resolveCalendarColor } from '@/shared/lib/calendarColor';
import { GroupColorPicker } from '@/features/world/chat/components/GroupColorPicker';
import { useCharacterCalendar } from '../../api/useCharacterSubdocs';
import { useUpdateCharacterCalendar } from '../../api/useCharacterMutations';
import type {
  CalendarEvent,
  CharacterCalendar,
} from '../../api/characters.types';
import { CalendarTabGrid } from './CalendarTabGrid';
import { EventEditorModal } from './EventEditorModal';
import { EditStickyBar } from './EditStickyBar';
import { EditModeBanner } from './EditModeBanner';
import s from './subdocs.module.css';
import ed from './editors/editors.module.css';

interface Props {
  slug: string;
  mode: 'view' | 'edit';
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  /** Horní „Hotovo" registruje aktuální save tabu (true=OK / false=fail). */
  onProvideSave?: (save: (() => Promise<boolean>) | null) => void;
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 8.1f + 9.2c + 9.2-FIX — Kalendář postavy.
 *
 * - View mode: mřížka, klik na chip → read-only detail modal.
 * - Edit mode: mřížka, klik na buňku → create modal s preset datem;
 *   klik na chip → edit modal s vyplněnými daty. Last-used datum se
 *   pamatuje v session pro další create flow.
 *
 * Kalendář je vybrán per `world.defaultCalendarConfigSlug`. PJ může
 * přepnout zobrazený kalendář v gridu (multi-config UX).
 */
export function CalendarTab({
  slug,
  mode,
  onExitEdit,
  onDirtyChange,
  onProvideSave,
}: Props) {
  const { worldId, world } = useWorldContext();
  const { data, isLoading, isError } = useCharacterCalendar(worldId, slug);
  const { data: configs = [] } = useCalendarConfigs(worldId);

  const defaultSlug = world?.defaultCalendarConfigSlug ?? 'gregorian';
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const initialActive =
    configs.find((c) => c.slug === defaultSlug)?.slug ?? configs[0]?.slug ?? null;
  const effectiveSlug = activeSlug ?? initialActive ?? 'gregorian';
  const activeConfig: CalendarConfig =
    configs.find((c) => c.slug === effectiveSlug) ?? GREGORIAN_DEFAULT_CONFIG;

  if (isLoading) return <Spinner center />;
  if (isError || !data) {
    return <p className={s.empty}>Kalendář se nepodařilo načíst.</p>;
  }

  const cursorStorageKey = `calendar-cursor-${worldId}-${data.characterId}`;

  if (mode === 'edit') {
    return (
      <CalendarTabEdit
        calendar={data}
        config={activeConfig}
        configs={configs}
        worldId={worldId}
        slug={slug}
        cursorStorageKey={cursorStorageKey}
        onConfigChange={setActiveSlug}
        onExitEdit={onExitEdit}
        onDirtyChange={onDirtyChange}
        onProvideSave={onProvideSave}
      />
    );
  }
  return (
    <CalendarTabView
      calendar={data}
      config={activeConfig}
      configs={configs}
      cursorStorageKey={cursorStorageKey}
      onConfigChange={setActiveSlug}
    />
  );
}

// ── View (read-only) ──────────────────────────────────────────────

interface ViewProps {
  calendar: CharacterCalendar;
  config: CalendarConfig;
  configs: CalendarConfig[];
  cursorStorageKey: string;
  onConfigChange: (slug: string) => void;
}

function CalendarTabView({
  calendar,
  config,
  configs,
  cursorStorageKey,
  onConfigChange,
}: ViewProps) {
  const [detail, setDetail] = useState<CalendarEvent | null>(null);
  return (
    <div className={s.wrap}>
      <CalendarTabGrid
        events={calendar.events}
        config={config}
        color={resolveCalendarColor(calendar.characterId, calendar.color)}
        availableConfigs={configs.length > 1 ? configs : undefined}
        cursorStorageKey={cursorStorageKey}
        onConfigChange={onConfigChange}
        onEventClick={setDetail}
      />
      {detail && (
        <Modal
          open
          onClose={() => setDetail(null)}
          title={
            detail.symbol
              ? `${detail.symbol} ${detail.title || '(bez názvu)'}`
              : detail.title || '(bez názvu)'
          }
          size="sm"
        >
          {detail.start && (
            <p>
              <strong>Datum:</strong> {formatFantasyDate(detail.start, config)}
            </p>
          )}
          {detail.end && (
            <p>
              <strong>Do:</strong> {formatFantasyDate(detail.end, config)}
            </p>
          )}
          {detail.description && <p>{detail.description}</p>}
        </Modal>
      )}
    </div>
  );
}

// ── Edit ──────────────────────────────────────────────────────────

interface EditProps {
  calendar: CharacterCalendar;
  config: CalendarConfig;
  configs: CalendarConfig[];
  worldId: string;
  slug: string;
  cursorStorageKey: string;
  onConfigChange: (slug: string) => void;
  onExitEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onProvideSave?: Props['onProvideSave'];
}

interface EventFormState {
  /** Existující event id (z calendar.events) nebo nově vygenerované pro create. */
  id: string;
  title: string;
  start: FantasyDate;
  end?: FantasyDate;
  allDay?: boolean;
  description?: string;
  symbol?: string;
}

function CalendarTabEdit({
  calendar,
  config,
  configs,
  worldId,
  slug,
  cursorStorageKey,
  onConfigChange,
  onExitEdit,
  onDirtyChange,
  onProvideSave,
}: EditProps) {
  const mutation = useUpdateCharacterCalendar(worldId, slug);

  const [events, setEvents] = useState<CalendarEvent[]>(() => calendar.events);
  // 9.2-followup — color = slot '0'..'11' / legacy HEX / '' (auto). GroupColorPicker.
  const [color, setColor] = useState(calendar.color ?? '');
  const [defaultView, setDefaultView] = useState(
    calendar.displaySettings?.defaultView ?? 'month',
  );
  const [dirty, setDirty] = useState(false);

  // 9.2-FIX — last-used datum pro další create flow.
  const [lastDate, setLastDate] = useState<FantasyDate | null>(null);

  // Modal state (create | edit | null).
  const [editing, setEditing] = useState<EventFormState | null>(null);
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  function openCreate(date: FantasyDate) {
    setEditing({
      id: newId(),
      title: '',
      start: lastDate ?? date,
      allDay: true,
    });
    setIsExisting(false);
  }

  function openEdit(ev: CalendarEvent) {
    if (!ev.start) return;
    setEditing({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      description: ev.description,
      symbol: ev.symbol,
    });
    setIsExisting(true);
  }

  function saveEvent(updated: CalendarEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    if (updated.start) setLastDate(updated.start);
    setDirty(true);
    setEditing(null);
  }

  function deleteEvent() {
    if (!editing) return;
    setEvents((prev) => prev.filter((e) => e.id !== editing.id));
    setDirty(true);
    setEditing(null);
  }

  // Async save = Promise wrapper nad mutací (resolve true=OK / false=fail).
  // Deps drží aktuální events/color/defaultView (žádná stale closure).
  const saveAsync = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        mutation.mutate(
          {
            events,
            color,
            displaySettings: { ...calendar.displaySettings, defaultView },
          },
          {
            onSuccess: () => {
              setDirty(false);
              toast.success('Kalendář uložen');
              resolve(true);
            },
            onError: () => {
              toast.error('Uložení se nezdařilo');
              resolve(false);
            },
          },
        );
      }),
    [mutation, events, color, defaultView, calendar.displaySettings],
  );

  function handleSave() {
    void saveAsync();
  }

  // Horní „Hotovo" — registruj aktuální save; při unmountu tabu vynuluj.
  useEffect(() => {
    onProvideSave?.(saveAsync);
    return () => onProvideSave?.(null);
  }, [onProvideSave, saveAsync]);

  return (
    <div className={s.wrap}>
      <EditModeBanner label="Kalendář" />

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Nastavení</h2>
        <div className={ed.row}>
          <div className={ed.stack}>
            <span className={ed.label}>Barva v kalendáři</span>
            <GroupColorPicker
              value={color}
              onChange={(slot) => {
                setColor(slot ?? '');
                setDirty(true);
              }}
            />
          </div>
          <div className={`${ed.stack} ${ed.rowGrow}`}>
            <label className={ed.label} htmlFor="cal-view">
              Výchozí pohled
            </label>
            <select
              id="cal-view"
              className={ed.field}
              value={defaultView}
              onChange={(e) => {
                setDefaultView(e.target.value as typeof defaultView);
                setDirty(true);
              }}
            >
              <option value="month">Měsíc</option>
              <option value="week">Týden</option>
              <option value="day">Den</option>
            </select>
          </div>
        </div>
      </section>

      <CalendarTabGrid
        events={events}
        config={config}
        color={resolveCalendarColor(calendar.characterId, color)}
        availableConfigs={configs.length > 1 ? configs : undefined}
        cursorStorageKey={cursorStorageKey}
        onConfigChange={onConfigChange}
        onEventClick={openEdit}
        onDayClick={openCreate}
      />

      {editing && (
        <EventEditorModal
          initial={editing}
          config={config}
          isExisting={isExisting}
          onClose={() => setEditing(null)}
          onSave={saveEvent}
          onDelete={isExisting ? deleteEvent : undefined}
        />
      )}

      <EditStickyBar
        dirty={dirty}
        isPending={mutation.isPending}
        onSave={handleSave}
        onCancel={onExitEdit}
      />
    </div>
  );
}
