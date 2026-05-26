/**
 * 9.4-I §3.1.1 — atmospheric overlay + particles per weather type.
 *
 * CSS-only animace (žádný motion lib). `prefers-reduced-motion: reduce`
 * vypíná particles; statický radial/gradient tint zůstává — pořád signaluje
 * weather type vizuálně, jen bez pohybu.
 *
 * Renderuje 2 vrstvy:
 *  1) `.overlay` — radial / gradient tint (vždy)
 *  2) `.particles` — span elements pro rain/snow (jen ne-reduced + pro 2 typy)
 *
 * Particle pozice deterministické (mod hash z generatorId) — aby přemount
 * karty neresetoval „náhodný" vzor jinam.
 */
import { useMemo } from 'react';
import type { WeatherType } from '@/shared/types';
import s from './WeatherAtmosphere.module.css';

interface Props {
  weatherType: WeatherType | string;
  /** Stabilní ID — driver deterministickej pozice particles. */
  seed: string;
}

/** Simple string hash → 0..1 deterministicky. */
function hashed(seed: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 1000) / 1000;
}

export function WeatherAtmosphere({ weatherType, seed }: Props) {
  const drops = useMemo(() => {
    if (weatherType !== 'rain') return [];
    return Array.from({ length: 10 }, (_, i) => ({
      left: `${Math.round(hashed(seed, i + 1) * 100)}%`,
      delay: `${Math.round(hashed(seed, i + 101) * 12) / 10}s`,
    }));
  }, [weatherType, seed]);

  const flakes = useMemo(() => {
    if (weatherType !== 'snow') return [];
    return Array.from({ length: 18 }, (_, i) => ({
      left: `${Math.round(hashed(seed, i + 1) * 100)}%`,
      delay: `${Math.round(hashed(seed, i + 201) * 60) / 10}s`,
      duration: `${6 + Math.round(hashed(seed, i + 301) * 6)}s`,
    }));
  }, [weatherType, seed]);

  return (
    <>
      <div
        className={s.overlay}
        data-weather={weatherType}
        aria-hidden="true"
      />
      {weatherType === 'rain' && (
        <div className={s.rainParticles} aria-hidden="true">
          {drops.map((d, i) => (
            <span
              key={i}
              style={{
                left: d.left,
                animationDelay: d.delay,
              }}
            />
          ))}
        </div>
      )}
      {weatherType === 'snow' && (
        <div className={s.snowParticles} aria-hidden="true">
          {flakes.map((f, i) => (
            <span
              key={i}
              style={{
                left: f.left,
                animationDelay: f.delay,
                animationDuration: f.duration,
              }}
            />
          ))}
        </div>
      )}
      {weatherType === 'storm' && (
        <div className={s.lightning} aria-hidden="true" />
      )}
    </>
  );
}
