import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubjectForm } from './SubjectForm';

// Našeptávač čte ze dvou zdrojů: persona adresář (PC/NPC) + adresář stránek.
vi.mock('@/features/world/pages/api/usePersonaDirectory', () => ({
  usePersonaDirectory: () => ({
    data: [
      {
        id: '1',
        slug: 'ikaros',
        title: 'Ikaros',
        type: 'NPC',
        order: 0,
        imageUrl: '/img/ikaros.png',
      },
    ],
  }),
}));
vi.mock('@/features/world/pages/api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({
    data: [
      { id: '2', slug: 'kamenec', title: 'Kamenec', type: 'Lokace', order: 1 },
    ],
  }),
}));

const NAME_PLACEHOLDER = 'Jméno subjektu nebo hledej existující…';

describe('SubjectForm', () => {
  it('odešle jméno + rozparsované štítky', () => {
    const onSubmit = vi.fn();
    render(<SubjectForm open worldId="w1" onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText(NAME_PLACEHOLDER), {
      target: { value: 'Vlastní jméno' },
    });
    fireEvent.change(screen.getByPlaceholderText('politika, magie'), {
      target: { value: 'král, hrdina ,' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Vlastní jméno',
      tags: ['král', 'hrdina'],
    });
  });

  it('bez jména neodešle a ukáže chybu', () => {
    const onSubmit = vi.fn();
    render(<SubjectForm open worldId="w1" onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Jméno je povinné')).toBeTruthy();
  });

  it('našeptá existující stránku a výběr doplní slug + typ', () => {
    const onSubmit = vi.fn();
    render(<SubjectForm open worldId="w1" onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText(NAME_PLACEHOLDER), {
      target: { value: 'ikar' },
    });
    // našeptaná položka
    const option = screen.getByRole('option', { name: /Ikaros/ });
    fireEvent.mouseDown(option);

    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Ikaros',
      type: 'NPC',
      linkedPageSlug: 'ikaros',
      linkedCharacterSlug: 'ikaros',
      avatarUrl: '/img/ikaros.png',
    });
  });

  it('přesná shoda názvu (lokace) automaticky doplní slug + typ bez kliknutí', () => {
    const onSubmit = vi.fn();
    render(<SubjectForm open worldId="w1" onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText(NAME_PLACEHOLDER), {
      target: { value: 'Kamenec' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Kamenec',
      type: 'LOCATION',
      linkedPageSlug: 'kamenec',
    });
  });
});
