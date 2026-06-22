# Spec 15.7 — Anonymní úvodní stránka (role-based homepage, fáze 1)

**Stav:** NÁVRH (čeká schválení) · **Fáze:** 15 (H1 Viditelnost) · **Roadmap:** [§15.7](../../roadmap2.md) · **Souvis.:** 15.6 prázdné/chybové stavy (sdílený vizuál), 16.4 onboarding, 17.3 vitrína (budoucí featured světy)

**Záběr ZÚŽEN oproti roadmapě:** roadmap 15.7 navrhuje velký 4‑persona rozcestník + 4 landing podstránky + featured světy (závisí na 17.3). Uživatel (2026‑06‑21/22) explicitně **nechce přestavbu** — současný přihlášený dashboard mu vyhovuje. Tato spec řeší **jen anonymní (nepřihlášený) pohled** jako aditivní vrstvu. Přihlášený dashboard se **nemění ani o pixel**.

## 0. Princip & rozsah

- **Vše jen pro anonima** (`!isAuthenticated`). Přihlášený vidí dnešní dashboard beze změny.
- **Aditivní, ne přestavba** — žádný nový skin, žádný nový vizuální jazyk. Vše ladí s `IkarosCard` / `Button` / theme tokeny / rohovými ornamenty.
- **Čtyři nezávislé kusy** (lze nasadit i postupně, ale cílíme jeden zátah — [feedback_no_debt]):
  1. Skrytí slepých odkazů v levém panelu pro anonima.
  2. Showcase banner (rotující, 5 reálných screenshotů) nad hero kartou.
  3. CTA tlačítka v hero kartě.
  4. Pravý panel „Začni tady" pro anonima (dnes anon pravý panel nemá).
- **Hospoda‑anon (chat pro nepřihlášené) NENÍ součástí** — samostatný roadmap bod (BE+WS+moderace). Zde Hospoda v menu zůstává viditelná (zatím vede na login).

## 1. Rozhodnuté designové volby (frontend‑design audit)

Estetický směr existující appky = **temný fantasy glassmorphism**: průsvitné karty, rohové SVG ornamenty, jemná záře (glow), `--font-display` na titulcích a `--font-script` na akcentech, painterly pozadí skinu. Tři nové prvky musí vypadat, že **patří do téhle vitráže** — ne jako bootstrap landing. Refined, ne maximalist.

| # | rozhodnutí | proč |
|---|---|---|
| R1 | **Showcase = kartová estetika, ne holý obrázek.** Banner obalit do stejného glass rámu jako `IkarosCard` (4× `CornerOrnament`, `radius-md`, `data-frame-panel`). Obrázek `object-fit: cover`, pevná výška. | Nekonzistentní poměry zdrojů (1,77–2,40:1) → cover ořízne okraje, výška se nemění. Rám sjednotí obrázek s okolím. |
| R2 | **Rotace:** auto á 5 s, **crossfade** (ne tvrdý cut), dolní **tečky** (klik = skok) + boční šipky. **Pauza při hoveru.** **`prefers-reduced-motion` → vypne autorotaci** (ovládání zůstane ruční). Volitelný jemný Ken‑Burns zoom (1.0→1.04). | Filmovost bez rušení. Přístupnost (reduced‑motion) povinná. |
| R3 | **Caption (popisek) dole vlevo** přes spodní gradient (transparent→tmavá) pro čitelnost; text `--font-display` + glow. Eyebrow „Co tě čeká" nad popiskem. | Vzor čitelnosti přes obrázek jako 15.6 mask‑trik, jen spodní gradient. |
| R4 | **CTA = reuse `<Button>`** — primary „Vytvořit svět zdarma" (size `lg`, ikona Sparkles) + secondary „Prozkoumat světy" (size `lg`, ikona Compass). Žádná nová tlačítková komponenta. | [project_link_picker_shared] past — nevyrábět paralelní kopii. |
| R5 | **CTA umístění:** v hero kartě, řádek **pod textem, nad podpisem.** Na mobilu pod sebe, full‑width. | Podpis „Příjemnou zábavu…" = brand, zůstává. CTA je hlavní akce. |
| R6 | **Registrace na stránce jen 1× výrazně** = hero primary CTA. Header „Registrace" zůstává (sekundární). Žádné třetí registrační tlačítko (rozhodnuto 2026‑06‑21). | Jeden primární cíl = jeden výrazný prvek; opakování ředí konverzi. |
| R7 | **Panel „Začni tady" = timeline 3 kroků.** Číslice ①②③ v kroužku (accent + glow), svislá spojnice (gradient accent→transparent) evokuje cestu. Krok ① „Zaregistruj se" je **klikací** (→ registrace), ②③ statické. Žádné tlačítko pod tím. | Vizuální návod, ne formulář. Konzistentní s panelovým jazykem (SectionTitle, ornamenty). |
| R8 | **Anon pravý panel se zapne** (`showRightPanel` rozšířit o anon větev), obsah = `AnonStartPanel` místo Administrace/Moje světy/Oblíbené. Na mobilu sbalený do draweru jako dnes. | Vyplní dnešní prázdný prostor; konzistentní se strukturou layoutu. |

## 2. Komponenty & API

### Nové
```
src/features/ikaros/pages/DashboardPage/sections/
  ShowcaseSection.tsx          // rotující banner (anon-only render řeší DashboardPage)
  ShowcaseSection.module.css
  showcaseSlides.ts            // DATA: [{ slug, src, caption }]  ← přidání obrázku = 1 řádek
src/app/layout/IkarosLayout/
  AnonStartPanel.tsx           // pravý panel „Začni tady" pro anonima
  AnonStartPanel.module.css
```

