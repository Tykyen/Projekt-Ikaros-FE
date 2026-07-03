import { useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/shared/ui';
import { EmptyState } from '@/shared/ui/StatePlaceholder';
import { Seo } from '@/shared/seo';
import { TVORBA_TILES } from './tiles';
import s from './ComingSoonPage.module.css';

/**
 * 21.5 — sdílený stub „Připravujeme" pro dosud nepostavené knihovny Společné
 * tvorby (Bestiář/Herbář/Lektvary/Kouzla/Hádanky). Kontext (název + ikona) čte
 * z `TVORBA_TILES` podle aktuální cesty → jedna komponenta pro všech 5 routes.
 * `noindex` — prázdný stub nepatří do vyhledávače.
 */
export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const tile = TVORBA_TILES.find((t) => t.to === pathname);
  const Icon = tile?.icon;
  const label = tile?.label ?? 'Připravujeme';

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label },
  ];

  return (
    <article className={s.page}>
      <Seo title={label} description={`${label} — tuto sekci právě stavíme.`} noindex />
      <Breadcrumbs items={crumbs} />
      <EmptyState
        size="hero"
        icon={Icon ? <Icon size={48} /> : undefined}
        title={`${label} — připravujeme`}
        description="Tuhle sekci Společné tvorby právě stavíme. Brzy tu bude živo."
        action={{ label: '← Zpět na Společnou tvorbu', to: '/ikaros/tvorba' }}
      />
    </article>
  );
}
