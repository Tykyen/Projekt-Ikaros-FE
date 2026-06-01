import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorylineForm } from './StorylineForm';
import type { CampaignSubject } from '../types';

function subj(id: string, name: string, type: CampaignSubject['type']): CampaignSubject {
  return {
    id,
    worldId: 'w1',
    ownerId: 'u1',
    isShared: false,
    type,
    name,
    tags: [],
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

const subjects = [subj('a', 'Aragorn', 'PC'), subj('b', 'Boromir', 'NPC')];

describe('StorylineForm', () => {
  it('bez názvu neodešle a ukáže chybu', () => {
    const onSubmit = vi.fn();
    render(
      <StorylineForm open subjects={subjects} isPJ onClose={() => {}} onSubmit={onSubmit} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Název je povinný')).toBeTruthy();
  });

  it('odešle název + zapojený subjekt (hledatelný multi-výběr)', () => {
    const onSubmit = vi.fn();
    render(
      <StorylineForm open subjects={subjects} isPJ onClose={() => {}} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByPlaceholderText('Název linky'), {
      target: { value: 'Hlavní zápletka' },
    });
    fireEvent.focus(screen.getByLabelText('Přidat subjekt do linky'));
    fireEvent.mouseDown(screen.getByRole('option', { name: /Boromir/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Hlavní zápletka',
      level: 'mid',
      status: 'active',
      subjectIds: ['b'],
    });
  });

  it('tajná pole (Pravda, Záměr PJ) jen pro PJ', () => {
    const { rerender } = render(
      <StorylineForm open subjects={subjects} isPJ onClose={() => {}} onSubmit={() => {}} />,
    );
    expect(screen.queryByText(/Pravda/)).toBeTruthy();
    expect(screen.queryByText(/Záměr PJ/)).toBeTruthy();

    rerender(
      <StorylineForm
        open
        subjects={subjects}
        isPJ={false}
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByText(/Pravda/)).toBeNull();
    expect(screen.queryByText(/Záměr PJ/)).toBeNull();
  });
});
