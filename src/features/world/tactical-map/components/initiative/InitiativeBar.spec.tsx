import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { InitiativeBar } from './InitiativeBar';
import type { MapScene, MapToken } from '../../types';

vi.mock('../../api/mapApi', () => ({
  postMapOperation: vi.fn().mockResolvedValue({}),
}));

function token(over: Partial<MapToken>): MapToken {
  return {
    id: 'x',
    characterId: 'c1',
    characterSlug: 's',
    isNpc: false,
    initiative: 0,
    inCombat: false,
    instanceName: 'X',
    ...over,
  } as MapToken;
}

function scene(over: Partial<MapScene>): MapScene {
  return {
    id: 'scene-1',
    worldId: 'w1',
    config: { size: 40, originX: 0, originY: 0 },
    tokens: [],
    combat: null,
    ...over,
  } as MapScene;
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function renderBar(over: Partial<Parameters<typeof InitiativeBar>[0]> = {}) {
  const onItemClick = vi.fn();
  const onOpenInfo = vi.fn();
  const r = render(
    <InitiativeBar
      scene={scene({})}
      worldId="w1"
      systemId="drd2"
      isPj
      myCharacterSlugs={[]}
      onItemClick={onItemClick}
      onOpenInfo={onOpenInfo}
      {...over}
    />,
    { wrapper: makeWrapper() },
  );
  return { ...r, onItemClick, onOpenInfo };
}

beforeEach(() => vi.clearAllMocks());

describe('InitiativeBar', () => {
  it('empty (žádný inCombat, boj neaktivní) → nerenderuje nic', () => {
    const { container } = renderBar({ scene: scene({ tokens: [] }) });
    expect(container).toBeEmptyDOMElement();
  });

  it('s inCombat tokeny → render bojovníků + PJ ovládání', () => {
    renderBar({
      scene: scene({
        tokens: [
          token({ id: 'a', inCombat: true, initiative: 5, instanceName: 'Alfa' }),
          token({ id: 'b', inCombat: true, initiative: 9, instanceName: 'Beta' }),
        ],
      }),
    });
    expect(screen.getByText('Alfa')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zahájit boj/i })).toBeInTheDocument();
  });

  it('hráč (isPj=false) → bez PJ ovládání', () => {
    renderBar({
      isPj: false,
      scene: scene({
        tokens: [token({ id: 'a', inCombat: true, initiative: 5 })],
      }),
    });
    expect(
      screen.queryByRole('button', { name: /Zahájit boj/i }),
    ).not.toBeInTheDocument();
  });

  it('klik na bojovníka → onItemClick', () => {
    const { onItemClick } = renderBar({
      scene: scene({
        tokens: [token({ id: 'a', inCombat: true, instanceName: 'Alfa' })],
      }),
    });
    fireEvent.click(screen.getByText('Alfa'));
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick.mock.calls[0][0].id).toBe('a');
  });

  it('mimo boj: PJ vidí PC i NPC, hráč jen PC', () => {
    const s = scene({
      tokens: [
        token({ id: 'pc', inCombat: false, isNpc: false, characterId: 'c9', instanceName: 'Hrdina' }),
        token({ id: 'npc', inCombat: false, isNpc: true, characterId: 'c8', instanceName: 'Strážný' }),
        token({ id: 'best', inCombat: false, characterId: 'bestie:x', instanceName: 'Duch' }),
      ],
    });
    // PJ — vidí všechny mimo boj
    const pj = renderBar({ isPj: true, scene: s });
    expect(screen.getByText('Hrdina')).toBeInTheDocument();
    expect(screen.getByText('Strážný')).toBeInTheDocument();
    expect(screen.getByText('Duch')).toBeInTheDocument();
    pj.unmount();
    // hráč — jen PC
    renderBar({ isPj: false, scene: s });
    expect(screen.getByText('Hrdina')).toBeInTheDocument();
    expect(screen.queryByText('Strážný')).not.toBeInTheDocument();
    expect(screen.queryByText('Duch')).not.toBeInTheDocument();
  });

  it('10.2h fog: hráč nevidí v liště bojujícího NPC schovaného mlhou, PC ano', () => {
    const s = scene({
      fogEnabled: true,
      revealedHexes: [],
      tokens: [
        token({ id: 'pc', inCombat: true, isNpc: false, q: 0, r: 0, instanceName: 'Hrdina' }),
        token({ id: 'npc', inCombat: true, isNpc: true, q: 5, r: 5, characterId: 'c8', instanceName: 'Skřet' }),
      ],
    });
    renderBar({ isPj: false, scene: s });
    expect(screen.getByText('Hrdina')).toBeInTheDocument(); // PC vždy
    expect(screen.queryByText('Skřet')).not.toBeInTheDocument(); // NPC v mlze
  });

  it('10.2h fog: PJ vidí bojujícího NPC v mlze i v liště', () => {
    const s = scene({
      fogEnabled: true,
      revealedHexes: [],
      tokens: [
        token({ id: 'npc', inCombat: true, isNpc: true, q: 5, r: 5, characterId: 'c8', instanceName: 'Skřet' }),
      ],
    });
    renderBar({ isPj: true, scene: s });
    expect(screen.getByText('Skřet')).toBeInTheDocument();
  });

  it('hráč bez bojovníků a bez PC mimo boj → lišta skrytá', () => {
    const { container } = renderBar({
      isPj: false,
      scene: scene({
        tokens: [token({ id: 'npc', inCombat: false, isNpc: true })],
      }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('boj aktivní → počítadlo kola + Další tah', () => {
    renderBar({
      scene: scene({
        tokens: [token({ id: 'a', inCombat: true })],
        combat: {
          isActive: true,
          round: 4,
          currentTokenId: 'a',
          order: ['a'],
          endOfTurnEffects: [],
        },
      }),
    });
    expect(screen.getByTitle(/Kolo 4/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Další tah/i })).toBeInTheDocument();
  });
});
