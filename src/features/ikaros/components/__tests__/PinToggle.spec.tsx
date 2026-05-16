import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PinToggle } from '../PinToggle';

describe('PinToggle', () => {
  it('isPinned → aria-pressed true + ikona fill', () => {
    const { container } = render(<PinToggle isPinned onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(container.querySelector('svg')).toHaveAttribute(
      'fill',
      'currentColor',
    );
  });

  it('disabled + nepřipnuté → button disabled, tooltip o limitu', () => {
    render(<PinToggle isPinned={false} disabled onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('title')).toContain('max 5');
  });

  it('disabled ale připnuté → odepnout lze (není disabled)', () => {
    render(<PinToggle isPinned disabled onToggle={() => {}} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('klik volá onToggle', () => {
    const onToggle = vi.fn();
    render(<PinToggle isPinned={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('blokovaný klik (limit) nevolá onToggle', () => {
    const onToggle = vi.fn();
    render(<PinToggle isPinned={false} disabled onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
