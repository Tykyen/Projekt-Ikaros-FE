import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SchemaValueEditor } from '../components/editors/SchemaValueEditor';

// D-DIARY-3 — image typ vyžaduje uploader hook; pro 8.1 testy stačí stub.
vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>();
  return {
    ...actual,
    useUploadImage: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ url: '' }),
      isPending: false,
    }),
  };
});

describe('SchemaValueEditor (8.1)', () => {
  it('stat — číselný vstup, onChange vrací číslo', () => {
    const onChange = vi.fn();
    render(
      <SchemaValueEditor
        type="stat"
        label="Síla"
        value={10}
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Síla');
    fireEvent.change(input, { target: { value: '14' } });
    expect(onChange).toHaveBeenCalledWith(14);
  });

  it('stat — prázdná hodnota vrací undefined', () => {
    const onChange = vi.fn();
    render(
      <SchemaValueEditor
        type="stat"
        label="Síla"
        value={10}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Síla'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('bar — v labelu ukáže maximum', () => {
    render(
      <SchemaValueEditor
        type="bar"
        label="Životy"
        value={50}
        maxValue={100}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/Životy/)).toHaveTextContent('/ 100');
  });

  it('list — textarea, onChange vrací pole řádků', () => {
    const onChange = vi.fn();
    render(
      <SchemaValueEditor
        type="list"
        label="Schopnosti"
        value={['Lukostřelba']}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Schopnosti'), {
      target: { value: 'Lukostřelba\nStopování' },
    });
    expect(onChange).toHaveBeenCalledWith(['Lukostřelba', 'Stopování']);
  });

  it('text — prostý vstup', () => {
    const onChange = vi.fn();
    render(
      <SchemaValueEditor
        type="text"
        label="Přezdívka"
        value="Pruháč"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Přezdívka'), {
      target: { value: 'Tulák' },
    });
    expect(onChange).toHaveBeenCalledWith('Tulák');
  });

  it('image — bez override zobrazí defaultImageUrl ze schématu', () => {
    render(
      <SchemaValueEditor
        type="image"
        label="Avatar"
        value={undefined}
        defaultImageUrl="https://cdn.example.com/default.png"
        onChange={() => {}}
      />,
    );
    const img = screen.getByAltText('Avatar') as HTMLImageElement;
    expect(img.src).toBe('https://cdn.example.com/default.png');
  });

  it('image — override hodnota přebije default', () => {
    render(
      <SchemaValueEditor
        type="image"
        label="Avatar"
        value="https://cdn.example.com/personal.png"
        defaultImageUrl="https://cdn.example.com/default.png"
        onChange={() => {}}
      />,
    );
    const img = screen.getByAltText('Avatar') as HTMLImageElement;
    expect(img.src).toBe('https://cdn.example.com/personal.png');
  });

  it('image — „Vrátit výchozí" volá onChange(undefined)', () => {
    const onChange = vi.fn();
    render(
      <SchemaValueEditor
        type="image"
        label="Avatar"
        value="https://cdn.example.com/personal.png"
        defaultImageUrl="https://cdn.example.com/default.png"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('Vrátit výchozí'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
