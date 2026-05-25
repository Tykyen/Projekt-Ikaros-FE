import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeChip } from '../TypeChip';

describe('TypeChip', () => {
  it('info → label „Informace"', () => {
    render(<TypeChip type="info" />);
    expect(screen.getByText('Informace')).toBeInTheDocument();
  });

  it('alert → label „Důležité"', () => {
    render(<TypeChip type="alert" />);
    expect(screen.getByText('Důležité')).toBeInTheDocument();
  });

  it('system → label „Systém"', () => {
    render(<TypeChip type="system" />);
    expect(screen.getByText('Systém')).toBeInTheDocument();
  });

  it('size=sm aplikuje menší variantu', () => {
    const { container } = render(<TypeChip type="info" size="sm" />);
    const chip = container.querySelector('span');
    expect(chip?.className).toMatch(/sm/);
  });
});
