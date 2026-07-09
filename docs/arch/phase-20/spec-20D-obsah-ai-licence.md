# Spec 20D — 20.3 Obsah & autorská práva (upload consent, AI badge, license model)

> Fáze D ze série 20.1–20.3. AI generování (Fáze 18) a komunitní knihovna
> s klonováním (21.5) NEEXISTUJÍ — proto strojové značení AI, vodoznaky a
> licenční gating nemají co ovládat. Budujeme actionable minimum + **datový
> podklad licenční karty**, který se později jen napojí.

## Rozhodnutí (locked, od uživatele)
| # | Rozhodnutí |
|---|---|
| R1 | Plný rozsah „co bude potřeba", ale **license model teď jako PODKLAD** (napojení na knihovnu 21.5 / AI 18 později). „Na licencích pracujeme, vytvoř podklady, ať jen napojíme." |
| R2 | AI označení = **dobrovolný self-declare** („tohle je AI obrázek") u uploadu → badge. Strojové značení (AI Act čl. 50(2)) až s Fází 18. |
| R3 | Takedown / copyright = **přes systém z Fáze B** (kategorie `copyright`), NE druhý formulář. → zajištěno v B2/B5 (ReportButton na galerii). |
| R4 | Důkaz souhlasu při uploadu = **samostatný audit log** (ne na entitě). |
| R5 | „Společná tvorba" (`SpolecnaTvorba/tiles.ts`) = základ budoucí knihovny. |

## Sub-kroky (každý kompletní)

### D1 — upload consent + self-declare AI (galerie)
- **FE (`GalleryUploadPage.tsx`):** před odesláním povinný checkbox prohlášení o právech: „Mám práva k obsahu / neobsahuje cizí chráněný materiál bez licence." + volitelný checkbox „Tento obrázek je vytvořený AI." Bez zaškrtnutí prohlášení nelze nahrát.
- **BE (`ikaros-gallery` schema):** přidat `aiOrigin?: 'none'|'ai_image'` (rozšiřitelný enum; default none) + zaznamenat consent do audit logu (D3). `aiOrigin` je first-class pole čitelné FE.

### D2 — AI badge
- **FE:** komponenta `AiBadge` (`src/shared/media/AiBadge.tsx`) — malý štítek „AI" s tooltipem „Vytvořeno pomocí AI (uvedl autor)". Zobrazit u galerie-detailu, thumbnailu a kdekoli se renderuje obrázek s `aiOrigin!=='none'`.
- Štítek putuje i do exportu/sdílení (kde relevantní).

### D3 — consent audit log (samostatný)
- **BE modul/kolekce `upload_consents`** (nebo pod `moderation`/nový): `{ userId, targetType, targetId?, action:'upload', rightsDeclared:true, aiDeclared:bool, termsVersion, ip?, createdAtUtc }`.
- Zapisuje se při každém uploadu s consentem (galerie teď; avatary/page images později stejným vzorem).
- Slouží jako doklad „uživatel prohlásil práva" (obrana proti nároku).

### D4 — license card model (PODKLAD, nenapojený)
- **BE schéma `content-license.schema.ts`** (nová kolekce `content_licenses`) — 17 polí dle právního rámce `30-licencni-karta` / `41-licencni-karta`:
  `contentId, versionId, ownerUserId, publicAuthorName, licenseMode('private'|'read'|'clone'|'remix'|'open'|'official'|'withdrawn'|'disputed'), cloneAllowed, derivativesAllowed, exportAllowed, aiOrigin(enum A0–A6), thirdPartyStatus, rpgSystemId?, attributionRequired, sourceUrlOrNote?, reviewStatus, acceptedTermsVersion, parentContentId?`.
- **Změna režimu = nová `versionId`** (ne tichý přepis) — navrhnout repo tak, aby verzoval.
- ⚠️ V D se model jen VYTVOŘÍ + základní repo/CRUD; **nenapojuje se** na galerii/knihovnu (to je 21.5). Žádné UI „klonovat" (nemá co gatovat). Cíl: až 21.5 přijde, jen se karta vytvoří per položka.

## Odloženo (vědomě, dokud Fáze 18 / 21.5 neexistují)
- Strojové značení AI (metadata/vodoznak, čl. 50(2)) — grace do 2.12.2026, ale bez AI generátoru bezpředmětné.
- Interakční hláška „řídí AI" (čl. 50(1)) — žádný AI chat/asistent.
- Deepfake filtry, NCII/CSAM automod, opt-in AI trénink, DPA/SCC u LLM — Fáze 18.
- Napojení license card na klonování/genealogii — 21.5.
→ zapsat souhrnně jako odložený dluh (ne otevřený, „až Fáze 18/21.5").

## Ověření
- FE tsc + ruční: upload bez prohlášení blokovaný; AI checkbox → badge; export JSON.
- BE typecheck + restart (nová pole/kolekce).
- `funkce` (upload consent, AI označení, license model podklad) + `napoveda` (autor: jak označit AI, co znamená prohlášení práv) — závěrečný průchod.
- `mobil-desktop` na upload formuláři + badge.
