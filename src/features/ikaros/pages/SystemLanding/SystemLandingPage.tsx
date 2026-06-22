import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import clsx from 'clsx';
import {
  Sparkles,
  Compass,
  ScrollText,
  Map as MapIcon,
  CalendarDays,
  MessagesSquare,
} from 'lucide-react';
import { Button, Breadcrumbs } from '@/shared/ui';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { Seo, JsonLd, faqJsonLd, breadcrumbJsonLd } from '@/shared/seo';
import {
  isAuthenticatedAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { SHOWCASE_SLIDES } from '../DashboardPage/sections/showcaseSlides';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import { getLandingBySlug, type SystemLanding } from './systemLandings';
import s from './SystemLandingPage.module.css';

/**
 * 15B.4a — šablona veřejné landing stránky systému (/ikaros/systemy/:slug).
 * Data z `systemLandings.ts`. SEO: <Seo> + FAQPage/BreadcrumbList JSON-LD
 * (gate `published` = vždy indexable; getLandingBySlug pustí jen published).
 * Optional sekce (bestiar/dodatky/denikScreenshot) se renderují JEN když mají
 * data — žádné „připravujeme" bloky.
 */

const FEATURE_ICONS = [ScrollText, MapIcon, CalendarDays, MessagesSquare];

/** Glass rám (vzor IkarosCard bez ember/medallionu) — per-téma `data-frame-panel`. */
function Frame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx(s.frame, className)} data-frame-panel="card">
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />
      {children}
    </div>
  );
}

function CtaRow() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const setRegisterOpen = useSetAtom(registerModalOpenAtom);
  const navigate = useNavigate();
  return (
    <div className={s.ctaRow}>
      <Button
        variant="primary"
        size="lg"
        onClick={() =>
          isAuth ? navigate('/ikaros/vytvorit-svet') : setRegisterOpen(true)
        }
      >
        <Sparkles size={18} aria-hidden="true" />
        Vytvořit svět zdarma
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => navigate('/ikaros/vesmiry')}
      >
        <Compass size={18} aria-hidden="true" />
        Prozkoumat světy
      </Button>
    </div>
  );
}

export default function SystemLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const landing = slug ? getLandingBySlug(slug) : undefined;

  // Neznámý / nepublikovaný slug → 404 (ne prázdná stránka, ne leak).
  if (!landing) return <NotFoundPage />;

  const origin = window.location.origin;
  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'RPG systémy', href: '/ikaros/systemy' },
    { label: landing.label },
  ];
  // Hero vizuál: dedikovaný screenshot (až 22.1), zatím reuse showcase deníku.
  const heroImage =
    landing.denikScreenshot ??
    SHOWCASE_SLIDES.find((sl) => sl.slug === 'denik-postavy')?.src;

  return (
    <article className={s.page}>
      <Seo
        title={`${landing.label} online`}
        description={landing.metaDescription}
        canonicalPath={`/ikaros/systemy/${landing.slug}`}
      />
      <JsonLd data={faqJsonLd(landing.faq)} />
      <JsonLd data={breadcrumbJsonLd(crumbs, origin)} />

      <Breadcrumbs items={crumbs} />

      {/* ── Hero (asymetrický: text vlevo, screenshot vpravo) ── */}
      <header className={s.hero}>
        <div className={s.heroText}>
          <span className={s.eyebrow}>{landing.label}</span>
          <h1 className={s.claim}>{landing.heroClaim}</h1>
          <p className={s.intro}>{landing.intro}</p>
          <CtaRow />
        </div>
        {heroImage && (
          <Frame className={s.heroVisual}>
            <img src={heroImage} alt={`Deník — ${landing.label}`} loading="eager" />
          </Frame>
        )}
      </header>

      <Divider />

      {/* ── Features (zig-zag) ── */}
      <section className={s.features} aria-label="Co Ikaros pro systém umí">
        {landing.features.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return (
            <Frame key={f.title} className={clsx(s.feature, i % 2 === 1 && s.featureAlt)}>
              <span className={s.featureIcon} aria-hidden="true">
                <Icon size={26} />
              </span>
              <div>
                <h2 className={s.featureTitle}>{f.title}</h2>
                <p className={s.featureBody}>{f.body}</p>
              </div>
            </Frame>
          );
        })}
      </section>

      <Divider />

      {/* ── Jak začít (timeline ①②③) ── */}
      <section className={s.start} aria-label="Jak začít">
        <h2 className={s.sectionTitle}>Jak začít</h2>
        <ol className={s.timeline}>
          {landing.jakZacit.map((step, i) => (
            <li key={step.title} className={s.step}>
              <span className={s.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Galerie (reuse showcase) ── */}
      <section className={s.gallery} aria-label="Ukázky">
        <h2 className={s.sectionTitle}>Podívej se dovnitř</h2>
        <div className={s.galleryGrid}>
          {SHOWCASE_SLIDES.map((sl) => (
            <Frame key={sl.slug} className={s.shot}>
              <img src={sl.src} alt={sl.caption} loading="lazy" />
              <span className={s.shotCaption}>{sl.caption}</span>
            </Frame>
          ))}
        </div>
      </section>

      {/* ── Optional pilíře (22.1) — render JEN když mají data ── */}
      <OptionalPillars landing={landing} />

      <Divider />

      {/* ── FAQ (details — crawler-friendly) ── */}
      <section className={s.faq} aria-label="Časté otázky">
        <h2 className={s.sectionTitle}>Časté otázky</h2>
        {landing.faq.map((item) => (
          <details key={item.q} className={s.faqItem}>
            <summary className={s.faqQ}>{item.q}</summary>
            <p className={s.faqA}>{item.a}</p>
          </details>
        ))}
      </section>

      {/* ── Závěrečné CTA ── */}
      <section className={s.finalCta}>
        <h2 className={s.finalClaim}>Rozjeď své {landing.label} ještě dnes.</h2>
        <CtaRow />
      </section>
    </article>
  );
}

/** Bestiář / dodatky — sekce existuje jen když registr má data (po 16.2). */
function OptionalPillars({ landing }: { landing: SystemLanding }) {
  if (!landing.bestiar && !landing.dodatky) return null;
  return (
    <>
      <Divider />
      {landing.bestiar && (
        <section className={s.pillar} aria-label="Bestiář">
          <h2 className={s.sectionTitle}>Bestiář</h2>
          <p className={s.intro}>{landing.bestiar.intro}</p>
        </section>
      )}
      {landing.dodatky && (
        <section className={s.pillar} aria-label="Dodatky k pravidlům">
          <h2 className={s.sectionTitle}>Dodatky k pravidlům</h2>
          <p className={s.intro}>{landing.dodatky.intro}</p>
        </section>
      )}
    </>
  );
}

function Divider() {
  return <div className={s.divider} aria-hidden="true">❖</div>;
}
