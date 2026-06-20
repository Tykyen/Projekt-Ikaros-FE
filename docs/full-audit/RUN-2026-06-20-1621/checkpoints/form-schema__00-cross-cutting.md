# form-schema / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem VŠECHNY XC-xx kontrolní body z `00-cross-cutting.md`:

- **XC-01** ValidationPipe (`main.ts:52-60`) — ověřen, `forbidNonWhitelisted:true` zapnuto ✅
- **XC-02** export-schemas pipeline — 17/17 párů spot-check diff (drd2-bestie, fate-token, matrix-bestie = prázdný diff) ✅
- **XC-03** `audit:routes` — baseline, nepoužit pro payload (správně)
- **XC-04** Sanitizace `sanitizeRichText` — timeline ✅ (F-02 fix), ikaros-news ✅ (F-10 fix), pages/sections/table/akjTabs ✅; ikaros-articles ✅; ikaros-discussions ✅. **NOVÝ NÁLEZ: `customData` (Noviny typ) — viz F-RUN-02.**
- **XC-05** Optimistic lock `expectedUpdatedAt` — pages + characters: ověřeno (`_ignored` destruktura, test v `characters.service.spec.ts`). ✅
- **XC-06** Tři FE validační styly — inventura OK, žádná nová kategorie
- **XC-07** `transform:true` coercion — žádný nový drift nalezen L1
- **XC-08** Naming/whitelist drift — kontrolováno u nových DTOs (honeypot `hp`, AKJ `locked`, `overridePageSlug`, push subscribe, TOTP) — vše v pořádku. **NOVÝ NÁLEZ (nízká závažnost): `totpDisableSchema` vs `PasswordConfirmDto` — viz F-RUN-03.**

Nové DTOs od posledního sweepus (2026-06-05) dle `git log`:
- `register.dto.ts` — honeypot `hp` přidán, FE `registerSchema.ts` má `hp: z.string().max(0).optional()` = shoda ✅
- `enable-totp.dto.ts` / `login-totp.dto.ts` / `password-confirm.dto.ts` — FE typy sedí (F-RUN-01 ověřena) ✅ (+ F-RUN-03 drift viz níže)
- `create-message.dto.ts` — `overridePageSlug` přidán, FE `useWorldChat.ts:83` + `types.ts:54` ✅
- `subscribe.dto.ts` — `oldEndpoint` přidán, FE `usePush.ts:74` posílá ✅
- `create-page.dto.ts` — `AkjTabDto.locked` přidán jako `@IsOptional @IsBoolean`, `sanitizeAkjTabs` ho zahazuje před persistem ✅
- `update-user.dto.ts` — `displayName @MaxLength(32)` sjednoceno s FE (F-24) ✅
- `update-favorite-pages.dto.ts` — `slugs` s `@ArrayMaxSize(100)` + `@Matches`, FE `MAX_FAVORITE_PAGES=100` ✅
- `create-weather-generator.dto.ts` — `monthlyTemps/monthlyStdDev/climateZone` přidány (forbidNonWhitelisted fix) ✅ (vedlejší `cloudRange`/`precipRange` TY issue = oblast 08+)
- `update-member.dto.ts` / `update-world-settings.dto.ts` — bez nových NM/WL driftů L1 ✅

XC-D5 komentář drift (`registry.ts:10` — `shared/schemas/` + `pnpm`): stále přítomen, neOpraveno.

## Dosažená L vs cílová L

- XC-01: L2 (staticky ověřen kód) vs cíl L2 ✅
- XC-02: L2 (content diff 3 párů z 17, stejný stav jako před) vs cíl L2 ✅ (L4 by vyžadoval `npm run export-schemas` + git diff — PROOF-REQUEST)
- XC-04: L2 (čtení kódu) vs cíl L2; F-RUN-02 = nález L1 (čtení)
- XC-05: L3 (existující testy) vs cíl L2 ✅
- Nové DTOs: L1-L2 vs cíl L2 ✅ (F-RUN-03 = L1 nález)

Celkově oblast: **L2 dosažena**, L3-L4 vyžaduje živou infrastrukturu → PROOF-REQUEST.

## Nálezy

### F-RUN-02 — `SAN` Page `customData` (typ Noviny) bez sanitizace, render přes `dangerouslySetInnerHTML` 🆕

