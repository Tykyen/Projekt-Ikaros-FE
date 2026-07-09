# Spec 20A — Legal statické stránky + patička (Příloha C)

> Fáze A ze série 20.1–20.3 (Příloha C = právně-ochranné featury). Sdílená
> páteř B/C/D navazuje. Zdroj pravdy pro obsah: `docs/pravni-ramec/` +
> `docs/provozni-ramec/` (build-HTML). Rozhodnutí uživatele viz konec.

## Cíl

Doplnit chybějící veřejné legal stránky a zviditelnit je jednotnou patičkou:

1. **`/soukromi`** — Zásady ochrany osobních údajů (GDPR čl. 13, informace, NE souhlas). — 20.2
2. **`/kodex`** — Pravidla komunity (7 hodnot + zákazy z provozního rámce). — 20.1
3. **`/kontakt`** — kontaktní místo (DSA čl. 11 orgány / čl. 12 uživatelé). — 20.1
4. **Sdílená patička** s legal odkazy (dnes žádná neexistuje).

## Rozsah — co Fáze A NEŘEŠÍ (jde do B/C/D)

- Funkční nahlašování (`ReportButton`, report queue, M0–M7) → **Fáze B**.
- Věkový záchyt při registraci, minor safe-defaults, data-export FE tlačítko → **Fáze C**.
- Upload consent, AI badge, license model → **Fáze D**.
- Fáze A je **čistě statický obsah + navigace**. Žádná změna BE, žádný nový stav.

## Rozhodnutí (locked, od uživatele)

| # | Rozhodnutí |
|---|---|
| R1 | Správce = **spolek**. Konkrétní název/IČO/sídlo/e-mail zatím nejsou → v textu `[DOPLNIT: …]` placeholder + dluh. Blokuje veřejné spuštění, ne implementaci stránky. |
| R2 | `/soukromi` = **samostatná stránka**, ne sekce v `/podminky` (provozní rámec kap. 10 chce oddělené dokumenty). |
| R3 | Nezletilí: platforma cílí **i na <15**; rodičovský souhlas řeší právník. Zásady OÚ jen popíšou bezpečný default nezletilého + rodičovský souhlas — bez app logiky (ta je Fáze C). |
| R4 | Provozní e-mail (`[DOPLNIT]`) = DSA čl. 11/12 kontakt (SMTP už propojený). In-app nahlašování bude Fáze B; v A jen kontaktní stránka. |
| R5 | Patička: uvnitř `<main>` za `<Outlet/>`, gated `!isChat && !isAdmin` (stejně jako pravý panel) → v chat/admin focus módu se nezobrazí. |

## Architektura

### Routy (`src/app/router.tsx`, sourozenci `podminky` řádek 192, veřejné)
```
{ path: 'soukromi', element: p(PrivacyPage) },
{ path: 'kodex',    element: p(CodeOfConductPage) },
{ path: 'kontakt',  element: p(ContactPage) },
```
Lazy importy vedle `TermsPage` (řádek 51).

### Komponenty
| Soubor | Popis |
|---|---|
| `src/features/ikaros/pages/PrivacyPage.tsx` (+ `.module.css`) | Zásady OÚ. Vzor = `TermsPage.tsx` (statická `<article>` + `Seo`). |
| `src/features/ikaros/pages/CodeOfConductPage.tsx` (+ css) | Pravidla komunity. |
| `src/features/ikaros/pages/ContactPage.tsx` (+ css) | Kontakt. |
| `src/shared/ui/SiteFooter/SiteFooter.tsx` (+ css) | Sdílená patička. |

CSS moduly znovupoužijí vzhled `TermsPage.module.css` (třídy `.page/.lead/.placeholder/.footer`) — buď `composes`, nebo sdílený `legalPage.module.css`. Vizuál = utilitární legal stránka, žádný per-skin ornament (drží se přes `[data-theme]` tokeny, ne globální edity).

### Patička (`SiteFooter`)
- Odkazy: **Podmínky** (`/podminky`) · **Zásady ochrany OÚ** (`/soukromi`) · **Pravidla komunity** (`/kodex`) · **Kontakt** (`/kontakt`) · **Nápověda** (`/ikaros/napoveda`).
- Řádek: `© {rok} Projekt Ikaros` + verze podmínek (dnes `1.0`).
- Renderuje se v `IkarosLayout.tsx` uvnitř `<main>` za `<Outlet/>`, podmínka `showRightPanel` (= `!isChat && !isAdmin`).
- ⚠️ `rok` NESMÍ přijít z `new Date()` v build-time snapshotu — použít runtime `new Date().getFullYear()` v komponentě (klient), OK v React render.

### Obsah stránek
Vytažen z rámce (agentem) — viz `docs/provozni-ramec/build/`:
- **Kodex**: `70-kodex-hodnoty.html` (7 hodnot + zákazy + krátká veřejná verze).
- **Zásady OÚ**: `21-gdpr-zaklady.html` (účel×právní základ), `20-gdpr-mapa.html` (kategorie údajů), `23-zpracovatele-transfer.html` (zpracovatelé + třetí země), `22-prava-export.html` (práva subjektu), `80a-podminky-spolek.html` (identita spolku).
- **Kontakt**: `31-notice-action.html` (co uvést pro čl. 11/12).

Každá stránka nese hlavičku „ⓘ pracovní verze (beta)" jako `TermsPage` a placeholder `[DOPLNIT: …]` u chybějící identity spolku.

### Napojení / odkazy
- `TermsPage.tsx` §6 + §11: dnes „Samostatné Zásady OÚ doplníme" → přepsat na odkaz na `/soukromi`; kontakt → odkaz na `/kontakt`.
- Registrace (`RegisterModal`): vedle odkazu na Podmínky doplnit „beru na vědomí Zásady OÚ" (`/soukromi`). (Plné rozdělení souhlasu = Fáze C; v A jen odkaz.)
- Patička = primární zviditelnění.

## Mobil / desktop
- Stránky = plynulý text v `<article>` s `max-width` (jako TermsPage) → responsivní bez extra práce.
- Patička: flex-wrap odkazů, na mobilu do sloupce / zalomení; ověřit `mobil-desktop` po implementaci.

## Ověření (Fáze 2/3)
- `npm run build` (tsc -b) bez chyb.
- Ruční průchod `/soukromi`, `/kodex`, `/kontakt`, patička na content stránce vs. skrytá v `/chat` a `/admin/chat`.
- `mobil-desktop` po grafické části.
- `funkce` (nové routy + kontaktní/nahlašovací kontext) + `napoveda` (hráč: kde najde pravidla/soukromí/kontakt).
- Zaškrtnout dílčí část 20.1/20.2 v `docs/roadmap-fe.md` (jen legal stránky, ne celý bod).

## [DOPLNIT] — blokuje veřejné spuštění, ne implementaci
- Identita správce (spolek): název, IČO, sídlo, kontaktní e-mail.
- Potvrzení konkrétních zpracovatelů (hosting, SMTP, push, Cloudinary, Turnstile, MeiliSearch) do seznamu v Zásadách.
→ zapsat jako dluh.
