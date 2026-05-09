import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import s from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, iconLeft, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={clsx(s.wrapper, error && s.error)}>
        {label && <label className={s.label} htmlFor={inputId}>{label}</label>}
        <div className={s.inputWrap}>
          {iconLeft && <span className={s.iconLeft}>{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            className={clsx(s.input, iconLeft && s.hasIcon, className)}
            {...rest}
          />
        </div>
        {error && <span className={s.errorMsg}>{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
