import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/shared/ui';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { Seo, JsonLd, itemListJsonLd, breadcrumbJsonLd } from '@/shared/seo';
import { getPublishedLandings } from './systemLandings';
import s from './SystemsHubPage.module.css';

/**
 * 15B.4a — rozcestník landing stránek systémů (/ikaros/systemy). Veřejný,
 * indexovatelný. Zobrazuje jen `published` systémy (kostra zbylých CZ se
 * nevypisuje). SEO: ItemList + BreadcrumbList JSON-LD.
 */
export default function SystemsHubPage() {
  const systems = getPublishedLandings();
  const origin = window.location.origin;
  const crumbs = [{ label: 'Domů', href: '/' }, { label: 'RPG systémy' }];

  return (
    <article className={s.page}>
      <Seo
        title="RPG systémy"
        description="Dračí Doupě, Dračí Doupě II, Jeskyně a Draci a další RPG systémy online na Ikarovi — deníkový list, taktická mapa, kalendář a chat za postavu."
        canonicalPath="/ikaros/systemy"
      />
      <JsonLd
        data={itemListJsonLd(
          systems.map((sys) => ({
            name: sys.label,
            url: `/ikaros/systemy/${sys.slug}`,
          })),
          origin,
        )}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs, origin)} />

      <Breadcrumbs items={crumbs} />

      <header className={s.head}>
        <h1 className={s.title}>RPG systémy na Ikarovi</h1>
        <p className={s.lead}>
          Vyber si pravidlový systém a rozjeď ho online — deníkový list,
          taktická mapa, kalendář i chat za postavu. Vše zdarma a v prohlížeči.
        </p>
      </header>

      <div className={s.grid}>
        {systems.map((sys) => (
          <Link
            key={sys.slug}
            to={`/ikaros/systemy/${sys.slug}`}
            className={s.card}
            data-frame-panel="card"
          >
            <CornerOrnament position="tl" />
            <CornerOrnament position="tr" />
            <CornerOrnament position="bl" />
            <CornerOrnament position="br" />
            <span className={s.emblem} aria-hidden="true">
              {sys.label.charAt(0)}
            </span>
            <h2 className={s.cardTitle}>{sys.label}</h2>
            <p className={s.cardClaim}>{sys.heroClaim}</p>
            <span className={s.more}>Zobrazit →</span>
          </Link>
        ))}
      </div>
    </article>
  );
}
