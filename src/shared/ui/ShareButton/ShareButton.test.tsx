/**
 * 15B.6 — testy sdílecího tlačítka (adaptivní Web Share / desktop menu).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

const URL_ = 'https://ikaros.test/svet/muj-svet';
const TITLE = 'Můj svět';
const TEXT = 'Popis světa';

/** Definuje (nebo přepíše) navigator.X tak, aby šlo v afterEach smazat. */
function defineNav(prop: string, value: unknown) {
  Object.defineProperty(window.navigator, prop, {
    value,
    configurable: true,
    writable: true,
  });
}
function deleteNav(prop: string) {
  if (prop in navigator) {
    delete (navigator as unknown as Record<string, unknown>)[prop];
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  // clipboard je vždy k dispozici (jsdom ho nemá nativně).
  defineNav('clipboard', { writeText: vi.fn().mockResolvedValue(undefined) });
});

afterEach(() => {
  vi.restoreAllMocks();
  deleteNav('share');
  deleteNav('canShare');
  deleteNav('clipboard');
});

function renderBtn() {
  return render(<ShareButton url={URL_} title={TITLE} text={TEXT} />);
}

describe('ShareButton — desktop fallback (bez Web Share)', () => {
  it('klik otevře menu se třemi položkami', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: 'Sdílet' }));
    expect(screen.getByText('Kopírovat odkaz')).toBeInTheDocument();
    expect(screen.getByText('Sdílet na Facebooku')).toBeInTheDocument();
    expect(screen.getByText('Sdílet na X')).toBeInTheDocument();
  });

  it('Kopírovat odkaz → clipboard.writeText(url) + toast.success', async () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: 'Sdílet' }));
    fireEvent.click(screen.getByText('Kopírovat odkaz'));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(URL_),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Odkaz zkopírován');
  });

  it('Facebook → window.open se sharer-URL', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: 'Sdílet' }));
    fireEvent.click(screen.getByText('Sdílet na Facebooku'));
    expect(open).toHaveBeenCalledWith(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_)}`,
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('X → window.open s intent-URL (url + text)', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: 'Sdílet' }));
    fireEvent.click(screen.getByText('Sdílet na X'));
    expect(open).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(URL_)}&text=${encodeURIComponent(TITLE)}`,
      '_blank',
      'noopener,noreferrer',
    );
  });
});

describe('ShareButton — nativní Web Share', () => {
  it('klik volá navigator.share a NEotevře menu', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    defineNav('share', share);
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: 'Sdílet' }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: TITLE,
        text: TEXT,
        url: URL_,
      }),
    );
    expect(screen.queryByText('Kopírovat odkaz')).not.toBeInTheDocument();
  });

  it('zrušení sheetu (AbortError) → tiše, bez chyby a bez menu', async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException('cancel', 'AbortError'));
    defineNav('share', share);
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: 'Sdílet' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.queryByText('Kopírovat odkaz')).not.toBeInTheDocument();
  });
});
