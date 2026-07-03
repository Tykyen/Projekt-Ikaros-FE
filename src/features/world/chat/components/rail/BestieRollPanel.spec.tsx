import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { Bestie } from '@/features/world/bestiar/types';

const { mockOnRoll, mockMakeOnRoll } = vi.hoisted(() => {
  const mockOnRoll = vi.fn();
  return { mockOnRoll, mockMakeOnRoll: vi.fn(() => mockOnRoll) };
});

vi.mock('./useChatDiaryRoll', () => ({
  useChatDiaryRoll: () => mockMakeOnRoll,
}));
// 16.2d-chat — rail je nově obalen DiarySkinScope („obalení" chrome); v unit
// testu ho přemostíme (netestuje skin, jinak by vyžadoval QueryClient/WorldContext).
vi.mock(
  '@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope',
  () => ({
    DiarySkinScope: ({ children }: { children: import('react').ReactNode }) => (
      <>{children}</>
    ),
  }),
);
vi.mock('@/features/world/tactical-map/components/tokens/BestieStatblock', () => ({
  BestieStatblock: ({
    abilities,
    onRollAbility,
  }: {
    abilities: { label: string; value: string }[];
    onRollAbility?: (a: { label: string; value: string }) => void;
  }) => (
    <div>
      {abilities.map((a, i) => (
        <button
          key={i}
          data-testid={`ab-${a.label}`}
          onClick={() => onRollAbility?.(a)}
        >
          {a.label}
        </button>
      ))}
    </div>
  ),
}));

import { BestieRollPanel } from './BestieRollPanel';

// „Vlastní Systém" (generic) — nemá dedikovaný chat bestie panel → ověřuje
// GENERICKOU katalogovou cestu (BestieStatblock + lore + fate). Dřív `coc`,
// ten ale od 8.7v dedikovaný panel má (drift → test padal na CocChatBestiePanel).
const bestie = {
  id: 'b1',
  scope: 'world',
  systemId: 'vlastni',
  name: 'Skřet',
  imageUrl: 'http://x/s.png',
  notes: 'Zlý skřet.',
  description: '',
  systemStats: { abilities: [{ label: 'Oheň', value: '3' }] },
  createdAt: '',
  updatedAt: '',
} as Bestie;

describe('BestieRollPanel (16.1c)', () => {
  it('hod schopnosti jde do chatu s atribucí bestie', () => {
    const { getByTestId } = render(
      <BestieRollPanel
        worldId="w1"
        channelId="c1"
        systemId="vlastni"
        bestie={bestie}
      />,
    );
    // atribuce bestie (jméno + avatar) předaná do mostu hodu
    expect(mockMakeOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'bestie',
        rollerName: 'Skřet',
        avatarUrl: 'http://x/s.png',
      }),
    );
    fireEvent.click(getByTestId('ab-Oheň'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Oheň', modifier: 3, kind: 'fate' }),
    );
  });

  it('zobrazí lore popis bestie', () => {
    const { getByText } = render(
      <BestieRollPanel
        worldId="w1"
        channelId="c1"
        systemId="vlastni"
        bestie={bestie}
      />,
    );
    expect(getByText('Zlý skřet.')).toBeTruthy();
  });
});
