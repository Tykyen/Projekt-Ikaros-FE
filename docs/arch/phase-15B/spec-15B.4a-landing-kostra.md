# Spec 15B.4a — Kostra landing stránek pro RPG systémy

**Stav:** 🚧 NÁVRH (čeká schválení) · **Fáze:** 15B (H2 Objevitelnost / SEO) · **Roadmap:** [15B.4a](../../roadmap2.md) [H2-04] · **Navazuje:** 15B.1 (prerender), 15B.2 (meta/sitemap/`<Seo>`), 15B.3 (JSON-LD) · **Předchází:** 22.1 (= bývalá 15B.4b, obohacení po 16.2) · **Souvis.:** 16.2 (hloubková podpora systémů — landing zobrazí jejich výstup), 15.7 (anon homepage, reuse estetiky)

**Cíl:** Veřejné, indexovatelné landing stránky per RPG systém („co Ikaros pro Dračí Doupě / DrD II / Jeskyně a Draci umí, jak začít") — **technická kostra teď**, aby URL žily a budovaly doménovou autoritu (SEO běží na čase). Obsah postavený **jen na tom, co dnes reálně existuje** (deník per systém + generické platform featury). Bohatý obsah (bestiář, dodatky, finální grafika) doplní **22.1** po 16.2.

---

## 0. Princip & rozsah

- **Kostra, ne bohatý obsah.** Cíl = infrastruktura (šablona + registr + routy + SEO + sitemap + prerender), kterou 22.1 jen naplní. Nestavíme nic, co závisí na 16.2.
- **Data-driven** (vzor 15.7 `showcaseSlides.ts`): jeden registr `systemLandings.ts` + jedna šablona `SystemLandingPage`. Přidání/úprava systému = data, ne kód.
- **Aditivní, reuse estetiky** (jako 15.7): `IkarosCard`, `Button`, `CornerOrnament`, `SectionTitle`, theme tokeny. **Žádný nový vizuální jazyk.** (Konkrétní vizuál projde `frontend-design` auditem mezi schválením a impl. plánem.)
- **1. vlna = 3 vlajkové** (`drd16`, `drd2`, `jad`) — největší CZ search objem + dotažený deník. Registr **datově pojme všech 7 CZ**; zbylé 4 (`matrix`, `drd-plus`, `draci-hlidka`, `pi`) jsou v registru `published:false` + `completeness` marker → **žádná stránka se nevygeneruje** (ne „připravujeme").
- **Žádné „připravujeme" bloky.** Optional sekce (bestiar/dodatky) se prostě nevykreslí, dokud nemá data. `completeness` je interní evidence (co čeká na 16.2), ne UI.

---

## 1. Rozhodnutá rozhodnutí

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Stavět teď vs. po 16.2** | kostra teď, obsah 22.1 | doménová autorita roste měsíce; spustit URL dřív i tenčí > spustit hotové od nuly (rozhodnuto 2026-06-22, var. A). |
| R2 | **Routing** | `/ikaros/systemy` (hub) + `/ikaros/systemy/:slug` | veřejné, bez `requireAuth`; konzistentní s `/ikaros/*` namespace. |
| R3 | **URL slug** | **SEO-čitelný slug** (`draci-doupe-1-6`), ne tech id (`drd16`) | čitelná URL rankuje líp; registr mapuje `slug → systemId`. |
| R4 | **Datový zdroj** | čistě FE registr `systemLandings.ts`, žádný BE/DB | obsah je redakční text, ne entita; vzor 15.7. |
| R5 | **Optional pilíře** | `bestiar?`/`dodatky?`/`denikScreenshot?` se renderují jen když existují | 22.1 doplní bez přestavby šablony; žádné prázdné bloky. |
| R6 | **JSON-LD typ** | detail = `FAQPage` (z `faq[]`) + `BreadcrumbList`; hub = `ItemList` | FAQ = bohatý výsledek u „jak začít"; ItemList = rozcestník. |
| R7 | **Hub obsah** | jen `published:true` systémy | unpublished v registru = nezobrazí se nikde. |

---

## 2. Routing

- `src/app/router.tsx` — dvě nové veřejné routy v `IkarosLayout` children (vedle `ikaros/clanky` apod., **bez** `loader: requireAuth`):
  - `{ path: 'ikaros/systemy', element: p(SystemsHubPage) }`
  - `{ path: 'ikaros/systemy/:slug', element: p(SystemLandingPage) }`
- `:slug` neznámý / `published:false` → `<NotFoundPage>` (ne prázdná stránka, ne leak).
- Lazy import (vzor existujících stránek).

---

## 3. Datový model — `systemLandings.ts`

`src/features/ikaros/pages/SystemLanding/systemLandings.ts`:

```ts
export interface LandingFeature { icon?: string; title: string; body: string; }
export interface LandingStep    { title: string; body: string; }
export interface LandingFaq     { q: string; a: string; }

export interface SystemLanding {
  slug: string;            // URL: /ikaros/systemy/<slug>  (SEO čitelný)
  systemId: string;        // vazba na RPG_SYSTEMS / diary preset (drd16, drd2, jad…)
  label: string;           // „Dračí Doupě 1.6"
  published: boolean;      // false = v registru, ale negeneruje stránku (1. vlna jen 3)

  // hero + intro
  heroClaim: string;       // jediný slib, H1
  intro: string;           // 1–2 odstavce, people-first
  metaDescription: string; // <Seo> description (≤ ~155 znaků)

  // co Ikaros pro systém umí (DNES existující — deník + platform featury)
  features: LandingFeature[];
  jakZacit: LandingStep[]; // kroky „jak začít hrát na Ikarovi"
  faq: LandingFaq[];       // → FAQPage JSON-LD

  // OPTIONAL pilíře — doplní 22.1 po 16.2; sekce se nevykreslí, dokud chybí
  denikScreenshot?: string;  // /images/systemy/<slug>-denik.webp
  bestiar?: { intro: string; ukazky?: string[] };
  dodatky?: { intro: string };

  // interní evidence (NE UI) — co čeká na 16.2
  completeness: { denik: boolean; bestiar: boolean; dodatky: boolean };
}

export const SYSTEM_LANDINGS: SystemLanding[] = [ /* 7 CZ; 3 published */ ];

export const getPublishedLandings = () => SYSTEM_LANDINGS.filter(s => s.published);
export const getLandingBySlug = (slug: string) =>
  SYSTEM_LANDINGS.find(s => s.slug === slug && s.published);
```

⚠️ **`systemId` musí sedět s `RPG_SYSTEMS`** ([systems.ts](../../../src/features/ikaros/pages/CreateWorldPage/constants/systems.ts)). U Dračí Hlídky pozor na drift `draci-hlidka` vs `drdh` (D-NEW-SYS-DIARY-DRIFT) — týká se 2. vlny, ne 3 vlajkových.

---

## 4. Komponenty

```
src/features/ikaros/pages/SystemLanding/
  SystemsHubPage.tsx          // rozcestník /ikaros/systemy (karty published)
  SystemsHubPage.module.css
  SystemLandingPage.tsx       // šablona /ikaros/systemy/:slug
  SystemLandingPage.module.css
  systemLandings.ts           // DATA (§3)
  sections/                   // kompozice z reuse komponent (hero/features/jakZacit/faq/galerie)
```

- **Šablona** renderuje sekce v pořadí: hero (H1 = `heroClaim`) → intro → features → „jak začít" → (denikScreenshot pokud je) → galerie (reuse showcase webp) → FAQ → CTA (Button „Vytvořit svět zdarma" / „Prozkoumat světy"). Optional pilíře (`bestiar`/`dodatky`) mezi galerii a FAQ — **jen když v datech jsou**.
- **Hub** = `SectionTitle` + grid karet (`IkarosCard`), karta = label + heroClaim + odkaz na detail.
- Reuse: `Button`, `IkarosCard`, `CornerOrnament`, `SectionTitle`; galerie obrázků = existující `/images/showcase/*` (žádné nové assety pro kostru).

---

## 4b. Designová rozhodnutí (frontend-design audit, 2026-06-22)

**Koncept:** landing = **iluminovaný list herního kompendia**, ne SaaS marketing. Reuse existující estetiky (temný fantasy glassmorphism, `IkarosCard`, `CornerOrnament`, `--font-display`/`--font-script`, glow) — žádný nový vizuální jazyk. Differentiator = brand Ikara aplikovaný na konverzní stránku (glass + ornamenty + script akcenty), aby příchozí z Google viděl „herní nástroj", ne bootstrap šablonu.

| # | rozhodnutí | proč |
|---|---|---|
| D1 | **Hero asymetrický, ne centrovaný.** Levý sloupec: eyebrow (label v `--font-script`) → H1 `heroClaim` (`--font-display`, `--text-2xl`+) → intro → CTA řádek. Pravý: screenshot deníku v `IkarosCard` rámu s glow. Mobil: stack (text → obrázek → CTA full-width). | Centrovaný hero s tlačítkem uprostřed = generické. Asymetrie + reálný screenshot = „tohle fakt funguje". Reuse vzoru `WelcomeSection` (title/paragraph/ctaRow/signature). |
| D2 | **Features zig-zag** — střídavě text/vizuál (L-R-L), každá ve glass `IkarosCard`. Mobil stack. | 3 stejné sloupce v řadě = bootstrap cliché. Střídání drží oko v pohybu. |
| D3 | **„Jak začít" = timeline ①②③** — číslice v kroužku (accent + glow) + svislá spojnice (gradient accent→transparent). | Reuse vzoru `AnonStartPanel` „Začni tady" (15.7 R7) → konzistence. Vizuální návod, ne formulář. |
| D4 | **Galerie v glass rámu** — reuse `/images/showcase/*.webp`, `object-fit: cover`, pevná výška, 4× `CornerOrnament`. | R1 z 15.7 (nekonzistentní poměry → cover). Žádné nové assety pro kostru. |
| D5 | **FAQ = ornamentální Q&A list** (nativní `<details>` kvůli a11y+SEO, ale stylované: otázka `--font-display`, ornamentální oddělovač). | Accordion „plast" kazí dojem; `<details>` je crawler-friendly (FAQ obsah v DOM i bez JS) → ladí s prerenderem. |
| D6 | **CTA = jeden primární** `Button` „Vytvořit svět zdarma" (v hero + zopakovaný na konci) + sekundární „Prozkoumat světy". Žádné třetí. | 15.7 R6 — jeden cíl = jeden výrazný prvek; opakování ředí konverzi. |
| D7 | **Atmosféra** — reuse skin pozadí (painterly/Matrix rain) + `data-theme-decoration="ember-orbit"`; sekce oddělené negative space + jemný ornamentální divider. Žádné solid pozadí. | Atmosféra a hloubka místo plochého marketingu. |
| D8 | **Hub = mřížka erbů** — každý systém `IkarosCard` (medailon/iniciála + label + `heroClaim` + hover glow). | „Výběr řádu/cechu" — herní pocit místo seznamu odkazů. |

```
┌─ DESKTOP detail ────────────────────────────────────┐   ┌─ MOBIL ──────────┐
│  ⟨ label ⟩ (script)          ╔══ screenshot ══╗      │   │ ⟨ label ⟩         │
│  ◆ HERO CLAIM (display)      ║  deníku v glass ║      │   │ ◆ HERO CLAIM      │
│  intro …                     ║  rámu + glow    ║      │   │ intro …          │
│  [Vytvořit svět] [Světy]     ╚════════════════╝      │   │ ╔ screenshot ╗    │
│ ─────────────── ❖ ───────────────                    │   │ ╚═══════════╝    │
│  ╔ feature ╗  text          text   ╔ feature ╗       │   │ [Vytvořit] full   │
│  ╚════════╝                        ╚════════╝  (zig) │   │ [Světy] full      │
│  ① ── ② ── ③  jak začít (timeline)                   │   │ ❖ feature(stack)  │
│  [galerie showcase v glass rámu]                     │   │ ① ② ③ stack       │
│  ▼ FAQ (details, ornament divider)                   │   │ galerie 1-sloup   │
│  ◆ CTA „Vytvořit svět zdarma"                        │   │ FAQ · CTA         │
└──────────────────────────────────────────────────────┘   └──────────────────┘
```

## 5. SEO

- **`<Seo>`** na obou stránkách (z `src/shared/seo`):
  - Hub: `title="RPG systémy"`, description „Dračí Doupě, DrD II, Jeskyně a Draci… na Ikarovi.", `canonicalPath="/ikaros/systemy"`.
  - Detail: `title=label`, `description=metaDescription`, `canonicalPath="/ikaros/systemy/<slug>"`, `type="website"`.
- **JSON-LD** (rozšířit [jsonLd.tsx](../../../src/shared/seo/jsonLd.tsx) + export v `index.ts`):
  - `faqJsonLd(faq, origin)` → `@type: FAQPage` (mainEntity = Question/acceptedAnswer). Detail stránka.
  - `itemListJsonLd(items, origin)` → `@type: ItemList`. Hub.
  - `breadcrumbJsonLd` (máme) — Domů → RPG systémy → `<label>`. Vizuální `<Breadcrumbs>` + JSON-LD (vzor 15B.2/3).
  - Render jen na `indexable` stránce (published) — gate sdílený s `noindex`.
- **Sitemap** (BE modul `seo`, leak-safe): přidat **statické routy** `/ikaros/systemy` + `/ikaros/systemy/<slug>` per `published`. (Statické veřejné URL — žádný access check.)
- **Prerender** (15B.1): ⚠️ přidat `/ikaros/systemy` do `$is_public` whitelist regex v `default.conf.template` — **jinak bot dostane prázdný SPA shell** a celé SEO úsilí je tiché. (Detail spec-15B.1 §2.)

---

## 6. Obsah 1. vlny (3 vlajkové)

Postaveno **jen na dnes existujícím** — deníkový list per systém ([diary-systems/presets](../../../src/features/world/pages/CharacterDetailPage/diary-systems/presets/)) + generické platform featury (taktická mapa, kalendář, chat za postavu, bestiář-world-scope, mapy, timeline).

| systém | slug | systemId | published |
|---|---|---|---|
| Dračí Doupě 1.6 | `draci-doupe-1-6` | `drd16` | ✅ |
| Dračí Doupě II | `draci-doupe-2` | `drd2` | ✅ |
| Jeskyně a Draci | `jeskyne-a-draci` | `jad` | ✅ |
| Matrix / Ikaros | `ikaros-pravidla` | `matrix` | ☐ (2. vlna) |
| Dračí Doupě Plus | `draci-doupe-plus` | `drd-plus` | ☐ |
| Dračí Hlídka | `draci-hlidka` | `draci-hlidka`/`drdh` | ☐ |
| Příběhy Impéria | `pribehy-imperia` | `pi` | ☐ |

**Draft copy** (heroClaim/intro/features/faq) napíšu jako součást impl., uživatel reviduje (zná systémy). People-first, ne keyword-stuffing.

---

## 7. Responsive (base.md: mobil ≤768, tablet 769–1024, desktop >1024)

- Hub grid: desktop 2–3 sloupce, tablet 2, mobil 1.
- Šablona: sekce plná šířka; features grid desktop 2–3, mobil 1; galerie reuse responsive ze showcase; CTA mobil stack full-width.
- Po implementaci povinně `mobil-desktop`.

---

## 8. Dotčené soubory

- **Nové:** `SystemLanding/{SystemsHubPage,SystemLandingPage}.{tsx,module.css}`, `systemLandings.ts`, `sections/*`, testy.
- **Změna:** `src/app/router.tsx` (2 routy), `src/shared/seo/jsonLd.tsx` (+`faqJsonLd`,`itemListJsonLd`), `src/shared/seo/index.ts` (export), levý panel nav (přidat „RPG systémy" odkaz — k ověření kde), `default.conf.template` (prerender whitelist).
- **BE (Projekt-ikaros):** modul `seo` sitemap generator — přidat statické landing routy.
- **Po implementaci:** `funkce` (nová route/stránka) + `napoveda` (hráč může narazit) + `mobil-desktop`.

---

## 9. Otevřené otázky

1. **Odkaz v levém panelu** — přidat „RPG systémy" do `PRIMARY_NAV` (anon i člen)? Nebo jen z homepage/footeru? (Landing cílí hlavně na příchozí z Google, ne na interní navigaci.)
2. **Slug formát** — pomlčky v číslech (`draci-doupe-1-6`) vs. (`drd-1-6`)? Návrh: plný čitelný název.
3. **FAQ obsah** — kolik otázek per systém (3–5)? Návrh: 4 (co je systém na Ikarovi · jak založit svět · co deník umí · je to zdarma).
4. **CTA cíl** — „Vytvořit svět zdarma" (anon → registrace) je hlavní. Sekundární „Prozkoumat světy" → `/ikaros/vesmiry`. OK?
