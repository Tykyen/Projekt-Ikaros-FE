import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupChip } from '../GroupChip';

describe('GroupChip', () => {
  it('zobrazí jméno skupiny a barvu z propu', () => {
    render(<GroupChip name="Lumíci" color="#b07cff" />);
    const chip = screen.getByText('Lumíci').parentElement;
    expect(chip).toBeTruthy();
    expect(chip!.style.background).toContain('rgb(176, 124, 255)');
  });

  it('bez locked prop nezobrazí Lock ikonu', () => {
    const { container } = render(
      <GroupChip name="Evropani" color="#4d9fff" />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('s locked=true zobrazí Lock ikonu', () => {
    const { container } = render(
      <GroupChip name="MI6" color="#ff9a2e" locked />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('size=sm aplikuje menší variantu', () => {
    const { container } = render(
      <GroupChip name="Test" color="#000" size="sm" />,
    );
    // class kontainer obsahuje sm modifier (CSS module hash)
    const chip = container.querySelector('span');
    expect(chip?.className).toMatch(/sm/);
  });
});
