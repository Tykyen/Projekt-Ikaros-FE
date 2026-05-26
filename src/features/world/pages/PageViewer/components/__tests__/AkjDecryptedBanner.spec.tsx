import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AkjDecryptedBanner } from '../AkjDecryptedBanner';
import type { WorldSettings } from '@/shared/types';

let mockSettings: WorldSettings | undefined;

vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: mockSettings }),
}));

const base: WorldSettings = {
  id: 's1',
  worldId: 'w1',
  hiddenNavItems: [],
  customGroups: [],
  groupColors: {},
  akjTypes: [],
  hideDefaultWeather: false,
  timelineCalendarSlug: null,
  updatedAt: '',
};

describe('AkjDecryptedBanner', () => {
  beforeEach(() => {
    mockSettings = base;
  });

  it('prázdné accessRequirements → null (nezobrazí se)', () => {
    const { container } = render(
      <AkjDecryptedBanner worldId="w1" accessRequirements={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('undefined accessRequirements → null', () => {
    const { container } = render(<AkjDecryptedBanner worldId="w1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('AKJ level 3 → title obsahuje "AKJ: 3"', () => {
    render(
      <AkjDecryptedBanner
        worldId="w1"
        accessRequirements={[{ type: 'AKJ', value: '3' }]}
      />,
    );
    expect(screen.getByText(/UTAJENÝ ARCHIV \[AKJ: 3\]/)).toBeInTheDocument();
    expect(screen.getByText('Úspěšně dešifrováno')).toBeInTheDocument();
  });

  it('AKJType resolved z settings → název + level', () => {
    mockSettings = {
      ...base,
      akjTypes: [{ key: 'top-secret', name: 'Tajný spis', level: 5 }],
    };
    render(
      <AkjDecryptedBanner
        worldId="w1"
        accessRequirements={[{ type: 'AKJType', value: 'top-secret' }]}
      />,
    );
    expect(
      screen.getByText(/UTAJENÝ ARCHIV \[AKJ: 5 — Tajný spis\]/),
    ).toBeInTheDocument();
  });

  it('jen Role requirement → [pro <role>]', () => {
    render(
      <AkjDecryptedBanner
        worldId="w1"
        accessRequirements={[{ type: 'Role', value: '4' }]}
      />,
    );
    expect(
      screen.getByText(/UTAJENÝ ARCHIV \[pro Pomocný PJ\]/),
    ).toBeInTheDocument();
  });

  it('jen UserId whitelist → [vyhrazený přístup]', () => {
    render(
      <AkjDecryptedBanner
        worldId="w1"
        accessRequirements={[{ type: 'UserId', value: 'u1' }]}
      />,
    );
    expect(
      screen.getByText(/UTAJENÝ ARCHIV \[vyhrazený přístup\]/),
    ).toBeInTheDocument();
  });

  it('isWoodWide → přidá "Wood-Wide" do titulu', () => {
    render(
      <AkjDecryptedBanner
        worldId="w1"
        accessRequirements={[{ type: 'AKJ', value: '2' }]}
        isWoodWide
      />,
    );
    expect(
      screen.getByText(/UTAJENÝ ARCHIV \[AKJ: 2 · Wood-Wide\]/),
    ).toBeInTheDocument();
  });

  it('mix AKJ a AKJType → vybere nejvyšší level', () => {
    mockSettings = {
      ...base,
      akjTypes: [{ key: 'k', name: 'Klíč', level: 7 }],
    };
    render(
      <AkjDecryptedBanner
        worldId="w1"
        accessRequirements={[
          { type: 'AKJ', value: '3' },
          { type: 'AKJType', value: 'k' },
        ]}
      />,
    );
    expect(
      screen.getByText(/UTAJENÝ ARCHIV \[AKJ: 7 — Klíč\]/),
    ).toBeInTheDocument();
  });
});
