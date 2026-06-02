import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoadPreparationDialog } from './LoadPreparationDialog';
import type { MapScene } from '../../types';

const { postOp } = vi.hoisted(() => ({
  postOp: vi.fn<(sceneId: string, op: { type: string; [k: string]: unknown }) => Promise<void>>(
    () => Promise.resolve(),
  ),
}));

vi.mock('../../api/mapApi', () => ({ postMapOperation: postOp }));
vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn((url: string) =>
      url.endsWith('/players')
        ? Promise.resolve([{ id: 'c1', slug: 'hrdina' }])
        : Promise.resolve([]),
    ),
  },
  parseApiError: () => 'err',
}));
vi.mock('@/features/world/campaign/api', () => ({
  useCampaignScenarios: () => ({
    data: [
      {
        id: 's1',
        title: 'Útok na hrad',
        worldId: 'w',
        ownerId: 'me',
        isShared: false,
        order: 0,
        subjectIds: ['sub1'],
        storylineIds: [],
        images: [],
        createdAt: '',
        updatedAt: '',
        contentData: {
          storyTree: { kind: 'scene', bestieIds: ['b1'], pageSlugs: [] },
        },
      },
    ],
  }),
  useCampaignSubjects: () => ({
    data: [{ id: 'sub1', name: 'Hrdina', linkedCharacterSlug: 'hrdina' }],
  }),
}));

const scene = {
  id: 'scene1',
  name: 'Hrad',
  activeBestieIds: [],
  activeCharacterIds: [],
} as unknown as MapScene;

function renderDialog() {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <LoadPreparationDialog worldId="w" scene={scene} onClose={() => {}} />
    </QueryClientProvider>,
  );
}

describe('LoadPreparationDialog', () => {
  it('vloží bestie (přímo) + postavy (resolve subjekt→slug→id) do scény', async () => {
    postOp.mockClear();
    renderDialog();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's1' } });

    // Po resolve postav (async query) se zobrazí plán 1 postava + 1 bestie.
    await waitFor(() =>
      expect(screen.getByText(/postav/)).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Načíst přípravu' }));

    await waitFor(() => expect(postOp).toHaveBeenCalledTimes(2));
    const ops = postOp.mock.calls.map((c) => c[1]);
    expect(ops).toContainEqual({ type: 'scene.activeBestie.add', bestieId: 'b1' });
    expect(ops).toContainEqual({
      type: 'scene.activeCharacters.add',
      characterId: 'c1',
    });
  });
});
