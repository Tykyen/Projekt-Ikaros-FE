/**
 * 10.2i — panel počasí na taktické mapě (pravý horní roh, otvírací).
 *
 * Zavřený = pecka (ikona + teplota). Rozbalený = barometr + metriky +
 * narrativní text + in-game datum. PJ navíc: výběr generátoru → „Vyslat na
 * mapu" / „Vypnout", + per-user toggle vizuálních efektů (vidí i hráč).
 *
 * Reuse: `<WeatherBarometer>` a ikonografie z 9.4.
 */
import { useState } from "react";
import {
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  CloudDrizzle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { WeatherBarometer } from "@/features/world/pages/WorldWeatherPage/components/WeatherBarometer";
import { useWeatherGenerators } from "@/features/world/api/useWeatherGenerators";
import { useWorldContext } from "@/features/world/context/WorldContext";
import type { ActiveMapWeather } from "@/shared/types";
import styles from "./MapWeatherPanel.module.css";

const ICONS: Record<string, typeof CloudSun> = {
  clear: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
};

interface Props {
  weather: ActiveMapWeather | null;
  isPJ: boolean;
  fxEnabled: boolean;
  toggleFx: () => void;
  setWeather: (generatorId: string) => void;
  clearWeather: () => void;
  isMutating: boolean;
  /** 17.10 — minimalizace počasí do spodní lišty „Zmenšené" (parent řídí mount). */
  onMinimize?: () => void;
}

export function MapWeatherPanel({
  weather,
  isPJ,
  fxEnabled,
  toggleFx,
  setWeather,
  clearWeather,
  isMutating,
  onMinimize,
}: Props): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const { worldId } = useWorldContext();
  // generátory jen pro PJ (dropdown výběru) — hráč je nepotřebuje
  const { data: generators } = useWeatherGenerators(isPJ ? worldId : "");
  const [pickGen, setPickGen] = useState("");

  // hráč bez počasí → nic neukazujeme
  if (!weather && !isPJ) return null;

  const w = weather?.weather;
  const Icon = w ? (ICONS[w.weatherType] ?? Cloud) : Cloud;
  const temp = w ? `${Math.round(w.temperature)}°${w.tempUnit}` : "—";

  return (
    <div className={`${styles.panel} ${open ? styles.open : ""}`}>
      <div className={styles.pillRow}>
        <button
          type="button"
          className={styles.pill}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={weather ? weather.generatorName : "Počasí na mapě"}
        >
          <Icon className={styles.pillIcon} size={18} />
          <span className={styles.pillTemp}>{temp}</span>
          <ChevronDown
            className={`${styles.chev} ${open ? styles.chevOpen : ""}`}
            size={14}
          />
        </button>
        {onMinimize && (
          <button
            type="button"
            className={styles.minBtn}
            onClick={onMinimize}
            title="Zmenšit počasí do lišty"
            aria-label="Zmenšit počasí do lišty"
          >
            —
          </button>
        )}
      </div>

      {open && (
        <div className={styles.body}>
          {w ? (
            <>
              <div className={styles.genName}>{weather!.generatorName}</div>
              <div className={styles.baroRow}>
                <WeatherBarometer
                  value={w.pressure.value}
                  trend={w.pressure.trend}
                />
                <div className={styles.metrics}>
                  <Metric icon={<Wind size={13} />} label="Vítr">
                    {w.wind.speed} {w.wind.unit}
                  </Metric>
                  <Metric icon={<Droplets size={13} />} label="Vlhkost">
                    {w.humidity} %
                  </Metric>
                  <Metric icon={<Cloud size={13} />} label="Oblačnost">
                    {w.cloudiness.value}
                  </Metric>
                  <Metric icon={<CloudDrizzle size={13} />} label="Srážky">
                    {w.precipitation.value}
                  </Metric>
                </div>
              </div>
              {w.narrativeText && (
                <p className={styles.narrative}>{w.narrativeText}</p>
              )}
              {w.inGameDate && (
                <div className={styles.inGame}>
                  {new Date(w.inGameDate).toLocaleString("cs-CZ", {
                    day: "numeric",
                    month: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>Na mapě není žádné počasí.</div>
          )}

          {isPJ && (
            <div className={styles.pjBlock}>
              <select
                className={styles.select}
                value={pickGen}
                onChange={(e) => setPickGen(e.target.value)}
              >
                <option value="">— vyber generátor —</option>
                {(generators ?? []).map((g) => (
                  <option key={g.id} value={g.id} disabled={!g.currentWeather}>
                    {g.name}
                    {g.currentWeather ? "" : " (bez počasí)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.sendBtn}
                disabled={!pickGen || isMutating}
                onClick={() => pickGen && setWeather(pickGen)}
              >
                Vyslat na mapu
              </button>
              {weather && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  disabled={isMutating}
                  onClick={clearWeather}
                >
                  Vypnout počasí
                </button>
              )}
            </div>
          )}

          <label className={styles.fxRow}>
            <input
              type="checkbox"
              aria-label="Vizuální efekty počasí"
              checked={fxEnabled}
              onChange={toggleFx}
            />
            <Sparkles size={13} />
            Vizuální efekty
          </label>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>
        {icon} {label}
      </span>
      <span className={styles.metricValue}>{children}</span>
    </div>
  );
}
