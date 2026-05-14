import { Link } from 'react-router-dom';
import s from './MemberDashboardStub.module.css';

interface Props {
  worldId: string;
}

interface SectionLink {
  to: string;
  label: string;
  description: string;
}

/**
 * Spec 2.4 — minimální dashboard pro membery (Čtenář+). Grid karet s linky
 * na hlavní sekce světa. Plný obsah (recent activity, statistiky) přijde
 * v pozdějších fázích.
 */
export function MemberDashboardStub({ worldId }: Props) {
  const base = `/svet/${worldId}`;
  const links: SectionLink[] = [
    {
      to: `${base}/stranky`,
      label: 'Stránky',
      description: 'Wiki, encyklopedie, deníky',
    },
    {
      to: `${base}/postavy`,
      label: 'Postavy',
      description: 'Adresář postav světa',
    },
    {
      to: `${base}/mapa`,
      label: 'Mapa vesmíru',
      description: 'Geografie a oblasti',
    },
    {
      to: `${base}/kalendar`,
      label: 'Kalendář',
      description: 'Události a časová osa',
    },
    {
      to: `${base}/chat`,
      label: 'Chat',
      description: 'Komunikace ve světě',
    },
    {
      to: `${base}/pravidla`,
      label: 'Pravidla',
      description: 'Herní systém a mechaniky',
    },
  ];

  return (
    <section className={s.dashboard}>
      <h2 className={s.title}>Vítej ve světě</h2>
      <p className={s.subtitle}>
        Toto je tvůj rozcestník. Klikni na sekci pro pokračování.
      </p>
      <div className={s.grid}>
        {links.map((link) => (
          <Link key={link.to} to={link.to} className={s.card}>
            <span className={s.cardLabel}>{link.label}</span>
            <span className={s.cardDesc}>{link.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
