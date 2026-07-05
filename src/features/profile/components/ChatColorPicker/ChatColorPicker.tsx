import { useId } from 'react';
import { HexColorPicker } from 'react-colorful';
import { NamedColorPalette } from '@/shared/ui';
import { DEFAULT_CHAT_COLOR } from '../../lib/chatColor';
import styles from './ChatColorPicker.module.css';

interface Props {
  value: string;
  onChange: (hex: string) => void;
  /** Náhledový text — defaultně „Tvé zprávy budou vypadat takto" */
  previewText?: string;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const HEX_PARTIAL_RE = /^#[0-9A-Fa-f]{0,6}$/;

/**
 * 1.3a — Color picker pro „barvu chatu" (Hospoda + Camp).
 * react-colorful HexColorPicker + ruční hex input (sync v obou směrech).
 * Náhled = větička v dané barvě (přibližná simulace zprávy v chatu).
 */
export function ChatColorPicker({
  value,
  onChange,
  previewText = 'Tvé zprávy budou vypadat takto',
}: Props) {
  const inputId = useId();

  function handleHexInput(raw: string) {
    if (!raw.startsWith('#')) raw = '#' + raw.replace(/^#/, '');
    if (!HEX_PARTIAL_RE.test(raw)) return;
    onChange(raw.toUpperCase());
  }

  const validHex = HEX_RE.test(value);

  return (
    <div className={styles.wrapper}>
      <HexColorPicker
        color={validHex ? value : DEFAULT_CHAT_COLOR}
        onChange={(c) => onChange(c.toUpperCase())}
        className={styles.picker}
      />

      <div className={styles.row}>
        <label htmlFor={inputId} className={styles.label}>
          HEX
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => handleHexInput(e.target.value)}
          maxLength={7}
          className={styles.hexInput}
          aria-invalid={!validHex}
        />
        <span
          className={styles.swatch}
          style={{ backgroundColor: validHex ? value : 'transparent' }}
          aria-hidden="true"
        />
      </div>

      <div
        className={styles.preview}
        style={{ color: validHex ? value : 'inherit' }}
      >
        {previewText}
      </div>

      <NamedColorPalette value={value} onPick={onChange} />
    </div>
  );
}
