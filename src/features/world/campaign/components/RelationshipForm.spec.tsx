import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RelationshipForm } from './RelationshipForm';
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

const subjects = [
  subj('a', 'Aragorn', 'PC'),
  subj('b', 'Boromir', 'NPC'),
];

describe('RelationshipForm', () => {
  it('výběr emoce předvyplní valenci a odešle obě strany', () => {
    const onSubmit = vi.fn();
    render(
      <RelationshipForm
        open
        subjects={subjects}
        subjectAId="a"
        isPJ
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );
    // druhý subjekt = hledatelný; nabídka nesmí obsahovat A (Aragorn)
    const bInput = screen.getByLabelText('Druhý subjekt');
    fireEvent.focus(bInput);
    expect(screen.queryByRole('option', { name: /Aragorn/ })).toBeNull();
    fireEvent.mouseDown(screen.getByRole('option', { name: /Boromir/ }));

    // emoce strany A → nenávist → valence -3
    fireEvent.change(screen.getByLabelText('Emoce strany A'), {
      target: { value: 'nenávist' },
    });
    const valA = screen.getByLabelText('Valence strany A') as HTMLInputElement;
    expect(valA.value).toBe('-3');

    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      subjectAId: 'a',
      subjectBId: 'b',
      sideA: { emotionTag: 'nenávist', valence: -3 },
    });
  });

  it('tajné pole „Záměr PJ" je jen pro PJ', () => {
    const { rerender } = render(
      <RelationshipForm
        open
        subjects={subjects}
        subjectAId="a"
        isPJ
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Záměr PJ strany A')).toBeTruthy();

    rerender(
      <RelationshipForm
        open
        subjects={subjects}
        subjectAId="a"
        isPJ={false}
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Záměr PJ strany A')).toBeNull();
  });

  it('bez druhého subjektu neodešle', () => {
    const onSubmit = vi.fn();
    render(
      <RelationshipForm
        open
        subjects={subjects}
        subjectAId="a"
        isPJ
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Vyber druhý subjekt')).toBeTruthy();
  });
});
