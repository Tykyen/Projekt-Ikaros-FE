import { useEffect, useMemo, useState } from 'react';
import { extractHeadings } from '../lib/articles';
import s from './AutoTOC.module.css';

interface Props {
  /** HTML obsah článku (TipTap output). */
  html: string;
}

/**
 * 3.2e — automatický obsah z `<h2>`/`<h3>` v článku. Sticky sidebar
 * @ desktop, accordion @ mobile. Skrytý pokud článek má < 2 nadpisy.
 */
export function AutoTOC({ html }: Props) {
  const headings = useMemo(() => extractHeadings(html), [html]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Inject id na h2/h3 v renderovaném DOM (TipTap output nemá id).
  useEffect(() => {
    if (headings.length < 2) return;
    const root = document.querySelector('[data-article-content]');
    if (!root) return;
    const elements = root.querySelectorAll('h2, h3');
    elements.forEach((el, idx) => {
      if (headings[idx]) el.id = headings[idx].id;
    });
  }, [headings]);

  // IntersectionObserver — highlight aktivní nadpis při scrollu.
  useEffect(() => {
    if (headings.length < 2) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const list = (
    <ul className={s.list}>
      {headings.map((h) => (
        <li
          key={h.id}
          className={[
            h.level === 3 ? s.level3 : s.level2,
            activeId === h.id ? s.active : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <a href={`#${h.id}`} onClick={(e) => smoothScroll(e, h.id)}>
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <nav className={s.desktop} aria-label="Obsah článku">
        <h4 className={s.heading}>Obsah</h4>
        {list}
      </nav>
      <details
        className={s.mobile}
        open={open}
        onToggle={(e) =>
          setOpen((e.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary className={s.summary}>Obsah ({headings.length})</summary>
        {list}
      </details>
    </>
  );
}

function smoothScroll(e: React.MouseEvent, id: string): void {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.pushState(null, '', `#${id}`);
}
