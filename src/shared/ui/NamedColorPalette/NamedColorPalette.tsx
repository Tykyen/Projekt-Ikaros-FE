import { NAMED_COLORS, readableTextOn } from './palette';
import s from './NamedColorPalette.module.css';

interface Props {
  /** Aktuální hodnota (hex) — zvýrazní odpovídající dlaždici. Volitelné. */
  value?: string;
  /** Klik na barvu → vrátí hex velkými písmeny (#RRGGBB). */
  onPick: (hex: string) => void;
  /** Defaultně sbaleno; `true` rozbalí na startu. */
  defaultOpen?: boolean;
  /** Popisek rozbalovací sekce (default „Pojmenované barvy"). */
  label?: string;
}

/**
 * 16.1g — sdílená nápovědní paleta pod/vedle color pickerů.
 *
 * Rozbalovací (`<details>`, defaultně sbalené — nenafoukne úzké popovery).
 * Klik na dlaždici = rychlá volba pojmenované barvy; text na dlaždici se
 * automaticky přepíná bílý/tmavý podle jasu (čitelný na světlé i tmavé barvě).
 * Kurátorská sada barev je čitelná na tmavém i světlém pozadí — viz `palette.ts`.
 */
export function NamedColorPalette({
  value,
  onPick,
  defaultOpen = false,
  label = 'Pojmenované barvy',
}: Props) {
  const current = value?.toUpperCase();

  return (
    <details className={s.hint} open={defaultOpen}>
      <summary className={s.summary}>
        <span className={s.chev} aria-hidden="true">
          ▶
        </span>
        {label}
      </summary>
      <p className={s.note}>
        Klikni pro rychlou volbu. Krajně tmavé/světlé odstíny jsou vynechány —
        na pozadí chatu by mizely.
      </p>
      <div className={s.tiles}>
        {NAMED_COLORS.map((c) => {
          const active = current === c.hex.toUpperCase();
          return (
            <button
              key={c.hex}
              type="button"
              className={active ? `${s.tile} ${s.active}` : s.tile}
              style={{ background: c.hex, color: readableTextOn(c.hex) }}
              title={`${c.name} ${c.hex}`}
              aria-label={`${c.name} ${c.hex}`}
              aria-pressed={active}
              onClick={() => onPick(c.hex.toUpperCase())}
            >
              {active && (
                <span className={s.chk} aria-hidden="true">
                  ✓
                </span>
              )}
              <span className={s.nm}>{c.name}</span>
              <span className={s.hx}>{c.hex}</span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
