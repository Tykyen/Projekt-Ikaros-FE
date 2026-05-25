import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PagePicker } from '../PagePicker';

const mockPages = [
  {
    id: '1',
    slug: 'mages-tower',
    title: 'Magická věž',
    type: 'Lokace',
    order: 0,
    updatedAt: '',
  },
  {
    id: '2',
    slug: 'tavern',
    title: 'Hospoda U lva',
    type: 'Lokace',
    order: 0,
    updatedAt: '',
  },
  {
    id: '3',
    slug: 'gandalf',
    title: 'Gandalf',
    type: 'NPC',
    order: 0,
    updatedAt: '',
  },
];

vi.mock('@/features/world/pages/api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: mockPages, isLoading: false }),
}));

describe('PagePicker', () => {
  it('value=null + focus → dropdown se všemi stránkami', () => {
    render(
      <PagePicker worldId="w1" value={null} onChange={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText(/Vyhledej/i);
    fireEvent.focus(input);
    expect(screen.getByText('Magická věž')).toBeInTheDocument();
    expect(screen.getByText('Hospoda U lva')).toBeInTheDocument();
    expect(screen.getByText('Gandalf')).toBeInTheDocument();
  });

  it('search filter — „věž" vrátí jen Magickou věž', () => {
    render(
      <PagePicker worldId="w1" value={null} onChange={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText(/Vyhledej/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'věž' } });
    expect(screen.getByText('Magická věž')).toBeInTheDocument();
    expect(screen.queryByText('Gandalf')).not.toBeInTheDocument();
  });

  it('klik na možnost volá onChange se slugem', () => {
    const onChange = vi.fn();
    render(<PagePicker worldId="w1" value={null} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Vyhledej/i);
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('Gandalf'));
    expect(onChange).toHaveBeenCalledWith('gandalf');
  });

  it('value set → chip s názvem stránky + clear button', () => {
    render(<PagePicker worldId="w1" value="tavern" onChange={vi.fn()} />);
    expect(screen.getByText('Hospoda U lva')).toBeInTheDocument();
    expect(screen.getByLabelText(/Odstranit/i)).toBeInTheDocument();
  });

  it('clear button volá onChange(null)', () => {
    const onChange = vi.fn();
    render(<PagePicker worldId="w1" value="tavern" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/Odstranit/i));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disabled=true → input disabled, dropdown se neotevře', () => {
    render(
      <PagePicker
        worldId="w1"
        value={null}
        onChange={vi.fn()}
        disabled
      />,
    );
    const input = screen.getByPlaceholderText(/Vyhledej/i);
    expect(input).toBeDisabled();
    fireEvent.focus(input);
    expect(screen.queryByText('Magická věž')).not.toBeInTheDocument();
  });

  it('Enter na input vybere první výsledek', () => {
    const onChange = vi.fn();
    render(<PagePicker worldId="w1" value={null} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Vyhledej/i);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('mages-tower');
  });
});
