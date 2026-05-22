import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DataTemplatePanel } from '../DataTemplatePanel';
import type { WorldPageTemplate } from '../../../api/worldPageTemplates.types';
import type { PageTable } from '../../../api/pages.types';

/** DataTemplatePanel obsahuje <Link> → render uvnitř routeru. */
const renderPanel = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const TEMPLATES: WorldPageTemplate[] = [
  {
    id: 't1',
    worldId: 'w1',
    key: 'stat',
    label: 'Stát',
    headers: ['Hlavní město', 'Měna'],
    defaultTitle: 'Profil státu',
    icon: 'Globe',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't2',
    worldId: 'w1',
    key: 'mesto',
    label: 'Město',
    headers: ['Stát', 'Obyvatel'],
    icon: 'MapPin',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockTemplates: WorldPageTemplate[] = [];

vi.mock('../../../api/useWorldPageTemplates', () => ({
  useWorldPageTemplates: () => ({ data: mockTemplates, isLoading: false }),
}));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1', worldSlug: 'matrix' }),
}));

// CollapsiblePanel je trivial wrapper s collapsem (`defaultOpen` umožní render).
// Pro stable testy ho neoperem — používáme `defaultOpen=true` (panel renderuje hned).

const EMPTY_TABLE: PageTable = {
  hasTable: false,
  title: '',
  headers: [],
  values: [],
};

describe('DataTemplatePanel', () => {
  beforeEach(() => {
    mockTemplates = TEMPLATES;
  });

  it('vykreslí „Volný text" + per-svět šablony', () => {
    renderPanel(<DataTemplatePanel table={EMPTY_TABLE} onChange={() => {}} />);
    expect(screen.getByText('Volný text')).toBeInTheDocument();
    expect(screen.getByText('Stát')).toBeInTheDocument();
    expect(screen.getByText('Město')).toBeInTheDocument();
  });

  it('prázdný svět ukáže jen „Volný text" a hint', () => {
    mockTemplates = [];
    renderPanel(<DataTemplatePanel table={EMPTY_TABLE} onChange={() => {}} />);
    expect(screen.getByText('Volný text')).toBeInTheDocument();
    expect(screen.queryByText('Stát')).not.toBeInTheDocument();
    expect(screen.getByText(/Vytvořit v Nastavení/)).toBeInTheDocument();
  });

  it('klik na šablonu na prázdnou tabulku aplikuje headers + defaultTitle', async () => {
    const onChange = vi.fn();
    renderPanel(<DataTemplatePanel table={EMPTY_TABLE} onChange={onChange} />);
    await userEvent.click(screen.getByText('Stát'));
    expect(onChange).toHaveBeenCalledWith({
      hasTable: true,
      title: 'Profil státu',
      headers: ['Hlavní město', 'Měna'],
      values: ['', ''],
    });
  });

  it('„Volný text" karta na prázdné table = no-op (žádný warning modal)', async () => {
    const onChange = vi.fn();
    renderPanel(<DataTemplatePanel table={EMPTY_TABLE} onChange={onChange} />);
    await userEvent.click(screen.getByText('Volný text'));
    expect(onChange).toHaveBeenCalledWith({
      hasTable: false,
      title: '',
      headers: [],
      values: [],
    });
  });

  it('klik na novou šablonu na existující tabulce otevře warning modal', async () => {
    const onChange = vi.fn();
    const tableWithData: PageTable = {
      hasTable: true,
      title: 'Stará',
      headers: ['x'],
      values: ['y'],
    };
    renderPanel(<DataTemplatePanel table={tableWithData} onChange={onChange} />);
    await userEvent.click(screen.getByText('Město'));
    // Modal se objeví — onChange ne hned.
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Šablona „Město" přepíše/),
    ).toBeInTheDocument();
    // Potvrdíme přepsání.
    await userEvent.click(screen.getByRole('button', { name: 'Přepsat' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        hasTable: true,
        headers: ['Stát', 'Obyvatel'],
      }),
    );
  });

  it('„Volný text" na existující tabulce — warning a potvrzení vyčistí tabulku', async () => {
    const onChange = vi.fn();
    const tableWithData: PageTable = {
      hasTable: true,
      title: 'Stará',
      headers: ['x'],
      values: ['y'],
    };
    renderPanel(<DataTemplatePanel table={tableWithData} onChange={onChange} />);
    await userEvent.click(screen.getByText('Volný text'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Přepnutí na „Volný text"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Přepsat' }));
    expect(onChange).toHaveBeenCalledWith({
      hasTable: false,
      title: '',
      headers: [],
      values: [],
    });
  });

  it('warning modal — „Zrušit" zavře bez změny', async () => {
    const onChange = vi.fn();
    const tableWithData: PageTable = {
      hasTable: true,
      title: 'Stará',
      headers: ['x'],
      values: ['y'],
    };
    renderPanel(<DataTemplatePanel table={tableWithData} onChange={onChange} />);
    await userEvent.click(screen.getByText('Město'));
    await userEvent.click(screen.getByRole('button', { name: 'Zrušit' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/přepíše současné hlavičky/),
    ).not.toBeInTheDocument();
  });
});
