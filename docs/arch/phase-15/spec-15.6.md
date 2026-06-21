# Spec 15.6 — Prázdné stavy (empty states) + chybové stavy (error states)

**Stav:** NÁVRH (čeká schválení) · **Fáze:** 15 (H1 Viditelnost) · **Roadmap:** [§15.6](../../roadmap2.md) · **Souvis.:** [project_friendly_messaging] (BE hlášky 403/404), 16.4 onboarding
**Záběr rozšířen oproti roadmapě:** roadmap 15.6 mluví jen o **empty states**. Uživatel (2026-06-21) chce sjednotit i **error states** (403/404/500/crash) pod stejný vizuální jazyk — místo holé „403" ilustrace + vlídný text + tlačítko.

## 0. Princip & terminologie

Dvě různé kategorie, jeden vizuální jazyk:

| | EMPTY state | ERROR state |
|---|---|---|
| Význam | vše OK, **jen není co ukázat** (uživatel nic nevytvořil) | **něco se pokazilo / nemáš právo** |
| Příklad | „Tvá družina tu zatím chybí. [Vytvořit postavu]" | „Sem nevidíš. [Zpět]" |
| Tón | pozvání k akci | omluva + cesta ven |
| Primární CTA | vytvořit / přidat | zpět / zkusit znovu |

„Prázdná bílá obrazovka" z roadmapy = **EMPTY state** (datový), ne chyba.

## 1. Rozhodnutá designová volba (ke schválení)

| # | rozhodnutí | proč |
|---|---|---|
| R1 | **Jedna sdílená primitiva `<StatePlaceholder>`** v `src/shared/ui/StatePlaceholder/`, nad ní dva tenké wrappery `<EmptyState>` a `<ErrorState>` | ~100 míst dnes řeší inline `<div>` ad-hoc. Jedna primitiva = jeden vizuál, jedna údržba. Wrappery jen předvyplní tón/CTA default. |
| R2 | **3 velikosti** (`size`): `hero` (plná stránka, velká ilustrace), `panel` (sekce/tab, malá ilustrace nebo ikona), `inline` (prázdný řádek/list, jen text+ikona, **bez** ilustrace) | Malovaná ilustrace patří na first-dojem (po registraci, prázdný svět). Prázdný řádek tabulky velkou malbu nechce. Velikost rozhoduje, **kolik obrázků** vůbec potřebujeme. |
| R3 | **Ilustrace jen pro `hero` (a volitelně `panel`)** → ~10 obrázků, ne 100 | Viz §3 soupis. Zbytek stavů = `panel`/`inline` s ikonou (lucide/emoji jako dnes). |
| R4 | **Styl B — painterly ilustrace, NADŽÁNROVÁ** (dark fantasy + sci-fi + postapo + současnost), neutrální (NE per-skin), **formát WebP** | Schváleno uživatelem 2026-06-21. Platforma hostí světy více žánrů (`world.system`). Motivy musí být **materiálově neutrální / symbolické archetypy** bez žánrových ornamentů (zámek-na-dveřích ANO, středověká brána NE). Atmosférický painterly styl, temná tlumená paleta = společný jmenovatel všech 4 žánrů. **Dodáno jako JPEG → konvertováno na WebP** (`scripts/convert-states-webp.mjs`, sharp, q80, max 768px, 4,24 MB → 0,28 MB / 93 %). |
| R4b | **Pozadí NENÍ transparentní** (JPEG zdroj) → CSS `mask-image: radial-gradient` vyblednutí okrajů | Ilustrace mají tmavé atmosférické pozadí. Na světlém skinu (`bila`) by byl tvrdý obdélník. Měkká radiální maska splyne s jakýmkoli pozadím bez nutnosti re-exportu transparentního zdroje. |
| R5 | **Error pages se přepíšou na `<ErrorState size="hero">`** (403/404/500/route-error/GlobalErrorBoundary) | Dnes holé inline styly bez theme ([ForbiddenPage], [NotFoundPage], [ErrorPage], [GlobalErrorBoundary]). |
| R6 | **Text 404 musí sedět i na „nemáš přístup"** | BE schválně vrací 404 i pro skrytí existence ([project_friendly_messaging] leak policy). Text: „Nenašli jsme to — možná to neexistuje, nebo sem nevidíš." NE „Stránka byla smazána" (lhal by). |
| R7 | **CTA je volitelné a role-aware** | „Vytvořit postavu" ukázat jen tomu, kdo smí. Hráč bez práva vidí jen text bez tlačítka (dnešní vzor [MapEmptyState] PJ vs hráč). |
| R8 | **Reuse, ne paralelní kopie** — `MapEmptyState`, `EmoteEmptyState`, `SubdocErrorState`, `CharacterDirectory.EmptyState` se přepíšou na novou primitivu | Jinak 5. kopie (past jako [project_link_picker_shared]). `MapEmptyState` si nechá svou logiku (scény/assign), ale vizuál vezme z primitivy. |