- **Pole / entita:** `customData` v `Page` (typ Noviny, klíče Stát/Vydavatel/Datum/Číslo vydání/Šéfredaktor)
- **FE:** `CustomDataPanel.tsx` vyplňuje hodnoty přes `SmartCellInput` (TipTap StarterKit min. sada — text + `<a>`, cleanHtml stripuje vnější `<p>`). Render: `NovinyLayout.tsx:66` `dangerouslySetInnerHTML={{ __html: value }}` bez DOMPurify.
- **BE DTO:** `create-page.dto.ts:293-295` — `@IsOptional() @IsObject() customData?: Record<string, string>` — žádná HTML sanitizace.
- **BE service:** `pages.service.ts` — `create()` i `update()` — `customData` jde přes `...dto` / `...persistDto` spread **bez** přepisu sanitizovanou verzí. Kontrast: `content`, `sections`, `table`, `akjTabs` mají explicitní `sanitizeRichText` / `sanitizeTable` / `sanitizeAkjTabs` voláni. `customData` bylo vynecháno.
- **DB:** `page.schema.ts:52` — `@Prop({ type: Object, default: {} }) customData?: Record<string, string>` — plain string, žádná DB omezení.
- **Rozpor / riziko:** přímý `POST /api/worlds/:wId/pages` nebo `PATCH` s `customData: { "Stát": "<img src=x onerror=alert(1)>" }` uloží payload nesanitizovaný. Při render viewer každé stránky typu Noviny tento obsah spustí (stored XSS). Rozsah: PomocnyPJ+ může editovat stránky, tj. každý člen s PomocnyPJ rollou v daném světě.
- **Poznámka ke SmartCellInput:** TipTap StarterKit neumožňuje vložit `<script>` přes UI, ale přes přímé API volání projde libovolný string. `forbidNonWhitelisted:true` nescreenuje obsah hodnoty — jen klíče objektu DTO.
- **Dopad na existující data:** existující stránky Noviny mohou nést nesanitizovaný obsah z dob před zavedením sanitizace (pokud byl obsah vkládán přes copy-paste nebo API). BE-side fix je idempotentní (jako u F-02 timeline: sanitizace read-time je druhá obrana bez nutnosti migrace). **Žádná migrace dat nutná** — read-time sanitizace (nebo DOMPurify na FE) ochrání i stará data.
- **Návrh:** (1) BE `pages.service.ts` v `create()` i `update()` přidat `customData` sanitizaci analogicky k `table` — `sanitizeCustomData(dto.customData)` funkce procházející `Object.entries()` a aplikující `sanitizeRichText` na každou hodnotu; (2) volitelně DOMPurify v `NovinyLayout` jako druhá obrana (vzor F-02 fix v `TimelineEventCard`). Priorita: **🔴 high** (stored XSS, stejná třída jako F-02).
- **Kde:** `pages.service.ts:241-258` (create spread) · `pages.service.ts:383-403` (update patch spread) · `NovinyLayout.tsx:66` (render) · `create-page.dto.ts:293-295` (DTO) · `page.schema.ts:52` (DB)
- **L1** · 🆕

---

### F-RUN-03 — `LN` `totpDisableSchema` FE `min(1)` vs BE `PasswordConfirmDto @MinLength(6)` 🆕

- **Pole / entita:** `password` v 2FA disable/backup-regen flow
- **FE:** `profileSchemas.ts:56-58` — `totpDisableSchema = z.object({ password: z.string().min(1, 'Zadej heslo') })`. Validuje jen neprázdnost.
- **BE DTO:** `password-confirm.dto.ts:7` — `@IsString() @MinLength(6) password: string`. Endpoints: `POST /auth/2fa/disable` a `POST /auth/2fa/backup-codes/regenerate` (oba přes `PasswordConfirmDto`).
- **Dopad:** V praxi nereálný — registrace vyžaduje `@MinLength(6)`, change-password `@MinLength(8)` → žádný aktivní uživatel nemá heslo kratší než 6 znaků. Přesto: FE neinformuje uživatele o délkovém požadavku; u 1-5 znakového hesla FE formulář projde → BE vrátí 400 „Pole „password" je příliš krátké." (UX matení).
- **Dopad na existující data:** žádný.
- **Návrh:** sjednotit FE na `z.string().min(6, 'Minimálně 6 znaků')` (nebo `min(8)` pokud se chce sjednotit s change-password). **Priorita: 🟡 nízká** (nereálný scénář).
- **Kde:** `profileSchemas.ts:57` · `password-confirm.dto.ts:7`
- **L1** · 🆕

---

### F-RUN-04 — `WL`/doc XC-D5 FE registry.ts stale komentář ♻️

- **Pole:** komentář `registry.ts:10` — `shared/schemas/` + `pnpm export-schemas`
- **Skutečnost:** `assets/schemas/` + `npm run export-schemas`
- **Dopad:** jen dokumentace, kód funguje správně. BE `schema-registry.service.ts:4-5` byl opraven (správně říká `assets/schemas/` + `npm`), FE zůstal pozadu.
- **Kde:** `src/features/world/tactical-map/schemas/registry.ts:10`
- **Stav:** 🟡 ⚖️ (zaznamenáno již jako XC-D5, zůstává neOpraveno) · ♻️

## PROOF-REQUEST

1. **XC-02 export-schemas sync (L4):** spustit `npm run export-schemas` + `git diff backend/assets/schemas/` v CI → prázdný diff = SYNC garantovaný. Statické porovnání 3/17 párů proběhlo (prázdný diff), ale 14/17 zůstalo bez diff ověření v tomto běhu.

2. **F-RUN-02 round-trip XSS proof (M5):** přímý `PATCH /api/worlds/:worldId/pages/:slug` s `customData: { "Stát": "<img src=x onerror=alert(1)>" }` → GET → ověřit, zda payload přežije do DB bez sanitizace a při zobrazení NovinyLayout dojde ke spuštění. (READ-ONLY audit nespouštěl živé requesty.)

3. **XC-05 optimistic lock — jiné write-heavy entity (M5):** Pages + Characters mají optimistic lock; `WorldSettings` (velký PATCH) + `MapToken` ops nemají. Zda je to záměr nebo díra — vyžaduje analýzu business logiky (mimo scope cross-cutting, spíše oblast 03/08).
