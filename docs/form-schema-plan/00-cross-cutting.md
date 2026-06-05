# 00 — Konvence & cross-cutting (globální mechanismy)

> **Tvar:** tahle oblast **není field-matice** jako 01–09. Dokumentuje **globální mechanismy**, které
> ovlivňují **každý** formulář / write-payload Ikara — ValidationPipe, export-schemas pipeline,
> sanitizace, optimistic lock, FE validační styly. Každý bod = **kontrolní bod `XC-xx`**: co to je,
> kde žije (`soubor:řádek`), jaké riziko driftu, **co ověřit při sweepu**.
> **Osy:** `WL` `NM` `SAN` `NL` `TY` `EN` · perspektivy **P1 P3 P5**.
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ **sweep proběhl 2026-06-05** (XC-01, XC-02, XC-04, XC-05 ověřeny čtením; ostatní body metodicky potvrzeny).

> ✅ **Sweep výsledek (TL;DR):** **XC-01 ValidationPipe** = `{ whitelist:true, transform:true }`, **bez**
> `forbidNonWhitelisted` — přesně dle plánu ([main.ts:15](../../../Projekt-ikaros/backend/src/main.ts)).
> Jediná lokální výjimka: `OperationPayloadValidator` (maps ops) explicitně `whitelist:false` (forward-compat,
> by-design). **XC-02 export-schemas SYNC = ✅ 100 %** — všech **17 párů** FE JSON ↔ BE `assets/schemas/`
> je **obsahově identických** (hash-porovnání po normalizaci CRLF; viz `XC-D1`). Žádný desync. **XC-04**
> sanitizace a **XC-05** optimistic lock = mechanismy **přítomny** (řádky v plánu mírně posunuté driftem,
> logika sedí). Žádný systémový 🔴 nález.

---

## Proč samostatná oblast

Field-matice (01–09) testují *jedno pole napříč 3 vrstvami*. Ale o tom, jestli pole vůbec **dojde** na
DTO, jestli mu **přežije obsah**, a jestli FE/BE validují proti **stejné kopii**, rozhodují mechanismy
*mimo* jednotlivé pole — globálně, jednou pro všechny formuláře. Drift tady = systémový (zasáhne každou
oblast naráz), proto se kontroluje zvlášť a **jako první** (je to baseline pro 01–09).

---

## Kontrolní body

### XC-01 — ValidationPipe: `whitelist:true`, `transform:true`, **bez** `forbidNonWhitelisted` · osa `WL`/`NM`

