import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { PendingActionType } from '@/shared/types';

// 21.5 — hub „Společná tvorba". Mockujeme jen pending-actions hook (badge);
// zbytek (atomy, Router) běží nastojáka.
vi.mock('@/features/users/api/usePendingActions', () => ({
  usePendingActionsCount: () => ({
    data: {
      total: 3,
      byType: { [PendingActionType.DiscussionPendingReview]: 3 },
    },
  }),
}));

import TvorbaHubPage from './TvorbaHubPage';

function renderHub() {
  const store = createStore();
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </MemoryRouter>
  );
  return render(<TvorbaHubPage />, { wrapper: Wrapper });
}

const ALL_KEYS = [
  'diskuze',
  'clanky',
  'galerie',
  'bestiar',
  'herbar',
  'lektvary',
  'kouzla',
  'predmety',
  'hadanky',
  'ceniky',
];

describe('TvorbaHubPage (21.5)', () => {
  it('vyrenderuje všech 10 dlaždic', () => {
    renderHub();
    for (const key of ALL_KEYS) {
      expect(document.querySelector(`[data-tile-key="${key}"]`)).toBeTruthy();
    }
  });

  it('aktivní dlaždice vede na svou routu', () => {
    renderHub();
    const diskuze = document.querySelector('[data-tile-key="diskuze"]');
    expect(diskuze?.getAttribute('href')).toBe('/ikaros/diskuze');
  });

  // 21.5d dokončil poslední knihovnu — žádná dlaždice už není stub.
  it('žádná dlaždice nenese odznak „Připravujeme" (všech 10 aktivních)', () => {
    renderHub();
    for (const key of ALL_KEYS) {
      const tile = document.querySelector(`[data-tile-key="${key}"]`);
      expect(tile?.textContent, key).not.toContain('Připravujeme');
    }
  });

  it('aktivní dlaždice zobrazí moderační badge z pending byType', () => {
    renderHub();
    const diskuze = document.querySelector('[data-tile-key="diskuze"]');
    expect(diskuze?.textContent).toContain('3');
  });
});
