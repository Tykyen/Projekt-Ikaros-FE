# Form-schema plán — kontrakt tvaru dat (FE validace ↔ BE DTO ↔ DB model)

> **Účel:** systematicky projít **každý formulář / write-payload** Ikara a ověřit, že **tři vrstvy
> definující tvar dat říkají totéž** — frontendová validace (zod / RHF / inline / per-system JSON),
> backendové DTO (class-validator) a databázový model (Mongoose `@Prop`). Pro každé pole: **required,
> délka, enum, název, formát/regex, rozsah, typ, default**.
>
> Čtvrtý sourozenec [`bug-plan/`](../bug-plan/README.md) (REST/logika),
> [`ws-contract-plan/`](../ws-contract-plan/README.md) (real-time) a
> [`role-plan/`](../role-plan/README.md) (oprávnění). Tenhle plán testuje výhradně **smlouvu o datech**:
> „když FE pošle tohle pole s touhle hodnotou, přijme/uloží/vrátí ho BE i DB beze ztráty a beze změny?"
>
> **Stav:** zahájeno 2026-06-05. Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (ID `F-xx`).

---

## Tři vrstvy pravdy (a kde žijí)

| Vrstva | Nástroj | Kde | Co určuje |
|---|---|---|---|
| **FE** | zod + `@hookform/resolvers`, RHF; **+ inline** `if/trim/maxLength`; **+ per-system JSON** | `src/features/**/lib/*Schema.ts`, modály, `tactical-map/schemas/<sys>/*.json` | co uživatel smí odeslat (klientská validace) |
| **BE DTO** | `class-validator` + `class-transformer` | `backend/src/modules/**/dto/*.dto.ts` | co server přijme (autoritativní brána requestu) |
| **DB model** | Mongoose `@Prop` | `backend/src/modules/**/schemas/*.schema.ts` | co se uloží (required, enum, maxlength, default, min/max) |
| **(+ mapper)** | `toEntity`/`toToken` whitelist | repository soubory | co GET **vrátí** zpět (drift sem = write projde, čtení zahodí) |

> 💡 **Autoritativní je BE+DB**, FE je jen UX předfiltr. Cíl auditu není „FE musí být stejně přísné",
> ale **„rozpor nesmí vést ke ztrátě dat ani k matoucí chybě"**. Dva směry rozporu, dva různé dopady ↓.

---

## Proč samostatný plán (co bug/role/ws i `audit:routes` míjejí)

`npm run audit:routes` páruje jen **existenci** FE volání ↔ BE endpointu (název + metoda). **Nevidí
payload.** Bug/role/ws audity řešily logiku, oprávnění a real-time — ne **shodu validačních pravidel
pole**. Díry, které proto nikdo systematicky neprojde:

