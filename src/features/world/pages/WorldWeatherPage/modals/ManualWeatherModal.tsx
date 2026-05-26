/**
 * 9.4-I — Modal pro ruční nastavení aktuálního počasí (spec §3.3).
 *
 * Pro PJ, který chce overrider — vyplní teplotu, typ počasí, oblačnost
 * (oktas slider), srážky, vítr, tlak (+ trend), vlhkost a narrativ.
 *
 * Submit: `useSetCurrentWeather` mutation (BE PUT /current).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/shared/ui';
import { useSetCurrentWeather } from '@/features/world/api/useWeatherGenerators';
import type { WeatherGenerator, WeatherResult } from '@/shared/types';
import s from './ManualWeatherModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  generator: WeatherGenerator;
}

interface ManualForm {
  temperature: number;
  tempUnit: 'C' | 'F';
  weatherType: string;
  cloudiness: number; // 0-8 oktas
  precipitation: number; // mm/h
  windSpeed: number;
  windGusts: number;
  pressureValue: number;
  pressureTrend: string;
  humidity: number;
  narrativeText: string;
}

const WEATHER_OPTIONS: Array<{ value: string; label: string; icon: string }> = [
  { value: 'clear', label: 'Slunečno', icon: '☀️' },
  { value: 'cloudy', label: 'Oblačno', icon: '☁️' },
  { value: 'rain', label: 'Déšť', icon: '🌧️' },
  { value: 'storm', label: 'Bouřka', icon: '⛈️' },
  { value: 'snow', label: 'Sníh', icon: '❄️' },
  { value: 'fog', label: 'Mlha', icon: '🌫️' },
];

const PRESSURE_TRENDS = ['stoupá', 'klesá', 'stabilní'];

function buildInitialForm(generator: WeatherGenerator): ManualForm {
  const cur = generator.currentWeather;
  const config = generator.config;
  return {
    temperature: cur?.temperature ?? Math.round((config.tempMin + config.tempMax) / 2),
    tempUnit: (cur?.tempUnit as 'C' | 'F') ?? config.tempUnit ?? 'C',
    weatherType: cur?.weatherType ?? 'clear',
    cloudiness: cur?.cloudiness ? parseOkta(cur.cloudiness.value) : 2,
    precipitation: cur?.precipitation ? parsePrecip(cur.precipitation.value) : 0,
    windSpeed: cur?.wind.speed ?? Math.round((config.windMin + config.windMax) / 2),
    windGusts:
      cur?.wind.gusts ??
      Math.round(
        ((config.windMin + config.windMax) / 2) * (config.windGustMultiplier ?? 1.5),
      ),
    pressureValue:
      cur?.pressure.value ??
      Math.round((config.pressureMin + config.pressureMax) / 2),
    pressureTrend: cur?.pressure.trend ?? 'stabilní',
    humidity:
      cur?.humidity ??
      Math.round((config.humidityMin + config.humidityMax) / 2),
    narrativeText: cur?.narrativeText ?? '',
  };
}

function parseOkta(label: string): number {
  const m = label.match(/^(\d)/);
  return m ? Number(m[1]) : 2;
}

function parsePrecip(label: string): number {
  const m = label.match(/([\d.]+)/);
  return m ? Number(m[1]) : 0;
}

function iconForType(type: string): string {
  return WEATHER_OPTIONS.find((o) => o.value === type)?.icon ?? '🌤️';
}

function describeCloud(o: number): string {
  if (o < 2) return 'jasno';
  if (o < 4) return 'polojasno';
  if (o < 7) return 'oblačno';
  return 'zataženo';
}

function describePrecip(mm: number): string {
  if (mm < 0.1) return 'beze srážek';
  if (mm < 2) return 'slabé srážky';
  if (mm < 10) return 'mírné srážky';
  return 'silné srážky';
}

export function ManualWeatherModal({ open, onClose, worldId, generator }: Props) {
  const mutation = useSetCurrentWeather(worldId);
  const [form, setForm] = useState<ManualForm>(() => buildInitialForm(generator));
  // Re-init není potřeba — parent dělá conditional render, modal fresh-mounts s init z props.

  function update<K extends keyof ManualForm>(key: K, value: ManualForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const payload: Partial<WeatherResult> = {
      isManual: true,
      temperature: form.temperature,
      tempUnit: form.tempUnit,
      weatherType: form.weatherType,
      weatherIcon: iconForType(form.weatherType),
      cloudiness: {
        value: `${form.cloudiness}/8`,
        description: describeCloud(form.cloudiness),
      },
      precipitation: {
        value: `${form.precipitation.toFixed(1)} mm`,
        description: describePrecip(form.precipitation),
      },
      wind: {
        speed: form.windSpeed,
        gusts: form.windGusts,
        unit: 'kmh',
      },
      pressure: {
        value: form.pressureValue,
        trend: form.pressureTrend,
      },
      humidity: form.humidity,
      narrativeText: form.narrativeText.trim() || null,
    };

    try {
      await mutation.mutateAsync({ id: generator.id, weather: payload });
      toast.success('Počasí nastaveno.');
      onClose();
    } catch {
      toast.error('Nastavení počasí selhalo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ručně nastavit počasí — ${generator.name}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Nastavit
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
        {/* Teplota + jednotka */}
        <div className={s.row}>
          <div className={s.field}>
            <Input
              label="Teplota"
              type="number"
              value={form.temperature}
              onChange={(e) => update('temperature', Number(e.target.value) || 0)}
            />
          </div>
          <div className={s.field}>
            <span className={s.label}>Jednotka</span>
            <div className={s.radioGroup}>
              <label className={s.radio}>
                <input
                  type="radio"
                  name="manualTempUnit"
                  checked={form.tempUnit === 'C'}
                  onChange={() => update('tempUnit', 'C')}
                />
                <span>°C</span>
              </label>
              <label className={s.radio}>
                <input
                  type="radio"
                  name="manualTempUnit"
                  checked={form.tempUnit === 'F'}
                  onChange={() => update('tempUnit', 'F')}
                />
                <span>°F</span>
              </label>
            </div>
          </div>
        </div>

        {/* Typ počasí (select s emoji) */}
        <div className={s.field}>
          <label className={s.label} htmlFor="mw-type">
            Typ počasí
          </label>
          <select
            id="mw-type"
            className={s.select}
            value={form.weatherType}
            onChange={(e) => update('weatherType', e.target.value)}
          >
            {WEATHER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Oblačnost slider */}
        <div className={s.field}>
          <label className={s.label} htmlFor="mw-cloud">
            Oblačnost: {form.cloudiness}/8 ({describeCloud(form.cloudiness)})
          </label>
          <input
            id="mw-cloud"
            type="range"
            min={0}
            max={8}
            step={1}
            value={form.cloudiness}
            onChange={(e) => update('cloudiness', Number(e.target.value))}
            className={s.slider}
          />
        </div>

        {/* Srážky */}
        <div className={s.field}>
          <Input
            label="Srážky (mm/h)"
            type="number"
            min={0}
            step={0.1}
            value={form.precipitation}
            onChange={(e) =>
              update('precipitation', Number(e.target.value) || 0)
            }
          />
        </div>

        {/* Vítr */}
        <div className={s.row}>
          <div className={s.field}>
            <Input
              label="Vítr (km/h)"
              type="number"
              min={0}
              value={form.windSpeed}
              onChange={(e) => update('windSpeed', Number(e.target.value) || 0)}
            />
          </div>
          <div className={s.field}>
            <Input
              label="Nárazy (km/h)"
              type="number"
              min={0}
              value={form.windGusts}
              onChange={(e) => update('windGusts', Number(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Tlak + trend */}
        <div className={s.row}>
          <div className={s.field}>
            <Input
              label="Tlak (hPa)"
              type="number"
              value={form.pressureValue}
              onChange={(e) =>
                update('pressureValue', Number(e.target.value) || 0)
              }
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="mw-trend">
              Trend tlaku
            </label>
            <select
              id="mw-trend"
              className={s.select}
              value={form.pressureTrend}
              onChange={(e) => update('pressureTrend', e.target.value)}
            >
              {PRESSURE_TRENDS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vlhkost */}
        <div className={s.field}>
          <label className={s.label} htmlFor="mw-humidity">
            Vlhkost: {form.humidity} %
          </label>
          <input
            id="mw-humidity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={form.humidity}
            onChange={(e) => update('humidity', Number(e.target.value))}
            className={s.slider}
          />
        </div>

        {/* Narrativ */}
        <div className={s.field}>
          <label className={s.label} htmlFor="mw-narrative">
            Vyprávění (volitelné)
          </label>
          <textarea
            id="mw-narrative"
            className={s.textarea}
            rows={3}
            maxLength={500}
            value={form.narrativeText}
            onChange={(e) => update('narrativeText', e.target.value)}
            placeholder="„Slunce zalévá ulice…"
          />
        </div>
      </form>
    </Modal>
  );
}
