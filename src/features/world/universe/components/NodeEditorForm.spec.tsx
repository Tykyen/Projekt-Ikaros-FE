import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { NodeEditorForm } from './NodeEditorForm';
import type { UniverseNode } from '../types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn().mockResolvedValue([]) },
}));

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('NodeEditorForm', () => {
  it('nový uzel: vyplnění jména + Přidat → onSubmit s name + vygenerovaným id', () => {
    const onSubmit = vi.fn();
    render(
      <NodeEditorForm
        worldId="w1"
        editingNode={null}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.change(screen.getByPlaceholderText('Jméno (Země)'), {
      target: { value: 'Mars' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Přidat těleso/ }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0] as UniverseNode;
    expect(arg.name).toBe('Mars');
    expect(arg.id).toBeTruthy();
    expect(arg.type).toBe('planet');
  });

  it('prázdné jméno → onSubmit se nevolá', () => {
    const onSubmit = vi.fn();
    render(
      <NodeEditorForm
        worldId="w1"
        editingNode={null}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByRole('button', { name: /Přidat těleso/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('editace: předvyplní formulář a drží id', () => {
    const node: UniverseNode = {
      id: 'earth',
      name: 'Země',
      type: 'planet',
      color: '#22aaff',
      size: 7,
      isPublic: true,
      visibleToPlayerIds: [],
    };
    const onSubmit = vi.fn();
    render(
      <NodeEditorForm
        worldId="w1"
        editingNode={node}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByDisplayValue('Země')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Uložit těleso/ }));
    expect((onSubmit.mock.calls[0][0] as UniverseNode).id).toBe('earth');
  });
});
