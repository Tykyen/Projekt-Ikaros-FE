import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionListEditor } from '../components/editors/SectionListEditor';
import type { PageSection } from '../../api/pages.types';

vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value: string }) => <div>{value}</div>,
}));

function sec(title: string, order: number): PageSection {
  return { id: `s-${title}`, title, content: '', order, isCollapsed: false, items: [] };
}

describe('SectionListEditor (8.1)', () => {
  it('přidá prázdnou sekci s order 0', () => {
    const onChange = vi.fn();
    render(<SectionListEditor sections={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Přidat sekci'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ title: '', order: 0, items: [] }),
    ]);
  });

  it('smaže sekci a přepočítá order', () => {
    const onChange = vi.fn();
    render(
      <SectionListEditor
        sections={[sec('A', 0), sec('B', 1)]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByLabelText('Smazat sekci')[0]);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'B', order: 0 }),
    ]);
  });

  it('posune sekci dolů a přepočítá order', () => {
    const onChange = vi.fn();
    render(
      <SectionListEditor
        sections={[sec('A', 0), sec('B', 1)]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByLabelText('Posunout sekci dolů')[0]);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'B', order: 0 }),
      expect.objectContaining({ title: 'A', order: 1 }),
    ]);
  });

  it('přidá položku do sekce', () => {
    const onChange = vi.fn();
    render(
      <SectionListEditor sections={[sec('A', 0)]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('Přidat položku'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'A',
        items: [expect.objectContaining({ text: '' })],
      }),
    ]);
  });
});
