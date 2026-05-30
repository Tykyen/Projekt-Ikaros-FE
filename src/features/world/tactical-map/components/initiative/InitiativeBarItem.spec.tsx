import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InitiativeBarItem } from './InitiativeBarItem';
import type { MapToken } from '../../types';

function token(over: Partial<MapToken>): MapToken {
  return {
    id: 't1',
    characterSlug: 'aragorn',
    initiative: 10,
    instanceName: 'Aragorn',
    ...over,
  } as MapToken;
}

function setup(over: Partial<Parameters<typeof InitiativeBarItem>[0]> = {}) {
  const onClick = vi.fn();
  const onOpenInfo = vi.fn();
  const onJumpTo = vi.fn();
  const onChangeInitiative = vi.fn();
  render(
    <InitiativeBarItem
      token={token({})}
      order={3}
      isCurrent={false}
      canEditInit
      showJump={false}
      systemId="drd2"
      onClick={onClick}
      onOpenInfo={onOpenInfo}
      onJumpTo={onJumpTo}
      onChangeInitiative={onChangeInitiative}
      {...over}
    />,
  );
  return { onClick, onOpenInfo, onJumpTo, onChangeInitiative };
}

describe('InitiativeBarItem', () => {
  it('renderuje badge pořadí a jméno', () => {
    setup();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
  });

  it('klik na tělo → onClick(tokenId)', () => {
    const { onClick } = setup();
    fireEvent.click(screen.getByText('Aragorn'));
    expect(onClick).toHaveBeenCalledWith('t1');
  });

  it('klik na „i" → onOpenInfo, NE onClick (stopPropagation)', () => {
    const { onClick, onOpenInfo } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Detail Aragorn/i }));
    expect(onOpenInfo).toHaveBeenCalledWith('t1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('canEditInit=false → input disabled', () => {
    setup({ canEditInit: false });
    const input = screen.getByLabelText(/Iniciativa Aragorn/i) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('showJump=true → „⏱" tlačítko, klik → onJumpTo', () => {
    const { onJumpTo, onClick } = setup({ showJump: true });
    fireEvent.click(screen.getByRole('button', { name: /Nastavit Aragorn na tah/i }));
    expect(onJumpTo).toHaveBeenCalledWith('t1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('showJump=false → žádné „⏱" tlačítko', () => {
    setup({ showJump: false });
    expect(
      screen.queryByRole('button', { name: /na tah/i }),
    ).not.toBeInTheDocument();
  });
});
