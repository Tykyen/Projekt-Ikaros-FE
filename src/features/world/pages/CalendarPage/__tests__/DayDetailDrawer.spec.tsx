import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GREGORIAN_DEFAULT_CONFIG } from '@/shared/lib/calendarEngine';
import { DayDetailDrawer, type DrawerEvent } from '../components/DayDetailDrawer';

function makeEvent(over: Partial<DrawerEvent>): DrawerEvent {
  return {
    id: 'e1',
    title: 'Event',
    date: { year: 2026, monthIndex: 4, day: 26 },
    color: '#7c5cff',
    kind: 'gameEvent',
    ...over,
  };
}

describe('DayDetailDrawer (9.4)', () => {
  it('vykreslí datum + počet eventů + seznam', () => {
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[
          makeEvent({ id: 'g1', title: 'Akce 1', kind: 'gameEvent' }),
          makeEvent({ id: 'p1', title: 'Pobyt', kind: 'player', entityName: 'Krásná elfka' }),
        ]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={() => {}}
        onEventClick={() => {}}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/2 události/i)).toBeInTheDocument();
    expect(screen.getByText('Akce 1')).toBeInTheDocument();
    expect(screen.getByText('Pobyt')).toBeInTheDocument();
  });

  it('řadí: gameEvent → player → npc → location', () => {
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[
          makeEvent({ id: 'l1', title: 'Lokace', kind: 'location', entityName: 'Hospoda' }),
          makeEvent({ id: 'n1', title: 'NPC', kind: 'npc', entityName: 'Strážce' }),
          makeEvent({ id: 'g1', title: 'Akce', kind: 'gameEvent' }),
          makeEvent({ id: 'p1', title: 'Hráč', kind: 'player', entityName: 'Elfka' }),
        ]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={() => {}}
        onEventClick={() => {}}
      />,
    );
    const titles = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    const akceIdx = titles.findIndex((t) => t.includes('Akce'));
    const hracIdx = titles.findIndex((t) => t.includes('Hráč'));
    const npcIdx = titles.findIndex((t) => t.includes('NPC'));
    const lokaceIdx = titles.findIndex((t) => t.includes('Lokace'));
    expect(akceIdx).toBeLessThan(hracIdx);
    expect(hracIdx).toBeLessThan(npcIdx);
    expect(npcIdx).toBeLessThan(lokaceIdx);
  });

  it('řadí podle času v rámci stejné kategorie', () => {
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[
          makeEvent({
            id: 'p2',
            title: 'Druhý',
            kind: 'player',
            date: { year: 2026, monthIndex: 4, day: 26, hour: 14 },
            entityName: 'Elfka',
          }),
          makeEvent({
            id: 'p1',
            title: 'První',
            kind: 'player',
            date: { year: 2026, monthIndex: 4, day: 26, hour: 8 },
            entityName: 'Elfka',
          }),
        ]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={() => {}}
        onEventClick={() => {}}
      />,
    );
    const titles = screen.getAllByRole('button').filter((b) => b.textContent?.includes('První') || b.textContent?.includes('Druhý'));
    expect(titles[0].textContent).toContain('První');
    expect(titles[1].textContent).toContain('Druhý');
  });

  it('zavře se ESC', () => {
    const onClose = vi.fn();
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[makeEvent({})]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={onClose}
        onEventClick={() => {}}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('zavře se kliknutím na backdrop (mimo drawer)', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[makeEvent({})]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={onClose}
        onEventClick={() => {}}
      />,
    );
    const backdrop = container.querySelector('[role="presentation"]')!;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('zavře se tlačítkem X', async () => {
    const onClose = vi.fn();
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[makeEvent({})]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={onClose}
        onEventClick={() => {}}
      />,
    );
    await userEvent.click(screen.getByLabelText('Zavřít detail dne'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('klik na event volá onEventClick s id', async () => {
    const onEventClick = vi.fn();
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[makeEvent({ id: 'abc', title: 'Klikni' })]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={() => {}}
        onEventClick={onEventClick}
      />,
    );
    await userEvent.click(screen.getByText('Klikni'));
    expect(onEventClick).toHaveBeenCalledWith('abc');
  });

  it('zobrazí čas u eventu pokud má hour', () => {
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[
          makeEvent({
            date: { year: 2026, monthIndex: 4, day: 26, hour: 14, minute: 30 },
          }),
        ]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={() => {}}
        onEventClick={() => {}}
      />,
    );
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('nezobrazí čas pokud nemá hour', () => {
    render(
      <DayDetailDrawer
        day={{ year: 2026, monthIndex: 4, day: 26 }}
        events={[makeEvent({})]}
        config={GREGORIAN_DEFAULT_CONFIG}
        onClose={() => {}}
        onEventClick={() => {}}
      />,
    );
    expect(screen.queryByText(/\d\d:\d\d/)).not.toBeInTheDocument();
  });
});
