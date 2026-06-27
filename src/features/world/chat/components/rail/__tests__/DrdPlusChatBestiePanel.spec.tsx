/**
 * 16.2d-chat — DrdPlusChatBestiePanel tests (parita s mapou DrdPlusBestiePanel).
 * BČ/ÚČ/OČ = 2k6+, ZZ = d6 (postih přičten); BČ navíc onPatch({initiative}).
 * Wound ± → onPatch systemStats.injury. Inline edit → onPatch. Katalog
 * (canEdit=false, bez onPatch) = read-only, hody jedou; bez konverzace zamčeno.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrdPlusChatBestiePanel } from '../DrdPlusChatBestiePanel';

const mockOnRoll = vi.fn();
// Mock useChatDiaryRoll: onRoll(req, onResult?) → zaznamená req, simuluje total 99
// (test init persistence přes onResult → onPatch).
vi.mock('../useChatDiaryRoll', () => ({
  useChatDiaryRoll:
    () => () => (req: unknown, onResult?: (t: number) => void) => {
      mockOnRoll(req);
      onResult?.(99);
    },
}));

const systemStats = {
  utoky: [{ name: 'Tlama', bc: 4, uc: 5, oc: 4, zz: 3, type: 'B' }],
  mez_zraneni: 10,
  postih: 0,
  injury: 0,
  ochrana: 2,
  sil: 3,
  obr: 2,
  zrc: 1,
  vol: 0,
  int: -1,
  chr: 0,
  odolnost: 5,
  vydrz: '—',
  rychlost: 4,
};

const base = {
  worldId: 'w1',
  channelId: 'c1' as string | null,
  rollerName: 'Požírač duší',
  systemStats,
  abilities: [{ name: 'Vidění duší', description: '4' }],
  notes: 'Plíží se stínem.',
};

beforeEach(() => mockOnRoll.mockReset());

describe('DrdPlusChatBestiePanel', () => {
  it('BČ → onRoll 2k6+ + bc a onPatch iniciativu (souboj lišta)', () => {
    const onPatch = vi.fn();
    render(<DrdPlusChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByLabelText('Tlama BČ (iniciativa)'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '2d6+', modifier: 4 }),
    );
    expect(onPatch).toHaveBeenCalledWith({ initiative: 99 });
  });

  it('ÚČ → 2k6+ (bez iniciativy), ZZ → d6', () => {
    const onPatch = vi.fn();
    render(<DrdPlusChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByLabelText('Tlama ÚČ'));
    expect(mockOnRoll).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: '2d6+', modifier: 5 }),
    );
    fireEvent.click(screen.getByLabelText('Tlama ZZ'));
    expect(mockOnRoll).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'd6', modifier: 3 }),
    );
    expect(onPatch).not.toHaveBeenCalled(); // ÚČ/ZZ nejsou iniciativa
  });

  it('vlastnost Síla → 2k6+ + postih', () => {
    render(
      <DrdPlusChatBestiePanel
        {...base}
        systemStats={{ ...systemStats, postih: -2 }}
        canEdit
        onPatch={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(mockOnRoll).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: '2d6+', modifier: 1 }), // 3 + (-2)
    );
  });

  it('wound +1 → onPatch systemStats.injury', () => {
    const onPatch = vi.fn();
    render(<DrdPlusChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByLabelText('Zranění +1'));
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        systemStats: expect.objectContaining({ injury: 1 }),
      }),
    );
  });

  it('inline edit: Upravit → Hotovo uloží přes onPatch', () => {
    const onPatch = vi.fn();
    render(<DrdPlusChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    fireEvent.click(screen.getByText('✓ Hotovo (uložit)'));
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Požírač duší' }),
    );
  });

  it('katalog (bez onPatch) read-only: žádné Upravit ani wound kroky, hody jedou', () => {
    render(<DrdPlusChatBestiePanel {...base} canEdit={false} />);
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Zranění +1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tlama ÚČ'));
    expect(mockOnRoll).toHaveBeenCalled();
  });

  it('bez konverzace (channelId null) → útoky zamčené', () => {
    render(
      <DrdPlusChatBestiePanel {...base} channelId={null} canEdit onPatch={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText('Tlama ÚČ'));
    expect(mockOnRoll).not.toHaveBeenCalled();
  });
});
