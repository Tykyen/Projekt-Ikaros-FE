import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EffectsPalette } from './EffectsPalette';
import { useEffectTool } from '../../hooks/useEffectTool';

// Harness — reálný hook + paleta (testuje integraci stavu a UI).
function Harness({
  effectCount = 0,
  onClearAll = vi.fn(),
}: {
  effectCount?: number;
  onClearAll?: () => void;
}): React.ReactElement {
  const tool = useEffectTool();
  return (
    <EffectsPalette tool={tool} effectCount={effectCount} onClearAll={onClearAll} />
  );
}

beforeEach(() => localStorage.clear());

describe('EffectsPalette', () => {
  it('zobrazí 3 nástroje, panel je skrytý dokud není aktivní nástroj', () => {
    render(<Harness />);
    expect(screen.getByTitle('Barevná pole')).toBeInTheDocument();
    expect(screen.getByTitle('Štítová bariéra')).toBeInTheDocument();
    expect(screen.getByTitle(/Výbuch/)).toBeInTheDocument();
    expect(screen.queryByText(/Barevná pole$/)).not.toBeInTheDocument();
  });

  it('klik na nástroj rozbalí panel s parametry', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Barevná pole'));
    // 8 swatchů barev
    expect(screen.getByLabelText('Červená')).toBeInTheDocument();
    expect(screen.getByLabelText('Modrá')).toBeInTheDocument();
  });

  it('bariéra — kruh režim odhalí poloměr', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Štítová bariéra'));
    expect(screen.queryByText(/Poloměr/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Kruh/));
    expect(screen.getByText(/Poloměr/)).toBeInTheDocument();
  });

  it('výbuch — přidání a odebrání ringu', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle(/Výbuch/));
    expect(screen.getByText('Střed')).toBeInTheDocument();
    expect(screen.getByText('Kruh 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Přidat kruh'));
    expect(screen.getByText('Kruh 2')).toBeInTheDocument();
  });

  it('🗑 smazat-vše jen když effectCount > 0', () => {
    const { rerender } = render(<Harness effectCount={0} />);
    expect(screen.queryByTitle('Smazat všechny efekty')).not.toBeInTheDocument();
    rerender(<Harness effectCount={3} />);
    expect(screen.getByTitle('Smazat všechny efekty')).toBeInTheDocument();
  });

  it('klik na 🗑 zavolá onClearAll', () => {
    const onClearAll = vi.fn();
    render(<Harness effectCount={2} onClearAll={onClearAll} />);
    fireEvent.click(screen.getByTitle('Smazat všechny efekty'));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it('guma je samostatný nástroj v toolbaru s hintem', () => {
    render(<Harness />);
    const eraser = screen.getByTitle(/Guma/);
    expect(eraser).toBeInTheDocument();
    fireEvent.click(eraser);
    expect(screen.getByText(/táhni přes mapu pro smazání/)).toBeInTheDocument();
  });

  it('opětovný klik na aktivní nástroj ho vypne (toggle)', () => {
    render(<Harness />);
    const btn = screen.getByTitle('Barevná pole');
    fireEvent.click(btn);
    expect(screen.getByLabelText('Červená')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByLabelText('Červená')).not.toBeInTheDocument();
  });
});
