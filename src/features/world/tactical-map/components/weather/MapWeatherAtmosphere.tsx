/**
 * 10.2i — vizuální atmosféra počasí nad hrací plochou. DOM overlay (reuse
 * `<WeatherAtmosphere>` z 9.4), NE PixiJS — počasí je celoplošná atmosféra
 * fixovaná k viewportu, nemá se zoomovat/panovat s world-space.
 *
 * Renderuje jen pro „viditelné" typy (rain/snow/storm/fog/cloudy); `clear`
 * a `custom` se přeskočí (nemá co rušit). Per-user `fxEnabled` ho skryje.
 * `prefers-reduced-motion` řeší už `WeatherAtmosphere` (particles off, tint zůstává).
 */
import { WeatherAtmosphere } from "@/features/world/pages/WorldWeatherPage/components/WeatherAtmosphere";
import type { ActiveMapWeather } from "@/shared/types";
import styles from "./MapWeatherAtmosphere.module.css";

const VISUAL_TYPES = new Set(["rain", "snow", "storm", "fog", "cloudy"]);

interface Props {
  weather: ActiveMapWeather | null;
  fxEnabled: boolean;
}

export function MapWeatherAtmosphere({
  weather,
  fxEnabled,
}: Props): React.ReactElement | null {
  if (!weather || !fxEnabled) return null;
  const type = weather.weather.weatherType;
  if (!VISUAL_TYPES.has(type)) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      <WeatherAtmosphere weatherType={type} seed={weather.generatorId} />
    </div>
  );
}
