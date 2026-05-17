import { GENRES, GENRE_CUSTOM_LABEL } from '../constants/genres';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  genre: string;
  customGenre: string;
  onGenreChange: (v: string) => void;
  onCustomGenreChange: (v: string) => void;
}

/**
 * 2.3 — Sekce výběru žánru.
 *
 * Pozn. (2026-05-14): `Tóny vyprávění` byly z UI vyřazeny po požadavku
 * autora. Konstanty `TONES` + `TONE_DESCRIPTIONS` zůstávají v balíčku
 * (`constants/tones.ts`), kdyby se vrátily v 2.5 World settings nebo
 * jiném kroku.
 */
export function GenreSection({
  genre,
  customGenre,
  onGenreChange,
  onCustomGenreChange,
}: Props) {
  const showCustomGenre = genre === GENRE_CUSTOM_LABEL;

  return (
    <SectionCard
      index={2}
      title="Žánr"
      description="Pomáhá hráčům odhadnout, do čeho jdou."
    >
      <div className={s.field}>
        <label htmlFor="cw-genre" className={`${s.label} ${s.required}`}>
          Žánr
        </label>
        <select
          id="cw-genre"
          className={s.select}
          value={genre}
          onChange={(e) => onGenreChange(e.target.value)}
        >
          <option value="" disabled>
            -- Vyberte žánr --
          </option>
          {GENRES.map((g) => (
            <option key={g.label} value={g.label}>
              {g.label}
            </option>
          ))}
          <option value={GENRE_CUSTOM_LABEL}>{GENRE_CUSTOM_LABEL}</option>
        </select>
        {showCustomGenre && (
          <input
            type="text"
            className={`${s.input} ${s.customInput}`}
            value={customGenre}
            onChange={(e) => onCustomGenreChange(e.target.value)}
            maxLength={40}
            placeholder="Pojmenuj vlastní žánr…"
            autoComplete="off"
          />
        )}
      </div>
    </SectionCard>
  );
}
