import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { PrintButton } from './PrintButton';
import { printModeAtom } from './printMode';

afterEach(() => {
  vi.unstubAllGlobals();
  getDefaultStore().set(printModeAtom, false);
});

describe('PrintButton', () => {
  it('vytiskne obsah nejbližšího [data-print-scope], ne sebe', () => {
    const writes: string[] = [];
    const win = {
      document: {
        write: (s: string) => writes.push(s),
        close: vi.fn(),
        readyState: 'complete' as const,
        images: [] as HTMLImageElement[],
      },
      focus: vi.fn(),
      print: vi.fn(),
      onload: null,
    };
    vi.stubGlobal('open', vi.fn(() => win));
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    render(
      <div data-print-scope>
        <span>Obsah ke vytištění</span>
        <PrintButton label="KLIK_TLACITKO" />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /KLIK_TLACITKO/ }));

    const doc = writes.join('');
    // Obsah scope se naklonoval do tiskového okna.
    expect(doc).toContain('Obsah ke vytištění');
    // Tlačítko (.print-hide) se do tisku neklonuje.
    expect(doc).not.toContain('KLIK_TLACITKO');
  });

  it('tlačítko nese .print-hide (samo se při tisku nevykreslí)', () => {
    render(<PrintButton label="Tisk" />);
    expect(screen.getByRole('button', { name: /Tisk/ })).toHaveClass(
      'print-hide',
    );
  });
});
