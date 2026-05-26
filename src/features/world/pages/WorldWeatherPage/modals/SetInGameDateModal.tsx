/**
 * 9.4 — Modal „Nastavit in-game datum".
 *
 * PJ explicit vyplní rok / měsíc / den. Pokud má svět custom kalendář
 * (`worldSettings.timelineCalendarSlug`), select měsíce použije custom názvy
 * + count (`calendar.months`). Jinak Gregorian 12 měsíců.
 *
 * Submit:
 *  - useSetInGameDate(worldId).mutate({ year, monthIndex, day, regenerateAll })
 *  - regenerateAll default ON — PJ nejčastěji chce „nastav datum + přegeneruj všechno".
 *  - toast.success s počtem regenerovaných generátorů.
 *
 * Edge cases:
 *  - Negative year (BCE) povolen do -25000.
 *  - Custom calendar months — day max = `monthsList[monthIndex].daysCount`.
 *  - Default values načteny z `worldSettings.currentInGameDate` (current state).
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { Modal, Button, Input } from '@/shared/ui';
import { useSetInGameDate } from '@/features/world/api/useWeatherGenerators';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import s from './SetInGameDateModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
}

interface MonthDescriptor {
  name: string;
  daysCount: number;
}

const GREGORIAN_MONTHS: MonthDescriptor[] = [
  { name: 'Leden', daysCount: 31 },
  { name: 'Únor', daysCount: 29 },
  { name: 'Březen', daysCount: 31 },
  { name: 'Duben', daysCount: 30 },
  { name: 'Květen', daysCount: 31 },
  { name: 'Červen', daysCount: 30 },
  { name: 'Červenec', daysCount: 31 },
  { name: 'Srpen', daysCount: 31 },
  { name: 'Září', daysCount: 30 },
  { name: 'Říjen', daysCount: 31 },
  { name: 'Listopad', daysCount: 30 },
  { name: 'Prosinec', daysCount: 31 },
];

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function SetInGameDateModal({ open, onClose, worldId }: Props) {
  const setDate = useSetInGameDate(worldId);
  const { data: settings } = useWorldSettings(worldId);
  const { data: calendars = [] } = useCalendarConfigs(worldId);

  // React Compiler memoizuje vše automaticky — žádný useMemo.
  const activeCalendar = settings?.timelineCalendarSlug
    ? calendars.find((c) => c.slug === settings.timelineCalendarSlug)
    : undefined;

  const monthsList: MonthDescriptor[] =
    activeCalendar && activeCalendar.months.length > 0
      ? activeCalendar.months.map((m, idx) => ({
          name: m.name || `${idx + 1}. měsíc`,
          daysCount: m.daysCount,
        }))
      : GREGORIAN_MONTHS;

  const monthsTotal = monthsList.length;

  // Init from persisted in-game date or real-world fallback.
  function computeInitial(): {
    year: number;
    monthIndex: number;
    day: number;
    hour: number;
    minute: number;
  } {
    const persisted = settings?.currentInGameDate
      ? new Date(settings.currentInGameDate)
      : null;
    const base =
      persisted && !Number.isNaN(persisted.getTime()) ? persisted : new Date();
    const m = base.getUTCMonth() % monthsTotal;
    return {
      year: base.getUTCFullYear(),
      monthIndex: m,
      day: Math.max(
        1,
        Math.min(base.getUTCDate(), monthsList[m]?.daysCount ?? 31),
      ),
      hour: persisted ? base.getUTCHours() : 12, // default poledne pro fresh init
      minute: persisted ? base.getUTCMinutes() : 0,
    };
  }

  // Trick: initialize state lazy přes function — state se updatuje až přes
  // explicit reset effect (které sleduje pouze open/persistedISO/calendarSlug).
  const [year, setYear] = useState<number>(() => computeInitial().year);
  const [monthIndex, setMonthIndex] = useState<number>(
    () => computeInitial().monthIndex,
  );
  const [day, setDay] = useState<number>(() => computeInitial().day);
  const [hour, setHour] = useState<number>(() => computeInitial().hour);
  const [minute, setMinute] = useState<number>(() => computeInitial().minute);
  const [regenerateAll, setRegenerateAll] = useState<boolean>(true);

  // Re-init defaults když se modal otevře (settings se může změnit mezi closes).
  // Použijeme primitive deps (ISO string + slug), aby effect nereagoval na nové
  // reference Date objektu při každém re-renderu.
  const persistedISO = settings?.currentInGameDate ?? null;
  const calendarSlug = settings?.timelineCalendarSlug ?? null;
  const previousOpenRef = useRef(false);
  useEffect(() => {
    // Pouze při OTEVŘENÍ modalu — ne při každé změně settings během otevřené modal.
    if (open && !previousOpenRef.current) {
      const init = computeInitial();
      setYear(init.year);
      setMonthIndex(init.monthIndex);
      setDay(init.day);
      setHour(init.hour);
      setMinute(init.minute);
    }
    previousOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, persistedISO, calendarSlug]);

  // Clamp day když změna měsíce ukáže shorter month (Únor po Lednu z dne 31).
  const dayMax = monthsList[monthIndex]?.daysCount ?? 31;
  const clampedDay = day > dayMax ? dayMax : day;

  async function handleSubmit() {
    try {
      const result = await setDate.mutateAsync({
        year,
        monthIndex,
        day: clampedDay,
        hour,
        minute,
        regenerateAll,
      });
      const count = result.regenerated.length;
      const countMsg =
        count > 0
          ? ` Vygenerováno počasí pro ${count} ${count === 1 ? 'generátor' : count < 5 ? 'generátory' : 'generátorů'}.`
          : '';
      const monthName = monthsList[monthIndex]?.name ?? `${monthIndex + 1}.`;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      toast.success(
        `In-game datum nastaveno na ${clampedDay}. ${monthName} ${year}, ${timeStr}.${countMsg}`,
      );
      onClose();
    } catch {
      toast.error('Nepodařilo se nastavit datum.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nastavit in-game datum"
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={setDate.isPending}
          >
            Zrušit
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            loading={setDate.isPending}
          >
            Nastavit datum
          </Button>
        </>
      }
    >
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <p className={s.intro}>
          Explicit nastavení in-game data světa. Generátory tento datum použijí
          při příštím generování (nebo hned, pokud zaškrtneš „Regenerovat
          všechny").
        </p>

        <div className={s.grid}>
          {/* České pořadí datumu: den → měsíc → rok */}
          <label className={s.field}>
            <span className={s.label}>Den</span>
            <Input
              type="number"
              value={clampedDay}
              onChange={(e) => setDay(clamp(Number(e.target.value), 1, dayMax))}
              min={1}
              max={dayMax}
              data-testid="sigd-day-input"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Měsíc</span>
            <select
              className={s.select}
              value={monthIndex}
              onChange={(e) => setMonthIndex(Number(e.target.value))}
              data-testid="sigd-month-select"
            >
              {monthsList.map((m, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}. {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className={s.field}>
            <span className={s.label}>Rok</span>
            <Input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(clamp(Number(e.target.value), -25000, 99999))
              }
              min={-25000}
              max={99999}
              data-testid="sigd-year-input"
            />
          </label>
        </div>

        {/* Čas: hodina + minuta */}
        <div className={s.timeGrid}>
          <label className={s.field}>
            <span className={s.label}>Hodina</span>
            <Input
              type="number"
              value={hour}
              onChange={(e) => setHour(clamp(Number(e.target.value), 0, 23))}
              min={0}
              max={23}
              data-testid="sigd-hour-input"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Minuta</span>
            <Input
              type="number"
              value={minute}
              onChange={(e) => setMinute(clamp(Number(e.target.value), 0, 59))}
              min={0}
              max={59}
              data-testid="sigd-minute-input"
            />
          </label>
        </div>

        {activeCalendar && (
          <p className={s.calendarNote} data-testid="sigd-calendar-note">
            <Calendar size={14} aria-hidden="true" />
            <span>
              Svět používá kalendář <strong>{activeCalendar.name}</strong> (
              {monthsTotal} měsíců).
            </span>
          </p>
        )}

        <label className={s.checkbox}>
          <input
            type="checkbox"
            checked={regenerateAll}
            onChange={(e) => setRegenerateAll(e.target.checked)}
            data-testid="sigd-regenerate-all"
          />
          <span>Vygenerovat počasí pro všechny generátory s tímto datem</span>
        </label>
      </form>
    </Modal>
  );
}
