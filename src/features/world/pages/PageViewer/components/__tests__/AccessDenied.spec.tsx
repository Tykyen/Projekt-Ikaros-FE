import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccessDenied } from '../AccessDenied';
import type { PageMeta } from '../../../api/usePageMeta';

let mockMeta: PageMeta | undefined;

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldSlug: 'matrix',
    worldId: 'w1',
    userRole: 2,
  }),
}));
vi.mock('../../../api/usePageMeta', () => ({
  usePageMeta: () => ({ data: mockMeta }),
}));

function renderUI() {
  return render(
    <MemoryRouter>
      <AccessDenied slug="tajne-info" />
    </MemoryRouter>,
  );
}

describe('AccessDenied', () => {
  it('bez shieldedBy → generic text + nadpis "Přístup zamítnut"', () => {
    mockMeta = { isWoodWide: false };
    renderUI();
    expect(screen.getByText('Přístup zamítnut')).toBeInTheDocument();
    expect(
      screen.queryByText(/K odemčení potřebuješ/),
    ).not.toBeInTheDocument();
  });

  it('s AKJ level 3 → zobrazí "AKJ úroveň 3"', () => {
    mockMeta = {
      isWoodWide: false,
      shieldedBy: [{ type: 'AKJ', level: 3 }],
    };
    renderUI();
    expect(screen.getByText('Stránka je zašifrovaná')).toBeInTheDocument();
    expect(screen.getByText('AKJ úroveň 3')).toBeInTheDocument();
    expect(
      screen.getByText(/Promluv s PJ světa o získání úrovně/),
    ).toBeInTheDocument();
  });

  it('s AKJType resolved label → zobrazí název + úroveň', () => {
    mockMeta = {
      isWoodWide: false,
      shieldedBy: [
        {
          type: 'AKJType',
          level: 5,
          akjKey: 'top-secret',
          akjLabel: 'Tajný spis',
        },
      ],
    };
    renderUI();
    expect(screen.getByText('Tajný spis (úroveň 5)')).toBeInTheDocument();
  });

  it('s Role requirement → zobrazí role label', () => {
    mockMeta = {
      isWoodWide: false,
      shieldedBy: [{ type: 'Role', level: 4, roleLabel: 'Pomocný PJ' }],
    };
    renderUI();
    expect(screen.getByText('Role: Pomocný PJ')).toBeInTheDocument();
  });

  it('shieldedBy + isWoodWide → obě sekce', () => {
    mockMeta = {
      isWoodWide: true,
      shieldedBy: [{ type: 'AKJ', level: 2 }],
    };
    renderUI();
    expect(screen.getByText('AKJ úroveň 2')).toBeInTheDocument();
    expect(screen.getByText(/celosvětového lore/)).toBeInTheDocument();
  });

  it('AKJType s fallback labelem (zombie key)', () => {
    mockMeta = {
      isWoodWide: false,
      shieldedBy: [
        {
          type: 'AKJType',
          akjKey: 'zombie',
          akjLabel: 'zombie',
        },
      ],
    };
    renderUI();
    // Bez level → bez " (úroveň X)" suffixu
    expect(screen.getByText('zombie')).toBeInTheDocument();
  });
});
