# form-schema / 04-pages — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20 · FE HEAD: 2a6c8e1c · BE HEAD: 9cf98be (ověřeno přímým čtením)

---

## Pokrytí

Prošel jsem veškerý relevantní kód oblasti 04-pages (L1 statické čtení M1, L2 strukturální ověření M2):

- FE: `usePageEditorState.ts`, `PageEditor.tsx` (všechny 3 save paths), `pages.types.ts`, `IdentityPanel.tsx`, `MenuPanel.tsx`, `RulebookHub.tsx`
- BE DTO: `create-page.dto.ts` (kompletní), `update-page.dto.ts`
- BE DB: `page.schema.ts`
- BE mapper: `pages.repository.ts` (`toEntity`, `findDirectory`)
- BE service: `pages.service.ts` (create, update, sanitizeAkjTabs, sanitizeTable)
- SAN: `sanitize-rich-text.ts`, RichTextEditor `extensions.ts`
- Interface: BE `page.interface.ts`, FE `pages.types.ts`
- Původní plánová matice (04-pages.md) re-ověřena proti HEAD

Pokrytí: celá oblast P1 (WL průchod), P5 (SAN rich-text), PG-01..PG-19 + všechny pod-body
(sections/gallery/videos/menu/AKJ/table).

---

## Dosažená L vs cílová L

| Vrstva/pole | Dosažená L | Cílová L |
|---|---|---|
| Základní pole PG-01..PG-08, PG-10..PG-13, PG-17..PG-19 | L2 | L2 |
| Nová pole imageFocalX/Y/imageZoom/imageFit | L2 | L2 |
| locked v AkjTabDto | L2 | L2 |
| PG-09 sections, PG-15 accessRequirements, PG-16 akjTabs | L2 | L2 |
| SAN round-trip (P5) TipTap ↔ sanitizeRichText | L2 | L3 |
| MenuItem.imageUrl (nový nález) | L2 | — |
| handleOverwriteConflict/confirmSaveExisting missing fields | L2 | — |
| F-14 stav (PG-D2 title MaxLength) | L2 (resolved) | — |

**Cílová L pro živé vrstvy (M4 round-trip) NEDOSAŽENA** — živá BE infrastruktura není dostupná →
PROOF-REQUEST viz níže.

---

## Nálezy

### 🆕 F-RUN-PG-01 — `WL` `MenuItem.imageUrl` dead-field: FE typ + viewer, BE DTO/mapper neznají · 🟠

- **Kde:** FE `pages.types.ts:107` (`imageUrl?: string` na `MenuItem`) · `RulebookHub.tsx:33,35` (renderuje `it.imageUrl`) · BE `create-page.dto.ts` `MenuItemDto` (pole chybí) · `pages.repository.ts:283-287` (mapper mapuje jen `label/href/order`)
- **Popis:** FE typ `MenuItem` deklaruje `imageUrl?: string` s komentářem „Volitelný obrázek dlaždice (sub-hub kapitol)". `RulebookHub.tsx` renderuje `it.imageUrl` v kartičkách menu. **Ale:** BE `MenuItemDto` pole nemá, mapper `toEntity` ho nezná → GET vždy vrací `undefined` → `RulebookHub` nikdy nezobrazí obrázky. Write path: pokud by editor `imageUrl` přidal, `forbidNonWhitelisted:true` → 400.
- **Dopad na existující data:** žádný (pole nikdy nebylo persistováno přes API; seed `menu[]` v `rulebook-seed-data.ts:12` `imageUrl` v položkách menu taky nemá).
- **Návrh:** buď (a) přidat `imageUrl?: string` do `MenuItemDto` + mapper + `page.interface.ts` `MenuItem` a otevřít UI v `MenuPanel` = plná implementace; nebo (b) odebrat `imageUrl` z FE typu `MenuItem` a z `RulebookHub` = dead-code cleanup. Závažnost 🟠 (nefunkční feature zamýšlená dle komentáře v typu).
- **L2** · 🆕

---

### 🆕 F-RUN-PG-02 — `WL` force-overwrite a slug-kolize cesty nezahrnují `ownerUserId` a `akjTabs` · 🟡

- **Kde:** `PageEditor.tsx:341-365` (`handleOverwriteConflict`) a `PageEditor.tsx:278-307` (`confirmSaveExisting`)
- **Popis:** Normální save path (`handleSave`, řádky 195-222 a 229-252) posílá `ownerUserId` a `akjTabs`. Ale dvě alternativní cesty — (1) force-overwrite po konfliktu verzí a (2) potvrzené uložení při slug-kolizi — tyto pole vynechávají. Dopad: změny `akjTabs` provedené v editoru se na force-overwrite uloží bez nich (PATCH semantika: bez pole = DB hodnota zůstane původní, tj. uložit novou verzi záložek nejde). Pro PC stránky `ownerUserId` taky chybí — ale service logika (`...(!isPersona && {ownerUserId:undefined})`) se spustí jen pro ne-PC typ, takže pro PC owner zůstane původní (DB hodnota přežije). Funkční dopad: uživatel vidí nové AKJ záložky v editoru, zmáčkne „Přepsat" po konfliktu → záložky se neuloží, editor se přesune zpět na stránku se starými záložkami.
- **Dopad na existující data:** žádný (nezpůsobí korrupci, jen ztrátu změn provedených v aktuální relaci editace).
- **Návrh:** doplnit `ownerUserId: state.ownerUserId || undefined` a `akjTabs: state.akjTabs` do obou alternativních cest v `PageEditor.tsx`. Závažnost 🟡 (okrajová cesta, edge case).
- **L2** · 🆕

