import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from 'lucide-react';
import { NavItem } from './IkarosLayout';
import { pendingTooltip } from './pendingBadge';
import { PendingActionType } from '@/shared/types';

/**
 * Spec 3.8 — badge počtu pending akcí u nav položek Diskuze/Články/Galerie.
 * Testuje conditional render badge; role gating řeší BE (`canHandle`), na FE
 * se projeví přítomností/absencí klíče v `pendingByType`.
 */

function renderNav(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('NavItem — pending badge', () => {
  it('zobrazí badge s počtem když pendingByType obsahuje daný typ', () => {
    renderNav(
      <NavItem
        navKey="clanky"
        to="/ikaros/clanky"
        label="Články"
        icon={<Home size={18} />}
        pendingType={PendingActionType.ArticlePendingReview}
        pendingByType={{ [PendingActionType.ArticlePendingReview]: 5 }}
      />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('nezobrazí badge když je počet 0', () => {
    renderNav(
      <NavItem
        navKey="clanky"
        to="/ikaros/clanky"
        label="Články"
        icon={<Home size={18} />}
        pendingType={PendingActionType.ArticlePendingReview}
        pendingByType={{ [PendingActionType.ArticlePendingReview]: 0 }}
      />,
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('nezobrazí badge když typ chybí v pendingByType (uživatel typ nevidí)', () => {
    renderNav(
      <NavItem
        navKey="diskuze"
        to="/ikaros/diskuze"
        label="Diskuze"
        icon={<Home size={18} />}
        pendingType={PendingActionType.DiscussionPendingReview}
        pendingByType={{}}
      />,
    );
    expect(screen.queryByLabelText(/čeká/i)).not.toBeInTheDocument();
  });

  it('nezobrazí badge u položky bez pendingType', () => {
    renderNav(
      <NavItem
        navKey="uvodnik"
        to="/"
        label="Úvodník"
        icon={<Home size={18} />}
        pendingByType={{ [PendingActionType.ArticlePendingReview]: 9 }}
      />,
    );
    expect(screen.queryByText('9')).not.toBeInTheDocument();
  });
});

describe('pendingTooltip — skloňování', () => {
  it('singulár pro 1', () => {
    expect(pendingTooltip(PendingActionType.ArticlePendingReview, 1)).toBe(
      '1 článek čeká na schválení',
    );
  });

  it('plurál 2–4', () => {
    expect(pendingTooltip(PendingActionType.ArticlePendingReview, 3)).toBe(
      '3 články čekají na schválení',
    );
  });

  it('genitiv plurál 5+', () => {
    expect(pendingTooltip(PendingActionType.GalleryPendingReview, 7)).toBe(
      '7 obrázků čeká na schválení',
    );
  });

  it('diskuze — vlastní tvary', () => {
    expect(pendingTooltip(PendingActionType.DiscussionPendingReview, 1)).toBe(
      '1 diskuze čeká na schválení',
    );
    expect(pendingTooltip(PendingActionType.DiscussionPendingReview, 6)).toBe(
      '6 diskuzí čeká na schválení',
    );
  });
});
