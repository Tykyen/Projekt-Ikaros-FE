/**
 * 10.2f — port InitiativeInput ze starého Matrixu
 * (C:\Matrix\Matrix\frontend\src\components\Map\InitiativeInput.tsx).
 *
 * Text input pro iniciativu: strip leading zeros, max 3 znaky (vč. minus),
 * povolí psát samostatné „-" pro záporná čísla. `stopPropagation` na pointer
 * eventech, ať klik do inputu neselectuje token / nepanuje mapu.
 */
import { useState } from 'react';
import styles from './InitiativeInput.module.css';

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function InitiativeInput({
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: Props): React.ReactElement {
  const [text, setText] = useState(String(value));

  // Sync z parenta při externí změně (hod kostkou, reorder) — React 19
  // „adjustment during render" pattern místo useEffect+setState (vzor
  // useDensity.ts). Když přijde nová `value` z parenta, přepiš text.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(String(value));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = e.target.value;
    if (v === '' || v === '-') {
      setText(v);
      return;
    }
    if (/^-?\d{1,2}$/.test(v)) {
      const parsed = parseInt(v, 10);
      setText(String(parsed));
      onChange(parsed);
    }
  };

  const handleBlur = (): void => {
    const parsed = parseInt(text, 10);
    const final = Number.isNaN(parsed) ? 0 : parsed;
    setText(String(final));
    onChange(final);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={3}
      className={styles.input}
      value={text}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={handleChange}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}
