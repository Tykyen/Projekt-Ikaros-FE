import { BookOpen, Lock } from 'lucide-react';
import clsx from 'clsx';
import { CAMP_PLACES, findPlace, genreShortLabel } from '../lib/campPlaces';
import type { RoomEnvironment, RoomStyle } from '../lib/types';
import s from './CampHeader.module.css';

/** Ikona žánru pro štítek Campu (16.6). */
const GENRE_ICON: Record<RoomStyle, string> = {
  fantasy: '🏰',
  mystic: '🔮',
  scifi: '🚀',
};

/** Pořadí žánrů v override selectu (dle proto: Fantasy · Mystery · Sci-fi). */
const GENRE_ORDER: RoomStyle[] = ['fantasy', 'mystic', 'scifi'];

export interface CampHeaderProps {
  environment: RoomEnvironment;
  /** Smí měnit prostředí — role s platformovou funkcí (spec 4.2a §4.3). */
  canEdit: boolean;
  onChange: (env: RoomEnvironment) => void;
  descOpen: boolean;
  onToggleDesc: () => void;
  /** Domovský žánr Campu (16.6) — detekce dočasného staff override. */
  defaultStyle: RoomStyle;
  /** Uložit aktuální scénu + posledních ~20 zpráv (📜). */
  onSaveGame: () => void;
  /** Načíst uloženou hru (📂). */
  onLoadGame: () => void;
  /** Log je neprázdný → hráč smí uložit. */
  canSaveGame: boolean;
  /** Hráč má uloženou hru → smí načíst. */
  hasSavedGame: boolean;
}

/**
 * Záhlaví scény Campu (16.6) — žánrový štítek + lokace + hra (📜/📂) + popis (📖).
 *
 * - **Žánr** je štítek Campu (ikona + „Camp" + žánr). Pro hráče read-only;
 *   staff dostane override select a — když se liší od domovského žánru —
 *   přerušovaný odznáček „⟳ dočasně".
 * - **Lokace**: select pro staff, statický název pro hráče („Scénu řídí správci").
 * - **Pečeti vpravo**: 📜 Uložit hru · 📂 Načíst hru · 📖 Popis místa.
 *
 * Stylizovaný nativní `<select>` (ne custom dropdown) — drží přístupnost
 * a nativní mobilní picker.
 */
export function CampHeader({
  environment,
  canEdit,
  onChange,
  descOpen,
  onToggleDesc,
  defaultStyle,
  onSaveGame,
  onLoadGame,
  canSaveGame,
  hasSavedGame,
}: CampHeaderProps) {
  const places = CAMP_PLACES[environment.style];
  const isOverride = environment.style !== defaultStyle;

  const handleStyle = (style: RoomStyle) => {
    // Nový žánr má jiné lokace → reset na první.
    onChange({ style, placeId: '1' });
  };

  return (
    <div className={s.bar}>
      <div className={s.controls}>
        {canEdit ? (
          <label className={s.cartouche}>
            <span className={s.cartoucheLabel}>Žánr</span>
            <select
              className={s.select}
              value={environment.style}
              onChange={(e) => handleStyle(e.target.value as RoomStyle)}
            >
              {GENRE_ORDER.map((style) => (
                <option key={style} value={style}>
                  {genreShortLabel(style)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className={s.genreBadge} title="Žánr tohoto Campu">
            <span className={s.genreIco} aria-hidden="true">
              {GENRE_ICON[environment.style]}
            </span>
            <span className={s.genreText}>
              <span className={s.genreKicker}>Camp</span>
              <span className={s.genreName}>
                {genreShortLabel(environment.style)}
              </span>
            </span>
          </div>
        )}

        {canEdit && isOverride && (
          <span
            className={s.overrideTag}
            title="Dočasná změna žánru — scéna se vrátí na domovský žánr v dalším okně (0:00 / 12:00)"
          >
            ⟳ dočasně
          </span>
        )}

        <label
          className={clsx(s.cartouche, s.cartouchePlace, !canEdit && s.locked)}
        >
          <span className={s.cartoucheLabel}>Lokace</span>
          {canEdit ? (
            <select
              className={s.select}
              value={environment.placeId}
              onChange={(e) =>
                onChange({ style: environment.style, placeId: e.target.value })
              }
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className={s.placeName}>
              {findPlace(environment.style, environment.placeId)?.name ??
                'Neznámá lokace'}
            </span>
          )}
        </label>

        {!canEdit && (
          <span className={s.lockHint} title="Prostředí scény mění správci">
            <Lock size={13} /> Scénu řídí správci
          </span>
        )}
      </div>

      <div className={s.gameActions}>
        <button
          type="button"
          className={s.seal}
          onClick={onSaveGame}
          disabled={!canSaveGame}
          title="Uložit tuto scénu a posledních 20 zpráv"
        >
          <span className={s.sealIcon} aria-hidden="true">
            📜
          </span>
          <span className={s.sealLabel}>Uložit hru</span>
        </button>

        <button
          type="button"
          className={clsx(s.seal, s.sealLoad)}
          onClick={onLoadGame}
          disabled={!hasSavedGame}
          title="Načíst mou uloženou hru"
        >
          <span className={s.sealIcon} aria-hidden="true">
            📂
          </span>
          <span className={s.sealLabel}>Načíst hru</span>
        </button>

        <button
          type="button"
          className={clsx(s.descBtn, descOpen && s.descBtnActive)}
          onClick={onToggleDesc}
          aria-pressed={descOpen}
          aria-label="Popis místa"
          title="Popis místa"
        >
          <BookOpen size={16} />
        </button>
      </div>
    </div>
  );
}
