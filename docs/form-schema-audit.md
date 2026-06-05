# Form-schema audit — registr nálezů (FE validace ↔ BE DTO ↔ DB model)

> Centrální registr nálezů z [`form-schema-plan/`](form-schema-plan/README.md). ID `F-xx`.
> Sourozenec [`bug-audit.md`](bug-audit.md) (logika), [`ws-audit.md`](ws-audit.md) (real-time)
> a [`role-audit.md`](role-audit.md) (oprávnění), ale výhradně pro **kontrakt tvaru dat**:
> říká FE validace, BE DTO i DB model o každém poli totéž? (required, délka, enum, název, formát, rozsah, typ, default)
>
> **Stav: sweep DOKONČEN 2026-06-05 — 28 nálezů (F-01…F-28), z toho 4× 🔴.**

---

## TL;DR (2026-06-05)

> Plán [`form-schema-plan/`](form-schema-plan/README.md) **KOMPLETNÍ** — 11 oblastních souborů (00–10)
> napsáno, 12 os (`RQ` `LN` `EN` `NM` `RG` `RN` `TY` `DF` `WL` `SAN` `XF` `NL`), 5 perspektiv (P1 plný
> průchod + rekurze · P2 round-trip · P3 soft-fail vs hard-fail · P4 per-system parita · P5 sanitizace).
> **Sweep DOKONČEN** — všech 11 oblastí projito (5 agentů + oblasti 02/09 a všechna 🔴 ověřeny přímým
> čtením). **28 nálezů `F-01…F-28`** (4× 🔴, 6× 🟠, 18× 🟡), 3 kandidáti vyvráceni. Token mapper drží
> (D-066 ok), per-system FE↔BE 1:1 mirror, export-schemas 17/17 sync.
>
> **Čtyři 🔴 k okamžité opravě (root cause = form-schema, ne logika):** F-02 aktivní stored XSS v timeline
> (`text` bez sanitizace + render `dangerouslySetInnerHTML`), F-03 GDPR `acceptedTerms` jen FE, a **dva
> rozbité user-flow stejné třídy** — F-01 reset hesla (FE `newPassword` ↔ DTO `password` → 400) a F-27
> změna username (FE `requestedUsername` ↔ DTO `newUsername` → 400). **Žádný nález nevyžaduje migraci dat.**
>
> 🔁 **Systematický vzor (F-01 + F-27):** FE pojmenuje pole jinak než BE DTO → `whitelist:true` ho zahodí
> → povinné pole chybí → 400, user-flow tiše nefunkční. Doporučení u oprav: přidat **kontraktový test**
> FE payload ↔ DTO klíče (zabrání další regresi téhož typu napříč všemi flow).
>
> ---
>
> ✅ **STAV OPRAV (2026-06-05): 26/28 opraveno + ověřeno; 2 ponechány jako vědomý dluh.** Žádný commit
> (čeká na uživatele), žádný deploy. Ověření: **BE** `tsc` 0 · `jest` 763 passed (dotčené moduly) · prettier;
> **FE** `tsc` 0 · vitest kontraktové F-01/F-27 2 passed · eslint 0.
> - **4× 🔴 + 6× 🟠 + 16× 🟡 opraveno.** Kontraktové testy přidány pro F-01/F-27 (`useResetPassword.spec.tsx`, `useRequestUsernameChange.spec.tsx`).
> - **Ponecháno (🟣 vědomý dluh):** **F-12** (sound `youtubeUrl` BE regex — riziko false-reject validních YT variant) · **F-15** (sections `isCollapsed` default — latentní, FE vždy posílá; změna by ovlivnila jen legacy doc). **F-26** = ⚖️ by-design (generic fallback). **F-25** byl už opraven dříve.
> - **Rozhodnutí „za uživatele" (k revizi):** F-03 `termsVersion='2026-06-05'` (konstanta) · F-07 `imageUrl` clear přes `@ValidateIf(v!==''&&v!==null)+@IsUrl` (zachová URL guard pro neprázdné) · F-11 game-event `confirmable` DB default `false→true` (align na FE/UI) · F-23 username change regex **ponechán** přísnější slug (jen opraven lživý komentář; kanonické sjednocení register↔change je větší rozhodnutí).
>
> ⚠️ **Kontext deploymentu:** Ikaros teď běží na serveru → drift tvaru dat = **reálné riziko ztráty
> dat uživatelů** (whitelist drop) nebo 400 pro živé requesty. Proto má tenhle audit prioritu na osách
> `WL`/`NM` (tichá ztráta) před kosmetickými drifty. Opravy DB modelu nutno koordinovat s migrací.