`showcaseSlides.ts` (data‑driven — naplní budoucí přidávání obrázků bez zásahu do kódu):
```ts
export interface ShowcaseSlide { slug: string; src: string; caption: string; }
export const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  { slug: 'uvod-sveta',    src: '/images/showcase/showcase_uvod_sveta.webp',    caption: 'Vybuduj vlastní svět' },
  { slug: 'vzhled-postav', src: '/images/showcase/showcase_vzhled_postav.webp', caption: 'Vytvoř si vlastní postavu' },
  { slug: 'takticka-mapa', src: '/images/showcase/showcase_takticka_mapa.webp', caption: 'Veď bitvy na taktické mapě' },
  { slug: 'denik-postavy', src: '/images/showcase/showcase_denik_postavy.webp', caption: 'Veď deník svých hrdinů' },
  { slug: 'chat',          src: '/images/showcase/showcase_chat.webp',          caption: 'Hraj příběh s komunitou' },
];
```
- Přístupnost: banner `role="region" aria-roledescription="carousel"`, tečky jako `<button>` s `aria-label`, autorotace přes `setInterval` clear při unmount/hover, `prefers-reduced-motion` media query vypne interval.

### Změněné
- `WelcomeSection.tsx` — přidat anon‑only CTA řádek (čte `isAuthenticatedAtom`); primary otevře `registerModalOpenAtom`, secondary `<Link to="/ikaros/vesmiry">`.
- `DashboardPage.tsx` — `{!isAuthenticated && <ShowcaseSection />}` nad `<WelcomeSection />`.
- `IkarosLayout.tsx` — (a) `PRIMARY_NAV` / `CHAT_ROOMS` filtr dle `isAuthenticated`; (b) `showRightPanel` anon větev → `AnonStartPanel`.

## 3. Anon gating levého panelu (kus 1)

| položka | anon | důvod |
|---|---|---|
| Úvodník, Nápověda, Články, Galerie | **zobrazit** | anon má čtecí přístup (BE OptionalJwt) |
| Vesmíry (veřejné světy) | **zobrazit** | veřejné světy anon vidí |
| **Hospoda** | **zobrazit** | budoucí anon‑chat; zatím klik→login |
| Vytvořit svět | **skrýt** | vede jen na login → přesunuto do hero CTA (R4) |
| Diskuze | **skrýt** | celý modul pod JwtAuthGuard (anon nevidí nic) |
| Rozcestí I–III | **skrýt** | login‑only roleplay |

Implementace: `PRIMARY_NAV.filter` + `CHAT_ROOMS.filter` podle `isAuthenticated` (ne nové pole — jen příznak `anonHidden` na položce nebo filtr v `SidebarContent`).

## 4. Obrázky — příprava (blokující kus 2)

5 zdrojů dodáno do `public/images/showcase/`, ale **nutná úprava** (neopravovat tiše — dohodnuto):
1. **Názvy s mezerami/diakritikou/velkými písmeny** → přejmenovat na slug (`showcase_<slug>.webp`).
2. **Formát .png, 0,5–1,4 MB** → konvertovat na **WebP** + komprese (cíl < 400 KB/ks). Reuse přístup z 15.6 (`scripts/convert-states-webp.mjs`, sharp q80) → nový `scripts/convert-showcase-webp.mjs` nebo rozšířit.
3. **Poměry 1,77–2,40:1** → CSS `object-fit: cover` + pevná výška řeší (R1).

Mapování zdroj → cíl:
| zdroj (.png) | cíl (.webp) | caption |
|---|---|---|
| `úvod světa` | `showcase_uvod_sveta` | Vybuduj vlastní svět |
| `Vzhled postav` | `showcase_vzhled_postav` | Vytvoř si vlastní postavu |
| `taktická mapa` | `showcase_takticka_mapa` | Veď bitvy na taktické mapě |
| `Deník postavy` | `showcase_denik_postavy` | Veď deník svých hrdinů |
| `Chatovací hra` | `showcase_chat` | Hraj příběh s komunitou |

## 5. Responsive (base.md: mobil ≤768, tablet 769–1024, desktop >1024)

- **Showcase:** desktop plná šířka main, výška ~320–360 px. Mobil výška ~180–220 px, caption menší, šípky skryté (jen tečky + swipe volitelně).
- **CTA:** desktop vedle sebe; mobil stack, full‑width.
- **Pravý panel „Začni tady":** desktop sloupec; mobil v pravém draweru (ikona Sparkles v headeru — už existuje pro přihlášené, rozšířit na anon).
- Po implementaci povinně `mobil-desktop`.

## 6. Dotčené soubory (souhrn)
- **Nové:** `ShowcaseSection.{tsx,module.css}`, `showcaseSlides.ts`, `AnonStartPanel.{tsx,module.css}`, `scripts/convert-showcase-webp.mjs`
- **Změna:** `DashboardPage.tsx`, `WelcomeSection.tsx` (+ `.module.css`), `IkarosLayout.tsx` (nav filtr + showRightPanel + mobil drawer gating)
- **Assety:** `public/images/showcase/showcase_*.webp` (5×)
- **Testy:** ShowcaseSection (rotace/tečky/reduced‑motion), WelcomeSection (CTA jen anon), IkarosLayout (skryté odkazy anon vs člen)

## 7. Otevřené otázky
1. **Texty captionů a CTA** — návrh v §2/§4; uživatel potvrdí/upraví.
2. **Pořadí slidů** — navrženo: svět → postava → bitva → deník → chat. Lze přeskládat (jen pořadí v `showcaseSlides.ts`).
3. **Ken‑Burns zoom** — zapnout jemný (R2), nebo statické snímky? Default: zapnout jemně.
4. **Featured světy** (sociální důkaz z roadmapy) — odloženo na 17.3 vitrínu, mimo tuto spec.
