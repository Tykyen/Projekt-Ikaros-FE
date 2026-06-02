import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioTree } from './ScenarioTree';
import { buildTree, type ScenarioMeta } from '../scenarioMeta';
import type { CampaignScenario } from '../types';

function scen(
  id: string,
  title: string,
  meta: Partial<ScenarioMeta> = {},
): CampaignScenario {
  return {
    id,
    worldId: 'w',
    ownerId: 'me',
    isShared: false,
    title,
    order: 0,
    subjectIds: [],
    storylineIds: [],
    images: [],
    createdAt: '',
    updatedAt: '',
    contentData: { storyTree: meta },
  };
}

function renderTree(props: Partial<Parameters<typeof ScenarioTree>[0]> = {}) {
  const scenarios = [
    scen('akt', 'Akt I', { kind: 'folder', order: 0 }),
    scen('s1', 'Scéna 1', { parentId: 'akt', order: 0 }),
    scen('s2', 'Scéna 2', { parentId: 'akt', order: 1, branchLabel: 'pokud zradí' }),
  ];
  const handlers = {
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onCreateFromTemplate: vi.fn(),
    onDelete: vi.fn(),
    onMove: vi.fn(),
  };
  render(
    <ScenarioTree
      nodes={buildTree(scenarios)}
      selectedId={null}
      readOnly={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('ScenarioTree', () => {
  it('vykreslí hierarchii včetně branchLabel', () => {
    renderTree();
    expect(screen.getByText('Akt I')).toBeTruthy();
    expect(screen.getByText('Scéna 1')).toBeTruthy();
    expect(screen.getByText('Scéna 2')).toBeTruthy();
    expect(screen.getByText('↳ pokud zradí')).toBeTruthy();
  });

  it('„+ Scéna" v hlavičce vytvoří kořenovou scénu', () => {
    const h = renderTree();
    fireEvent.click(screen.getByRole('button', { name: '+ Scéna' }));
    expect(h.onCreate).toHaveBeenCalledWith(null, 'scene');
  });

  it('„+ Složka" vytvoří kořenovou složku', () => {
    const h = renderTree();
    fireEvent.click(screen.getByRole('button', { name: '+ Složka' }));
    expect(h.onCreate).toHaveBeenCalledWith(null, 'folder');
  });

  it('klik na uzel volá onSelect', () => {
    const h = renderTree();
    fireEvent.click(screen.getByText('Scéna 1'));
    expect(h.onSelect).toHaveBeenCalledWith('s1');
  });

  it('readOnly skryje tlačítka tvorby', () => {
    renderTree({ readOnly: true });
    expect(screen.queryByRole('button', { name: '+ Scéna' })).toBeNull();
  });

  it('prázdný strom ukáže výzvu', () => {
    render(
      <ScenarioTree
        nodes={[]}
        selectedId={null}
        readOnly={false}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onCreateFromTemplate={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
      />,
    );
    expect(screen.getByText(/Začni příběh/)).toBeTruthy();
  });
});
