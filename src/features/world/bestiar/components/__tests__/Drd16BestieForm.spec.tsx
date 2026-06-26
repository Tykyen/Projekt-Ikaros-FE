import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd16BestieForm } from '../Drd16BestieForm';
import { drd16BestieSchema } from '@/features/world/tactical-map/schemas/drd16/bestie';

function renderForm(value: Record<string, unknown> = {}, onChange = vi.fn()) {
  render(
    <Drd16BestieForm
      schema={drd16BestieSchema}
      value={value}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe('Drd16BestieForm', () => {
  it('vykreslí sekce a klíčová pole', () => {
    renderForm({ hp: 3, defense: 7, mindForce: -2, experience: 125000 });
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.getByLabelText('Životy')).toHaveValue(3);
    expect(screen.getByLabelText('Obr. číslo')).toHaveValue(7);
    // záporné číslo (ZSM)
    expect(screen.getByLabelText('ZSM')).toHaveValue(-2);
    // velká Zkušenost
    expect(screen.getByLabelText('Zkušenost')).toHaveValue(125000);
    // Útoky list (reuse ListField)
    expect(screen.getByText('Útoky')).toBeInTheDocument();
    // Pohyblivost + způsob
    expect(screen.getByLabelText('Pohyblivost')).toBeInTheDocument();
    expect(screen.getByLabelText('Způsob pohybu')).toBeInTheDocument();
  });

  it('Přesvědčení = select s 5 hodnotami', () => {
    renderForm({ alignment: 'N' });
    const sel = screen.getByLabelText('Přesvědčení');
    const opts = Array.from(sel.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(opts).toEqual(['ZkD', 'ZmD', 'N', 'ZmZ', 'ZkZ']);
  });

  it('změna čísla (i záporného) volá onChange', () => {
    const onChange = renderForm({ hp: 3 });
    fireEvent.change(screen.getByLabelText('Životy'), {
      target: { value: '-5' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ hp: -5 }),
    );
  });

  it('prázdné číslo → undefined (lze vymazat)', () => {
    const onChange = renderForm({ hp: 3 });
    fireEvent.change(screen.getByLabelText('Životy'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ hp: undefined }),
    );
  });
});