| ID | Záv. | Oblast | Podstata | Stav |
|---|---|---|---|---|
| **F-01** | 🔴 | 01 | reset hesla: FE `newPassword` ↔ DTO `password` → **400 vždy**, reset z emailu nefunkční | ✅ opraveno |
| **F-02** | 🔴 | 09 | timeline `text` **aktivní stored XSS** (BE bez sanitizace + FE `dangerouslySetInnerHTML`) | ✅ opraveno |
| **F-03** | 🔴 | 01 | `acceptedTerms` GDPR souhlas jen FE, BE nezaznamená (whitelist drop) | ✅ opraveno |
| **F-27** | 🔴 | 02 | změna username: FE `requestedUsername` ↔ DTO `newUsername` → **400 vždy** (stejná třída jako F-01) | ✅ opraveno |
| **F-04** | 🟠 | 09 | currency `code/name/symbol/rate` — BE jen `@IsString`/bez max; FE jediná pojistka | ✅ opraveno |
| **F-05** | 🟠 | 03 | world **update** DTO bez délkových limitů (`name`/`description`/`playersWanted`) | ✅ opraveno |
| **F-06** | 🟠 | 03 | world `slug` bez `@Matches` na žádné vrstvě (FE slugify jediná pojistka) | ✅ opraveno |
| **F-07** | 🟠 | 03 | world `imageUrl` smazání pošle `''`, update `@IsUrl()` → **400** (nelze smazat titulku) | ✅ opraveno |
| **F-08** | 🟠 | 09 | game-event `groupOnly` bez `@ValidateIf` na BE → akce cílí na nikoho/všechny | ✅ opraveno |
| **F-09** | 🟠 | 07 | bestie `imageUrl` bez délkového limitu (žádná vrstva) | ✅ opraveno |
| F-10…F-28 | 🟡 | různé | drift / latentní / dead-code — viz sekce **Nálezy** | ✅ (mimo F-12/F-15 🟣 dluh, F-26 ⚖️) |

---

## Kandidáti z plánovací inventury (⬜ neověřeno — verdikt až sweep)

> Hypotézy z čtení obou repů při psaní plánu (já + 5 agentů). **Nejsou to nálezy** — jsou to místa,
> kde vrstvy *na první pohled* nesedí. Sweep každý povýší na `🐛 F-xx`, `✅ shoda` nebo `⚖️ by-design`.
> Body ověřené mým přímým čtením mají `[ja]`, z agentní inventury `[ag]` (k doověření při sweepu).

**🔴 Vysoké (tichá ztráta / compliance):**

| ID | Osa | Oblast | Podstata | Zdroj |
|---|---|---|---|---|
| **K-F7** | `NM`/`WL` | 01 | reset hesla: `auth/reset-password` má pole `password`, `users/reset-password` má `newPassword`; FE posílá `newPassword` → při špatném endpointu `whitelist` heslo **tiše zahodí** = reset selže bez chyby | `[ag]` AU-11 |
| **K-F8** | `RQ`/`XF` | 01 | `acceptedTerms` (GDPR souhlas) FE vynutí `refine`, BE DTO pole **nemá** → souhlas se nikde nezaznamená | `[ag]` AU-05 |
| **K-F9** | `SAN` | 09 | ikaros news `content` ukládá BE **bez `sanitize-html`** (na rozdíl od článků/diskusí) → uložené XSS; stejná třída `timeline text` | `[ag]` EV |
| **K-F10** | `WL`/`NM` | 06 | `groupId` není v `CreateChannelDto`, ale FE create payload ho posílá → `whitelist` drop riziko | `[ag]` CT-06 |

**🟠 Střední (400 / UX / parita):**

