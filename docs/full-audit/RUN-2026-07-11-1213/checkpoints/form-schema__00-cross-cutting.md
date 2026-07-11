# Checkpoint — form-schema / oblast 00-cross-cutting

> RUN-2026-07-11-1213 · styl **form-schema** (registr `docs/form-schema-audit.md`, prefix `F-`)
> Oblast: `docs/form-schema-plan/00-cross-cutting.md` — globální mechanismy (ValidationPipe,
> export-schemas pipeline, sanitizace, optimistic lock, 3 FE validační styly).
> READ-ONLY. Hloubka L1-L3 (statické čtení BE main.ts + DTO + Mongoose + service + FE↔BE JSON sync).
> Metoda: re-verifikace všech kontrolních bodů XC-01…XC-08 proti HEAD (poslední sweep 2026-06-05,
> F-RUN-01 doc-fix 2026-06-20). Cíl: drží global mechanismy dál? Přibyly nesanitizované write-paths?

---

## VERDIKT

**Bez nových 🔴/🟠. Všech 8 kontrolních bodů (XC-01…XC-08) na HEAD DRŽÍ.** Od sweepu 2026-06-05 se
navíc **uzavřely tři dřívější nálezy** (F-02 timeline XSS, F-10/K-F9 ikaros-news, F-25 BE komentář).
Jediné akční reziduum = **♻️ F-25 FE polovina** (stale komentář v `registry.ts:10`) + **♻️ line-drift
v plánu** (číselné odkazy XC-01/02/04 posunuté). Žádná ztráta dat, žádná migrace.

---

## Re-verifikace kontrolních bodů (L1-L2, statické čtení HEAD)

| Bod | Stav | Důkaz na HEAD | Δ vs plán |
|---|---|---|---|
| **XC-01** ValidationPipe | ✅ DRŽÍ | `main.ts:66-73` = `new ValidationPipe({ whitelist:true, forbidNonWhitelisted:true, transform:true, exceptionFactory: validationExceptionFactory })` | plán cituje `:53-56` (+transform `:15`) → **line-drift**; obsah sedí |
| **XC-02** export-schemas sync | ✅ SYNC **32/32** | obsahové porovnání FE `schemas/<sys>/<ent>.json` ↔ BE `assets/schemas/<sys>-<ent>.json` (sha256 po CRLF-normalizaci) → **mismatches=0** | páry narostly **17 → 32** (přibyly coc/drd16/drdh/drdplus/fae/jad/pi/shadowrun + drd2 char/diary); pořád 100 % sync |
| **XC-D2** maps ops výjimka | ✅ intact | `operation-payload-validator.service.ts:55-56` `whitelist:false, forbidNonWhitelisted:false` (forward-compat, by-design) | beze změny |
| **XC-04** sanitizer config | ✅ beze změny | `sanitize-rich-text.ts:21-97` — allowedTags/Attributes/Styles/schemes identické s plánem | config drift = 0 |
| **XC-04** pokrytí (callsites) | ✅ ROZŠÍŘENO | viz „Sanitizace" níže — timeline + ikaros-news + world-page-templates + seed-listener + customData **nově sanitizují** | plán vede timeline/ikaros-news jako kandidáty **bez** SAN → **zastaralé** |
| **XC-05** optimistic lock | ✅ DRŽÍ | `pages.service.ts:453,478` + `characters.service.ts:349,364` → 409 při mismatch, `const {expectedUpdatedAt:_ignored,...persistDto}=dto` **před** persistem; DTO dekorováno (`update-page.dto.ts:13`, `update-character.dto.ts:32` `@IsOptional @IsString`); **není** `@Prop` v žádném Mongoose schema (hit v `character-diary.schema.ts:8` = jen komentář o `timestamps:true`) | řádky posunuté driftem, logika sedí |
| **XC-07** transform coercion | ✅ (mechanismus) | `transform:true` v `main.ts:69` | pole-specifika řeší oblasti 01-10 |
| **XC-08** WL/NM 4-místa | ✅ (mechanismus) | maps mapper whitelist komentáře potvrzují disciplínu (`maps.repository.ts:146,164,200` walls/lights/notes/diceRolls doplněny do whitelistu) | — |

---

## Sanitizace (P5) — pokrytí write-paths na HEAD

