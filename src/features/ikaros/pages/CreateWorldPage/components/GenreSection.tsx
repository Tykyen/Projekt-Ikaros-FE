import { GENRES, GENRE_CUSTOM_LABEL } from '../constants/genres';
import { TONES, TONE_CUSTOM_LABEL } from '../constants/tones';
import { PillChips } from './PillChips';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  genre: string;
  customGenre: string;
  tones: string[];
  customTone: string;
  onGenreChange: (v: string) => void;
  onCustomGenreChange: (v: string) => void;
  onTonesChange: (v: string[]) => void;
  onCustomToneChange: (v: string) => void;
}

const TONES_WITH_CUSTOM = [...TONES, TONE_CUSTOM_LABEL];

export function GenreSection({
  genre,
  customGenre,
  tones,
  customTone,
  onGenreChange,
  onCustomGenreChange,
  onTonesChange,
  onCustomToneChange,
}: Props) {
  const showCustomGenre = genre === GENRE_CUSTOM_LABEL;
  const showCustomTone = tones.includes(TONE_CUSTOM_LABEL);

  return (
    <SectionCard
      index={2}
      title="Žánr & styl"
      description="Atmosféra světa — pomáhá hráčům odhadnout, do čeho jdou."
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
            <option key={g} value={g}>
              {g}
            </option>
          ))}
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

      <div className={s.field}>
        <span className={s.label}>Tóny vyprávění</span>
        <p className={s.helper}>
          Vyberte atmosféru, jakou bude svět navozovat. Můžete zaškrtnout více
          možností.
        </p>
        <PillChips
          options={TONES_WITH_CUSTOM}
          value={tones}
          onChange={onTonesChange}
          ariaLabel="Tóny vyprávění"
        />
        {showCustomTone && (
          <input
            type="text"
            className={`${s.input} ${s.customInput}`}
            value={customTone}
            onChange={(e) => onCustomToneChange(e.target.value)}
            maxLength={40}
            placeholder="Vlastní tón…"
            autoComplete="off"
          />
        )}
      </div>
    </SectionCard>
  );
}
