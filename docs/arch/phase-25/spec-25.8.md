# Spec 25.8 — Ohraničení systémových slibů (skrytí landing pages do licencí)

**Stav:** schváleno uživatelem 2026-07-19 („ok skryj") · implementováno
**Karta:** roadmap3 fáze 25, karta 25.8 · **Zdroj:** Konkurenční rešerše 2026-07-19 („kritická komunikační kolize")

## Problém

Veřejné (anon) plochy slibují hraní konkrétních licencovaných systémů — **Dračí Doupě 1.6, Dračí Doupě II, Jeskyně a Draci** — zatímco mantinel projektu říká „licence čekají na držitele práv, systémy neřešíme". Veřejný slib bez licence = riziko (rešerše: pravděpodobnost 60 % × dopad 85 %).

## Rozhodnutí

**Skrýt** (volba uživatele; varianta „generická stránka" zamítnuta jako zbytečná — generický systém je popsán v nápovědě a při tvorbě světa). Dle rešerše: *kód a obsah zůstává, jen se nevystavuje veřejný claim* — vše za jedním flagem, po licencích se flipne zpět.

- **Flag:** `SYSTEM_LANDINGS_PUBLIC = false` v novém `src/features/ikaros/pages/SystemLanding/flag.ts` (samostatný tiny modul — router ho importuje bez zatažení datového registru do main bundle).
- **In-app funkčnost se NEMĚNÍ:** výběr systému při zakládání světa, deníky, mapy — vše zůstává (za loginem, není to veřejný marketingový slib).

## Zásahy

| # | Soubor | Změna |
|---|---|---|
| 1 | FE `SystemLanding/flag.ts` **(nový)** | flag + návod na zpětné zapnutí (3 kroky) |
| 2 | FE `SystemLanding/systemLandings.ts` | `getPublishedLandings`/`getLandingBySlug` respektují flag |
| 3 | FE `app/router.tsx` | routes `ikaros/systemy(+/:slug)` → při vypnutém flagu `<Navigate to="/" replace>` (stránky byly živé/indexované — redirect je čistší než 404) |
| 4 | FE `IkarosLayout.tsx` | nav položka „RPG systémy" jen při flagu |
| 5 | FE `HelpPage/PlatformSection.tsx` | blok „RPG systémy" (jmenuje DrD/JaD + odkaz) jen při flagu |
| 6 | FE `DashboardPage.tsx` | meta description bez „Dračí Doupě, D&D" |
| 7 | FE `default.conf.template` | prerender map řádek `/ikaros/systemy` zakomentován |
| 8 | BE `modules/seo/seo.service.ts` | 4 STATIC_ROUTES záznamy odstraněny (komentář s pointerem sem) |
| 9 | FE `systemLandings.spec.ts` | testy flag-aware (integrita registru testována přímo nad `SYSTEM_LANDINGS`) |

## Co se vědomě NEskrývá

- **TermsPage** „(např. Matrix, Dračí Doupě, Dungeons & Dragons…)" — popisný právní text (nominativní užití), rozhodne advokát při revizi Podmínek (karta 31.1).
- **Nápověda WorldSection/FaqSection** zmínky systémů — dokumentace reálné in-app funkce pro přihlášené, ne marketingový slib. Kdyby držitelé práv chtěli víc, řeší se to spolu s flagem.
- Interní registry (`RPG_SYSTEMS`, diary presety, šablony) — funkčnost.

## Zpětné zapnutí (po licencích — Etapa IV)

1. `flag.ts` → `true` · 2. BE `seo.service.ts` vrátit 4 záznamy · 3. `default.conf.template` odkomentovat prerender řádek. Poté FE+BE deploy, ověřit sitemapu a Rich Results.

## SEO dopad

Stránky byly veřejně živé → redirect na `/` + odstranění ze sitemap/prerenderu ⇒ Google je postupně vyřadí. Vědomé (slib > pár indexovaných stránek).
