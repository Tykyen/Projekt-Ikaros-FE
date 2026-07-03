import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampHeader } from './CampHeader';
import type { RoomEnvironment } from '../lib/types';

const env: RoomEnvironment = { style: 'fantasy', placeId: '5' };

function setup(over: Partial<Parameters<typeof CampHeader>[0]> = {}) {
  const onChange = vi.fn();
  const onToggleDesc = vi.fn();
  render(
    <CampHeader
      environment={env}
      canEdit
      onChange={onChange}
      descOpen={false}
      onToggleDesc={onToggleDesc}
      {...over}
    />,
  );
  return { onChange, onToggleDesc };
}

describe('CampHeader', () => {
  it('vykreslí výběr stylu i lokace', () => {
    setup();
    expect(screen.getByDisplayValue('Fantasy')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Mlžné hřbitovní návrší'),
    ).toBeInTheDocument();
  });

  it('změna stylu resetuje lokaci na 1', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByDisplayValue('Fantasy'), {
      target: { value: 'scifi' },
    });
    expect(onChange).toHaveBeenCalledWith({ style: 'scifi', placeId: '1' });
  });

  it('změna lokace zachová styl', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByDisplayValue('Mlžné hřbitovní návrší'), {
      target: { value: '12' },
    });
    expect(onChange).toHaveBeenCalledWith({ style: 'fantasy', placeId: '12' });
  });

  it('bez oprávnění jsou selecty read-only a zobrazí se hint', () => {
    setup({ canEdit: false });
    expect(screen.getByDisplayValue('Fantasy')).toBeDisabled();
    expect(screen.getByText('Scénu řídí správci')).toBeInTheDocument();
  });

  it('tlačítko popisu přepíná panel', () => {
    const { onToggleDesc } = setup();
    fireEvent.click(screen.getByLabelText('Popis místa'));
    expect(onToggleDesc).toHaveBeenCalled();
  });
});
