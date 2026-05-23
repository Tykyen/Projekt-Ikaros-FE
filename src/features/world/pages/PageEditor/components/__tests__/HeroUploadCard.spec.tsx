import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroUploadCard } from '../HeroUploadCard';

const mutateAsync = vi.fn();
const toastError = vi.fn();
let pending = false;

vi.mock('@/shared/api/useUploadImage', () => ({
  useUploadImage: () => ({ mutateAsync, isPending: pending }),
}));
vi.mock('sonner', () => ({
  toast: { error: (m: string) => toastError(m) },
}));

function makeFile(name = 'hero.png', type = 'image/png', size = 1000): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('HeroUploadCard', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    toastError.mockReset();
    pending = false;
  });

  it('prázdný stav — vyzva k nahrání', () => {
    render(<HeroUploadCard value="" onChange={() => {}} />);
    expect(screen.getByText('Nahrát hero obrázek')).toBeInTheDocument();
  });

  it('s hodnotou — zobrazí preview obrázku', () => {
    render(
      <HeroUploadCard value="https://cdn/x.png" onChange={() => {}} />,
    );
    const img = document.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://cdn/x.png');
    expect(screen.getByText('Změnit obrázek')).toBeInTheDocument();
  });

  it('nahrání souboru zavolá upload a onChange s URL', async () => {
    mutateAsync.mockResolvedValueOnce({ url: 'https://cdn/uploaded.png' });
    const onChange = vi.fn();
    render(<HeroUploadCard value="" onChange={onChange} />);
    const input = screen.getByLabelText('Vybrat hero obrázek');
    await userEvent.upload(input, makeFile());
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('https://cdn/uploaded.png'),
    );
  });

  it('odmítne soubor větší než 10 MB', async () => {
    const onChange = vi.fn();
    render(<HeroUploadCard value="" onChange={onChange} />);
    const input = screen.getByLabelText('Vybrat hero obrázek');
    await userEvent.upload(input, makeFile('big.png', 'image/png', 11_000_000));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('odebrat vymaže hodnotu', async () => {
    const onChange = vi.fn();
    render(<HeroUploadCard value="https://cdn/x.png" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Odebrat/ }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('odebrat tlačítko chybí, když není obrázek', () => {
    render(<HeroUploadCard value="" onChange={() => {}} />);
    expect(
      screen.queryByRole('button', { name: /Odebrat/ }),
    ).not.toBeInTheDocument();
  });

  it('drop souboru na kartu spustí upload', async () => {
    mutateAsync.mockResolvedValueOnce({ url: 'https://cdn/dropped.png' });
    const onChange = vi.fn();
    render(<HeroUploadCard value="" onChange={onChange} />);
    const card = screen.getByRole('button', {
      name: 'Nahrát hlavní obrázek',
    });
    const file = makeFile('dropped.png');
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] },
    });
    card.dispatchEvent(dropEvent);
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('https://cdn/dropped.png'),
    );
  });
});
