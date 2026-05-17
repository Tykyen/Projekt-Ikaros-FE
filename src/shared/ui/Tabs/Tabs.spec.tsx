import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Tabs, type TabItem } from './Tabs';

const ITEMS: TabItem[] = [
  { id: 'a', label: 'Alfa' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gama' },
];

function Harness({ initial = 'a' }: { initial?: string }) {
  const [active, setActive] = useState(initial);
  return (
    <Tabs items={ITEMS} activeId={active} onChange={setActive}>
      <div>Panel {active}</div>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('vykreslí tab pro každou položku + panel aktivního', () => {
    render(<Harness />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel a');
  });

  it('aktivní tab má aria-selected', () => {
    render(<Harness initial="b" />);
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Alfa' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('klik na tab přepne panel', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: 'Gama' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel c');
  });

  it('šipka dolů posune na další tab (vertikální orientace)', () => {
    render(<Harness />);
    const first = screen.getByRole('tab', { name: 'Alfa' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel b');
  });

  it('šipka nahoru z prvního tabu cykluje na poslední', () => {
    render(<Harness />);
    const first = screen.getByRole('tab', { name: 'Alfa' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel c');
  });

  it('onChange dostane id zvoleného tabu', async () => {
    const onChange = vi.fn();
    render(
      <Tabs items={ITEMS} activeId="a" onChange={onChange}>
        <div />
      </Tabs>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
