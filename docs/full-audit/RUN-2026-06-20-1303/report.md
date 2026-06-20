# Plný audit — RUN 2026-06-20-1303 (FE 2a6c8e1c / BE 9cf98be)

Krok roadmapy **14.9** (dotáhnout běžící audity, opravit otevřené nálezy). Spuštěno přes skill `plny-audit`.
Rozsah: **všech 16 stylů** · hloubka: scannery + statické sweepy L1-L2 + census + META brána + **+e2e seed-scenario** (in-process replSet). `+db`/`+teeth`/`+formal` ⏭️ blokováno (viz níže).

## TL;DR
- **Čerstvé nálezy: 14** (🆕 11 / ♻️ 1 regrese / 🔓 2 stále otevřené z 14.9 inventury) · 🔴 0
- **1 oprava už hotová + ověřená**: ♻️ regrese e2e harness (14.7 world-export `archiver` ESM) → 21/21 e2e zelená.
- Coverage drift: **3 SWEEP coverage gaps** (trusted-device kolekce/delete, `*-totp` DTO, trusted-devices query-keys) — vše z 2FA(14.1)+export(14.7), proauditováno.
- META brána (`audit:regression --ci`): ✅ **0 regresí** (každý opravený důležitý nález má G≥2). Pozn.: 3 fixed&G0 = bez pojistky.
- **Čisté audity:** cache, upload-media, ws, error-contract (žádný čerstvý nález).
- **Vyvráceno ze zadání 14.9:** „soft-delete akcí bez cleanup jobu" — game-events maže tvrdě + emituje `media.orphaned`, čistý vzor.

---

## ✅ Výsledek oprav (ověřeno — working tree, NEcommitnuto)

**FE dávka** — ověřeno: 25/25 vitest ✓, `npm run build` (tsc -b) ✓.
- S-RUN-01/02/03 reconnect refetch (`useWorldAccessSocket`, `useReassignmentListener`, `useUniverseSocket`) + 3 nové/rozšířené specy.
- F-24: FE↔BE displayName už shodně 32 → zesílen zavádějící test na hranici 32 (ne fix kódu).

**BE dávka** — ověřeno: typecheck ✓, 131 cílených jest ✓, e2e seed-scenario 21/21 ✓, eslint ✓.
- SS-RUN-01: e2e harness odblokován (archiver ESM mock) — z 0/21 na 21/21.
- CD-RUN-1 timeline blob leak · CD-RUN-2 calendar-slug cleanup · CD-RUN-3 trusted-devices hard-delete cleanup · CD-RUN-4 ikaros-news blob leak — vše + jest pojistky.
- DI dup-index: **6 schémat** (Notes/Calendar/Diary/Finance/Inventory + UniverseMap) — všechny mongoose „Duplicate schema index" warningy pryč (ověřeno e2e bootem).

**Korekce oproti detekci (čtení kódu přebilo dluh-list):**
- ⚠️ NAV `/akce` do menu → **NEuděláno**: komentář `worldNavConfig.ts:153` říká, že Akce jsou na úvodní stránce **záměrně dle spec 12.3 R1/R2**. Kolize dluhu se specifikací → tvoje rozhodnutí.
- NAV `/sprava-udalosti` → **NEuděláno**: redirect zaveden 2026-05-25 „na 1 měsíc", vyprší ~25.6. — dnes ještě platí.
- CD-RUN-4 `dungeon-maps` = false-positive (schema nemá blob pole); `ikaros-events` = soft-delete bez purge → review.

**🛑 Review pile:** ✅ **VYŘEŠENO 2026-06-20 (společně):** `/akce` do menu „Svět" + spec 12.3 (#1) · legacy `/calenders` controller smazán (#2) · `/sprava-udalosti` redirect smazán (#3) · F-RUN-01 form-schema doc model opraven (#4) · ikaros-events soft→**hard delete + blob cleanup** (#5, CD-RUN-4b). Vše ověřeno (FE build+vitest / BE typecheck+jest+eslint), NEcommitnuto.
**Stále zbývá:** DI-01/03/04/05/RUN-06/07/08 (kvantifikace přes `+db`), D-NEW-INV-CLEANUP (legacy UserRole / Tyky bypass / getUsers paginace / …), in-game datum (Počasí) vs „Dnes" v `/kalendar`.

