import { useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { useUpdateCalendarConfig } from '@/features/world/api/useCalendarConfigs';
import type {
  CalendarConfig,
  CelestialBody,
  MonthDef,
  Season,
} from '@/shared/lib/calendarEngine';
import s from './CalendarConfigsPage.module.css';

interface Props {
  config: CalendarConfig;
  isDefault: boolean;
  worldId: string;
  onSetDefault: () => void;
  onDelete: () => void;
}

/**
 * 9.2b-IV — Editor jednoho kalendářového configu. PATCH delta merge
 * (per `feedback_persist_across_variants` — posíláme jen změněné fields).
 */
export function CalendarConfigEditor({
  config,
  isDefault,
  worldId,
  onSetDefault,
  onDelete,
}: Props) {
  const updateMut = useUpdateCalendarConfig(worldId);

  // Lokální editor state (synchronizovaný s `config` přes effect při změně slug).
  const [name, setName] = useState(config.name);
  const [hoursPerDay, setHoursPerDay] = useState(config.hoursPerDay);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(config.daysOfWeek);
  const [months, setMonths] = useState<MonthDef[]>(config.months);
  const [bodies, setBodies] = useState<CelestialBody[]>(config.celestialBodies);
  const [seasons, setSeasons] = useState<Season[]>(config.seasons);
  const [epochOffset, setEpochOffset] = useState(config.epochOffset);
  const [dirty, setDirty] = useState(false);

  // Reset při změně configu (přepnutí slug) — R19 adjustment-during-render.
  // Klíč config.slug je primitivní → žádné riziko smyčky z object-ref deps.
  const [prevSlug, setPrevSlug] = useState(config.slug);
  if (config.slug !== prevSlug) {
    setPrevSlug(config.slug);
    setName(config.name);
    setHoursPerDay(config.hoursPerDay);
    setDaysOfWeek(config.daysOfWeek);
    setMonths(config.months);
    setBodies(config.celestialBodies);
    setSeasons(config.seasons);
    setEpochOffset(config.epochOffset);
    setDirty(false);
  }

  const touch = () => setDirty(true);

  function handleSave() {
    // Delta merge — posíláme všechny editovatelné fields (FE forma drží
    // kompletní state, BE rozhodne co je změněné na úrovni Mongo $set).
    updateMut.mutate(
      {
        slug: config.slug,
        dto: { name, hoursPerDay, daysOfWeek, months, celestialBodies: bodies, seasons, epochOffset },
      },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success('Uloženo.');
        },
        onError: () => toast.error('Uložení se nezdařilo.'),
      },
    );
  }

  return (
    <section className={s.editor}>
      {/* ── Identita ── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Identita</h3>
        <div className={s.row}>
          <div className={s.rowGrow}>
            <label className={s.label}>Slug (neměnný)</label>
            <input className={s.field} value={config.slug} disabled />
          </div>
          <div className={s.rowGrow}>
            <label className={s.label}>Název</label>
            <input
              className={s.field}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                touch();
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Hodiny ── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Hodiny</h3>
        <div className={s.row}>
          <input
            type="number"
            min={1}
            max={48}
            className={`${s.field} ${s.numberField}`}
            value={hoursPerDay}
            onChange={(e) => {
              setHoursPerDay(parseInt(e.target.value) || 24);
              touch();
            }}
          />
          <span className={s.unit}>hodin v dni</span>
        </div>
      </div>

      {/* ── Dny v týdnu ── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Dny v týdnu ({daysOfWeek.length})</h3>
        {daysOfWeek.map((d, i) => (
          <div key={i} className={s.itemRow}>
            <input
              className={s.field}
              value={d}
              onChange={(e) => {
                const next = [...daysOfWeek];
                next[i] = e.target.value;
                setDaysOfWeek(next);
                touch();
              }}
            />
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => {
                setDaysOfWeek(daysOfWeek.filter((_, idx) => idx !== i));
                touch();
              }}
              title="Odstranit"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={s.addBtn}
          onClick={() => {
            setDaysOfWeek([...daysOfWeek, `Den${daysOfWeek.length + 1}`]);
            touch();
          }}
        >
          <Plus size={14} aria-hidden /> Přidat den
        </button>
      </div>

      {/* ── Měsíce ── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Měsíce ({months.length})</h3>
        {months.map((m, i) => (
          <div key={i} className={s.itemRow}>
            <span className={s.itemIndex}>{i + 1}.</span>
            <input
              className={s.field}
              value={m.name}
              placeholder="Název měsíce"
              onChange={(e) => {
                const next = [...months];
                next[i] = { ...m, name: e.target.value };
                setMonths(next);
                touch();
              }}
            />
            <input
              type="number"
              min={1}
              max={100}
              className={`${s.field} ${s.numberField}`}
              value={m.daysCount}
              onChange={(e) => {
                const next = [...months];
                next[i] = { ...m, daysCount: parseInt(e.target.value) || 1 };
                setMonths(next);
                touch();
              }}
            />
            <span className={s.unit}>dnů</span>
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => {
                setMonths(months.filter((_, idx) => idx !== i));
                touch();
              }}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={s.addBtn}
          onClick={() => {
            setMonths([...months, { name: `Měsíc ${months.length + 1}`, daysCount: 30 }]);
            touch();
          }}
        >
          <Plus size={14} aria-hidden /> Přidat měsíc
        </button>
      </div>

      {/* ── Nebeská tělesa ── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Nebeská tělesa ({bodies.length})</h3>
        {bodies.map((b, i) => (
          <div key={b.id} className={s.itemRow}>
            <input
              className={s.field}
              value={b.name}
              placeholder="Název tělesa"
              onChange={(e) => {
                const next = [...bodies];
                next[i] = { ...b, name: e.target.value };
                setBodies(next);
                touch();
              }}
            />
            <input
              type="number"
              min={0.0001}
              step={0.1}
              className={`${s.field} ${s.numberField}`}
              value={b.orbitalPeriodDays}
              onChange={(e) => {
                const next = [...bodies];
                next[i] = { ...b, orbitalPeriodDays: parseFloat(e.target.value) || 29.5306 };
                setBodies(next);
                touch();
              }}
            />
            <span className={s.unit}>dnů oběh</span>
            <input
              type="color"
              className={s.colorPicker}
              value={b.color}
              onChange={(e) => {
                const next = [...bodies];
                next[i] = { ...b, color: e.target.value };
                setBodies(next);
                touch();
              }}
            />
            <input
              className={`${s.field} ${s.iconField}`}
              value={b.icon ?? ''}
              placeholder="🌑"
              maxLength={4}
              onChange={(e) => {
                const next = [...bodies];
                next[i] = { ...b, icon: e.target.value || undefined };
                setBodies(next);
                touch();
              }}
            />
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => {
                setBodies(bodies.filter((_, idx) => idx !== i));
                touch();
              }}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={s.addBtn}
          onClick={() => {
            const id = `body-${Date.now()}`;
            setBodies([
              ...bodies,
              {
                id,
                name: 'Nové těleso',
                orbitalPeriodDays: 29.5306,
                color: '#c0c8d0',
                epochOffset: 0,
              },
            ]);
            touch();
          }}
        >
          <Plus size={14} aria-hidden /> Přidat těleso
        </button>
      </div>

      {/* ── Sezóny ── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Sezóny ({seasons.length})</h3>
        {seasons.map((season, i) => (
          <div key={season.id} className={s.itemRow}>
            <input
              className={s.field}
              value={season.name}
              placeholder="Název sezóny"
              onChange={(e) => {
                const next = [...seasons];
                next[i] = { ...season, name: e.target.value };
                setSeasons(next);
                touch();
              }}
            />
            <select
              className={s.field}
              value={season.startMonthIndex}
              onChange={(e) => {
                const next = [...seasons];
                next[i] = { ...season, startMonthIndex: parseInt(e.target.value) };
                setSeasons(next);
                touch();
              }}
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}. {m.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100}
              className={`${s.field} ${s.numberField}`}
              value={season.startDay}
              onChange={(e) => {
                const next = [...seasons];
                next[i] = { ...season, startDay: parseInt(e.target.value) || 1 };
                setSeasons(next);
                touch();
              }}
            />
            <span className={s.unit}>den</span>
            <input
              type="color"
              className={s.colorPicker}
              value={season.color}
              onChange={(e) => {
                const next = [...seasons];
                next[i] = { ...season, color: e.target.value };
                setSeasons(next);
                touch();
              }}
            />
            <input
              className={`${s.field} ${s.iconField}`}
              value={season.icon ?? ''}
              placeholder="🌸"
              maxLength={4}
              onChange={(e) => {
                const next = [...seasons];
                next[i] = { ...season, icon: e.target.value || undefined };
                setSeasons(next);
                touch();
              }}
            />
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => {
                setSeasons(seasons.filter((_, idx) => idx !== i));
                touch();
              }}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={s.addBtn}
          onClick={() => {
            const id = `season-${Date.now()}`;
            setSeasons([
              ...seasons,
              {
                id,
                name: 'Nová sezóna',
                startMonthIndex: 0,
                startDay: 1,
                color: '#7cb342',
              },
            ]);
            touch();
          }}
        >
          <Plus size={14} aria-hidden /> Přidat sezónu
        </button>
      </div>

      {/* ── Action bar ── */}
      <div className={s.actionsBar}>
        <Button
          variant="ghost"
          size="md"
          onClick={onDelete}
          disabled={isDefault}
          title={isDefault ? 'Výchozí kalendář nelze smazat' : 'Smazat tento kalendář'}
        >
          <Trash2 size={14} aria-hidden /> Smazat
        </Button>
        <Button variant="ghost" size="md" onClick={onSetDefault} disabled={isDefault}>
          <Star size={14} aria-hidden /> {isDefault ? 'Výchozí' : 'Nastavit jako výchozí'}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          loading={updateMut.isPending}
          disabled={!dirty}
        >
          Uložit
        </Button>
      </div>
    </section>
  );
}