| Slepá skvrna | Příklad reálného rizika | Dopad |
|---|---|---|
| **Tichá ztráta pole** — `ValidationPipe({ whitelist:true })` dropne pole bez dekorátoru / s jiným názvem | FE pošle `displayName`, BE DTO má `name` → hodnota **zmizí bez chyby** | 🔴 ztráta dat |
| **3-vrstvý drift** — DTO přijme pole, ale Mongoose schema / `toEntity` ho nezná | write 200 OK, ale GET pole nikdy nevrátí (paměť: D-066, field-checklist) | 🔴 ztráta dat |
| **Délkový/range rozpor** — FE pustí 64, BE `@MaxLength(32)` | uživatel napíše 40 znaků → FE OK → **BE 400** (matoucí, „uložilo se to napůl?") | 🟠 UX/chyba |
| **Enum rozpor** — FE select má hodnotu, kterou BE `@IsIn` nezná (nebo naopak) | nová volba v UI → 400; nebo legacy hodnota v DB → FE crash na render | 🟠 |
| **Required rozpor** — FE nepovinné, DB `required:true` (nebo opačně) | prázdné odeslání projde FE → BE/DB 400/500; nebo FE blokuje to, co BE dovolí | 🟠 |
| **Formát rozpor** — FE regex ≠ BE `@Matches` | username `Foo` projde BE (`/^[^@]+$/`), ale FE žádost o username chce `/^[a-z0-9-]+$/` | 🟡 drift |
| **Default rozpor** — FE default ≠ DB default | pole neodeslané → DB dosadí jinou hodnotu, než FE ukazoval | 🟡 překvapení |
| **Sanitizace strhne obsah** — FE editor povolí tag, BE `sanitize-html` ho odstraní (nebo opačně nestrhne) | TipTap tučné/odkaz po uložení zmizí; nebo `<script>` přežije do DB → uložené XSS | 🔴 ztráta/XSS |
| **Cross-field rozpor** — FE `refine` vynutí vztah polí, BE `@ValidateIf` ne | `groupOnly:true` bez `targetGroup` projde BE → event špatně cílí (nikomu/všem) | 🟠 |
| **Prázdno/delete drift** — `null` vs `''` vs `undefined` napříč vrstvami | „smazat avatar" pošle `''`, ale BE čeká `null` → mazání tiše nefunguje | 🟠 |

> 💡 **Závěr:** zelený `audit:routes` = „endpoint existuje". Neříká **nic** o tom, jestli pole
> v payloadu přežije DTO, Mongoose a mapper se stejným jménem, typem a limitem. Tenhle plán tlačí
> kontrolu na **úroveň pole**.

---

## Kontrolní osy

Každé pole se prověřuje podél jedné/více os. U bodu se uvádí, kterou osu řeší.

| Osa | Zkratka | Otázka | Jak ověřit |
|---|---|---|---|
| **Required** | `RQ` | Je povinnost pole stejná FE ↔ DTO ↔ DB? | zod `.optional()` ↔ `@IsOptional` ↔ `required:` |
| **Délka** | `LN` | min/max délka stringu sedí? | zod `.min/.max` ↔ `@MinLength/@MaxLength` ↔ `maxlength:` |
| **Enum** | `EN` | Množina povolených hodnot identická? | FE options/literal ↔ `@IsIn/@IsEnum` ↔ `enum:` |
| **Název** | `NM` | Jméno pole **přesně** stejné napříč vrstvami (+ mapper)? | grep klíče; whitelist drop risk |
| **Formát** | `RG` | FE regex/pattern ↔ BE `@Matches`/`@IsEmail`/`@IsUrl`? | diff regexů |
| **Rozsah** | `RN` | number min/max/int sedí? | zod `.min/.max/.int` ↔ `@Min/@Max/@IsInt` ↔ `min/max:` |
| **Typ** | `TY` | Datový typ stejný (string/number/bool/array/object)? | zod typ ↔ `@IsString…` ↔ `type:` |
| **Default** | `DF` | Default konzistentní FE ↔ DB? | zod `.default` / UI ↔ `default:` |
| **Průchod/mapper** | `WL` | Přežije pole celou cestu **write i read** (DTO → schema → `toEntity`)? | inventura 4 míst |
| **Sanitizace** | `SAN` | Povolená sada HTML tagů/atr. sedí FE editor ↔ BE `sanitize-html` ↔ render? | čtení sanitize konfigu (4. vrstva) |
| **Cross-field** | `XF` | Sedí pravidla *vztahu* mezi poli (FE `refine`/`superRefine` ↔ BE `@ValidateIf`)? | diff podmínek |
| **Prázdno/null** | `NL` | `null` vs `''` vs `undefined` + delete semantika + `transform` coercion konzistentní? | optional/nullable/default + jak FE maže |

`WL` je nejhlubší osa pro *ztrátu pole* (form-schema obdoba `PC` z role-plánu: „jedny dveře ze čtyř
zapomněly"). `SAN` a `NL` jsou další dvě třídy **tiché ztráty hodnoty** o vrstvu níž — ztrácí se *obsah*
pole, ne pole samo. `XF` hlídá pravidla *mezi* poli, která field-centrický audit ze své podstaty míjí.

> 💡 U `EN` si všímej i **zdroje**: je enum jeden sdílený zdroj, nebo **dvě kopie** (FE literal + BE
> `@IsIn`)? Shoda *dnes* neznamená shodu po příští změně — duplikát je latentní drift (paměť: `THEME_IDS`
> na FE i BE = dvě ruční kopie). Nález „enumy se shodují, ale jsou to kopie" = preventivní 🟡.

---

## Hloubkové perspektivy (jak hluboko každé pole proklepnout)

Osy říkají *co* hledat; perspektivy *jak hluboko*. Cílené na hot-spoty, každá vázaná na reálný
historický nález / pravidlo z paměti projektu — ne na teorii.

### P1 — Plný průchod pole (4 místa, osa `WL`/`NM`)
Pole přidané do formuláře musí přežít **celý řetězec**: `FE payload → DTO dekorátor → Mongoose @Prop
→ repository toEntity mapper → GET response`. Vynechané místo = tichá ztráta.
- Paměť: `project_be_field_checklist` — **začni od `toEntity` mapperu** (jinak schema/write funguje, ale GET zahazuje).
- Paměť: `project_map_token_tomapper_whitelist` (D-066 `isLocked` drift) — token mapper je explicitní whitelist.
- Paměť: `project_chat_channel_field_checklist` — 5 míst u ChatChannel.
- **Rekurze do polí objektů:** u `@ValidateNested({ each:true })` projdi prvek jako **mini-formulář**
  s vlastním 3-vrstvým kontraktem — limit počtu (`calendars[]` max 20), validaci **každého** prvku,
  stabilitu `order`. Vnořené pole je nejčastější místo, kde mapper zahodí podpole.

### P2 — Round-trip persistence (A→B→A, osa `DF`/`TY`)
Nestačí „write vrátil 200". Zapiš hodnotu, načti, ověř shodu; u variant/presetů projdi A→B→A.
- Paměť: `feedback_persist_across_variants` — povinný persistence test + **delta merge write, ne full replace**.
- Past `transform:true` — string `"5"` → number `5`; ověř, že FE pošle typ, který BE čeká.

### P3 — Soft-fail vs hard-fail (osa `RQ`/`WL`)
Rozliš, kde rozpor **tiše dropne** (whitelist) vs kde vrátí **400** (dekorátor odmítne). Tichý drop je
zákeřnější — uživatel nevidí chybu, data prostě nejsou.
- Paměť: `feedback_be_restart_required` — whitelist ValidationPipe tiše drop neznámé fields; po BE změně DTO nutný **restart** (FE refresh nestačí).
- `forbidNonWhitelisted` **není** zapnuto → extra pole = ticho, ne 400.

### P4 — Per-system schema parita (osa `EN`/`RQ`/`RN`)
`systemStats` má vlastní validační engine: **FE JSON je canonical** → `export-schemas` → BE `assets/schemas/`.
Ověř paritu napříč **6 systémy × entityTypes** (required, enum, min/max, version) a **soft-mode** chování
(chybí schema → `errors._schema`, validace se přeskočí a FE se důvěří).
- Paměť: `project_schema_be_fe_sync` — per-system schémata canonical na FE → export do BE; BE soft-mode.
- Past: změna FE JSON bez `export-schemas` → BE validuje proti **staré** kopii.

### P5 — Sanitizace round-trip rich-textu (osa `SAN`)
U polí s HTML / rich obsahem ověř **celý řetězec**: FE editor (TipTap povolená sada) → DTO (často jen
`@IsString` — pravidlo tam **není**) → **service `sanitize-html`** (skutečná povolená sada tagů/atributů)
→ DB → GET → FE render. Drift mezi tím, co FE umí vytvořit, a co sanitizér pustí = tichá ztráta
formátování; opačný drift (sanitizér nestrhne) = uložené XSS.
- Pole: Pages `content` / `sections` / `table values` / AKJ `contentOverride`, ikaros news `content`, timeline `text`.
- Past: DTO „string" *vypadá* hotově, ale skutečné pravidlo žije v **service**, mimo class-validator i Mongoose.

### Dopad na existující data (povinné u každého nálezu — server běží)
Audit řeší „nové requesty", ale Ikaros **běží na serveru s reálnými daty**. U každého nálezu, jehož
oprava zpřísní BE/DB (`required`, `enum`, kratší `maxlength`, nový `@Matches`), je **povinná** kolonka
**„Dopad na existující data"**: stane se nějaký dokument v produkční DB nevalidním? Pokud ano → návrh
musí obsahovat **migraci** (backfill / čištění), ne jen změnu modelu. Zpřísnění bez migrace = rozbité
staré světy/postavy.

---

## Inventura formulářů (povrch auditu)

Mapováno průzkumem 2026-06-05 (čísla = „k ověření při exekuci", ne potvrzená).

**FE validace = 3 styly:** ① zod+RHF (typované, testovatelné) · ② inline `if/trim/maxLength` (drift-prone,
bez type safety) · ③ per-system JSON registry (`validateForCreate/Patch`). Styl ② je primární podezřelý.

| Oblast | Hl. entity | FE styl | ID prefix |
|---|---|---|---|
| 00 cross-cutting | ValidationPipe, export-schemas pipeline, optimistic lock, konvence | — | `XC-` |
| 01 auth | register, login, reset, forgot | zod | `AU-` |
| 02 user profile | UpdateUserDto (displayName, bio, city, characterName, chatColor, privacy, themeId) | zod | `UP-` |
| 03 worlds | create/update world, world-settings, calendars | zod | `WO-` |
| 04 pages | create/update page (+ nested: sections, gallery, videos, menu, AKJ tabs, table) | inline | `PG-` |
| 05 characters | create/update character (kind, isNpc, diaryData) | inline | `CH-` |
| 06 chat | channel, group, message, scheduled-message | inline | `CT-` |
| 07 bestiae | create/update/clone bestie + systemStats | registry | `BE-` |
| 08 maps | create map, token ops + systemStats, config, fog | inline+registry | `MP-` |
| 09 events/misc | game-event, timeline-event, currency, ikaros news/event, sound | zod+inline | `EV-` |
| 10 per-system | 6 systémů × entityTypes (bestie/token/character-pc/npc/diary), JSON↔assets parita | JSON | `SY-` |

---

## Metody ověření (`[auto]`)

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — zod ↔ DTO dekorátory ↔ Mongoose `@Prop` ↔ mapper, vedle sebe | Read/Grep |
| **M2** | Kontrakt typů — FE typ ↔ BE DTO (název, enum, typ) | skill `type-sync` |
| **M3** | Existující test — spustit relevantní vitest/jest validační test | `vitest` / `jest` |
| **M4** | **Round-trip** — write → GET → diff hodnoty (A→B→A u variant) | `jest` e2e / ruční |
| **M5** | **Red-team payload** — pošli pole navíc / mimo enum / přes limit / špatný typ; sleduj 400 vs drop vs uložení | ruční request / `jest` |
| **M6** | Baseline — `audit:routes`, `tsc --noEmit` (FE+BE), `export-schemas` diff | npm scripty |

## Úrovně jistoty (L1–L4)

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno (M1) — pravidla *vypadají* shodně | nejslabší |
| **L2** | kontrakt ověřen (M2) — název/typ/enum sedí staticky napříč 3 vrstvami | strukturální |
| **L3** | existující test pokrývá pole a je zelený (M3) | chování zajištěno |
| **L4** | **round-trip (M4) nebo red-team payload (M5)** prokázal, že pole přežije / rozpor je ošetřen | trvalá pojistka |

**Cíl:** běžná pole na **L2+**; pole s rizikem **tiché ztráty** (`WL`/`NM`, P1/P3) a **per-system** (P4)
na **L3+**; kritická (data uživatelů na živém serveru) přes round-trip **M4** na **L4**.

---

## Baseline — health checks

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| `npm run audit:routes` | FE | ⬜ ověřit | jen existence FE↔BE, **ne payload** |
| `tsc --noEmit` | FE+BE | ⬜ ověřit | FE `build`/`tsc -b` pre-existing rozbitý (paměť) → měř `--noEmit` |
| `npm run export-schemas` (diff) | FE→BE | ⬜ ověřit | jsou BE `assets/schemas/` v sync s FE JSON? |
| validační vitest/jest | FE+BE | ⬜ ověřit | `validateSystemStats.test.ts` aj. |

⚠️ **Pasti prostředí (z paměti):**
- **Po BE změně DTO/schema nutný restart** (`nest --watch`) — FE refresh nestačí, drží starý bundle (`feedback_be_restart_required`).
- **`forbidNonWhitelisted:true`** (PC-07, `main.ts:55`, akt. 2026-06-20) → neznámá/přejmenovaná pole vrátí **400** (NE tichý drop). `whitelist:true` tedy už nedropuje tiše.
- FE `tsc -b` rozbitý → `tsc --noEmit` (`project_fe_build_preexisting_errors`).
- FE vitest `--project '!storybook'`; FE **nikdy prettierem** (`feedback_fe_no_prettier`).
- Změna FE per-system JSON bez `export-schemas` → BE validuje proti staré kopii.

---

## Seed kandidáti (z porovnání průzkumu — k ověření, ne potvrzeno)

> Stejně jako `K-R*` v role-planu — hypotézy z prvního čtení, verdikt až při exekuci oblasti.

- **K-F1** `RG` — **username regex drift:** FE žádost o username `/^[a-z0-9-]+$/` (lowercase, pomlčka)
  vs BE `RegisterDto` `@Matches(/^[^@]+$/)` (jen zákaz `@`). FE výrazně přísnější → registrace pustí
  `Foo Bar`, ale change-request ne. Oblast 01/02.
- **K-F2** `LN` — **displayName délka:** FE profile `headerSchema` `max(64)` vs BE `UpdateUserDto`
  `@MaxLength(32)`. 33–64 znaků: FE OK → BE 400. Oblast 02.
- **K-F3** `LN`/`RG` — **currency code:** FE `/^[A-Z0-9]{1,8}$/` + unique superRefine; BE DTO/schema
  validace neověřena průzkumem → možný `WL` (drop) nebo chybějící server-side limit. Oblast 09.
- **K-F4** `RQ` — **password min:** FE login `min(1)`, register `min(6)`, reset `min(8)`; BE register
  `@MinLength(6)`. Reset-password BE práh neověřen → drift 8 vs ? Oblast 01.
- **K-F5** `WL`/`NM` — **chat channel `type`/`imageUrl`:** FE inline (maxLength jen HTML attr), BE DTO
  `@MaxLength(32)`/`@MaxLength(512)` + mapper — ověřit, že FE jméno pole = DTO = schema = mapper. Oblast 06.
- **K-F6** `EN` — **PAGE_TYPES / accessMode / kind / scope:** každý enum existuje na 2–3 místech
  (FE literal, BE `@IsIn`, DB `enum`) — ověřit množinovou shodu (oblasti 03/04/05/06/07).

---

## Index oblastí

| # | Oblast | Jádro povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Konvence & cross-cutting](00-cross-cutting.md) | ValidationPipe whitelist, export-schemas pipeline, optimistic lock `expectedUpdatedAt`, naming konvence, sanitizace pipeline, 3 FE styly | `WL` `NM` `SAN` · P1 P3 P5 |
| 01 | [Auth](01-auth.md) | register/login/reset/forgot: email, username, password, captcha, passwordConfirm | `RQ` `LN` `RG` `XF` · P3 |
| 02 | [User profile](02-user-profile.md) | UpdateUserDto: displayName, bio, city, characterName, chatColor hex, privacy enumy, themeId, avatar delete | `LN` `RG` `EN` `WL` `NL` · P1 |
| 03 | [Worlds](03-worlds.md) | create/update world, settings: name, slug, maxPlayers, accessMode, system, themeId, themeBackgroundUrl, calendars[] | `RQ` `LN` `EN` `RN` `NL` · P1 |
| 04 | [Pages](04-pages.md) | create/update page + nested (sections/gallery/videos/menu/AKJ/table), type PAGE_TYPES, rich content | `EN` `WL` `TY` `SAN` · P1 P5 |
| 05 | [Characters](05-characters.md) | create/update: slug, name, kind enum, isNpc, diaryData | `RQ` `EN` `WL` · P1 P2 |
| 06 | [Chat](06-chat.md) | channel/group/message: name, accessMode, allowedRoles[], type, imageUrl | `LN` `EN` `WL` `NM` · P1 |
| 07 | [Bestiae](07-bestiae.md) | create/update/clone + systemStats: scope, systemId, name, notes, abilities[] | `RQ` `LN` `EN` · P4 |
| 08 | [Maps & tokens](08-maps.md) | create map, token ops + systemStats, config, fog, isLocked | `WL` `TY` · P1 P4 |
| 09 | [Events & misc](09-events-misc.md) | game-event (groupOnly), timeline, currency, ikaros news/event, sound | `RQ` `LN` `RG` `RN` `XF` `SAN` · P2 P5 |
| 10 | [Per-system schémata](10-per-system.md) | 6 systémů × entityTypes JSON ↔ BE assets parita, soft-mode, version | `EN` `RQ` `RN` · P4 |

---

## Legenda statusů

- ⬜ netestováno
- ✅ ověřeno OK (`✅L2` drží i úroveň jistoty)
- 🐛 nalezen rozpor → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`)
- ⚠️ podezřelé / nejisté / dluh
- ⏭️ blokované nebo `[human]`

---

## Pracovní postup

1. **Baseline** — `audit:routes` + `tsc` + `export-schemas` diff + validační testy; zapsat stav.
2. **Inventura pole na zdroj** (`WL`/P1) — pro každou entitu vypiš **soupis polí** a u každého
   4 místa (DTO / schema / mapper / FE). Chybějící místo = okamžitý `WL` kandidát.
3. **Oblast po oblasti** — tabulka **pole × vrstva** (FE / DTO / DB), buňka = pravidlo (`req`, `max64`,
   `enum[...]`, `—`). Pod tabulkou **delta** — každé pole, kde se vrstvy liší.
4. **Delta → `F-xx`.** Pořadí dle dopadu: **tichá ztráta hodnoty první** (`WL`/`NM` ztratí pole,
   `SAN`/`NL` ztratí obsah — riziko dat na živém serveru), pak `RQ`/`LN`/`RN`/`EN`/`XF` (400/UX),
   pak `RG`/`DF`/`TY` (drift).
5. **Round-trip (M4)** na pole s rizikem ztráty → L4. **Red-team payload (M5)** na enum/limit hranice.
6. **Per-system (P4)** — parita 6 systémů + `export-schemas` sync. **Sanitizace (P5)** na rich-text pole.
7. **Nález → `F-xx`** s `soubor:řádek` všech vrstev + návrhem + **povinnou kolonkou „Dopad na existující
   data"**; **neopravovat tiše** (pravidlo projektu). ⚠️ **Opravy na živém serveru** (DB schema, required,
   enum, kratší limit) mohou rozbít existující dokumenty — zpřísnění bez migrace = rozbitá stará data.
