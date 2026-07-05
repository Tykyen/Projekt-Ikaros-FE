import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KebabMenu, type KebabMenuItem } from './KebabMenu';

function makeAnchor(): HTMLElement {
  const div = document.createElement('button');
  document.body.appendChild(div);
  return div;
}

describe('KebabMenu', () => {
  beforeEach(() => {
    // Default desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    document.body.innerHTML = '';
  });

  const items: KebabMenuItem[] = [
    { key: 'a', label: 'Akce A', onClick: vi.fn() },
    { key: 'b', label: 'Akce B', variant: 'danger', onClick: vi.fn() },
  ];

  it('open=false → nic nevykreslí', () => {
    render(<KebabMenu anchor={makeAnchor()} open={false} onClose={() => {}} items={items} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('open=true → vykreslí items', () => {
    render(<KebabMenu anchor={makeAnchor()} open onClose={() => {}} items={items} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Akce A' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Akce B' })).toBeInTheDocument();
  });

  it('klik na item volá jeho onClick', async () => {
    const onA = vi.fn();
    render(
      <KebabMenu
        anchor={makeAnchor()}
        open
        onClose={() => {}}
        items={[{ key: 'a', label: 'Akce A', onClick: onA }]}
      />,
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Akce A' }));
    expect(onA).toHaveBeenCalled();
  });

  it('Escape volá onClose', () => {
    const onClose = vi.fn();
    render(<KebabMenu anchor={makeAnchor()} open onClose={onClose} items={items} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('mobil ≤ 768 px vykreslí menu se scrim', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });
    const { container } = render(
      <KebabMenu anchor={makeAnchor()} open onClose={() => {}} items={items} />,
    );
    // Scrim je první div uvnitř bodyportal — najdeme přes class match
    const portalNodes = Array.from(document.body.querySelectorAll('div'));
    const hasScrim = portalNodes.some((n) =>
      (n.className ?? '').includes('scrim'),
    );
    expect(hasScrim).toBe(true);
    expect(container).toBeDefined();
  });

  it('roving tabindex: ArrowDown/ArrowUp cyklí fokus mezi položkami', () => {
    render(<KebabMenu anchor={makeAnchor()} open onClose={() => {}} items={items} />);
    const menu = screen.getByRole('menu');
    const [a, b] = screen.getAllByRole('menuitem');
    // Po otevření je fokus i tabindex=0 na první položce.
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute('tabindex', '0');
    expect(b).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(b).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // wrap na začátek
    expect(a).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowUp' }); // wrap na konec
    expect(b).toHaveFocus();
  });

  it('roving tabindex přeskočí disabled položku', () => {
    render(
      <KebabMenu
        anchor={makeAnchor()}
        open
        onClose={() => {}}
        items={[
          { key: 'a', label: 'Akce A', onClick: vi.fn() },
          { key: 'b', label: 'Disabled', disabled: true, onClick: vi.fn() },
          { key: 'c', label: 'Akce C', onClick: vi.fn() },
        ]}
      />,
    );
    const menu = screen.getByRole('menu');
    const a = screen.getByRole('menuitem', { name: 'Akce A' });
    const c = screen.getByRole('menuitem', { name: 'Akce C' });
    expect(a).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // přeskočí disabled 'b'
    expect(c).toHaveFocus();
  });

  it('disabled item nereaguje na klik', async () => {
    const onClick = vi.fn();
    render(
      <KebabMenu
        anchor={makeAnchor()}
        open
        onClose={() => {}}
        items={[{ key: 'x', label: 'Disabled', disabled: true, onClick }]}
      />,
    );
    const btn = screen.getByRole('menuitem', { name: 'Disabled' });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