| ID | Osa | Oblast | Podstata | Zdroj |
|---|---|---|---|---|
| **K-F2** | `LN` | 02 | displayName: FE `max(64)` vs BE `@MaxLength(32)` → 33–64 znaků = FE OK, BE 400 | `[ja]` UP-01 |
| **K-F11** | `EN` | 03 | accessMode: create-wizard FE typ jen 3 (`public/open/private`), DTO `@IsIn` 4 (+`closed`), DB `@Prop` bez `enum` | `[ag]` WO-05 |
| **K-F12** | `LN`/`RG` | 03 | create vs update world DTO drift: update postrádá délkové limity (`name`/`description`/`slug` chybí), `imageUrl` `@IsUrl`↔`@IsString` | `[ag]` WO-01.. |
| **K-F13** | `NM` | 03 | payload `defaultCalendarSlug` ↔ DB `defaultCalendarConfigSlug` (jiný název) → vyžaduje service mapping | `[ag]` WO-15 |
| **K-F3** | `RG`/`LN` | 09 | currency `code`: FE `/^[A-Z0-9]{1,8}$/` + unique, BE `@IsString` **bez** formátu/délky/unique → FE jediná pojistka; navíc 2 BE definice měny | `[ag]` EV |
| **K-F6** | `EN` | 03–07 | enumy na 2–3 místech (PAGE_TYPES, accessMode, kind, scope); DB `@Prop` často **bez** `enum` constraintu | `[ag]` |

**🟡 Nízké (drift / dead code):**

| ID | Osa | Oblast | Podstata | Zdroj |
|---|---|---|---|---|
| **K-F1** | `RG` | 01/02 | username: 3 různá pravidla (register `/^[^@]+$/` ↔ change FE `/^[a-z0-9-]+$/` ↔ change BE `/^[^@]+$/`), FE komentář tvrdí falešnou shodu | `[ja]` UP-06 |
| **K-F4** | `RQ`/`XF` | 01 | password min nejednotné: register 6 vs reset/change 8 (vrstvy FE↔BE sedí, policy ne) | `[ja]` AU-03/11 |
| **K-F5** | `LN`/`NM` | 06 | chat `name` `maxLength` jen HTML attr; `accessMode`/`type`/`imageUrl` jména napříč 4 místy | `[ag]` CT |
| **K-F14** | `EN`/`WL` | 05 | character `kind` enum (DTO/DB) vs FE `CreateCharacterInput.isLocation:boolean`; `useCreateCharacter` se nikde nevolá (dead code?) | `[ag]` CH-05 |
| **K-F15** | `WL` | 05 | `CreateCharacterDto` deklaruje legacy `imageUrl/publicBio/...`, schema je po 9.1 nemá → tichá ztráta + matoucí kontrakt | `[ag]` CH |
| **K-F16** | `LN` | 04/07 | žádný server-side max: pages `title` (`@IsString` bez `@MaxLength`), bestie `imageUrl` (bez limitu/`@IsUrl`) | `[ag]` PG-03/BE-05 |
| **K-F17** | `TY` | 06/09 | nevalidované array prvky: chat scheduled `attachments` (`@IsArray` nad `unknown[]`), bestie `abilities[]` | `[ag]` CT-31/BE-07 |

---

## Baseline — health checks

| Check | Repo | Výsledek | Pozn. |
|---|---|---|---|
| `npm run audit:routes` | FE | ✅ exit 0 | jen existence FE↔BE, **ne payload** |
| `tsc --noEmit` | FE+BE | ✅ FE 0 / BE 0 | `tsc -b` pre-existing rozbitý → měřeno `--noEmit` |
| `npm run export-schemas` (sync) | FE→BE | ✅ 17/17 identických | obsahová shoda FE JSON ↔ BE `assets/schemas/` (sha256) |
| validační testy (vitest/jest) | FE+BE | ⬜ (před opravami) | `validateSystemStats.test.ts` aj. |

---

## Nálezy (detailně)

> Oblastní delta parity s plnými `soubor:řádek` jsou v [`form-schema-plan/NN-*.md`](form-schema-plan/).
> Zde konsolidace + globální `F-xx`. Pořadí dle dopadu.

### 🔴 F-01 — `NM`/`WL` reset hesla z emailu je rozbitý (FE `newPassword` ↔ DTO `password`) 🐛

