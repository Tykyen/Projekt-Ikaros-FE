import type { ReactNode } from 'react';
import { UserCircle, Users, Swords, HelpCircle } from 'lucide-react';
import { HelpAccordion } from '../components';
import { FAQ_POLOZKY, type FaqKategorie } from '@/shared/vypravec/registry/faq';
import s from '../HelpPage.module.css';

// D-080a: data FAQ žijí v registru Vypravěče (`shared/vypravec/registry/faq.tsx`);
// tady zůstává jen render (kategorie → akordeon `faq-<kategorie>` + <details>).
const CATS: { key: FaqKategorie; label: string; icon: ReactNode; accent: 'accent' | 'player' | 'pj' | 'info' }[] = [
  { key: 'ucet', label: 'Účet', icon: <UserCircle size={20} />, accent: 'accent' },
  { key: 'komunita', label: 'Komunita', icon: <Users size={20} />, accent: 'player' },
  { key: 'svet', label: 'Svět & hra', icon: <Swords size={20} />, accent: 'pj' },
  { key: 'obecne', label: 'Obecné', icon: <HelpCircle size={20} />, accent: 'info' },
];

export function FaqSection() {
  return (
    <>
      <p>Krátké odpovědi na časté otázky, seskupené do kategorií. Rozbal kategorii a klikni na otázku.</p>
      {CATS.map((cat, i) => {
        const items = FAQ_POLOZKY.filter((f) => f.cat === cat.key);
        return (
          <HelpAccordion
            key={cat.key}
            icon={cat.icon}
            title={cat.label}
            id={`faq-${cat.key}`}
            accent={cat.accent}
            defaultOpen={i === 0}
          >
            <div className={s.faqList}>
              {items.map((item, idx) => (
                <details key={idx} className={s.faqItem}>
                  <summary>{item.q}</summary>
                  <div className={s.faqAnswer}>{item.a}</div>
                </details>
              ))}
            </div>
          </HelpAccordion>
        );
      })}
    </>
  );
}
