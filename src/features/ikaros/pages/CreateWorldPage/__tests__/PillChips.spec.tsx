import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PillChips } from '../components/PillChips';

describe('PillChips', () => {
  it('klik na unchecked option volá onChange s přidaným prvkem', () => {
    const onChange = vi.fn();
    render(
      <PillChips
        options={['A', 'B', 'C']}
        value={['B']}
        onChange={onChange}
        ariaLabel="test"
      />,
    );
    fireEvent.click(screen.getByText('A'));
    expect(onChange).toHaveBeenCalledWith(['B', 'A']);
  });

  it('klik na checked option ho odebere', () => {
    const onChange = vi.fn();
    render(
      <PillChips
        options={['A', 'B']}
        value={['A', 'B']}
        onChange={onChange}
        ariaLabel="test"
      />,
    );
    fireEvent.click(screen.getByText('A'));
    expect(onChange).toHaveBeenCalledWith(['B']);
  });

  it('checked chip má aria-pressed=true', () => {
    render(
      <PillChips
        options={['A']}
        value={['A']}
        onChange={() => {}}
        ariaLabel="test"
      />,
    );
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
  });
});