- **Pole / entita:** `newPassword` v reset-password flow (`POST /auth/reset-password`).
- **FE:** [useResetPassword.ts:24](form-schema-plan/01-auth.md) posílá `{ token, newPassword }` · **BE DTO:** `auth/reset-password.dto.ts` přijímá `{ token, password }` ([auth.controller.ts:156](../Projekt-ikaros/backend/src/modules/auth/auth.controller.ts#L156) → `resetPasswordByToken(dto.token, dto.password)`).
- **Rozpor:** `newPassword` není v DTO → `whitelist:true` ho **zahodí**; `password` chybí → `@IsString @MinLength(8)` selže → **400 pokaždé**. Reset hesla z emailu nelze dokončit. (Druhý DTO `users/reset-password.dto.ts` má `newPassword`, ale ten patří k jinému, self-flow endpointu.)
- **Dopad na existující data:** žádný (čistě request kontrakt).
- **Návrh:** sjednotit jméno pole — buď FE poslat `password`, nebo DTO přejmenovat na `newPassword`. **Doporučení:** FE → `password` (1 řádek, sedne na controller). + regresní test reset flow. **Priorita 1 (uživatelé na serveru si nemohou resetovat heslo).**

### 🔴 F-02 — `SAN` timeline `text` aktivní stored XSS 🐛

- **Pole / entita:** `text` v `TimelineEvent`.
- **FE render:** [TimelineEventCard.tsx:184](../Projekt-ikaros-FE/src/features/world/pages/TimelinePage/components/TimelineEventCard.tsx#L184) `dangerouslySetInnerHTML={{ __html: event.text }}` — **bez DOMPurify** · **BE:** timeline service `text` ukládá **raw** (grep `saniti` v modulu = 0; jen `@MaxLength(50000)`) · **DB:** `required maxlength:50000`.
- **Rozpor:** writer (PomocnyPJ+) vloží `<img src=x onerror=…>`/`<script>` → uloží se nesanitizované → **spustí se každému, kdo zobrazí timeline světa** = aktivní stored XSS. Kontrast: pages/articles/discussions přes `sanitizeRichText` čistí, timeline ne.
- **Dopad na existující data:** ✅ **zkontrolovat** — existující timeline texty mohou nést payload; po nasazení sanitizace na render (DOMPurify) je čtení bezpečné i pro stará data; sanitizace na write + jednorázový sweep existujících doporučen.
- **Návrh:** (1) BE `sanitizeRichText(text)` v timeline service (jako pages); (2) FE `DOMPurify.sanitize` ve `TimelineEventCard` jako druhá obrana. **Priorita 1 (bezpečnost).**

### 🔴 F-03 — `RQ`/`XF` GDPR souhlas `acceptedTerms` se nezaznamenává 🐛

- **Pole / entita:** `acceptedTerms` v registraci.
- **FE:** [registerSchema.ts:21](../Projekt-ikaros-FE/src/features/auth/lib/registerSchema.ts#L21) `refine(v===true)` + odešle · **BE DTO:** `register.dto.ts` pole **nemá** · **BE service:** [auth.service.ts:79-122](../Projekt-ikaros/backend/src/modules/auth/auth.service.ts#L79) `register` ukládá usera bez souhlasu, žádný consent log.
- **Rozpor:** `whitelist:true` `acceptedTerms` zahodí; souhlas existuje jen jako FE gate. **Žádný server-side doklad, že uživatel souhlasil** (GDPR/compliance riziko — nedokazatelné).
- **Dopad na existující data:** žádný; pokud se přidá perzistence, existující účty bez záznamu (backfill / grandfathering dle právního rozhodnutí).
- **Návrh:** přidat `acceptedTerms` do DTO + zaznamenat consent (timestamp + verze podmínek) na User nebo do audit logu. **Priorita 1 (compliance) — vyžaduje i právní rozhodnutí, co a jak dlouho uchovávat.**

### 🔴 F-27 — `NM`/`WL` změna username je rozbitá (FE `requestedUsername` ↔ DTO `newUsername`) 🐛

- **Pole / entita:** `requestedUsername` v username-change request (`POST /users/me/username-request`).
- **FE:** [useAdminUsers.ts:30-33](../Projekt-ikaros-FE/src/features/admin/users/api/useAdminUsers.ts#L30) posílá body `{ requestedUsername }` · **BE DTO:** `RequestUsernameChangeDto` má `newUsername` ([users.controller.ts:256](../Projekt-ikaros/backend/src/modules/users/users.controller.ts#L256) → `requestUsernameChange(requester.id, dto.newUsername)`).
- **Rozpor:** `requestedUsername` whitelist zahodí; `newUsername` chybí → `@IsString @MinLength(3)` selže → **400 pokaždé**. Žádost o změnu username nelze podat. **Identická třída jako F-01** (FE jméno pole ≠ DTO jméno → drop → 400).
- **Dopad na existující data:** žádný (request kontrakt).
- **Návrh:** sjednotit jméno — FE poslat `newUsername` (nebo DTO `requestedUsername`). **Priorita 1 (rozbitý user-flow na serveru).** + společný kontraktový test pro F-01/F-27.

### 🟠 Střední

- **F-04** `RG`/`LN`/`RN` — **currency** `WorldCurrencyItemDto` ([:13-16](../Projekt-ikaros/backend/src/modules/world-currencies/dto/update-world-currencies.dto.ts#L13)) `code/name/symbol` jen `@IsString`, `rate @Min(0.0001)` bez max; FE [validation.ts](../Projekt-ikaros-FE/src/features/world/currencies/validation.ts) má `/^[A-Z0-9]{1,8}$/`+unique+délky+`max(1M)`. Přímý request projde. **Data:** zkontrolovat legacy měny před zpřísněním. Návrh: zrcadlit FE pravidla do DTO, unique v service.
- **F-05** `LN` — **world update** DTO ([update-world.dto.ts:26-31](../Projekt-ikaros/backend/src/modules/worlds/dto/update-world.dto.ts#L26)) postrádá `@MaxLength` u `name`/`description`/`playersWanted` (create je má). PATCH nadlimitních se uloží. Návrh: doplnit limity do update DTO.
- **F-06** `RG` — **world slug** bez `@Matches` na DTO i schema; FE `useWorldSlug` slugify jediná pojistka. Přímý POST `Foo Bar`. Návrh: `@Matches(/^[a-z0-9-]+$/)` do create/update DTO.
- **F-07** `RG`/`NL` — **world imageUrl** smazání pošle `''`, update `@IsUrl()` ([:28](../Projekt-ikaros/backend/src/modules/worlds/dto/update-world.dto.ts#L28)) ho odmítne → **400**, titulku nelze smazat (`themeBackgroundUrl` clear-workaround má, `imageUrl` ne). Návrh: `@ValidateIf(o=>o.imageUrl!=='')` nebo `@IsUrl()` + povolit `''`.
- **F-08** `XF` — **game-event groupOnly** ([create-game-event.dto.ts:73](../Projekt-ikaros/backend/src/modules/game-events/dto/create-game-event.dto.ts#L73)) `@IsOptional @IsBoolean` bez `@ValidateIf` vztahu k `targetGroup`; FE refine vynutí. `{groupOnly:true, targetGroup:null}` projde → špatné cílení. FE komentář „BE i FE validace" lživý. Návrh: `@ValidateIf(o=>o.groupOnly) @IsNotEmpty targetGroup`.
- **F-09** `LN` — **bestie imageUrl** ([create-bestie.dto.ts:31](../Projekt-ikaros/backend/src/modules/bestiae/dto/create-bestie.dto.ts#L31)) `@IsString` bez `@MaxLength` (kontrast chat `@MaxLength(512)`); clone kopíruje bez kontroly. Návrh: `@MaxLength(2048)`.

### 🟡 Nízké (drift / latentní / dead-code) — viz oblastní delta sekce

| ID | Osa | Oblast | Podstata | Pozn. |
|---|---|---|---|---|
| **F-10** | `SAN` | 09 | ikaros news `content` bez sanitizace, ale **nikde HTML render** → latentní (stane se XSS, až přibude render) | preventivně sanitizovat |
| **F-11** | `DF` | 09 | game-event `confirmable` FE `default(true)` ↔ DB `default false` | sjednotit default |
| **F-12** | `RG` | 09 | sound `youtubeUrl` BE `@IsString` (žádná YT validace) | nízká |
| **F-13** | `LN` | 09 | game-event `targetGroup` FE bez `max(64)` ↔ BE `@MaxLength(64)` | FE kosmetika |
| **F-14** | `LN` | 04 | pages `title` bez server-side max (FE jen HTML attr, DTO/DB bez limitu) | + váže F-16 |
| **F-15** | `DF` | 04 | sections `isCollapsed` DTO `default false` ↔ mapper `?? true` | latentní (legacy doc) |
| **F-16** | `LN` | 05 | character `name` bez server max (dědí z `Page.title`, F-14) | — |
| **F-17** | `EN`/`WL` | 05 | character `kind` enum ↔ FE `CreateCharacterInput.isLocation` — **dead code** (`useCreateCharacter` nevolán) | uklidit dead code |
| **F-18** | `WL` | 05 | `CreateCharacterDto` legacy `imageUrl/publicBio/…` — schema po 9.1 nemá → Mongoose strict drop; dnes nikdo neposílá | matoucí kontrakt |
| **F-19** | `TY` | 06 | scheduled `attachments` `@IsArray` nad `unknown[]`; cron job obejde ValidationPipe → uloží libovolný objekt do `ChatMessage` | red-team only |
| **F-20** | `TY`/`WL` | 07 | bestie `abilities[]` `@IsArray` bez `@ValidateNested` — prvky `{label,value}` nevalidované | red-team only |
| **F-21** | `TY` | 08 | map `config.size/originX/originY` `@IsOptional` bez `@IsNumber` (string by prošel; FE posílá number) | robustnost |
| **F-22** | `RN`/`TY` | 08 | token `q/r` range jen v `token.add/move`; `patch`/`fog.brush`/`revealedHexes` bez int/range | robustnost |
| **F-23** | `RG` | 01/02 | username **3 různá pravidla** (register `/^[^@]+$/` ↔ change FE `/^[a-z0-9-]+$/` ↔ change BE `/^[^@]+$/`) + **lživý FE komentář** o shodě | rozhodnout kanonické pravidlo |
| **F-24** | `LN` | 02 | displayName FE `max(64)` ↔ BE `@MaxLength(32)` → 33–64 znaků = FE OK, BE 400 | sjednotit na 32 |
| **F-25** | `WL` | 00 | stale komentář `schema-registry.service.ts:9` (`shared/schemas/`+`pnpm`) vs realita (`assets/schemas/`+`npm`) | jen dokumentace 🟣 |
| **F-26** | `EN` | 10 | generic-fallback asymetrie: FE `registry.get` má generic fallback, BE soft-mode skip | ⚖️ by-design |
| **F-28** | `RG` | 02 | chatColor: FE picker nepovinuje úplný 6-znak hex před submit (`#ABC`/`#` projde) ↔ BE `@Matches` → 400; drag picker OK | 🐛 |

### Vyvrácené kandidáty (sweep → ne nález)

- **K-F10** (chat `groupId` drop) → ⚖️ **by-design**: FE posílá `groupId` v **URL** (`/groups/:groupId/channels`), ne v body; DTO ho záměrně nemá, service derivuje `worldId` z group. Žádná ztráta.
- **K-F13** (world `defaultCalendarSlug` ↔ `defaultCalendarConfigSlug`) → ✅ **shoda**: service [worlds.service.ts:320-337](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L320) explicitně mapuje. Žádná ztráta.
- **K-F11** (world accessMode wizard 3 vs DTO 4) → ⚖️ **by-design**: `closed` dosažitelný přes settings; DTO `@IsIn` vynutí, zápis chráněn.

---

## Legenda

**Status:** ✅ opraveno · 🐛 potvrzeno · ⚖️ by-design · ⬜ navrženo/neověřeno · 🟣 dluh · ❌ vyvráceno
**Závažnost:** 🔴🔴 kritická (ztráta dat) · 🔴 vysoká · 🟠 střední (400/UX) · 🟡 nízká (drift) · ⚪ kosmetika
**Osy:** `RQ` required · `LN` délka · `EN` enum · `NM` název · `RG` formát/regex · `RN` rozsah · `TY` typ · `DF` default · `WL` průchod/mapper · `SAN` sanitizace · `XF` cross-field · `NL` prázdno/null

**Šablona nálezu** (vč. povinné migrační kolonky):
> ### F-xx — [osa] [krátký popis] [status]
> - **Pole / entita:** `<pole>` v `<entita>`
> - **FE:** `soubor:řádek` — pravidlo · **BE DTO:** `soubor:řádek` — pravidlo · **DB:** `soubor:řádek` — pravidlo
> - **Rozpor:** co se liší a co se reálně stane (400 / tichý drop / uložení nevalidní hodnoty)
> - **Dopad na existující data:** je nějaký dokument v produkční DB po opravě nevalidní? → migrace ano/ne
> - **Návrh:** … · **Stav:** ⬜
