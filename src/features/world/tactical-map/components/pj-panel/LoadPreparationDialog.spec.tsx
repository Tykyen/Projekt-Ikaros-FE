import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoadPreparationDialog } from './LoadPreparationDialog';

const { postOp, postWorldOp, apiPost, apiPut, apiClientPost } = vi.hoisted(
  () => ({
    postOp: vi.fn<
      (
        sceneId: string,
        op: { type: string; [k: string]: unknown },
      ) => Promise<void>
    >(() => Promise.resolve()),
    postWorldOp: vi.fn(() => Promise.resolve()),
    apiPost: vi.fn(() => Promise.resolve({ id: 'newscene' })),
    apiPut: vi.fn(() => Promise.resolve({})),
    apiClientPost: vi.fn(() => Promise.resolve({})),
  }),
);

vi.mock('../../api/mapApi', () => ({ postMapOperation: postOp }));
vi.mock('../../api/worldOpsApi', () => ({ postWorldOperation: postWorldOp }));
vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn((url: string) =>
      url.endsWith('/players')
        ? Promise.resolve([{ id: 'c1', slug: 'hrdina' }])
        : Promise.resolve([]),
    ),
    post: apiPost,
    put: apiPut,
  },
  apiClient: { post: apiClientPost },
  parseApiError: () => 'err',
}));
vi.mock('@/features/world/campaign/api', () => ({
  campaignKeys: {
    scenarios: (w: string) => ['campaign', w, 'scenarios'],
  },
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
          storyTree: {
            kind: 'scene',
            bestieIds: ['b1'],
            pageSlugs: [],
            mapPrep: {
              imageUrl: 'http://img/base.png',
              numberedImageUrl: 'http://img/numbered.png',
              legend: [],
            },
          },
        },
      },
    ],
  }),
  useCampaignSubjects: () => ({
    data: [{ id: 'sub1', name: 'Hrdina', linkedCharacterSlug: 'hrdina' }],
  }),
}));

function renderDialog() {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <LoadPreparationDialog worldId="w" currentUserId="me" onClose={() => {}} />
    </QueryClientProvider>,
  );
}

describe('LoadPreparationDialog', () => {
  it('vytvoří scénu s podkladem (základní imageUrl) + vloží bestie a postavy', async () => {
    postOp.mockClear();
    postWorldOp.mockClear();
    apiPost.mockClear();
    apiPut.mockClear();
    apiClientPost.mockClear();
    renderDialog();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's1' } });

    // Po resolve postav (async query) se zobrazí plán 1 postava + 1 bestie.
    await waitFor(() => expect(screen.getByText(/postav/)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit scénu' }));

    // Nová scéna se založí jménem scénáře.
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    expect(apiPost.mock.calls[0][0]).toBe('/maps');
    expect(apiPost.mock.calls[0][1]).toMatchObject({ name: 'Útok na hrad' });

    const ops = postOp.mock.calls.map((c) => c[1]);
    // Podklad = ZÁKLADNÍ imageUrl, NE numberedImageUrl.
    expect(ops).toContainEqual({
      type: 'scene.image',
      imageUrl: 'http://img/base.png',
    });
    expect(ops).not.toContainEqual(
      expect.objectContaining({ imageUrl: 'http://img/numbered.png' }),
    );
    // Entity do nové scény (sceneId z create = 'newscene').
    expect(ops).toContainEqual({ type: 'scene.activeBestie.add', bestieId: 'b1' });
    expect(ops).toContainEqual({
      type: 'scene.activeCharacters.add',
      characterId: 'c1',
    });
    expect(postOp.mock.calls.every((c) => c[0] === 'newscene')).toBe(true);

    // Aktivace + přepnutí PJ na novou scénu.
    await waitFor(() => expect(apiClientPost).toHaveBeenCalled());
    expect(apiClientPost.mock.calls[0][0]).toBe('/maps/newscene/active');
    expect(postWorldOp).toHaveBeenCalledWith('w', {
      type: 'member.assignToScene',
      userId: 'me',
      sceneId: 'newscene',
    });

    // D-076 — provázání scénář→scéna: PUT doplní mapSceneIds o novou scénu.
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    const putUrl = apiPut.mock.calls[0][0] as string;
    const putBody = apiPut.mock.calls[0][1] as {
      contentData: { storyTree: { mapSceneIds: string[] } };
    };
    expect(putUrl).toContain('/campaign/scenarios/s1');
    expect(putBody.contentData.storyTree.mapSceneIds).toContain('newscene');
  });
});
