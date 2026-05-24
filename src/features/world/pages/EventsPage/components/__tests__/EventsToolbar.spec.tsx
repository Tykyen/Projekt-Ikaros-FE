import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldRole } from '@/shared/types';
import { EventsToolbar } from '../EventsToolbar';

function baseProps(overrides: Partial<Parameters<typeof EventsToolbar>[0]> = {}) {
  return {
    viewerRole: WorldRole.Hrac,
    view: 'upcoming' as const,
    onViewChange: vi.fn(),
    groupFilter: '',
    onGroupFilterChange: vi.fn(),
    customGroups: ['Lumíci', 'Evropani'],
    groupColors: { Lumíci: '#b07cff', Evropani: '#4d9fff' },
    onCreate: vi.fn(),
    ...overrides,
  };
}

describe('EventsToolbar', () => {
  it('hráč NEVIDÍ chip group Nadcházející | Archiv', () => {
    render(<EventsToolbar {...baseProps({ viewerRole: WorldRole.Hrac })} />);
    expect(screen.queryByRole('tab', { name: /Nadcházející/ })).toBeNull();
    expect(screen.queryByRole('tab', { name: /Archiv/ })).toBeNull();
  });

  it('hráč NEVIDÍ „Nová akce" button', () => {
    render(<EventsToolbar {...baseProps({ viewerRole: WorldRole.Hrac })} />);
    expect(screen.queryByText(/Nová akce/)).toBeNull();
  });

  it('PomocnyPJ vidí chip group i „Nová akce"', () => {
    render(
      <EventsToolbar
        {...baseProps({ viewerRole: WorldRole.PomocnyPJ })}
      />,
    );
    expect(
      screen.getByRole('tab', { name: /Nadcházející/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Archiv/ })).toBeInTheDocument();
    expect(screen.getByText(/Nová akce/)).toBeInTheDocument();
  });

  it('klik na Archiv volá onViewChange("archive")', () => {
    const onViewChange = vi.fn();
    render(
      <EventsToolbar
        {...baseProps({ viewerRole: WorldRole.PJ, onViewChange })}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Archiv/ }));
    expect(onViewChange).toHaveBeenCalledWith('archive');
  });

  it('group filter dropdown obsahuje všechny customGroups + „Všechny"', () => {
    render(<EventsToolbar {...baseProps({ viewerRole: WorldRole.Hrac })} />);
    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.map((o) => o.textContent)).toEqual([
      'Všechny',
      'Lumíci',
      'Evropani',
    ]);
  });

  it('group filter dropdown se nezobrazí pokud customGroups je prázdné', () => {
    render(<EventsToolbar {...baseProps({ customGroups: [] })} />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
