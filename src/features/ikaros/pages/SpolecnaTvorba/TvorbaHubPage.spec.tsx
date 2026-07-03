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
  'hadanky',
];

describe('TvorbaHubPage (21.5)', () => {
  it('vyrenderuje všech 8 dlaždic', () => {
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

  it('stub dlaždice je proklikatelná a nese odznak „Připravujeme"', () => {
    renderHub();
    const bestiar = document.querySelector('[data-tile-key="bestiar"]');
    expect(bestiar?.getAttribute('href')).toBe('/ikaros/bestiar');
    expect(bestiar?.textContent).toContain('Připravujeme');
  });

  it('aktivní dlaždice zobrazí moderační badge z pending byType', () => {
    renderHub();
    const diskuze = document.querySelector('[data-tile-key="diskuze"]');
    expect(diskuze?.textContent).toContain('3');
  });
});
