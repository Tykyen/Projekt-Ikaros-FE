import { describe, it, expect } from 'vitest';
import type { IkarosArticle } from '@/shared/types';
import { filterArticles } from '../lib/articles';

function mkArticle(overrides: Partial<IkarosArticle> = {}): IkarosArticle {
  return {
    id: 'a1',
    title: 'Test',
    content: '<p>Lorem ipsum dolor sit amet</p>',
    category: 'povidky',
    authorId: 'u1',
    authorName: 'Autor',
    status: 'Published',
    ratings: [],
    averageRating: 0,
    createdAtUtc: '2026-01-01T10:00:00Z',
    updatedAtUtc: '2026-01-01T10:00:00Z',
    publishedAtUtc: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

describe('filterArticles', () => {
  it('skryje Draft/Pending/Rejected v Přehledu', () => {
    const articles = [
      mkArticle({ id: '1', status: 'Published' }),
      mkArticle({ id: '2', status: 'Draft' }),
      mkArticle({ id: '3', status: 'Pending' }),
      mkArticle({ id: '4', status: 'Rejected' }),
    ];
    const result = filterArticles(articles, '', new Set(), 'new');
    expect(result.map((a) => a.id)).toEqual(['1']);
  });

  it('search v title', () => {
    const articles = [
      mkArticle({ id: '1', title: 'Cesta do hvozdů' }),
      mkArticle({ id: '2', title: 'Jiný název' }),
    ];
    const result = filterArticles(articles, 'cesta', new Set(), 'new');
    expect(result.map((a) => a.id)).toEqual(['1']);
  });

  it('search v content', () => {
    const articles = [
      mkArticle({ id: '1', content: '<p>tajné slovo bagr</p>' }),
      mkArticle({ id: '2', content: '<p>nic</p>' }),
    ];
    const result = filterArticles(articles, 'bagr', new Set(), 'new');
    expect(result.map((a) => a.id)).toEqual(['1']);
  });

  it('multi-kategorie OR filter', () => {
    const articles = [
      mkArticle({ id: '1', category: 'povidky' }),
      mkArticle({ id: '2', category: 'poezie' }),
      mkArticle({ id: '3', category: 'uvahy' }),
    ];
    const result = filterArticles(
      articles,
      '',
      new Set(['povidky', 'poezie']),
      'new',
    );
    expect(result.map((a) => a.id).sort()).toEqual(['1', '2']);
  });

  it('sort=new — DESC podle publishedAtUtc', () => {
    const articles = [
      mkArticle({ id: '1', publishedAtUtc: '2026-01-01T10:00:00Z' }),
      mkArticle({ id: '2', publishedAtUtc: '2026-03-01T10:00:00Z' }),
      mkArticle({ id: '3', publishedAtUtc: '2026-02-01T10:00:00Z' }),
    ];
    const result = filterArticles(articles, '', new Set(), 'new');
    expect(result.map((a) => a.id)).toEqual(['2', '3', '1']);
  });

  it('sort=top — DESC podle averageRating', () => {
    const articles = [
      mkArticle({ id: '1', averageRating: 3.5, ratings: [{ userId: 'u', stars: 3 }] }),
      mkArticle({ id: '2', averageRating: 4.8, ratings: [{ userId: 'u', stars: 5 }] }),
      mkArticle({ id: '3', averageRating: 4.2, ratings: [{ userId: 'u', stars: 4 }] }),
    ];
    const result = filterArticles(articles, '', new Set(), 'top');
    expect(result.map((a) => a.id)).toEqual(['2', '3', '1']);
  });

  it('sort=most-rated — DESC podle počtu hodnocení', () => {
    const articles = [
      mkArticle({ id: '1', ratings: Array(5).fill({ userId: 'u', stars: 4 }) }),
      mkArticle({ id: '2', ratings: Array(20).fill({ userId: 'u', stars: 4 }) }),
      mkArticle({ id: '3', ratings: Array(10).fill({ userId: 'u', stars: 4 }) }),
    ];
    const result = filterArticles(articles, '', new Set(), 'most-rated');
    expect(result.map((a) => a.id)).toEqual(['2', '3', '1']);
  });

  it('empty filtr → všechny Published', () => {
    const articles = [
      mkArticle({ id: '1' }),
      mkArticle({ id: '2' }),
      mkArticle({ id: '3' }),
    ];
    expect(filterArticles(articles, '', new Set(), 'new')).toHaveLength(3);
  });

  it('search v stripped HTML (ne v tagách)', () => {
    const articles = [
      mkArticle({ id: '1', content: '<p><strong>match</strong></p>' }),
    ];
    expect(
      filterArticles(articles, 'strong', new Set(), 'new'),
    ).toHaveLength(0);
    expect(
      filterArticles(articles, 'match', new Set(), 'new'),
    ).toHaveLength(1);
  });
});
