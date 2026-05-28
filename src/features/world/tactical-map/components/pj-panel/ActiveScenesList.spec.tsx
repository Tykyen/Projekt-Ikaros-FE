import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveScenesList } from './ActiveScenesList';
import type { MapScene } from '../../types';

function makeScene(overrides: Partial<MapScene> = {}): MapScene {
  return {
    id: 's1',
    worldId: 'w1',
    name: 'Scéna A',
    imageUrl: '',
    config: { size: 40, originX: 0, originY: 0, showGrid: true },
    tokens: [],
    npcTemplates: [],
    effects: [],
    fogEnabled: false,
    revealedHexes: [],
    isActive: true,
    isHidden: false,
    isLocked: false,
    activeSoundIds: [],
    ...overrides,
  } as MapScene;
}

describe('ActiveScenesList', () => {
  it('prázdný list → fallback hláška', () => {
    render(
      <ActiveScenesList scenes={[]} currentSceneId={null} onSwitch={vi.fn()} />,
    );
    expect(screen.getByText(/Žádná aktivní scéna/i)).toBeInTheDocument();
  });

  it('renderuje jména scén', () => {
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's1', name: 'Lesní mýtina' }), makeScene({ id: 's2', name: 'Hospůdka' })]}
        currentSceneId={null}
        onSwitch={vi.fn()}
      />,
    );
    expect(screen.getByText('Lesní mýtina')).toBeInTheDocument();
    expect(screen.getByText('Hospůdka')).toBeInTheDocument();
  });

  it('aktuální scéna má aria-current="true"', () => {
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's1', name: 'Aktuální' }), makeScene({ id: 's2', name: 'Jiná' })]}
        currentSceneId="s1"
        onSwitch={vi.fn()}
      />,
    );
    const aktualni = screen.getByText('Aktuální').closest('button');
    const jina = screen.getByText('Jiná').closest('button');
    expect(aktualni).toHaveAttribute('aria-current', 'true');
    expect(jina).not.toHaveAttribute('aria-current');
  });

  it('klik na řádek volá onSwitch(sceneId)', () => {
    const onSwitch = vi.fn();
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's42', name: 'Cíl' })]}
        currentSceneId={null}
        onSwitch={onSwitch}
      />,
    );
    fireEvent.click(screen.getByText('Cíl'));
    expect(onSwitch).toHaveBeenCalledWith('s42');
  });

  it('bez onDeactivate prop → ✕ tlačítko se nerendrne', () => {
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's1' })]}
        currentSceneId={null}
        onSwitch={vi.fn()}
      />,
    );
    expect(
      screen.queryByLabelText(/Deaktivovat scénu/i),
    ).not.toBeInTheDocument();
  });

  it('s onDeactivate → ✕ tlačítko volá callback se sceneId', () => {
    const onDeactivate = vi.fn();
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's7', name: 'Vyhodit' })]}
        currentSceneId={null}
        onSwitch={vi.fn()}
        onDeactivate={onDeactivate}
      />,
    );
    fireEvent.click(screen.getByLabelText('Deaktivovat scénu'));
    expect(onDeactivate).toHaveBeenCalledWith('s7');
  });

  it('klik na ✕ NESPOUŠTÍ onSwitch (stopPropagation)', () => {
    const onSwitch = vi.fn();
    const onDeactivate = vi.fn();
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's7' })]}
        currentSceneId={null}
        onSwitch={onSwitch}
        onDeactivate={onDeactivate}
      />,
    );
    fireEvent.click(screen.getByLabelText('Deaktivovat scénu'));
    expect(onDeactivate).toHaveBeenCalled();
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it('isHidden flag → 🚫 badge', () => {
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's1', isHidden: true })]}
        currentSceneId={null}
        onSwitch={vi.fn()}
      />,
    );
    expect(screen.getByTitle(/Skrytá pro hráče/i)).toBeInTheDocument();
  });

  it('isLocked flag → 🔒 badge', () => {
    render(
      <ActiveScenesList
        scenes={[makeScene({ id: 's1', isLocked: true })]}
        currentSceneId={null}
        onSwitch={vi.fn()}
      />,
    );
    expect(screen.getByTitle(/Pohyby uzamčené/i)).toBeInTheDocument();
  });
});
