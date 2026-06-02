import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ScenarioLinksPanel } from './ScenarioLinksPanel';
import type { CampaignScenario, CampaignSubject } from '../types';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('../api', () => ({
  useUpdateScenario: () => ({ mutate }),
}));
vi.mock('@/features/world/pages/api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: [] }),
}));
vi.mock('@/features/world/bestiar/hooks/useBestiar', () => ({
  useBestiar: () => ({ data: { system: [], user: [], world: [] } }),
}));

function subj(id: string, name: string): CampaignSubject {
  return {
    id,
    worldId: 'w',
    ownerId: 'me',
    isShared: false,
    type: 'NPC',
    name,
    tags: [],
    status: 'active',
    createdAt: '',
    updatedAt: '',
  };
}

function scen(subjectIds: string[] = []): CampaignScenario {
  return {
    id: 's1',
    worldId: 'w',
    ownerId: 'me',
    isShared: false,
    title: 'Scéna',
    order: 0,
    subjectIds,
    storylineIds: [],
    images: [],
    createdAt: '',
    updatedAt: '',
    contentData: { storyTree: { kind: 'scene' } },
  };
}

function renderPanel(opts: {
  worldSystem?: string;
  subjectIds?: string[];
  subjects?: CampaignSubject[];
} = {}) {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ScenarioLinksPanel
          scenario={scen(opts.subjectIds)}
          worldId="w"
          worldSlug="svet"
          worldSystem={opts.worldSystem ?? 'dnd5e'}
          subjects={opts.subjects ?? []}
          storylines={[]}
          readOnly={false}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ScenarioLinksPanel', () => {
  it('vykreslí sekce provázání (mapa-podklad je v editoru, ne tady)', () => {
    renderPanel();
    expect(screen.getByText('📍 Místo scény')).toBeTruthy();
    expect(screen.getByText('📄 Wiki stránky')).toBeTruthy();
    expect(screen.getByText('🐉 Bestiář')).toBeTruthy();
    expect(screen.getByText('👥 Subjekty')).toBeTruthy();
    expect(screen.getByText('🧵 Linky')).toBeTruthy();
  });

  it('bez systému světa ukáže u bestiáře hint', () => {
    renderPanel({ worldSystem: '' });
    expect(screen.getByText('Svět nemá nastavený systém')).toBeTruthy();
  });

  it('odebrání subjektu uloží přes update s prázdným subjectIds', () => {
    mutate.mockClear();
    renderPanel({ subjectIds: ['subj9'], subjects: [subj('subj9', 'Drak')] });
    fireEvent.click(screen.getByLabelText('Odebrat Drak'));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0].input.subjectIds).toEqual([]);
  });
});
