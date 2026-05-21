/**
 * Picker barvy kanálu (krok 6.5c).
 *
 * 13 chipů: 1× „Auto" (conic-gradient ze všech 12 slotů = „nech systém vybrat")
 * + 12× chip s `var(--chat-group-N)`. PJ klikne → `onChange(slot | undefined)`.
 *
 * `value` = `'0'..'11'` (PJ explicit volba) nebo `undefined` (auto, hash z id).
 *
 * Vizuál: kruhové chipy, selected indicator = double box-shadow ring v barvě chipu
 * (zachová rozměr, bezpečné napříč prohlížeči — viz design audit §2).
 */
import s from './GroupColorPicker.module.css';

interface Props {
  value?: string;
  onChange: (color: string | undefined) => void;
}

const SLOTS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export function GroupColorPicker({ value, onChange }: Props) {
  const autoSelected = !value || !/^([0-9]|1[01])$/.test(value);
  return (
    <div
      className={s.row}
      role="radiogroup"
      aria-label="Barva kanálu"
    >
      <button
        type="button"
        role="radio"
        aria-checked={autoSelected}
        aria-label="Auto (barva podle názvu)"
        className={s.auto}
        data-selected={autoSelected || undefined}
        onClick={() => onChange(undefined)}
        title="Auto (barva podle názvu)"
      />
      {SLOTS.map((slot) => (
        <button
          key={slot}
          type="button"
          role="radio"
          aria-checked={value === slot}
          aria-label={`Barva ${Number(slot) + 1}`}
          className={s.chip}
          data-selected={value === slot || undefined}
          style={{ '--chip-color': `var(--chat-group-${Number(slot) + 1})` } as React.CSSProperties}
          onClick={() => onChange(slot)}
          title={`Barva ${Number(slot) + 1}`}
        />
      ))}
    </div>
  );
}
