import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnknownCurrencyChip } from './UnknownCurrencyChip';

describe('UnknownCurrencyChip', () => {
  it('zobrazí code v chipu', () => {
    render(<UnknownCurrencyChip code="EU" />);
    expect(screen.getByText(/⚠.*EU/)).toBeInTheDocument();
  });

  it('má tooltip s vysvětlením', () => {
    render(<UnknownCurrencyChip code="EU" />);
    const chip = screen.getByLabelText('Neznámá měna EU');
    expect(chip).toHaveAttribute('title', expect.stringContaining("'EU'"));
    expect(chip).toHaveAttribute('title', expect.stringContaining('kontaktuj PJ'));
  });
});
