import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FateChatBestiePanel } from './FateChatBestiePanel';

const mockOnRoll = vi.fn();
vi.mock('./useChatDiaryRoll', () => ({
  useChatDiaryRoll: () => () => mockOnRoll,
}));

describe('FateChatBestiePanel', () => {
  it('fae: vykreslí přístupy + Hlavní koncept + stres boxy', () => {
    render(
      <FateChatBestiePanel
        worldId="w1" channelId="c1" systemId="fae" rollerName="Agent"
        systemStats={{ 'health.max': 3, appr_quick: 3, highConcept: 'Zabiják v mlze' }}
        canEdit={false}
      />,
    );
    expect(screen.getByText('Rychle')).toBeInTheDocument();
    expect(screen.getByText('Zabiják v mlze')).toBeInTheDocument();
    expect(screen.getByLabelText('Stres 1 volný')).toBeInTheDocument();
  });

  it('roll přístupu → onRoll(label, modifier, fate)', () => {
    render(
      <FateChatBestiePanel
        worldId="w1" channelId="c1" systemId="fae" rollerName="Agent"
        systemStats={{ 'health.max': 3, appr_quick: 3 }}
        canEdit={false}
      />,
    );
    fireEvent.click(screen.getByLabelText('Hodit Rychle'));
    expect(mockOnRoll).toHaveBeenCalledWith({ label: 'Rychle', modifier: 3, kind: 'fate' });
  });

  it('editable (onPatch): toggle stres → onPatch systemStats health.current', () => {
    const onPatch = vi.fn();
    render(
      <FateChatBestiePanel
        worldId="w1" channelId="c1" systemId="fae" rollerName="Agent"
        systemStats={{ 'health.max': 3, 'health.current': 3 }}
        canEdit onPatch={onPatch}
      />,
    );
    fireEvent.click(screen.getByLabelText('Stres 1 volný')); // box index 0 → used 1 → current 2
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({ systemStats: expect.objectContaining({ 'health.current': 2 }) }),
    );
  });

  it('read-only (canEdit false): stres box disabled', () => {
    render(
      <FateChatBestiePanel
        worldId="w1" channelId="c1" systemId="fae" rollerName="Agent"
        systemStats={{ 'health.max': 3 }}
        canEdit={false}
      />,
    );
    expect(screen.getByLabelText('Stres 1 volný')).toBeDisabled();
  });

  it('core: dovednosti místo přístupů', () => {
    render(
      <FateChatBestiePanel
        worldId="w1" channelId="c1" systemId="fate" rollerName="Chrt"
        systemStats={{ 'health.max': 4, skills: [{ label: 'Boj', rating: 3 }] }}
        canEdit={false}
      />,
    );
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.queryByText('Pečlivě')).not.toBeInTheDocument();
  });
});
