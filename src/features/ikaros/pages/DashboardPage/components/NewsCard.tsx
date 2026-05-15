import type { IkarosNews } from '@/shared/types';
import { formatRelativePast } from '../utils/formatRelativePast';
import s from './NewsCard.module.css';

interface NewsCardProps {
  news: IkarosNews;
}

/**
 * Náhled karty = 2-řádkový excerpt. Od 3.2 je `content` rich-text HTML
 * (TipTap) — pro náhled stačí stripnout tagy na plain text. Backward
 * kompatibilní: starší plain-text novinky projdou beze změny.
 */
function toExcerpt(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <article className={s.card}>
      <h4 className={s.title}>{news.title}</h4>
      <span className={s.date}>{formatRelativePast(news.createdAtUtc)}</span>
      <p className={s.excerpt}>{toExcerpt(news.content)}</p>
      <span className={s.author}>— {news.authorName}</span>
    </article>
  );
}
