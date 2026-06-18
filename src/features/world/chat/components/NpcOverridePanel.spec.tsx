import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NpcOverridePanel } from './NpcOverridePanel';

// Adresář mockujeme — panel jinak volá usePersonaDirectory (TanStack Query).
const { mockEntries } = vi.hoisted(() => ({
  mockEntries: [
    {
      id: '1',
      slug: 'stary-kovar',
      title: 'Starý kovář',
      type: 'NPC',
      order: 0,
      updatedAt: '',
      imageUrl: 'http://img/k.png',
    },
  ],
}));

vi.mock('@/features/world/pages/api/usePersonaDirectory', () => ({
  usePersonaDirectory: () => ({ data: mockEntries }),
}));

describe('NpcOverridePanel', () => {
  it('výběr z adresáře vyplní jméno, avatar a slug', () => {
    const onChange = vi.fn();
    render(
      <NpcOverridePanel
        state={{ name: '', avatarUrl: '' }}
        worldId="w1"
        onChange={onChange}
        onTurnOff={vi.fn()}
      />,
    );
    fireEvent.focus(screen.getByLabelText('Jméno NPC'));
    fireEvent.mouseDown(screen.getByText('Starý kovář'));
    expect(onChange).toHaveBeenCalledWith({
      name: 'Starý kovář',
      avatarUrl: 'http://img/k.png',
      slug: 'stary-kovar',
    });
  });

  it('ruční editace jména rozváže slug (degraduje na ad-hoc)', () => {
    const onChange = vi.fn();
    render(
      <NpcOverridePanel
        state={{ name: 'Starý kovář', avatarUrl: '', slug: 'stary-kovar' }}
        worldId="w1"
        onChange={onChange}
        onTurnOff={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Jméno NPC'), {
      target: { value: 'Jiný kovář' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jiný kovář', slug: undefined }),
    );
  });

  it('OFF tlačítko zavolá onTurnOff', () => {
    const onTurnOff = vi.fn();
    render(
      <NpcOverridePanel
        state={{ name: '', avatarUrl: '' }}
        worldId="w1"
        onChange={vi.fn()}
        onTurnOff={onTurnOff}
      />,
    );
    fireEvent.click(screen.getByLabelText('Vypnout NPC mód'));
    expect(onTurnOff).toHaveBeenCalled();
  });
});
