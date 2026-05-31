/**
 * 10.2l — testy papíru deníku + status indikátoru.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotebookPaper, NotebookStatus } from '../NotebookPaper';

// RichTextEditor mock — testujeme prop forwarding, ne editor samotný.
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label="editor"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('NotebookPaper', () => {
  it('předá value + placeholder editoru a propaguje onChange', () => {
    const onChange = vi.fn();
    render(<NotebookPaper value="text" onChange={onChange} placeholder="piš…" />);
    const ed = screen.getByLabelText('editor') as HTMLTextAreaElement;
    expect(ed.value).toBe('text');
    expect(ed.placeholder).toBe('piš…');
    fireEvent.change(ed, { target: { value: 'nové' } });
    expect(onChange).toHaveBeenCalledWith('nové');
  });
});

describe('NotebookStatus', () => {
  it('saving → "Ukládám…"', () => {
    render(<NotebookStatus status="saving" dirty />);
    expect(screen.getByText('Ukládám…')).toBeInTheDocument();
  });
  it('saved → "Uloženo ✓"', () => {
    render(<NotebookStatus status="saved" dirty={false} />);
    expect(screen.getByText('Uloženo ✓')).toBeInTheDocument();
  });
  it('idle + dirty → "Nezapsáno…"', () => {
    render(<NotebookStatus status="idle" dirty />);
    expect(screen.getByText('Nezapsáno…')).toBeInTheDocument();
  });
  it('idle + not dirty → nic (null)', () => {
    const { container } = render(<NotebookStatus status="idle" dirty={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
