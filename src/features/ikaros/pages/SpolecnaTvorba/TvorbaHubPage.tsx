import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import { Breadcrumbs } from '@/shared/ui';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { Seo, JsonLd, itemListJsonLd, breadcrumbJsonLd } from '@/shared/seo';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { usePendingActionsCount } from '@/features/users/api/usePendingActions';
import { TVORBA_TILES } from './tiles';
import s from './TvorbaHubPage.module.css';

/**
 * 21.5 — rozcestník „Společná tvorba" (`/ikaros/tvorba`). Veřejný, indexovatelný.
 * Sjednocuje komunitní tvorbu: Diskuze/Články/Galerie (aktivní) + Bestiář/Herbář/
 * Lektvary/Kouzla/Hádanky (zatím stuby). SEO: ItemList (jen aktivní) + Breadcrumbs.
 */
export default function TvorbaHubPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const { data: pending } = usePendingActionsCount(isAuth);
  const origin = window.location.origin;
  const crumbs = [{ label: 'Domů', href: '/' }, { label: 'Společná tvorba' }];
  const activeTiles = TVORBA_TILES.filter((t) => t.active);

  return (
    <article className={s.page}>
      <Seo
        title="Společná tvorba"
        description="Diskuze, články, galerie, bestiář, herbář, lektvary, kouzla a hádanky — komunitní tvorba na Ikarovi na jednom místě."
        canonicalPath="/ikaros/tvorba"
      />
      <JsonLd
        data={itemListJsonLd(
          activeTiles.map((t) => ({ name: t.label, url: t.to })),
          origin,
        )}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs, origin)} />

      <Breadcrumbs items={crumbs} />

      <header className={s.head}>
        <h1 className={s.title}>Společná tvorba</h1>
        <p className={s.lead}>
          Vše, co tvoří komunita, na jednom místě. Vyber si sekci a přidej se —
          nebo si projdi, co ostatní vytvořili.
        </p>
      </header>

      <div className={s.grid}>
        {TVORBA_TILES.map((tile) => {
          const Icon = tile.icon;
          const badge = tile.pendingType ? pending?.byType?.[tile.pendingType] ?? 0 : 0;
          return (
            <Link
              key={tile.key}
              to={tile.to}
              className={clsx(s.card, !tile.active && s.stub)}
              data-tile-key={tile.key}
              data-frame-panel="card"
            >
              <CornerOrnament position="tl" />
              <CornerOrnament position="tr" />
              <CornerOrnament position="bl" />
              <CornerOrnament position="br" />

              {!tile.active && <span className={s.soon}>Připravujeme</span>}
              {badge > 0 && (
                <span
                  className={s.badge}
                  aria-label={`${badge} čeká na schválení`}
                  title={`${badge} čeká na schválení`}
                >
                  {badge}
                </span>
              )}

              <span className={s.emblem} aria-hidden="true">
                <Icon size={28} />
              </span>
              <h2 className={s.cardTitle}>{tile.label}</h2>
              <p className={s.cardClaim}>{tile.description}</p>
              <span className={s.more}>{tile.active ? 'Otevřít →' : 'Už brzy'}</span>
            </Link>
          );
        })}
      </div>
    </article>
  );
}
