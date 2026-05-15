import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ArticleReviewLeft, ArticleReviewMid } from './ArticleReviewRenderer';
import { timeAgo } from '../lib/articles';
import type { ArticleReviewListItem } from '@/shared/types';

function makeItem(
  overrides: Partial<ArticleReviewListItem> = {},
): ArticleReviewListItem {
  return {
    articleId: '507f1f77bcf86cd799439abc',
    title: 'Cesta do hvozdů',
    preview: 'Začátek příběhu o lese a poutníkovi',
    category: 'povidky',
    authorId: 'u1',
    authorName: 'Petra K.',
    submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

let qc: QueryClient;

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
}

describe('ArticleReviewRenderer', () => {
  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  describe('Left slot', () => {
    it('renderuje N° ID (uppercase last 4)', () => {
      render(<ArticleReviewLeft item={makeItem()} />, { wrapper: Wrapper });
      expect(screen.getByText(/N° 9ABC/)).toBeTruthy();
    });

    it('zobrazí kategorii (fallback Ostatní pokud cache prázdná)', () => {
      render(<ArticleReviewLeft item={makeItem({ category: 'povidky' })} />, {
        wrapper: Wrapper,
      });
      // Categories cache je prázdná → fallback `ostatni`
      expect(screen.getByText('Ostatní')).toBeTruthy();
    });
  });

  describe('Mid slot', () => {
    it('title je link na detail', () => {
      render(<ArticleReviewMid item={makeItem()} />, { wrapper: Wrapper });
      const titleLink = screen.getByText('Cesta do hvozdů');
      expect(titleLink.tagName).toBe('A');
      expect(titleLink.getAttribute('href')).toBe(
        '/ikaros/clanky/507f1f77bcf86cd799439abc',
      );
    });

    it('autor je link na veřejný profil', () => {
      render(<ArticleReviewMid item={makeItem()} />, { wrapper: Wrapper });
      const authorLink = screen.getByText('Petra K.');
      expect(authorLink.tagName).toBe('A');
      expect(authorLink.getAttribute('href')).toBe('/ikaros/uzivatel/u1');
    });

    it('preview zobrazen', () => {
      render(
        <ArticleReviewMid item={makeItem({ preview: 'Něco specifického' })} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText(/Něco specifického/)).toBeTruthy();
    });
  });

  describe('timeAgo helper', () => {
    it('< 60s → „právě teď"', () => {
      expect(timeAgo(new Date().toISOString())).toBe('právě teď');
    });
    it('30 min → „před 30 min"', () => {
      const t = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      expect(timeAgo(t)).toBe('před 30 min');
    });
    it('5 h → „před 5 h"', () => {
      const t = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(t)).toBe('před 5 h');
    });
    it('3 dny → „před 3 d"', () => {
      const t = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(t)).toBe('před 3 d');
    });
    it('30 dní → absolute date', () => {
      const t = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(t)).toMatch(/\d/);
    });
  });
});

describe('PENDING_ACTION_RENDERERS registry', () => {
  it('contains article_pending_review entry', async () => {
    const { PENDING_ACTION_RENDERERS } = await import(
      '@/features/users/components/tabs/ZpracovatTab/rendererRegistry'
    );
    const { PendingActionType } = await import('@/shared/types');
    expect(
      PENDING_ACTION_RENDERERS[PendingActionType.ArticlePendingReview],
    ).toBeDefined();
  });
});
