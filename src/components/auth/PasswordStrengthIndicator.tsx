import { passwordStrength } from './passwordStrength';
import s from './PasswordStrengthIndicator.module.css';

interface Props {
  password: string;
  id?: string;
}

const SEGMENT_COUNT = 5;

export function PasswordStrengthIndicator({ password, id }: Props) {
  const strength = passwordStrength(password);
  const filledCount = password.length === 0 ? 0 : strength.score + 1;

  return (
    <div className={s.wrap} id={id} aria-live="polite">
      <div
        className={s.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={SEGMENT_COUNT}
        aria-valuenow={filledCount}
        aria-label={`Síla hesla: ${strength.label}`}
      >
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <span
            key={i}
            className={s.segment}
            data-filled={i < filledCount}
            style={i < filledCount ? { background: strength.color } : undefined}
          />
        ))}
      </div>
      {password.length > 0 && (
        <span className={s.label} style={{ color: strength.color }}>
          {strength.label}
        </span>
      )}
    </div>
  );
}
