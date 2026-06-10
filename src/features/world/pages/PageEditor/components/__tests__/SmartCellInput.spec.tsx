import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartCellInput } from '../SmartCellInput';
import type { PageDirectoryEntry } from '../../../api/pages.types';

const DIRECTORY: PageDirectoryEntry[] = [
  {
    id: 'p1',
    slug: 'aralion',
    title: 'Aralion',
    type: 'Lokace',
    order: 0,
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    slug: 'brennor',
    title: 'Brennor',
    type: 'Lokace',
    order: 1,
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
];

describe('SmartCellInput (8.5 — mini rich-text)', () => {
  it('vykreslí contenteditable editor s hodnotou', async () => {
    render(
      <SmartCellInput
        value="Hlavní město"
        onChange={() => {}}
        directory={DIRECTORY}
      />,
    );
    await waitFor(() => {
      expect(document.querySelector('.ProseMirror')).toBeTruthy();
    });
    expect(screen.getByText('Hlavní město')).toBeInTheDocument();
  });

  it('vykreslí existující odkaz v buňce', async () => {
    render(
      <SmartCellInput
        value='<a href="aralion">Aralion</a>'
        onChange={() => {}}
        directory={DIRECTORY}
      />,
    );
    await waitFor(() => {
      const link = document.querySelector('.ProseMirror a');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('aralion');
    });
  });

  it('🔗 tlačítko bez označeného textu picker neotevře (není co odkazovat)', async () => {
    render(
      <SmartCellInput value="text" onChange={() => {}} directory={DIRECTORY} />,
    );
    await waitFor(() =>
      expect(document.querySelector('.ProseMirror')).toBeTruthy(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Odkaz' }));
    // Bez selekce a bez aktivního odkazu se popover neotevře (title napovídá).
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('prázdná hodnota → placeholder', async () => {
    render(
      <SmartCellInput
        value=""
        onChange={() => {}}
        directory={DIRECTORY}
        placeholder="Klíč"
      />,
    );
    await waitFor(() => {
      const p = document.querySelector('.ProseMirror p');
      expect(p?.getAttribute('data-placeholder')).toBe('Klíč');
    });
  });
});