---

### ♻️ F-14 (PG-D2) stav — `title @MaxLength` tiše opraveno od 2026-06-05 · ✅ RESOLVED

- **Kde:** BE `create-page.dto.ts:203-205`
- **Popis:** Původní nález F-14 (2026-06-05) hlásil chybějící `@MaxLength` v DTO. HEAD nyní obsahuje `@IsString() @MaxLength(200)` — shoduje se s FE `maxLength={200}` HTML atributem na `IdentityPanel.tsx:81`. 3-vrstvá shoda: FE HTML attr `200` = DTO `@MaxLength(200)` = DB bez limitu (přijatelné — DTO brána je autoritativní). Nález F-14 je de facto vyřešen, registr to nezaznamenal.
- **Dopad na existující data:** tituly delší než 200 znaků (pokud existují) by při editaci a uložení přes PATCH dostaly 400 — **PROOF-REQUEST živé DB**.
- **Návrh:** zaznamenat F-14 jako ✅ opraveno v `form-schema-audit.md`. Zvážit kontrolu existujících titulů před nasazením pokud ještě nebyla provedena.
- **L2** · ♻️

---

### ✅ Nová pole imageFocalX/Y/imageZoom/imageFit — shoda L2 · 🆕 (oproti sweep 2026-06-05)

- **Kde:** `create-page.dto.ts:219-245` + `page.schema.ts:19-23` + `pages.repository.ts:247-250` + `usePageEditorState.ts:28-31` + `PageEditor.tsx:204-209`
- **Popis:** Čtyři nová pole přidaná po původním sweepu. DTO: `@IsOptional @ValidateIf(!=null) @IsNumber @Min/@Max` + `@IsIn(['cover','contain'])` — správná null-clear sémantika. DB schema: `{default:null, type:Number/String, enum:[...]  }`. Mapper: explicitně mapuje `?? null`. FE: INITIAL_PAGE_STATE `null`, editor odesílá hodnoty ze state. 3+1-vrstvá shoda, null-clear flow ✅.
- **L2** · 🆕

---

### ✅ `locked` v AkjTabDto — by-design, L2

- **Kde:** `create-page.dto.ts:191-193` + `pages.service.ts:69-71` (`sanitizeAkjTabs`)
- **Popis:** `AkjTabDto` nově deklaruje `locked?: boolean` (`@IsOptional @IsBoolean`). Přijme ho kvůli `forbidNonWhitelisted` (bez dekoratoru by editor's PATCH s `locked` v záložce vrátil 400). Service `sanitizeAkjTabs` ho výslovně stripuje před uložením (`const { locked: _locked, ...tab }`). GET vždy přepočítá `locked` dle přístupu viewera. Tok: FE editor strip při načtení (`pageToFormState:103`) + DTO accept + service strip + GET enrich = konzistentní.
- **L2** · ✅

---

### ✅ SAN parity TipTap ↔ sanitizeRichText — L2

- **TipTap extensions.ts povoluje:** `p, br, h2, h3, blockquote, strong, em, s, u, ul, ol, li, a, img (opt), table/tr/th/td/thead/tbody (opt), sub, sup, span[style=color]`
- **BE sanitizeRichText allowlist:** identické + navíc `code` (TipTap to zakázal; legacy data přežijí sanitizací bez ztráty, nová data ho nemohou vytvořit).
- **Výsledek:** žádná tichá ztráta formátování pro aktuální TipTap schema. Žádné uložené XSS (allowlist přísný). ✅

---

### ✅ Původní plánem flaggované položky (PG-D1, PG-D3, F-15) — stav beze změny

- **PG-D1** slug bez `@Matches` — ⚖️ by-design (slug skrytý, FE vždy slugify; beze změny).
- **PG-D3 / F-15** `sections[].isCollapsed` DF mapper `?? true` vs DTO default `false` — 🟣 dluh (latentní, FE vždy posílá pole; beze změny, registr to ví).
- **PG-09 sections, PG-10 gallery, PG-11 videos, PG-12 menu, PG-13 table, PG-15 accessReqs, PG-16 akjTabs** — re-ověřeny L2, žádný nový drift.

---

## PROOF-REQUEST

| # | Co ověřit | Metoda | Blokuje |
|---|---|---|---|
| PR-PG-01 | `title @MaxLength(200)` — existují v produkci tituly delší než 200 znaků? | M5 red-team (přímý PATCH) nebo DB scan `db.pages.find({title:{$regex:'.{201}'}})` | Oprava F-14 v registru |
| PR-PG-02 | `MenuItem.imageUrl` — je tato hodnota v jakémkoli `menu[]` dokumentu v DB? (Legacy data před API gatováním) | DB scan `db.pages.find({'menu.imageUrl':{$exists:true}})` | Rozhodnutí implement vs cleanup F-RUN-PG-01 |
| PR-PG-03 | SAN round-trip L3: `content` s `<strong>/<em>/<span style=color>/<table>` přežije save→GET beze ztráty | M4 round-trip test (e2e / jest) | L3 pojistka |

---

## Shrnutí

Oblast 04-pages po přidání nových polí (imageFocalX/Y/zoom/fit, locked v AkjTabDto) — nová pole projita L2, shoda 4-vrstvě. Původní sweep 2026-06-05 byl korektní; F-14 byl tiše opraven. 2 nové nálezy: 🟠 F-RUN-PG-01 (`MenuItem.imageUrl` dead WL) + 🟡 F-RUN-PG-02 (force-overwrite chybí akjTabs). 3 proof-requesty pro živou infru.
