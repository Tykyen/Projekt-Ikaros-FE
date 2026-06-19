import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePrintMode } from '@/features/world/export/print';
import type { PageSection } from '../../api/pages.types';
import s from './PageSections.module.css';

interface Props {
  sections: PageSection[];
}

/**
 * 7.1 — Collapsible sekce stránky. Render seřazený podle `order`. Default
 * stav = sbaleno (viewer); editor (7.2) bude rozbalovat. Render obsahu jako
 * HTML přes `dangerouslySetInnerHTML` (TipTap output v `section.content`).
 *
 * Items (PageSectionItem) — render jako odrážkový list pod content. Pokud
 * sekce nemá `content` ani `items`, vůbec se nevykreslí.
 */
export function PageSections({ sections }: Props) {
  if (sections.length === 0) return null;
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <section className={s.wrap} aria-label="Sekce">
      {sorted.map((section) => (
        <SectionCard key={section.id} section={section} />
      ))}
    </section>
  );
}

function SectionCard({ section }: { section: PageSection }) {
  const [collapsed, setCollapsed] = useState(section.isCollapsed);
  const printMode = usePrintMode();
  // Tisk rozbalí všechny sekce (jinak by se vytiskl jen vizuálně otevřený obsah).
  const showBody = printMode || !collapsed;
  const hasContent =
    section.content.trim().length > 0 || section.items.length > 0;
  if (!hasContent) return null;

  return (
    <article className={s.card}>
      <button
        type="button"
        className={s.header}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <span className={s.title}>{section.title || 'Sekce'}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`print-hide ${collapsed ? '' : s.chevronOpen}`}
        />
      </button>
      {showBody && (
        <div className={s.body}>
          {section.content.trim().length > 0 && (
            <div
              className={s.content}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
          {section.items.length > 0 && (
            <ul className={s.items}>
              {section.items.map((it) => (
                <li key={it.id} className={s.item}>
                  <span className={s.itemText}>{it.text}</span>
                  {typeof it.quantity === 'number' && (
                    <span className={s.itemQty}>×{it.quantity}</span>
                  )}
                  {it.note && <span className={s.itemNote}>{it.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
