import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrencyDisplay } from './CurrencyDisplay';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlatak', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stribrnak', symbol: 'St', rate: 0.1 },
];

// Helper - porovna textContent ignorujici libovolny whitespace (Intl cs-CZ
// pouziva U+00A0 non-breaking space jako tisicovy separator).
function textMatches(expected: string) {
  return (_content: string, el: Element | null) => {
    if (!el || el.tagName !== 'SPAN') return false;
    const stripped = el.textContent?.replace(/\s+/g, '') ?? '';
    return stripped === expected.replace(/\s+/g, '');
  };
}

describe('CurrencyDisplay', () => {
  it('zobrazi amount + symbol bez konverze', () => {
    render(<CurrencyDisplay amount={100} currencyCode="ZL" items={items} />);
    expect(screen.getByText('100 Zl')).toBeInTheDocument();
  });

  it('prevede a zobrazi cilovou hodnotu s tooltipem', () => {
    render(
      <CurrencyDisplay
        amount={100}
        currencyCode="ZL"
        items={items}
        convertTo="ST"
      />,
    );
    // 100 ZL x (1.0 / 0.1) = 1000 ST
    const span = screen.getByText(textMatches('1000St'));
    expect(span).toBeInTheDocument();
    expect(span.getAttribute('title')).toContain('100 Zl');
  });

  it('convertTo === currencyCode -> zadna konverze', () => {
    render(
      <CurrencyDisplay
        amount={50}
        currencyCode="ZL"
        items={items}
        convertTo="ZL"
      />,
    );
    expect(screen.getByText('50 Zl')).toBeInTheDocument();
  });

  it('showTooltip=false vypne title atribut', () => {
    render(
      <CurrencyDisplay
        amount={10}
        currencyCode="ZL"
        items={items}
        convertTo="ST"
        showTooltip={false}
      />,
    );
    const span = screen.getByText(textMatches('100St'));
    expect(span).not.toHaveAttribute('title');
  });
});