## Per audit
| Audit | Runner | 🆕 | ♻️ | 🔓 | 🔴 | Dosažená L | Pozn. |
|---|---|---|---|---|---|---|---|
| bug | audit:routes | 0 | 0 | 0 | 0 | L2 | 48 FE-bez-BE = vše false-positive (scanner nerozvine dyn. base) |
| role | audit:routes | 0 | 0 | 0 | 0 | L2 | bez driftu |
| nav | audit:nav | 0 | 0 | 3 | 0 | L2 | scanner 0 dead/orphan; 3 položky D-NEW-INV-CASCADE (viz níže) |
| ws | audit:ws | 0 | 0 | 0 | 0 | L2 | 0 mrtvých listenerů / 0 zahozených emitů |
| prod-config | audit:config | 0 | 0 | ~ | 0 | L2 | převážně známé PC-* (ops/deferred), TOTP_ENC_KEY čeká, EMBEDDING_* → starý web |
| error-contract | audit:errors | 0 | 0 | 0 | 0 | L2 | FE↔BE code parita bez driftu (29/862 generic = 3 %) |
| log-hygiene | audit:logs | 0 | 0 | ~ | 0 | L2 | BE SEC:1 taint + console.* runtime (BE 3/FE 15) — drobné |
| form-schema | SWEEP | 1 | 0 | 1 | 0 | L2 | F-RUN-01 doc drift, F-24 displayName 64↔32 |
| cache | SWEEP | 0 | 0 | 0 | 0 | L2 | 2FA/trusted-devices cache čisté |
| upload-media | SWEEP | 0 | 0 | 0 | 0 | L3 | 9 oprav drží, žádná regrese |
| state-consistency | SWEEP | 3 | 0 | 0 | 0 | L2 | reconnect-bez-refetch ×3 |
| cascade-delete | SWEEP | 4 | 0 | 0 | 0 | L2 | timeline/calendar/trusted-dev/ikaros blob+dangling |
| db-integrity | SWEEP | 3+2 | 0 | 4 | 0 | L2 | DI-06/07/08 + 2 dup indexy (z e2e); DI-01/03/04/05 čekají +db |
| race-condition | BE e2e | — | — | — | — | ⏭️ | nespuštěno (focus na seed-scenario); G-matice G≥2 |
| seed-scenario | BE e2e | 0 | 1 | 0 | 0 | L2→✅ | ♻️ archiver ESM OPRAVENO, 21/21 zelená |
| anti-regression | audit:regression | — | — | — | 0 | META | ✅ 0 regresí, 3 fixed&G0 warn |

---

## 📈 Rozšíření kontroly (coverage drift vs baseline)
| Kategorie | Audit | Bylo | Teď | Nové položky | Akce |
|---|---|---|---|---|---|
| BE kolekce | db-integrity, cascade | 79 | 80 | trusted-device.schema | ✅ proauditováno (schema čisté; cascade CD-RUN-3) |
| BE DTO | form-schema | 243 | 245 | enable-totp, login-totp, password-confirm | ✅ proauditováno (čisté) |
| BE delete cesty | cascade | 57 | 59 | trusted-devices.repository | ✅ → CD-RUN-3 |
| BE process.env | prod-config | 23 | 32 | THROTTLER_REDIS (+8 už řešených) | scanner pokryl |
| BE throw new | error-contract | 857 | 880 | totp-crypto, totp, world-export | scanner pokryl |
| FE query-keys | cache | 242 | 247 | trusted-devices | ✅ proauditováno (čisté) |
| FE mutace | cache | 284 | 290 | (2FA/trusted-dev) | ✅ proauditováno |

