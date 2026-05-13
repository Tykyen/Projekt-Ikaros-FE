import type { IkarosNews } from '@/shared/types';
import { formatRelativePast } from '../utils/formatRelativePast';
import s from './NewsCard.module.css';

interface NewsCardProps {
  news: IkarosNews;
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <article className={s.card}>
      <h4 className={s.title}>{news.title}</h4>
      <span className={s.date}>{formatRelativePast(news.createdAtUtc)}</span>
      <p className={s.excerpt}>{news.content}</p>
      <span className={s.author}>— {news.authorName}</span>
    </article>
  );
}
