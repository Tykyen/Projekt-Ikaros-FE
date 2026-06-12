import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { World } from '@/shared/types';
import { WorldAboutPanel } from '../WorldAboutPanel';

function makeWorld(over: Partial<World> = {}): World {
  return {
    id: 'w1',
    name: 'Matrix',
    slug: 'matrix',
    system: 'matrix',
    ownerId: 'u1',
    isActive: true,
    accessMode: 'private',
    playerCount: 0,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('WorldAboutPanel', () => {
  it('vykreslí popis, tóny i kostky', () => {
    render(
      <WorldAboutPanel
        world={makeWorld({
          description: 'Temný svět věží.',
          tones: ['ponurý', 'epický'],
          dice: ['d20', 'd6'],
        })}
      />,
    );
    expect(screen.getByText('Temný svět věží.')).toBeInTheDocument();
    expect(screen.getByText('ponurý')).toBeInTheDocument();
    expect(screen.getByText('d20')).toBeInTheDocument();
    expect(screen.getByText('Tón a styl')).toBeInTheDocument();
    expect(screen.getByText('Kostky a mechaniky')).toBeInTheDocument();
  });

  it('prázdný svět (bez popisu/tónů/kostek) → nerenderuje nic', () => {
    const { container } = render(<WorldAboutPanel world={makeWorld()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('jen popis → renderuje popis bez sekcí tónů/kostek', () => {
    render(
      <WorldAboutPanel world={makeWorld({ description: 'Jen popis.' })} />,
    );
    expect(screen.getByText('Jen popis.')).toBeInTheDocument();
    expect(screen.queryByText('Tón a styl')).not.toBeInTheDocument();
    expect(screen.queryByText('Kostky a mechaniky')).not.toBeInTheDocument();
  });

  it('je sbalitelný <details> a default sbalený', () => {
    const { container } = render(
      <WorldAboutPanel world={makeWorld({ description: 'Popis.' })} />,
    );
    const details = container.querySelector('details');
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute('open');
  });
});