> Inventury v plánech (db-integrity „~70 kolekcí", cache, cascade) je vhodné aktualizovat na aktuální čísla — doporučení, ne blokující.

---

## Detail nálezů

### Bezpečně opravitelné (dle schválené dělící čáry — opravuji v tomto běhu)

**SS-RUN-01 ♻️ [seed-scenario/anti-regr] world-export `archiver` v8 (ESM) rozbil BE e2e harness → OPRAVENO**
- Kde: `backend/src/modules/world-export/world-export.service.ts:7` `import { ZipArchive } from 'archiver'`; `app.module.ts:57` načítá world-export.module → každý app-bootující e2e padl (21/21).
- Příčina: archiver v8 `type:module`; ts-jest (`allowJs:false`, `module:nodenext`) node_modules ESM netranspiluje. **Prod NEohrožen** — reálný Node `require('archiver')` funguje (ověřeno).
- Fix (test-only): `backend/test/mocks/archiver.stub.ts` + `moduleNameMapper ^archiver$` v `jest-e2e.json`. Ověřeno: **21/21 seed-scenario zelená**. Pojistka G≥2 = e2e sada sama.

**CD-RUN-2 🟡 [cascade/DR] mazání kalendářového configu nečistí `worldSettings.timelineCalendarSlug`** (14.9 priorita #1)
- Kde: `backend/src/modules/.../world-calendar-config.service.ts:136-160` `remove` (guard jen na `defaultCalendarConfigSlug`).
- Dopad: dangling slug; self-heal přes `getTimelineConfig` fallback (NE crash), ale timeline/weather tiše přepne na default. Fix = po smazání nullovat slug. + test.

**CD-RUN-1 🟡 [cascade/EX] timeline event blob leak (delete i replace)**
- Kde: `timeline.service.ts:235-249` (delete) + `:219-221` (update); `TimelineService` neinjektuje `EventEmitter2`.
- Dopad: `imageUrl` zůstane na Cloudinary navždy. Fix = inject EventEmitter2 + emit `media.orphaned` (vzor world-news). + test.

**CD-RUN-3 🟡 [cascade/OR] trusted devices se neuklidí při hard-delete uživatele**
- Kde: `trusted-devices.service.ts` (jen `@OnEvent('user.password.changed')`); žádný listener na `user.deletion.hardDeleted`.
- Dopad: orphan keyed na userId; TTL 30d to mírní (self-heal), žádné PII. Fix = `@OnEvent('user.deletion.hardDeleted')` → `revokeAllForUser`. + test.

**CD-RUN-4 🟡 [cascade/EX] ikaros-news / ikaros-events / dungeon-maps blob leak při delete**
- Kde: `ikaros-news.service.ts`, `ikaros-events.service.ts`, `dungeon-maps.service.ts:98` — delete bez blob cleanup pro `imageUrl`.
- Fix = stejný `media.orphaned` vzor. + testy.

**S-RUN-01 🟡 [state/RJ] `useWorldAccessSocket` bez reconnect refetch**
- Kde: `src/features/world/hooks/useWorldAccessSocket.ts:45-69`. Zmeškaná žádost/schválení za výpadku tichá. Fix = `useSocketReconnect`+invalidate (vzor S-05).

**S-RUN-02 🟡 [state/RJ] `useReassignmentListener` bez reconnect refetch**
- Kde: `src/features/world/tactical-map/hooks/useReassignmentListener.ts:26-44`. Zmeškané přeřazení scény. Fix = vzor S-03/04/05.

**S-RUN-03 🟡 [state/RJ] `useUniverseSocket` re-join bez refetch**
- Kde: `src/features/world/universe/hooks/useUniverseSocket.ts:44-47`. Zmeškaný `universe:updated` za výpadku. Fix = onConnect invalidate.

**F-24 🔓 [form/WL] `displayName` FE max(64) ↔ BE `@MaxLength(32)`**
- Kde: `backend/.../update-user.dto.ts:15` vs FE form. 33-64 znaků = FE OK, BE 400. Fix = sjednotit FE na 32 (BE je enforcer, existující data ≤32).

**DI-RUN-dup1/2 🟡 [db/IDX] duplicitní index** (z e2e mongoose warning)
- `CharacterNotes {characterId}` a `UniverseMap {worldId}` mají `index:true` + `schema.index()` zároveň. Fix = odstranit duplicitní deklaraci.

**F-RUN-01 🆕 [form/doc] form-schema plán+registr tvrdí „bez forbidNonWhitelisted", kód má `forbidNonWhitelisted:true`**
- Kde: `backend/src/main.ts:50-55` vs `form-schema-plan/00-cross-cutting.md` + README + oblasti. Doc-only fix (aktualizovat model auditu).

### 🛑 Review pile (k tvému odsouhlasení / vyžaduje +db / architektonické — NEopravuji bez tebe)

- **NAV `/calenders`** — BE legacy controller `legacy-calenders.controller.ts:17` (překlep, FE nevolá). Smazání = risk (externí konzumenti? starý web/migrace). Read-only audit to nezaručí.
- **DI-01** custom_emotes `worldId/createdBy` ObjectId→string migrace (vyžaduje +db + transformaci dat).
- **DI-03** weather `name` unique index (3 kolekce) — nutný dedup před indexem (vyžaduje +db).
- **DI-04** `worlds.service.create` bez session/transakce (architektonické, Mongo TX = replica set).
- **DI-05** playerCount backfill existujících hodnot (vyžaduje +db).
- **DI-07** ikaros_discussion_posts/reports FK orphan — kvantifikace vyžaduje +db scan.
- **DI-08** game_events `comments[].parentId` cyklus/dangling guard — mění write-path validaci.
- **D-NEW-INV-CLEANUP (14.9 tag, samostatný úklid):** legacy `UserRole` 3-8 v BE, `Tyky` hardcoded bypass→role/flag, `getUsers` in-memory paginace, tichý fail MeiliSearche, centralizace favorites toggle, sync audit-log labelů FE↔BE. Většina architektonická/behaviorální.

### ✅ Vyvráceno / čisté (žádná akce)
- „Soft-delete akcí bez cleanup jobu" — game-events maže tvrdě + `media.orphaned` (čistý vzor).
- 48 FE-bez-BE rout = scanner šum (dynamická base URL); 0 reálného driftu. → doporučení: naučit `route-audit.mjs` rozvíjet modulové `const PREFIX`.
- cache, upload-media, ws, error-contract — bez čerstvých nálezů.
- trusted_devices schema, *-totp DTO, trusted-devices query-keys — nový povrch proauditován, čistý.

---

## ⏭️ Neproběhlé vrstvy (vyžadují infru)
| Audit | Vrstva | Příznak/prerekvizit |
|---|---|---|
| db-integrity | M-SCAN / M-TYPE (orphan/dup/type counts, DI-01/03/05/07/08 kvantifikace) | `+db` — Docker dole; ráno spustit dev/staging, NE prod zápis |
| cascade-delete | orphan-scan (reálné dangling/blob leak counts) | `+db` |
| race-condition | BE e2e race-condition.e2e-spec | `+e2e` (lze teď, harness odblokován — nespuštěno v tomto běhu) |
| upload-media | L5 M-PROBE/M-ORPHAN (podvržené soubory, Cloudinary diff) | `+e2e`/`+db` |
| state-consistency | L8 TLC (mimo ověřený MapReconnect) | `+formal` |
| (všechny) | Stryker mutace (L5-teeth) | `+teeth` — ověřeno přes G-matici |

> **Ráno společně:** spustit Docker → `+db` (orphan-scan + integrity-scan) pro reálná čísla DI-* a cascade; volitelně `+e2e` race-condition (harness je teď zelený).
