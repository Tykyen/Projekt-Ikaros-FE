import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScenarioEditor } from './ScenarioEditor';
import type { ScenarioMeta } from '../scenarioMeta';
import type { CampaignScenario, CreateScenarioInput } from '../types';

// TipTap nelze v jsdom plně mountovat → náhrada textareou se stejným kontraktem.
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange?: (html: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock('@/shared/api', () => ({
  useUploadImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Integrace chatu se testuje zvlášť; tady jen editor logika.
vi.mock('./SendImageToChatDialog', () => ({
  SendImageToChatDialog: () => null,
}));


function scen(meta: Partial<ScenarioMeta> = {}): CampaignScenario {
  return {
    id: 's1',
    worldId: 'w',
    ownerId: 'me',
    isShared: false,
    title: 'Scéna A',
    order: 0,
    subjectIds: ['subj1'],
    storylineIds: [],
    images: [],
    createdAt: '',
    updatedAt: '',
    contentData: { storyTree: { kind: 'scene', status: 'draft', ...meta } },
  };
}

function setup(opts: { isPJ?: boolean; meta?: Partial<ScenarioMeta> } = {}) {
  const onSave = vi.fn<(input: CreateScenarioInput) => void>();
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <ScenarioEditor
        scenario={scen(opts.meta)}
        isPJ={opts.isPJ ?? true}
        readOnly={false}
        isSaving={false}
        onSave={onSave}
      />
    </QueryClientProvider>,
  );
  return onSave;
}

describe('ScenarioEditor', () => {
  it('tajná PJ zóna se zobrazí jen PJ', () => {
    setup({ isPJ: true });
    expect(screen.getByText('🔒 Jen PJ')).toBeTruthy();
  });

  it('hráč (ne PJ) tajnou zónu nevidí', () => {
    setup({ isPJ: false });
    expect(screen.queryByText('🔒 Jen PJ')).toBeNull();
  });

  it('Uložit je zakázané dokud není dirty', () => {
    setup();
    const save = screen.getByRole('button', { name: 'Uložit' });
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });

  it('změna stavu zachová tělo (merge, ne přepis) a uloží first-class linky', () => {
    const onSave = setup({ meta: { body: '<p>příběh</p>' } });
    fireEvent.change(screen.getByDisplayValue('Koncept'), {
      target: { value: 'active' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Uložit' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0];
    const tree = (input.contentData as { storyTree: ScenarioMeta }).storyTree;
    expect(tree.status).toBe('active');
    expect(tree.body).toBe('<p>příběh</p>'); // tělo nesmaže
    expect(input.subjectIds).toEqual(['subj1']); // first-class linky zachovány
  });
});
