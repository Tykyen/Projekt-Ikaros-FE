/**
 * 15B.4a — Registr landing stránek pro RPG systémy (data-driven, vzor 15.7
 * `showcaseSlides.ts`). Jedna šablona `SystemLandingPage` čte odsud.
 *
 * **Obsah 1. vlny = 3 vlajkové** (`drd16`, `drd2`, `jad`) postavené JEN na tom,
 * co dnes reálně existuje (deníkový list per systém + generické platform
 * featury). Zbylé 4 CZ jsou `published:false` (kostra) → negenerují stránku;
 * jejich copy + optional pilíře (bestiar/dodatky) doplní bod 22.1 po 16.2.
 *
 * ⚠️ `systemId` musí sedět s `RPG_SYSTEMS` (CreateWorldPage/constants/systems.ts)
 * a s diary presetem (diary-systems/presets/<id>.ts).
 *
 * 📝 Draft copy (heroClaim/intro/features/faq) je NÁVRH — uživatel reviduje
 * (zná systémy líp). People-first, ne keyword-stuffing.
 */

export interface LandingFeature {
  title: string;
  body: string;
}

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingFaq {
  q: string;
  a: string;
}

export interface SystemLanding {
  /** URL segment: /ikaros/systemy/<slug> (SEO čitelný, ne tech id). */
  slug: string;
  /** Vazba na RPG_SYSTEMS / diary preset (drd16, drd2, jad…). */
  systemId: string;
  label: string;
  /** false = v registru (kostra), ale negeneruje stránku ani odkaz v hubu. */
  published: boolean;

  heroClaim: string;
  intro: string;
  /** <Seo> description, ≤ ~155 znaků. */
  metaDescription: string;
  features: LandingFeature[];
  jakZacit: LandingStep[];
  faq: LandingFaq[];

  /** OPTIONAL pilíře — doplní 22.1 po 16.2. Sekce se nevykreslí, dokud chybí. */
  denikScreenshot?: string;
  bestiar?: { intro: string; ukazky?: string[] };
  dodatky?: { intro: string };

  /** Interní evidence (NE UI) — co na landing zbývá dotáhnout po 16.2. */
  completeness: { denik: boolean; bestiar: boolean; dodatky: boolean };
}

/** Sdílené „jak začít" kroky (liší se jen 2. krok názvem systému). */
const jakZacit = (label: string): LandingStep[] => [
  {
    title: 'Zaregistruj se zdarma',
    body: 'Stačí e-mail a přezdívka. Žádná platba, žádná instalace — hraješ rovnou v prohlížeči.',
  },
  {
    title: `Vytvoř svět a vyber systém ${label}`,
    body: 'Při zakládání světa zvolíš pravidlový systém. Ikaros podle něj připraví deníkový list i kostky.',
  },
  {
    title: 'Pozvi spoluhráče a začni hrát',
    body: 'Přidej hráče do světa, rozdej role a veďte příběh ve světovém chatu i na taktické mapě.',
  },
];

/** Sdílené featury platformy (co Ikaros umí DNES, napříč systémy). */
const features = (label: string): LandingFeature[] => [
  {
    title: 'Deníkový list na míru systému',
    body: `Postava s vlastnostmi, dovednostmi a kostkami podle pravidel ${label}. Háže se přímo z listu, výpočty drží Ikaros.`,
  },
  {
    title: 'Taktická mapa',
    body: 'Bitvy na čtvercové mřížce — tokeny postav i nestvůr, iniciativa, mlha války, zvuky a počasí scény.',
  },
  {
    title: 'Kalendář a kronika',
    body: 'Vlastní herní kalendář světa, časová osa událostí a deník tažení — příběh nikdy nezapadne.',
  },
  {
    title: 'Chat za postavu',
    body: 'Hraní příběhu ve světovém chatu: mluvíš za svou postavu (vlastní jméno i portrét), PJ za své NPC.',
  },
];

/** FAQ → FAQPage JSON-LD. */
const faq = (label: string): LandingFaq[] => [
  {
    q: `Co je ${label} na Ikarovi?`,
    a: `Ikaros je česká online platforma pro hraní RPG. Pro ${label} nabízí deníkový list, taktickou mapu, kalendář a chat za postavu — všechno na jednom místě a v prohlížeči.`,
  },
  {
    q: `Jak založím svět pro ${label}?`,
    a: `Po registraci klikni na „Vytvořit svět", zvol systém ${label} a Ikaros ti připraví deník i kostky. Pak pozveš spoluhráče.`,
  },
  {
    q: 'Co umí deníkový list?',
    a: 'Drží vlastnosti, dovednosti, výbavu a životy postavy a umí házet kostkami daného systému přímo z listu — bez ručního počítání.',
  },
  {
    q: 'Je to zdarma?',
    a: 'Ano. Registrace i hraní jsou zdarma; Ikaros je nekomerční komunitní projekt.',
  },
];

