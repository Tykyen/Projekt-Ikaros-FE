import type { IkarosDiscussion } from '@/shared/types';

export type DiscussionSort = 'activity' | 'new' | 'posts';

/** Filtr (fulltext nad názvem/popisem) + řazení seznamu diskuzí. */
export function filterDiscussions(
  list: IkarosDiscussion[],
  query: string,
  sort: DiscussionSort,
): IkarosDiscussion[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q),
      )
    : list;
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sort === 'new')
      return +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc);
    if (sort === 'posts') return b.postCount - a.postCount;
    return +new Date(b.lastActivityUtc) - +new Date(a.lastActivityUtc);
  });
  return sorted;
}

/** Relativní čas „před X" v češtině. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'právě teď';
  if (min < 60) return `před ${min} min`;
  const hod = Math.floor(min / 60);
  if (hod < 24) return `před ${hod} h`;
  const dny = Math.floor(hod / 24);
  if (dny < 30) return `před ${dny} dny`;
  const mes = Math.floor(dny / 30);
  if (mes < 12) return `před ${mes} měs`;
  return `před ${Math.floor(mes / 12)} r`;
}

/** Iniciály z uživatelského jména pro avatar placeholder. */
export function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}