- **Kde:** [`backend/src/main.ts:15`](../../../Projekt-ikaros/backend/src/main.ts) —
  `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.
- **Co dělá:** `whitelist:true` **tiše zahodí** každé pole requestu, které nemá class-validator dekorátor
  v cílovém DTO. `forbidNonWhitelisted` **není** zapnuto → extra/přejmenované pole **nevrátí 400, jen
  zmizí**. `transform:true` → coercion typů (viz XC-07).
- **Riziko driftu:** FE pošle `displayName`, DTO má jen `name` → hodnota zmizí **bez chyby** (🔴 tichá
  ztráta). Jakýkoli název pole, který nesedí přesně na dekorátor DTO, padá do téhle díry.
- **Co ověřit při sweepu (P3):** pro **každé** pole z 01–09 ověř, že FE klíč == DTO property == Mongoose
  `@Prop` == mapper. Red-team (M5): pošli pole navíc / s překlepem → sleduj, jestli **zmizí** (drop) vs
  400. Past z paměti (`feedback_be_restart_required`): po změně DTO nutný **restart BE** (`nest --watch`),
  FE refresh nestačí — jinak whitelist drží starý seznam povolených polí.

### XC-02 — export-schemas pipeline (FE JSON → BE assets) · osa pozn. (oblast 10)

- **Kde:** [`scripts/export-schemas.mjs`](../../scripts/export-schemas.mjs).
- **Co dělá:** čte canonical FE JSON z
  `src/features/world/tactical-map/schemas/<system>/*.json`, validuje přítomnost `systemId`+`entityType`,
  a **kopíruje** je do BE pod **flat názvem** `<systemId>-<entityType>.json` do
  `Projekt-ikaros/backend/assets/schemas/` (`export-schemas.mjs:21-28,71-76`). BE je čte při startup —
  [`schema-registry.service.ts:24-57`](../../../Projekt-ikaros/backend/src/modules/maps/schemas/system-entity-schema/schema-registry.service.ts)
  přes `process.cwd() + assets/schemas`.
- **Riziko desync:** script je **manuální** (`npm run export-schemas`) a kopíruje *snapshot*. Změna FE
  JSON **bez** spuštění scriptu → BE validuje proti **staré** kopii v `assets/schemas/`. Žádný CI gate to
  nehlídá (k ověření). Past v dokumentaci: BE `schema-registry.service.ts:9` komentář mluví o
  `shared/schemas/` + `pnpm export-schemas` — **neaktuální** vs reálná cesta `assets/schemas/` + příkaz
  `npm run export-schemas`; jen komentář, ne kód, ale matoucí (ověřit).
- **Co ověřit při sweepu (P4, M6):** spusť `npm run export-schemas` a porovnej git diff
  `backend/assets/schemas/` — **prázdný diff = sync**, nenulový = desync (FE JSON změněn bez exportu).
  Detail parity systém×entityType řeší oblast [10](10-per-system.md).

### XC-03 — `audit:routes` (jen existence endpointů, ne payload) · baseline

- **Kde:** [`scripts/route-audit.mjs`](../../scripts/route-audit.mjs).
- **Co dělá:** spáruje FE `api.<method>('<path>')` volání vs BE `@Get/@Post/...` v controllerech podle
  **metody + normalizované cesty** (`route-audit.mjs:32-80`). Reportuje FE volání **bez** odpovídající BE
  route.
- **Co NEvidí:** **payload** — žádné porovnání polí, typů, délek, enumů. Zelený `audit:routes` =
  „endpoint existuje", neříká nic o tom, jestli pole přežije DTO/schema/mapper. Přesně tahle slepá skvrna
  je důvod existence celého form-schema plánu.
- **Co ověřit při sweepu (M6):** spusť jako baseline (zachyť stav), ale **nespoléhej** na něj pro field
  paritu — to dělají oblasti 01–10 ručně.

### XC-04 — Sanitizace rich-textu (`sanitize-html`) · osa `SAN` (P5)

- **Kde (pravidlo):** [`backend/src/common/utils/sanitize-rich-text.ts`](../../../Projekt-ikaros/backend/src/common/utils/sanitize-rich-text.ts).
  - `sanitizeRichText(html)` (`:103`) — allowlist `RICH_TEXT_CONFIG` (`:21-97`): povolené tagy
    `p,br,h2,h3,blockquote,strong,em,b,i,s,u,ul,ol,li,a,img,table,thead,tbody,tr,th,td,code,span,sub,sup`;
    atributy per tag (`a:href,target,rel,title`; `img:src,alt,title,width,height,data-caption`;
    `span:data-mention,style`; `th/td:colspan,rowspan,colwidth`); `allowedStyles.span.color` jen
    hex/rgb/rgba/named; schémata `http,https,mailto`; `a` dostává `rel="noopener noreferrer nofollow"`
    +`target=_blank` jen pro externí (`transformTags`, `:80-96`).
  - `stripAllTags(html)` (`:111`) — vše pryč, jen plain text.
- **Kde (volání) — kterých polí se týká:**
  - **Pages** `content` + `sections[].content` + AKJ `contentOverride` + `table.headers/values`:
    [`pages.service.ts:47,50,71,157,160,253,258`](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts).
  - **Ikaros články** `content`:
    [`ikaros-articles.service.ts:259,310`](../../../Projekt-ikaros/backend/src/modules/ikaros-articles/ikaros-articles.service.ts).
  - **Ikaros diskuse** `content`:
    [`ikaros-discussions.service.ts:517`](../../../Projekt-ikaros/backend/src/modules/ikaros-discussions/ikaros-discussions.service.ts).
  - **Search index** (jen `stripAllTags`, read-only derivace):
    [`meili-search.service.ts:128-129`](../../../Projekt-ikaros/backend/src/modules/search/meili-search.service.ts),
    [`embedding-search.service.ts:314-325`](../../../Projekt-ikaros/backend/src/modules/search/embedding-search.service.ts).
- **Riziko driftu (P5):** DTO u těchhle polí je často jen `@IsString` — **skutečné pravidlo žije v
  service**, mimo class-validator i Mongoose. Drift FE TipTap allowlist ↔ BE `allowedTags` = tichá ztráta
  formátování (FE umí tag, sanitizér ho strhne) **nebo** uložené XSS (sanitizér nestrhne to, co FE pošle).
- **Co ověřit při sweepu (M4/M5):** porovnej TipTap extension sadu (FE editor) s `allowedTags/Attributes`.
  Round-trip: ulož bohatý obsah (barva, link, tabulka, sub/sup) → GET → render; zkontroluj ztrátu. Red-team:
  pošli `<script>`/`onerror`/`<iframe>`/`style:position` → ověř, že je sanitizér zahodí. **Pozor:** pole
  bez sanitizace v seznamu výše (např. chat message, timeline `text`, ikaros news mimo článek) → ověřit,
  jestli rich-text obsah jde do DB **nesanitizovaný** (kandidát na chybějící `SAN` vrstvu).

### XC-05 — Optimistic lock `expectedUpdatedAt` (filtrace před persistem) · osa pozn. / `WL`

- **Kde:**
  - DTO: [`update-page.dto.ts:13`](../../../Projekt-ikaros/backend/src/modules/pages/dto/update-page.dto.ts)
    (`@IsOptional @IsString expectedUpdatedAt?`),
    [`update-character.dto.ts:32`](../../../Projekt-ikaros/backend/src/modules/characters/dto/update-character.dto.ts).
  - Filtrace: [`pages.service.ts:236-248,261`](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts)
    a [`characters.service.ts:276-291`](../../../Projekt-ikaros/backend/src/modules/characters/characters.service.ts)
    — pokud `dto.expectedUpdatedAt !== serverUpdatedAt` → **409** (`PAGE_CONFLICT`/conflict); jinak se pole
    **odstraní destrukturou** `const { expectedUpdatedAt: _ignored, ...persistDto } = dto` **před** uložením.
- **Riziko driftu:** `expectedUpdatedAt` je **kontrolní, ne datové** pole. Kdyby se zapomnělo
  odstranit, uložilo by se do dokumentu. Vzor je jen v pages + characters (D-073 / 7.2k) — jiné entity
  s concurrency rizikem (token ops, world settings?) to **nemají** (k ověření, jestli mají mít).
- **Co ověřit při sweepu:** že `expectedUpdatedAt` **není** v Mongoose schema (nesmí persistovat), a že
  FE u pages/characters posílá `updatedAt` ze své kopie. Stale token → 409 (M5). Ostatní write-heavy
  entity: posoudit, jestli concurrency lock chybí (mimo scope form-schema, → bug-plan).

### XC-06 — Tři FE validační styly (zdroj `NM`/`LN`/`EN` driftu) · osa `WL`/`NM`

FE validace **není jednotná** — tři styly, různá míra type-safety. Inline je primární podezřelý na drift.

| Styl | Nástroj | Kde (příklady) | Drift riziko |
|---|---|---|---|
| ① **zod + RHF** | `zodResolver` (`@hookform/resolvers`) | `RegisterModal`, `LoginModal`, `ForgotPasswordModal`, `ResetPasswordPage`, profil (`ProfileHeader`, `BioSection`, `CharacterSection`, `ChangeEmailModal`, `SecuritySection`), world `BasicInfoTab`, `GameEventModal`, `CurrencyFormModal`, `TimelineEventModal`, ikaros `NewsFormModal`/`IkarosEventModal`, `WorldNewsEditorModal` (16 míst — viz grep `zodResolver`) | nízké (typované, testovatelné), ale **kopie** pravidla vůči BE |
| ② **inline** `if/trim/maxLength` | ruční JS v komponentě / HTML attr | pages modály, characters, chat (dle inventury README) | **vysoké** — bez type-safety, `maxLength` jen HTML atribut (nevynutí na programovém setu), snadno se rozejde s DTO |
| ③ **per-system JSON registry** | `validateForCreate/Patch` | [`validateSystemStats.ts`](../../src/features/world/tactical-map/utils/validateSystemStats.ts) → viz oblast [10](10-per-system.md) | střední — řízeno schématem, ale mirror vůči BE (export-schemas) |

- **Co ověřit při sweepu:** u stylu ② je `maxLength` často jen HTML `maxLength=` (UX, ne validace) →
  ověř, jestli existuje i programová kontrola; jinak jediná autorita je BE DTO. Mapuj každou oblast 01–09
  na její styl (sloupec „FE styl" v [README inventuře](README.md#inventura-formulářů-povrch-auditu)).

### XC-07 — `transform:true` coercion (string→number/bool past) · osa `TY`/`NL`

- **Kde:** `transform:true` v [`main.ts:15`](../../../Projekt-ikaros/backend/src/main.ts) + class-transformer
  na DTO (`@Type(() => Number)` apod.).
- **Co dělá:** ValidationPipe se pokusí **přetypovat** příchozí hodnotu na typ deklarovaný v DTO. U query
  paramů a multipart je vstup vždy string → `@IsNumber` pole potřebuje `@Type(() => Number)`, jinak
  `"5"` neprojde nebo projde jako string. U `systemStats` čísla coercuje až **per-system validator**
  (`Number(value)`, viz oblast 10), ne ValidationPipe (je to `Record<string,unknown>`).
- **Riziko driftu:** FE pošle number, BE čeká string (nebo opačně); coercion buď tiše opraví, nebo
  spadne na `@IsNumber` 400. `NL`: prázdný string vs `null` vs `undefined` se coercuje různě.
- **Co ověřit při sweepu (M4):** u number polí round-trip — pošli string `"5"` i number `5`, ověř, co se
  uloží. U optional number ověř, že `""`/`null` nespadne na `@IsNumber`.

### XC-08 — Naming/whitelist drift checklist (DTO → schema → toEntity → FE) · osa `WL`/`NM` (P1)

- **Pravidlo (z paměti):** nové pole musí přežít **4 místa**: FE payload → DTO dekorátor → Mongoose
  `@Prop` → **repository `toEntity`/`toToken` mapper** → GET response. Vynechané místo = tichá ztráta.
  - `project_be_field_checklist` — **začni od `toEntity` mapperu** (jinak write/schema funguje, ale GET
    pole zahodí).
  - `project_map_token_tomapper_whitelist` (D-066 `isLocked`) — token mapper je **explicitní whitelist**;
    nové token pole nutno přidat i tam.
  - `project_chat_channel_field_checklist` — u ChatChannel **5 míst** (mapper navíc).
- **Co ověřit při sweepu (P1):** pro každé pole vypiš 4 místa; chybějící = okamžitý `WL` kandidát. U
  `@ValidateNested({ each:true })` (sekce, kalendáře, abilities) projdi **každý prvek** jako mini-formulář
  + ověř limit počtu + že mapper nezahazuje podpole.

---

## Delta parity (plní sweep)

> **Sweep 2026-06-05.** Globální mechanismy ověřeny. Žádný systémový rozpor; klíčový pozitivní výsledek =
> **export-schemas plně v sync** (XC-D1).

| ID | Bod | Osa | Δ | Dopad / pozn. |
|---|---|---|---|---|
| XC-D1 | XC-02 export-schemas sync | `WL`/all | ✅ **SYNC** | **Všech 17 párů** FE JSON (`src/features/world/tactical-map/schemas/<system>/*.json`) ↔ BE kopie (`backend/assets/schemas/<system>-<entity>.json`) **obsahově identických** (sha256 po normalizaci CRLF — viz tabulka níže). FE NEbyl změněn bez exportu. Ověřeno čtením (drd2-bestie byte-identical) + hash všech párů. **Dopad:** žádný desync → BE validuje proti aktuální FE kopii. |
| XC-D2 | XC-01 ValidationPipe | `WL`/`NM` | ✅ shoda | `main.ts:15` = `{ whitelist:true, transform:true }`, **bez** `forbidNonWhitelisted` → extra/přejmenované pole **tiše zmizí** (drop, ne 400). Přesně dle plánu. Jediná výjimka: `operation-payload-validator.service.ts:54-57` má `whitelist:false, forbidNonWhitelisted:false` pro maps ops (forward-compat, by-design — viz [08-maps Delta MP-D*](08-maps.md#delta-parity-plní-sweep)). |
| XC-D3 | XC-04 sanitizace rich-text | `SAN` | ✅ přítomno | `sanitizeRichText` volání **přítomna** v `pages.service.ts` (table headers/values [:47,50], content [:253], sections.content [:258]). Mechanismus ověřen. Pozn.: konkrétní řádky v plánu mírně driftly, ale logika sedí. Pole **bez** sanitizace (ikaros news, timeline) = kandidát K-F9, řeší oblast 09. |
| XC-D4 | XC-05 optimistic lock | `WL` | ✅ přítomno | `pages.service.ts`: 409 `PAGE_CONFLICT` při `expectedUpdatedAt !== serverUpdatedAt` [:236-248], pole **odstraněno destrukturou** `const { expectedUpdatedAt: _ignored, ...persistDto } = dto` [:261] **před** persistem → nepersistuje. Mechanismus ověřen (řádky posunuté driftem). |
| XC-D5 | XC-02 komentář drift | pozn. | 🟡 ⚖️ | `schema-registry.service.ts:1-9` komentář mluví o `shared/schemas/` + `pnpm export-schemas`, reálná cesta je `assets/schemas/` ([schema-registry.service.ts:28] `process.cwd()/assets/schemas`) + `npm run export-schemas`. **Jen komentář**, kód správně. FE `registry.ts:11` má stejný zastaralý komentář (`shared/schemas/` + `pnpm`). **Dopad:** matoucí dokumentace, ne funkční. **Návrh:** opravit oba komentáře. |

### XC-D1 — důkaz sync (17/17 párů, sha256 prvních 12 znaků po CRLF-normalizaci, 2026-06-05)

| pár | FE = BE | pár | FE = BE | pár | FE = BE |
|---|---|---|---|---|---|
| coc-bestie | ✅ | drd2-character-pc | ✅ | gurps-bestie | ✅ |
| coc-token | ✅ | drd2-character-npc | ✅ | gurps-token | ✅ |
| dnd5e-bestie | ✅ | drd2-diary-pc | ✅ | matrix-bestie | ✅ |
| dnd5e-token | ✅ | drd2-diary-npc | ✅ | matrix-token | ✅ |
| drd2-bestie | ✅ | fate-bestie | ✅ | | |
| drd2-token | ✅ | fate-token | ✅ | generic-token | ✅ |

> **Verdikt:** 17/17 SYNC, 0 desync. Pozn.: script `export-schemas` jsem **NEspouštěl** (audit needituje BE) —
> sync ověřen čistě obsahovým porovnáním souborů. Detail parity systém×entityType → [oblast 10](10-per-system.md).

## Baseline příkazy (spustit na začátku sweepu)

> `npm run audit:routes` (XC-03) · `npm run export-schemas` + git diff `backend/assets/schemas/` (XC-02) ·
> `tsc --noEmit` FE+BE · validační vitest/jest. Stav zapsat do [README baseline](README.md#baseline--health-checks).