/** Kostra pro zatím nepublikované CZ systémy (2. vlna / 22.1). */
const stub = (
  slug: string,
  systemId: string,
  label: string,
): SystemLanding => ({
  slug,
  systemId,
  label,
  published: false,
  heroClaim: '',
  intro: '',
  metaDescription: '',
  features: [],
  jakZacit: [],
  faq: [],
  completeness: { denik: false, bestiar: false, dodatky: false },
});

export const SYSTEM_LANDINGS: SystemLanding[] = [
  // ── Vlajkové (1. vlna, published) ──────────────────────────────────────
  {
    slug: 'draci-doupe-1-6',
    systemId: 'drd16',
    label: 'Dračí Doupě 1.6',
    published: true,
    heroClaim: 'Hraj Dračí Doupě 1.6 online — deník, mapa i příběh na jednom místě.',
    intro:
      'Dračí Doupě je nejznámější česká hra na hrdiny. Na Ikarovi ho rozjedeš v prohlížeči — bez papírů, bez instalace. Postavy mají deníkový list s pravidly 1.6, bitvy se odehrávají na taktické mapě a příběh žije ve světovém chatu.',
    metaDescription:
      'Hraj Dračí Doupě 1.6 online zdarma — deníkový list, taktická mapa, kalendář a chat za postavu. Vše v prohlížeči na české platformě Ikaros.',
    features: features('Dračí Doupě 1.6'),
    jakZacit: jakZacit('Dračí Doupě 1.6'),
    faq: faq('Dračí Doupě 1.6'),
    completeness: { denik: true, bestiar: false, dodatky: false },
  },
  {
    slug: 'draci-doupe-2',
    systemId: 'drd2',
    label: 'Dračí Doupě II',
    published: true,
    heroClaim: 'Veď tažení v Dračím Doupěti II — deník, taktická mapa a chat za postavu.',
    intro:
      'Dračí Doupě II posouvá klasiku do modernějších pravidel. Na Ikarovi k němu dostaneš deníkový list, čtvercovou taktickou mapu pro souboje a nástroje pro vedení dlouhých tažení — kalendář, kroniku i chat, ve kterém mluvíš za svou postavu.',
    metaDescription:
      'Hraj Dračí Doupě II online zdarma — deníkový list, taktická mapa, kalendář a chat za postavu na české platformě Ikaros.',
    features: features('Dračí Doupě II'),
    jakZacit: jakZacit('Dračí Doupě II'),
    faq: faq('Dračí Doupě II'),
    completeness: { denik: true, bestiar: false, dodatky: false },
  },
  {
    slug: 'jeskyne-a-draci',
    systemId: 'jad',
    label: 'Jeskyně a Draci',
    published: true,
    heroClaim: 'Jeskyně a Draci online — postavy, bitvy na mřížce a kronika tažení.',
    intro:
      'Jeskyně a Draci přináší dobrodružství v duchu staré školy. Na Ikarovi pro něj máš deníkový list, taktickou mapu s tokeny a iniciativou a celé zázemí pro vyprávění — kalendář světa, časovou osu a chat, kde se příběh píše po postavách.',
    metaDescription:
      'Hraj Jeskyně a Draci online zdarma — deníkový list, taktická mapa, kalendář a chat za postavu na české platformě Ikaros.',
    features: features('Jeskyně a Draci'),
    jakZacit: jakZacit('Jeskyně a Draci'),
    faq: faq('Jeskyně a Draci'),
    completeness: { denik: true, bestiar: false, dodatky: false },
  },

  // ── Kostra (2. vlna — published:false, doplní 22.1) ────────────────────
  stub('ikaros-pravidla', 'matrix', 'Matrix / Ikaros pravidla'),
  stub('draci-doupe-plus', 'drd-plus', 'Dračí Doupě Plus'),
  stub('draci-hlidka', 'draci-hlidka', 'Dračí Hlídka'),
  stub('pribehy-imperia', 'pi', 'Příběhy Impéria'),
];

export const getPublishedLandings = (): SystemLanding[] =>
  SYSTEM_LANDINGS.filter((s) => s.published);

export const getLandingBySlug = (slug: string): SystemLanding | undefined =>
  SYSTEM_LANDINGS.find((s) => s.slug === slug && s.published);
