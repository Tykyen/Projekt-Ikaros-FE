/**
 * 21.2a — Generátory (Společná tvorba, 11. dlaždice): tři záložky —
 * Jména (generátor ze jmenných sad), Potomci (demografický generátor rodin),
 * Sady (správa jmenných sad). Generování běží čistě na klientu.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { JmenaTab } from './components/JmenaTab';
import { PotomciTab } from './components/PotomciTab';
import { SadyTab } from './components/SadyTab';
import s from './Generatory.module.css';

type TabId = 'jmena' | 'potomci' | 'sady';

const TABS: { id: TabId; label: string }[] = [
  { id: 'jmena', label: '🎲 Jména' },
  { id: 'potomci', label: '👪 Potomci' },
  { id: 'sady', label: '📚 Sady' },
];

export default function GeneratoryPage() {
  const [tab, setTab] = useState<TabId>('jmena');

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Generátory' },
  ];

  return (
    <article className={s.page} data-generator-scope="community">
      <Seo
        title="Generátory jmen a rodin"
        description="Náhodná jména podle národů a států světa + demografický generátor potomků a rodin pro tvé rodokmeny. Deterministický seed, přechylování, mini-rodokmen."
        canonicalPath="/ikaros/generatory"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Generátory</h1>
        <p className={s.lead}>
          Jména podle národů a států, celé rodiny s realistickou demografií.
          Sdílené jmenné sady plní komunita — vlastní sadu si založíš v záložce
          Sady.
        </p>
      </header>

      <div className={s.tabs} role="tablist" aria-label="Generátory">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={s.tab}
            data-generator-tab={t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jmena' ? <JmenaTab /> : null}
      {tab === 'potomci' ? <PotomciTab /> : null}
      {tab === 'sady' ? <SadyTab /> : null}
    </article>
  );
}
