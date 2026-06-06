import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroUploadCard } from '../HeroUploadCard';

const FOCAL_LABEL = 'Klikni kam má být střed výřezu obrázku';

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

  it('uploadCta přepíše text výzvy (znovupoužití mimo hero kontext)', () => {
    render(
      <HeroUploadCard value="" onChange={() => {}} uploadCta="Nahrát obrázek" />,
    );
    expect(screen.getByText('Nahrát obrázek')).toBeInTheDocument();
    expect(screen.queryByText('Nahrát hero obrázek')).not.toBeInTheDocument();
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

  it('bez focal props — žádný focal overlay (čistý uploader, beze změny)', () => {
    render(<HeroUploadCard value="https://cdn/x.png" onChange={() => {}} />);
    expect(screen.queryByLabelText(FOCAL_LABEL)).not.toBeInTheDocument();
    expect(screen.getByText('Změnit obrázek')).toBeInTheDocument();
  });

  it('focal mód — klik na obrázek přepočítá střed výřezu na procenta', () => {
    const onFocalChange = vi.fn();
    render(
      <HeroUploadCard
        value="https://cdn/x.png"
        onChange={() => {}}
        focal={{ x: 50, y: 50 }}
        onFocalChange={onFocalChange}
      />,
    );
    const overlay = screen.getByLabelText(FOCAL_LABEL);
    vi.spyOn(overlay, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    fireEvent.click(overlay, { clientX: 100, clientY: 25 });
    expect(onFocalChange).toHaveBeenCalledWith({ x: 50, y: 25 });
  });

  it('focal mód — zobrazí fit toggle a zoom slider', () => {
    render(
      <HeroUploadCard
        value="https://cdn/x.png"
        onChange={() => {}}
        focal={{ x: 50, y: 50 }}
        onFocalChange={() => {}}
      />,
    );
    expect(
      screen.getByRole('group', { name: /Režim zobrazení obrázku/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Přiblížení obrázku')).toBeInTheDocument();
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