**Sanitizuje (`sanitizeRichText` na write):**
- Pages: `pages.service.ts` content/sections/table/customData/akjTabs (`:61,63,66,80,106,303,306,470,475`)
- Ikaros články: `ikaros-articles.service.ts:297,348`
- Ikaros diskuse: `ikaros-discussions.service.ts:567`
- **Timeline `text`:** `timeline.service.ts:97,167,210` — **NOVĚ** (byl F-02 🔴 stored XSS → uzavřeno na write)
- **Ikaros news `content`:** `ikaros-news.service.ts:119,173` — **NOVĚ** (byl F-10/K-F9 latentní → uzavřeno)
- World page templates `contentOutline`: `world-page-templates.service.ts:70,113` (nové, mimo plán)
- Pages world-seed listener: `pages-world-seed.listener.ts:58,61,66,109`
- Search (jen `stripAllTags`, read-only derivace): `meili-search.service.ts:136-137`, `embedding-search.service.ts:331-342`

**Bez sanitizace = OK (žádný HTML render):** chat message — FE nemá `dangerouslySetInnerHTML` v
`features/world/chat` (grep = 0) → plain-text render, XSS riziko nulové, SAN vrstva nepotřeba.

**Verdikt SAN:** dřívější dva kandidáti bez sanitizace (timeline, ikaros-news) jsou **opravené**;
žádný nový nesanitizovaný rich-text write-path nenalezen. Plán XC-04 „Pozor: pole bez sanitizace
(chat, timeline text, ikaros news)" je **zastaralý** — timeline+news teď sanitizují, chat je plain-text.

---

## Nálezy

### ♻️ F-25 (FE polovina) · 🟡/🟣 `WL`/doc — stale komentář v FE `registry.ts:10`
- **Vrstvy:** BE polovina F-25/XC-D5 **opravena** — `schema-registry.service.ts:1-9,28,31` už mluví
  o `backend/assets/schemas/` + `npm run export-schemas` (dřívější `shared/schemas/`+`pnpm` pryč).
- **FE polovina NEopravena:** `src/features/world/tactical-map/schemas/registry.ts:10` stále:
  `` * `shared/schemas/` (exportované přes `pnpm export-schemas`). `` — reálná cesta je `assets/schemas/`
  + příkaz `npm run export-schemas`.
- **Rozpor / dopad:** jen matoucí dokumentace, kód správně (export-schemas i registry fungují, 32/32 sync).
  Žádný funkční dopad, žádná ztráta dat.
- **Návrh:** srovnat komentář `registry.ts:10` na `assets/schemas/` + `npm run export-schemas`
  (1 řádek). Registr `form-schema-audit.md` může F-25 povýšit z 🟣 na ✅ až po tomto řádku. **Priorita 4.**

### ♻️ line-drift v plánu `00-cross-cutting.md` · ⚪ doc — číselné odkazy zastaralé
- XC-01 cituje `main.ts:53-56` (+ `:15` pro transform) → realita `main.ts:66-73`.
- XC-02 export-schemas: doc říká „17 párů" → realita **32 párů** (systémy přibyly).
- XC-04/XC-05 řádky sanitize/lock mírně posunuté (obsah OK).
- **Dopad:** kosmetika; při příštím refreshi plánu srovnat čísla + „17 párů" → „32 párů". Ne blocker.

---

## Ověřeno ✅ (bez nálezu)

- **ValidationPipe forbidNonWhitelisted:true** — potvrzeno `main.ts:69`; F-RUN-01 (doc inverze „tichý
  drop" → 400) už uzavřen 2026-06-20; na HEAD platí. `expectedUpdatedAt` dekorováno v obou DTO → žádná
  400-regrese na optimistic-lock poli.
- **export-schemas 32/32 SYNC** — FE JSON nebyl změněn bez exportu; BE validuje proti aktuální kopii.
- **maps ops výjimka** — jediná lokální `whitelist:false`, by-design forward-compat, intact.
- **sanitizer allowlist** — beze změny; pokrytí rozšířené, žádná díra.
- **optimistic lock** — pages+characters, nepersistuje, DTO whitelistováno.

---

## Metodika / jistota
- L1-L2 statické čtení všech vrstev na HEAD (M1): `main.ts`, `sanitize-rich-text.ts`,
  `operation-payload-validator.service.ts`, `schema-registry.service.ts`, pages/characters/timeline/
  ikaros-news services, DTO dekorátory, Mongoose schemata; FE↔BE JSON obsahové porovnání (M6-lite,
  32 párů, sha256 po CRLF-norm) — **export-schemas jsem NEspouštěl** (READ-ONLY, needituju BE assets),
  sync ověřen čistě obsahově.
- L3 runtime nespuštěno (READ-ONLY). Chat plain-text potvrzen negativním grepem `dangerouslySetInnerHTML`.
- **Závěr:** oblast 00 global mechanismy **konzistentní a zpevněné** vůči poslednímu sweepu; 3 dřívější
  nálezy uzavřené, 1 reziduum (♻️ F-25 FE komentář 🟡) + line-drift plánu (⚪). Žádný 🔴, žádná migrace.
