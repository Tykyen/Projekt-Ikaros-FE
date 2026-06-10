import { describe, it, expect, vi } from 'vitest';
import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkPickerPopover } from '../LinkPickerPopover';
import type { LinkSuggestion } from '../types';

const DIR: LinkSuggestion[] = [
  { id: 'p1', title: 'Aralion', slug: 'aralion' },
  { id: 'p2', title: 'Brennor', slug: 'brennor' },
];

const slugify = (q: string) =>
  q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function Harness({
  open = true,
  ...props
}: Partial<React.ComponentProps<typeof LinkPickerPopover>>) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={ref}>anchor</button>
      <LinkPickerPopover
        anchorRef={ref}
        open={open}
        onClose={props.onClose ?? (() => {})}
        onPick={props.onPick ?? (() => {})}
        {...props}
      />
    </>
  );
}

describe('LinkPickerPopover', () => {
  it('zavřený → nic nerenderuje', () => {
    render(<Harness open={false} directory={DIR} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('otevřený s adresářem → dialog + nabídka stránek', () => {
    render(<Harness directory={DIR} makeSlug={slugify} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Aralion')).toBeInTheDocument();
    expect(screen.getByText('Brennor')).toBeInTheDocument();
  });

  it('klik na stránku → onPick(slug, title) + onClose', () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <Harness directory={DIR} makeSlug={slugify} onPick={onPick} onClose={onClose} />,
    );
    fireEvent.click(screen.getByText('Aralion'));
    expect(onPick).toHaveBeenCalledWith('aralion', 'Aralion');
    expect(onClose).toHaveBeenCalled();
  });

  it('dotaz bez shody + makeSlug → „zatím neexistuje" volba → onPick(slug, dotaz)', () => {
    const onPick = vi.fn();
    render(<Harness directory={DIR} makeSlug={slugify} onPick={onPick} />);
    fireEvent.change(screen.getByPlaceholderText(/Hledat stránku/), {
      target: { value: 'Nové Místo' },
    });
    fireEvent.click(screen.getByText(/Odkázat na/));
    expect(onPick).toHaveBeenCalledWith('nove-misto', 'Nové Místo');
  });

  it('allowUrl → URL fallback aplikuje zadanou adresu', () => {
    const onPick = vi.fn();
    render(
      <Harness directory={DIR} makeSlug={slugify} allowUrl onPick={onPick} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/URL/), {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onPick).toHaveBeenCalledWith('https://example.com', undefined);
  });

  it('bez adresáře + allowUrl → jen URL režim (žádný search stránek)', () => {
    render(<Harness allowUrl />);
    expect(screen.queryByPlaceholderText(/Hledat stránku/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/URL/)).toBeInTheDocument();
  });

  it('currentHref na existující stránku → current link banner + odebrání', () => {
    const onRemove = vi.fn();
    render(
      <Harness
        directory={DIR}
        makeSlug={slugify}
        currentHref="aralion"
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Odebrat odkaz' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
