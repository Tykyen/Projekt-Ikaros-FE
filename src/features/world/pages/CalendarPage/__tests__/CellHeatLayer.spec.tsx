import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CellHeatLayer } from '../components/CellHeatLayer';
import { heatA11yLabel } from '../lib/heatLabels';

describe('CellHeatLayer (9.4)', () => {
  it('nezobrazí se pro 0 eventů', () => {
    const { container } = render(<CellHeatLayer eventCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('opacity 0.12 pro 1-5 events', () => {
    const { container } = render(<CellHeatLayer eventCount={3} />);
    const layer = container.firstChild as HTMLElement;
    expect(layer.style.opacity).toBe('0.12');
  });

  it('opacity 0.24 pro 6-20 events', () => {
    const { container } = render(<CellHeatLayer eventCount={15} />);
    const layer = container.firstChild as HTMLElement;
    expect(layer.style.opacity).toBe('0.24');
  });

  it('opacity 0.4 pro 21-50 events', () => {
    const { container } = render(<CellHeatLayer eventCount={35} />);
    const layer = container.firstChild as HTMLElement;
    expect(layer.style.opacity).toBe('0.4');
  });

  it('opacity 0.6 pro 51+ events', () => {
    const { container } = render(<CellHeatLayer eventCount={100} />);
    const layer = container.firstChild as HTMLElement;
    expect(layer.style.opacity).toBe('0.6');
  });

  it('aria-hidden=true (dekorativní vrstva)', () => {
    const { container } = render(<CellHeatLayer eventCount={1} />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('heatA11yLabel (9.4)', () => {
  it('prázdný string pro 0', () => {
    expect(heatA11yLabel(0)).toBe('');
  });

  it('singular pro 1', () => {
    expect(heatA11yLabel(1)).toBe('1 událost');
  });

  it('few-form pro 2-4', () => {
    expect(heatA11yLabel(2)).toBe('2 události');
    expect(heatA11yLabel(4)).toBe('4 události');
  });

  it('plural pro 5+', () => {
    expect(heatA11yLabel(5)).toBe('5 událostí');
    expect(heatA11yLabel(23)).toBe('23 událostí');
  });
});
