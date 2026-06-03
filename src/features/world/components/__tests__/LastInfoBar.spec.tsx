import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { LastInfo } from '@/shared/types';
import { LastInfoBar } from '../LastInfoBar';

const info = (over: Partial<LastInfo> = {}): LastInfo => ({
  text: 'Sezení v pátek',
  visible: true,
  updatedAt: '2026-06-03T10:00:00.000Z',
  ...over,
});

describe('LastInfoBar', () => {
  beforeEach(() => localStorage.clear());

  it('nezobrazí nic když chybí / skryté / prázdné', () => {
    const { container, rerender } = render(
      <LastInfoBar worldId="w1" lastInfo={null} />,
    );
    expect(container.firstChild).toBeNull();
    rerender(<LastInfoBar worldId="w1" lastInfo={info({ visible: false })} />);
    expect(container.firstChild).toBeNull();
    rerender(<LastInfoBar worldId="w1" lastInfo={info({ text: '   ' })} />);
    expect(container.firstChild).toBeNull();
  });

  it('zobrazí text a po zavření zmizí + uloží updatedAt', () => {
    render(<LastInfoBar worldId="w1" lastInfo={info()} />);
    expect(screen.getByText('Sezení v pátek')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Zavřít oznámení'));
    expect(screen.queryByText('Sezení v pátek')).not.toBeInTheDocument();
    expect(localStorage.getItem('ikaros.lastinfo.dismissed.w1')).toBe(
      '2026-06-03T10:00:00.000Z',
    );
  });

  it('zavřená zpráva zůstává skrytá, ale novější updatedAt se zobrazí', () => {
    localStorage.setItem(
      'ikaros.lastinfo.dismissed.w1',
      '2026-06-03T10:00:00.000Z',
    );
    const { container, rerender } = render(
      <LastInfoBar worldId="w1" lastInfo={info()} />,
    );
    expect(container.firstChild).toBeNull(); // stejný updatedAt = skryto

    rerender(
      <LastInfoBar
        worldId="w1"
        lastInfo={info({ updatedAt: '2026-06-04T10:00:00.000Z' })}
      />,
    );
    expect(screen.getByText('Sezení v pátek')).toBeInTheDocument();
  });
});
