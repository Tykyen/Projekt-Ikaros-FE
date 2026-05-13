import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorldRoleIcon, type WorldRoleKey } from '../WorldRoleIcon';

const CASES: Array<{ role: WorldRoleKey; label: string }> = [
  { role: 'pj',        label: 'PJ' },
  { role: 'pj-asst',   label: 'Pomocný PJ' },
  { role: 'corrector', label: 'Korektor' },
  { role: 'player',    label: 'Hráč' },
  { role: 'reader',    label: 'Čtenář' },
  { role: 'applicant', label: 'Žadatel' },
];

describe('WorldRoleIcon', () => {
  it.each(CASES)('role $role → aria-label $label', ({ role, label }) => {
    render(<WorldRoleIcon role={role} />);
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it('size="sm" → svg width 14', () => {
    const { container } = render(<WorldRoleIcon role="pj" size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '14');
  });

  it('size="lg" → svg width 24', () => {
    const { container } = render(<WorldRoleIcon role="pj" size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
  });

  it('showLabel → label text v outputu', () => {
    render(<WorldRoleIcon role="corrector" showLabel />);
    // role 'corrector' má label 'Korektor' — aria-label i text
    expect(screen.getAllByText('Korektor').length).toBeGreaterThan(0);
  });
});
