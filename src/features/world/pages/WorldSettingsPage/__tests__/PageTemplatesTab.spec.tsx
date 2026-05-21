import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageTemplatesTab from '../tabs/PageTemplatesTab';
import type { WorldPageTemplate } from '@/features/world/pages/api/worldPageTemplates.types';

const createMut = vi.fn().mockResolvedValue({});
const updateMut = vi.fn().mockResolvedValue({});
const deleteMut = vi.fn().mockResolvedValue(undefined);
const toastSuccess = vi.fn();
const toastError = vi.fn();

let mockTemplates: WorldPageTemplate[] = [];

vi.mock('@/features/world/pages/api/useWorldPageTemplates', () => ({
  useWorldPageTemplates: () => ({ data: mockTemplates, isLoading: false }),
}));
vi.mock('@/features/world/pages/api/useCreateWorldPageTemplate', () => ({
  useCreateWorldPageTemplate: () => ({
    mutateAsync: createMut,
    isPending: false,
  }),
}));
vi.mock('@/features/world/pages/api/useUpdateWorldPageTemplate', () => ({
  useUpdateWorldPageTemplate: () => ({
    mutateAsync: updateMut,
    isPending: false,
  }),
}));
vi.mock('@/features/world/pages/api/useDeleteWorldPageTemplate', () => ({
  useDeleteWorldPageTemplate: () => ({
    mutateAsync: deleteMut,
    isPending: false,
  }),
}));
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    world: { id: 'w1', slug: 'matrix' },
    worldId: 'w1',
    worldSlug: 'matrix',
  }),
}));
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  },
}));

const TPL: WorldPageTemplate = {
  id: 't1',
  worldId: 'w1',
  key: 'stat',
  label: 'Stát',
  headers: ['Hl. město', 'Měna'],
  defaultTitle: 'Profil státu',
  icon: 'Globe',
  order: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PageTemplatesTab', () => {
  beforeEach(() => {
    createMut.mockClear();
    updateMut.mockClear();
    deleteMut.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
    mockTemplates = [];
  });

  it('prázdný stav ukáže hint na novou šablonu', () => {
    render(<PageTemplatesTab />);
    expect(screen.getByText(/Žádné šablony zatím nejsou/)).toBeInTheDocument();
  });

  it('zobrazí existující šablony', () => {
    mockTemplates = [TPL];
    render(<PageTemplatesTab />);
    expect(screen.getByText('Stát')).toBeInTheDocument();
    expect(screen.getByText('Hl. město · Měna')).toBeInTheDocument();
    expect(screen.getByText(/2 polí/)).toBeInTheDocument();
  });

  it('„Nová šablona" otevře modal', async () => {
    render(<PageTemplatesTab />);
    await userEvent.click(
      screen.getByRole('button', { name: /Nová šablona/ }),
    );
    expect(
      await screen.findByPlaceholderText(/Postava, Stát/),
    ).toBeInTheDocument();
  });

  it('smazat otevře confirm a po potvrzení volá mutaci', async () => {
    mockTemplates = [TPL];
    render(<PageTemplatesTab />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Smazat šablonu Stát' }),
    );
    expect(
      await screen.findByText(/bude trvale odstraněna/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Smazat' }));
    expect(deleteMut).toHaveBeenCalledWith('t1');
  });
});
