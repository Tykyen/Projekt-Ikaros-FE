import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldRoleChip } from './WorldRoleChip';
import { WorldRole } from '@/shared/types';

describe('WorldRoleChip', () => {
  it('PJ — label, ikona Crown, aria-label longLabel', () => {
    render(<WorldRoleChip role={WorldRole.PJ} />);
    const chip = screen.getByLabelText(/Pán jeskyně/);
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('PJ');
  });

  it('PomocnyPJ — label "Pomocný PJ"', () => {
    render(<WorldRoleChip role={WorldRole.PomocnyPJ} />);
    expect(screen.getByText('Pomocný PJ')).toBeInTheDocument();
  });

  it('Korektor', () => {
    render(<WorldRoleChip role={WorldRole.Korektor} />);
    expect(screen.getByText('Korektor')).toBeInTheDocument();
  });

  it('Hrac → "Hráč"', () => {
    render(<WorldRoleChip role={WorldRole.Hrac} />);
    expect(screen.getByText('Hráč')).toBeInTheDocument();
  });

  it('Ctenar → "Čtenář"', () => {
    render(<WorldRoleChip role={WorldRole.Ctenar} />);
    expect(screen.getByText('Čtenář')).toBeInTheDocument();
  });

  it('Zadatel → "Žadatel"', () => {
    render(<WorldRoleChip role={WorldRole.Zadatel} />);
    expect(screen.getByText('Žadatel')).toBeInTheDocument();
  });

  it('size="sm" přidá modifier class', () => {
    const { container } = render(
      <WorldRoleChip role={WorldRole.PJ} size="sm" />,
    );
    const chip = container.querySelector('span');
    expect(chip?.className).toMatch(/sm/);
  });

  it('tooltip=false → aria-label je krátký label', () => {
    render(<WorldRoleChip role={WorldRole.PJ} tooltip={false} />);
    expect(screen.getByLabelText('PJ')).toBeInTheDocument();
  });
});