## 2. API komponenty

```tsx
// src/shared/ui/StatePlaceholder/StatePlaceholder.tsx
interface StatePlaceholderProps {
  variant: 'empty' | 'error';        // tón + default ilustrace
  size?: 'hero' | 'panel' | 'inline'; // default 'panel'
  illustration?: StateIllustration;   // klíč do registru (§3); default dle variant+kontext
  icon?: ReactNode;                    // pro panel/inline bez ilustrace (lucide ikona)
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; to?: string }; // primární CTA
  secondaryAction?: { label: string; onClick?: () => void; to?: string };
  children?: ReactNode;                // extra obsah (MapEmptyState list scén, profilové karty…)
}
```

- `<EmptyState>` = `<StatePlaceholder variant="empty">` (default ilustrace „prázdno", tón pozvání)
- `<ErrorState>` = `<StatePlaceholder variant="error">` (+ `status?: 403|404|500`, default CTA „Zpět" / „Zkusit znovu", `onRetry`)
- Accessibility: `role="status"` (empty) / `role="alert"` (error), `aria-live`. Ilustrace `alt=""` (dekorativní, význam nese text).
- Themed: jen theme tokeny ([project_overlay_rgb_tokens]), žádné hardcoded barvy ([feedback_no_prettier] formátování eslint).

## 3. Ilustrace — sada (styl B, ~10 PNG)

Uloženo: `public/illustrations/states/<klíč>.webp` (vzor `public/textures/`, `public/icons/`). Registr klíčů ve FE: `stateIllustrations.ts`. **11 souborů dodáno a hotovo** (viz README v té složce).

### EMPTY (hero, first-dojem) — nadžánrové archetypy:
| klíč | použití | motiv (nadžánrový) |
|---|---|---|
| `characters` | adresář postav, profil „moje postavy", mapa (hráč bez postavy) | prázdný kruh sedadel kolem zářícího středu (nikdo nesedí) |
| `pages` | stránky/wiki světa prázdné | otevřená prázdná kniha/kodex, prázdné stránky, náznak nezapsaných řádků |
| `worlds` | žádné světy (vitrína, profil „moje světy") | osamělá prázdná planeta/koule v prázdnu s náznakem orbity |
| `gallery` | galerie/obrázky prázdné (ikaros + world) | řada prázdných rámů na tmavé zdi |
| `events` | akce/kalendář prázdné | prázdná mřížka kalendáře se zářícím okrajem / přesýpací hodiny |
| `messages` | mail, chat, diskuze prázdné | prázdné bubliny zpráv nad prázdnou nástěnkou |
| `generic-empty` | fallback pro panel-level bez vlastní ilustrace | jeden prostý prázdný otevřený kontejner, slabá záře zevnitř |

### ERROR (hero) — nadžánrové archetypy:
| klíč | použití | motiv (nadžánrový) |
|---|---|---|
| `forbidden` (403) | nemáš přístup | masivní zavřené dveře s těžkým zářícím zámkem a řetězy |
| `notfound` (404) | nenalezeno | stopy mizící do mlhy a končící v prázdnu / prázdný sokl |
| `crash` (500 + ErrorBoundary) | appka spadla | roztříštěný krystal/panel, úlomky a jiskry, dramatické ale ne brutální |
| `load-error` | „nepodařilo se načíst" + retry | přervaný most / přetržené zářící spojení, dva konce se nesetkávají |

Σ = **7 empty + 4 error = 11 obrázků**. Prompty viz §7.

## 4. Soupis nasazení (z kódem-ověřené rešerše, ~100 míst)

Plný soupis: viz rešerše v konverzaci. Nasazení po **kompletních sub-krocích** ([feedback_no_debt] — žádné nedodělky):

- **Sub-krok A (jádro + hero) — ✅ HOTOVO 2026-06-21:** primitiva + 11 WebP ilustrací + 4 error pages/boundary (403/404/ErrorPage/GlobalErrorBoundary) + **5 hero empty** (postavy [CharacterDirectory], stránky [PagesListPage], světy [WorldsPage], galerie [GalleryPage ×2], akce [EventsList]). Build ✓, tsc -b ✓, vitest 38/38 (8 nových + 30 dotčených opravených). Komponenta `src/shared/ui/StatePlaceholder/`.
  - **Mapa-reuse PŘESUNUTA** do samostatného kroku (NE tiché vynechání): `MapEmptyState` má 8 testů na konkrétní texty/emoji + CTA s loading stavem (`mutation.isPending`) + children (list scén, karty postav hráče) → refactor na primitivu je delikátní. **Mapa už je plnohodnotný empty stav** (není „bílá obrazovka"), takže jde o kosmetické vizuální sjednocení, ne o díru. Řešit zvlášť, opatrně.
- **Sub-krok B (panel/ikaros) — ✅ HOTOVO 2026-06-21:** ikaros (články, diskuze, oblíbené, novinky, akce, mail, dashboard sekce) + profil (postavy/přátelé/světy/akce) + notifikace (events/chat/pending). Empty→`EmptyState`, error→`ErrorState onRetry`. Nasazeno přes paralelní agenty.
- **Sub-krok C (world panel/inline) — ✅ HOTOVO 2026-06-21:** finance, inventář, počasí, skupiny, vesmír (panel, ne tisk), galerie layout + admin (uživatelé/audit/smazané světy) + sjednocení `EmoteEmptyState`/`SubdocErrorState` na primitivu (zachované API) + mapa: emoji→sdílená ilustrace (NE plný přepis — overlay komponenta, viz deník).

**Σ ověřeno:** `tsc -b` ✓, `vitest` 757 dotčených ✓ (4 drifty opraveny), `npm run build` ✓. **Zbývá:** `mobil-desktop`, `funkce`, `napoveda`, git.

## 5. Dotčené soubory (jádro)
- **Nové:** `src/shared/ui/StatePlaceholder/{StatePlaceholder,EmptyState,ErrorState}.tsx` + `.module.css` + `stateIllustrations.ts` + `StatePlaceholder.spec.tsx`
- **Přepis:** `src/pages/errors/{ForbiddenPage,NotFoundPage,ErrorPage}.tsx`, `src/shared/ui/GlobalErrorBoundary.tsx`
- **Reuse-migrace:** `MapEmptyState.tsx`, `chat/emotes/.../EmoteEmptyState.tsx`, `CharacterDetailPage/.../SubdocErrorState.tsx`, `CharactersPage/CharacterDirectory.tsx`
- **Assety:** `public/illustrations/states/*.png`

## 6. Otevřené otázky
1. ~~Per-skin vs neutrální~~ → neutrální (R4).
2. ~~Styl~~ → B malovaná fantasy.
3. Generovat ilustrace AI (Chrome/externí) a kdo? → uživatel dodá PNG dle promptů §7, nebo schválí gen pipeline.
4. Loading stavy (~15 míst) — sjednotit taky? Návrh: **mimo záběr 15.6** (jiná primitiva `<Spinner>` už je); jen kde loading→error přechod.

## 7. Příloha — prompty na ilustrace (styl B)

Společný styl (NADŽÁNROVÝ — vlož do každého promptu): *„Atmospheric semi-realistic digital painting, painterly brushwork with visible texture, dark and moody muted desaturated palette, dramatic volumetric lighting with a soft inner glow, timeless genre-neutral design that reads equally as dark fantasy, sci-fi, post-apocalyptic or modern, minimal era-specific ornamentation, single centered symbolic subject, minimal empty background, transparent background, no text, no logos, no faces, 1:1 square."*

| klíč | prompt (subjekt) |
|---|---|
| characters | An empty circle of simple identical seats around a glowing point of light in the center, no people, waiting to be filled, sense of a gathering not yet begun. |
| pages | An open blank book floating, empty pages with faint glowing unwritten lines, a few loose blank sheets drifting around it. |
| worlds | A single lone empty planet/sphere floating in dark empty void, faint thin orbital ring around it, vast emptiness surrounding it. |
| gallery | A row of empty rectangular frames of varying sizes mounted on a dark wall, nothing inside them, soft directional light. |
| events | An empty grid of calendar cells glowing faintly at the edges, no marks or dates on it, floating in dark space; optional hourglass beside it. |
| messages | A few empty rounded message bubbles floating above an empty board with empty pinned slots, soft glow, nothing written. |
| generic-empty | A single simple empty open container with its lid ajar, nothing inside, a faint soft glow coming from within. |
| forbidden | A massive closed door blocking the way, a heavy glowing lock and chains across it, dramatic light leaking from behind, imposing but not aggressive. |
| notfound | Faint footprints or a thin trail fading into drifting fog and ending at nothing, an empty pedestal nearby, lonely empty space. |
| crash | A shattered geometric crystal/panel breaking apart mid-air, fragments and faint sparks drifting outward, dramatic but not gory. |
| load-error | A broken bridge with its middle section missing over a misty void, OR a snapped glowing cable, the two ends not reaching each other, hopeful soft light. |
