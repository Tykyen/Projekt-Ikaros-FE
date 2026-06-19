import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { PrintButton } from './PrintButton';
import { printModeAtom } from './printMode';

afterEach(() => {
  vi.unstubAllGlobals();
  getDefaultStore().set(printModeAtom, false);
  document.documentElement.removeAttribute('data-printing');
});

describe('PrintButton', () => {
  it('vytiskne nejbližší [data-print-scope] předek', () => {
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    render(
      <div data-print-scope data-testid="scope">
        <PrintButton label="Tisk" />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Tisk/ }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('scope').getAttribute('data-print-root')).toBe('');
  });

  it('tlačítko nese .print-hide (samo se při tisku nevykreslí)', () => {
    render(<PrintButton label="Tisk" />);
    expect(screen.getByRole('button', { name: /Tisk/ })).toHaveClass('print-hide');
  });
});
