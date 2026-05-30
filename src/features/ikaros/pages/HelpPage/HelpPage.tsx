import { type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { HELP_TABS, TAB_LABELS, parseTab, type HelpTab } from './helpers';
import { StartSection } from './sections/StartSection';
import { PagesSection } from './sections/PagesSection';
import { AccountSection } from './sections/AccountSection';
import { RolesSection } from './sections/RolesSection';
import { FaqSection } from './sections/FaqSection';
import s from './HelpPage.module.css';

const SECTIONS: Record<HelpTab, ComponentType> = {
  start: StartSection,
  stranky: PagesSection,
  ucet: AccountSection,
  role: RolesSection,
  faq: FaqSection,
};

export default function HelpPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get('sekce'));
  const Section = SECTIONS[tab];

  function changeTab(next: HelpTab) {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === 'start') out.delete('sekce');
        else out.set('sekce', next);
        return out;
      },
      { replace: false },
    );
  }

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1>Nápověda</h1>
        <p className={s.lead}>
          Co stránky umí, kdo má jaká práva, jak na účet a kam se obrátit.
          Aktualizováno k 2026-05-30 (10.2h — Taktická mapa: mlha války. PJ zapne mlhu a štětcem odhaluje/zahaluje oblasti (tři velikosti); hráč vidí jen odhalené, nepřátele v mlze ne, PJ vidí vše a mlhu jen poloprůsvitně. Vlastní postavy hráče jsou viditelné vždy. Předchozí: 10.2g — efekty (barevné zóny, bariéry s DC, výbuchy oheň/plyn/kouř); 10.2f — iniciativa a tracker boje.).
        </p>
      </header>

      <nav className={s.tabs} role="tablist" aria-label="Sekce nápovědy">
        {HELP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={clsx(s.tab, tab === t && s.tabActive)}
            onClick={() => changeTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <section className={s.content} aria-live="polite">
        <Section />
      </section>
    </article>
  );
}
