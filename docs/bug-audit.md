# Bug audit — automatizovaný kontrolní bod

> Poslední automatizovaná kontrola před předáním lidské testovací skupině.
> Cíl: najít a opravit vše, co jde odhalit **bez člověka u prohlížeče** — typecheck, testy, lint, kontraktní drift.
> Co audit **nenajde**: vizuální regrese, UX, „tlačítko nedělá co má" → to je práce testovací skupiny.
> Stav: zahájeno 2026-06-03.

---

## TL;DR (2026-06-03)

> **Stav: 32 nálezů opraveno** (+ D-029) + 2 ze 4 N-6b features, commitnuto + pushnuto na main.
> Nově: N-12 (paginace), N-33 (events), N-18 (membership worldId), N-14 (reviewers), **N-6b username-request** (BE doplněno), **N-6b admin-friendships** (mapping bez schema migrace).
> **N-17 → by-design** (Zadatel=member, spec 2.4). Zbývá N-6b self-deletion (celá 1.3c, samostatný spec), N-8/27, N-11, N-23, N-34.
> 1 by-design (N-40), 2 false-positive (N-39 + kandidáti C-10/C-12).
> Baseline: BE 1836 + FE 2473 testů zelené · `audit:routes` + `audit:ws` čisté · ~58 nových regresních testů.
>
> **Zbývá ~10 nálezů + 2 přehodnocené jako by-design/sporné:**
> - 🟠 technické (spolehlivě opravitelné): N-12 (diskuze paginace), N-18 (worldId URL konzistence), N-23 (refund tlačítko gating), N-33 (events invalidace BE+FE), N-34 (mail race)
> - 🟠 vyžaduje rozmyšlení: N-8/N-27 (weather room — sdílená BaseGateway), N-11 (themeId IsIn — potřebuje sdílený theme registry FE↔BE)
> - ⚖️ **k rozhodnutí (NE jasné bugy):** N-14 (`UserRole.PJ=3` je GLOBÁLNÍ role, ne world PJ → možná legitimní v ADMIN_ROLES), N-17 (Zadatel=member — komentář spec 2.4 říká záměr)
> - ✅ **přehodnoceno → by-design:** N-10 (kalendář Lokace) — komentář `characters.service.ts:140-143`: 8.1-FIR (2026-05-24) **záměrně** přebilo spec 9.2, lokace subdoc vidí jen PomocnyPJ+
> - 📋 N-6b (4 chybějící BE features — spec níže) · N-2 (colors), N-3 (cron) = vědomé dluhy
>
> ⚠️ **Pozn. k rozboru:** N-10 a N-14 byly v 1. kole označeny jako bugy, ale při ověření jde o
> záměrné chování / globální roli. Lekce: u „access/role" nálezů vždy ověřit komentář + enum,
> ne věřit prvnímu dojmu agenta.

**Opravené nálezy (26):** N-1, N-4, N-5, N-6a, N-7, N-9, N-13, N-15, N-16, N-19, N-20, N-21, N-22, N-24, N-25, N-26, N-28, N-29, N-30, N-31, N-32, N-35, N-36, N-37, N-38, N-41 + D-029.

**Hotovo a ověřeno:**
- ✅ Baseline zelený: FE 2473 + BE 1815 testů, tsc+eslint obojí čisté
- ✅ **N-1 opraveno** — `model-runtime.spec.ts` zastaralý mock (BE testy 1813→1815)
- ✅ **D-029 opraveno** — PWA ikony z brandového anděla (magie medailon), manifest
- ✅ Hloubkový bug-plán: [`bug-plan/`](bug-plan/) — 14 oblastí, ~1200 kontrolních bodů (BE+FE)
- ✅ Nástroj `npm run audit:routes` — FE↔BE kontraktní audit (našel N-6)

**41 potvrzených nálezů (N-1…N-41), 39 čeká na tvé rozhodnutí. Seskupeno:**
- 🔴 **Herní blokery:** N-22 (obchod prázdný pro hráče), N-26 (hráč nenastaví iniciativu), N-25 (dice log mizí po reloadu), N-16 (PomocnyPJ nevidí PJ UI), N-39 (počasí karty se neaktualizují)
- 🔴 **Bezpečnost / leaky:** N-7 (members leak), N-8/N-27 (room:join bez membership → počasí), N-9 (sound spoof), N-35 (AKJ leak v search), N-36 (favorite cizího světa), N-37 (AKJ leak slugů)
- 🔴 **Chybějící WS / kontrakt:** N-4/N-5 (friendship+presence WS mrtvé), N-6 (auth/account contract drift — verify/change/delete/reactivate nefungují), N-15/N-19/N-20/N-30/N-31 (membership undefined, unread, kanály, presence auth, whisper leak)
- 🟠🟡 **Ostatní (~20):** access politika, validace, paginace, embedding, kalendář leap, stale cache, konzistence
- 🟠 **N-3** — account-cleanup cron stub (GDPR hard-delete nefunguje) — impl. plán níže

**Pokrytí:** hloubkově prověřeno všech 14 oblastí (BE+FE), ~1200 kontrolních bodů, 3 kola bug-huntingu + route audit + verifikace kandidátů.

**Proč neopraveno autonomně:** každý vyžaduje rozhodnutí o přístupové politice, kontraktní volbu (kterým směrem sjednotit naming), nebo schema/DI/WS změnu s rizikem — to nepatří do půlnočního patche bez tvého vstupu. Každý nález má přesný `soubor:řádek` + návrh. **Doporučené pořadí oprav: herní blokery → bezpečnost/leaky → WS gateways (N-4/5) → kontrakt N-6 → zbytek.**

---

## Baseline — health checks

| Check | Repo | Výsledek | Pozn. |
|---|---|---|---|
| `tsc --noEmit` | FE | ✅ čistý | žádný TS drift |
| `eslint .` | FE | ✅ čistý | 0 chyb/varování |
| `lint:colors` | FE | ⚠️ 207 souborů / 2704 barev | konzistenční dluh, ne bug — viz N-2 |
| `vitest run` (unit) | FE | ✅ 2473/2473 | `--project '!storybook'` (browser projekt visí) |
| `tsc --noEmit` | BE | ✅ čistý | cron spec excluded → díra schovaná (N-3) |
| `eslint` | BE | ✅ čistý | |
| `jest` | BE | 🐛→✅ 2 faily opraveny | viz N-1 |

Statický sweep: FE 73 / BE 9 výskytů `TODO`/`@ts-ignore`/`eslint-disable` napříč 64 soubory — orientační, převážně legit, neřeší se plošně.

---

## Nálezy

### N-1 — BE search ModelRuntime: zastaralý test mock 🐛→✅ OPRAVENO
- **Soubor:** `backend/src/modules/search/model-runtime.spec.ts`
- **Symptom:** 2 testy padaly — `TypeError: sp.SentencePieceProcessor is not a constructor`
- **Root cause:** drift po refaktoru. Produkční kód volá `new sp.SentencePieceProcessor()` (named export) + `encodeIds()`; mock vracel `jest.fn()` jako celý modul (žádný named export) a definoval starý `encode()`. Produkční kód **ověřen jako správný** vůči reálnému API knihovny (`SentencePieceProcessor` + `encodeIds`).
- **Fix:** mock přepsán na named export `SentencePieceProcessor` + `encodeIds`. BE testy 1815/1815 ✅.
- **Dopad:** žádný v provozu (jen test schovával zelenou); ale maskoval by reálnou regresi embeddings.

### N-2 — FE 2704 hardcoded barev (207 souborů) ⚠️ KONZISTENČNÍ DLUH
- **Symptom:** `lint:colors` selhává; barvy mimo theme tokeny.
- **Posouzení:** velká část legit (fyzické barvy 3D kostek `dice/models/*`, barvy kalendářů jako data v `calendarEngine/presets/*`). Appka funguje, jen obchází `var(--token)` → riziko pro theme isolaci u skutečných UI komponent.
- **Stav:** k vyhodnocení — oddělit legit data od skutečných UI úniků. Není blocker.

### N-3 — BE account-cleanup cron je stub 🔴 FUNKČNÍ DÍRA (známý dluh)
- **Soubor:** `backend/src/modules/users/services/account-cleanup.cron.ts`
- **Symptom:** cron běží jako prázdný `void` stub → soft-deleted účty se po 30 dnech **fyzicky nemažou** (GDPR). Spec test vyřazen z tsconfigu → typecheck díru schovává.
- **Stav:** plánovaná plná implementace. **NEDĚLÁNO autonomně** — dotýká se DI grafu + schématu, reálný cyklus by se projevil až při `nest start` (neověřitelné v noci jen jestem).
- **Implementační plán (zjištěno auditem, k provedení po schválení):**
  1. `User` entity: přidat `deletedAt?: Date` (interface + `user.schema.ts` `@Prop` + `users.repository.ts` toEntity mapper — pozor field-drift checklist).
  2. `IUsersRepository` + `MongoUsersRepository`: `findExpiredTombstones(cutoff): Promise<User[]>` (`isDeleted=true AND deletedAt < cutoff`).
  3. `IFriendshipsRepository` + repo: ověřit/doplnit `deleteAllByUser(userId): Promise<number>` (spec ho volá; v interface zřejmě chybí).
  4. `users.module`: registrovat `AccountCleanupCron` v `providers` (teď tam vůbec není) + doplnit DI: `IRefreshTokenRepository` (z auth modulu — **⚠️ riziko cyklu auth↔users**, řešit forwardRef nebo přesunem cronu do vlastního modulu / exportem refresh repo jako @Global), `UploadService`/`UserBanCacheService`/`IFriendshipsRepository`/`ConfigService`/`EventEmitter2` (většina už v module dostupná).
  5. Implementovat 3 metody dle existujícího spec (`removeExpiredTombstones`, `removeTombstoneOne`, `hardDeleteOne`).
  6. `tsconfig.json`: odebrat `account-cleanup.cron.spec.ts` z `exclude`.
  7. Ověřit: **celý** `jest` + reálný `nest start` (kvůli DI cyklu — jest s mocky to neodhalí).

### N-4 — Friendship real-time WS most chybí 🐛 POTVRZENO (z C-01)
- **Soubory:** BE `friendships.service.ts` (emit), FE `features/friendships/hooks/useFriendshipsSocket.ts`
- **Důkaz:** BE emituje `friendship.requested/accepted/rejected/removed/blocked` přes `EventEmitter2`. V celém BE **neexistuje** `FriendshipsGateway` ani `@OnEvent('friendship…')`. FE poslouchá socket eventy `friend:request:incoming/accepted/declined/canceled`, `friend:removed`. Grep BE na tyto socket stringy = **0 výskytů**.
- **Dopad:** real-time přátelství mrtvé — toast „nová žádost", auto-invalidace queries, live aktualizace Zpracovat tabu nikdy nepřijdou. Funguje jen po manuálním refetchi.
- **Proč uniklo:** `useFriendshipsSocket` nemá vlastní test; BE service testy ověřují jen `events.emit` volání, ne doručení klientovi.
- **Oprava:** doplnit `FriendshipsGateway` (JWT handshake) + `@OnEvent` listenery překládající EventEmitter2 eventy na Socket.IO `friend:*` emit cílenému uživateli. Velikost: střední BE. → rozhodnutí ráno.

### N-5 — Globální presence (OnlineDot) přes WS mrtvá 🐛 POTVRZENO (z C-02)
- **Soubory:** BE `presence/` modul, FE `shared/presence/usePresence.ts`, `OnlineDot.tsx`
- **Důkaz:** `PresenceModule` = controller + service, **žádný gateway/registry**. `PresenceService` umí jen REST `getOnlineUserIds()` (online = `lastSeenAt < 25h`). FE `usePresence` poslouchá `presence:snapshot/update`, emituje `presence:idle/active`. Grep BE na `presence:snapshot/update` = **0**. Architektura z roadmapy 1.5 (OnlinePresenceRegistry, PresenceGateway, idle) v kódu neexistuje.
- **Dopad:** `OnlineDot` (header avatar, UserCard, profil) je plněn jen z WS atomu, který se nikdy nenaplní → tečka nikdy nesvítí online přes WS. Žádný REST fallback v `usePresence`.
- **Oprava:** buď (A) doplnit `PresenceGateway` + registry dle 1.5, nebo (B) překlopit `OnlineDot` na REST `/presence/online` poll. → rozhodnutí ráno (A vs B).

### N-6 — Systémový FE↔BE contract drift: auth / account / admin 🐛 POTVRZENO (z C-05/06/07 + audit)
- **Metoda:** automatizovaný route audit (`scripts/route-audit.mjs`) — porovnáno 456 BE routes × 341 FE volání.
- **Naming mismatch (BE endpoint existuje pod jiným jménem → FE volá 404):**

  | FE volá | BE má | Dopad |
  |---|---|---|
  | `POST auth/email-verify` | `POST auth/verify-email` | ověření e-mailu (každá registrace) |
  | `POST auth/email-verify/resend` | `POST auth/resend-verification` | znovuzaslání verifikace |
  | `POST auth/email-change-confirm` | `POST auth/confirm-email-change` | potvrzení změny e-mailu |
  | `POST users/me/email-change-request` | `POST users/me/request-email-change` | žádost o změnu e-mailu |
  | `POST admin/users/:id/deletion-request` | `POST admin/users/:id/request-deletion` | admin naplánuje smazání |
  | `DELETE admin/users/:id/deletion-request` | `POST admin/users/:id/cancel-deletion` | admin zruší smazání (i metoda!) |
  | `POST admin/users/:id/admin-permissions` | `PATCH …/admin-permissions` | změna admin práv (metoda) |

- **Chybějící BE endpoint úplně (FE-only oprava nestačí, nutná BE impl):**
  - `POST auth/reactivate-deletion` — reaktivace účtu (1.3c)
  - `GET/POST users/me/deletion-request` — self-delete účtu (1.3c)
  - `GET/POST/DELETE users/me/username-request` — žádost o změnu přezdívky (1.3b); BE má jen pod-routy `…/last-unseen-decided`, `…/:id/seen`
  - `GET admin/friendships`, `POST admin/friendships/:id/reset-cooldown`, `GET admin/friendships/by-pair` — celý admin friendships modul
- **Vzorec:** FE konvence `{noun}-{verb}` (`email-verify`, `deletion-request`), BE `{verb}-{noun}` (`verify-email`, `request-deletion`). FE je napřed; část BE endpointů v `main` chybí.
- **Návrh řešení (k rozhodnutí):** (1) zvolit jednu konvenci a sjednotit naming napříč; (2) doplnit chybějící BE endpointy (deletion/reactivate/username-request/admin-friendships) NEBO potvrdit, že FE features mají být zatím skryté; (3) přidat `route-audit` do CI jako trvalou pojistku proti driftu. **Neopravováno autonomně — ucelený kontrakt + chybějící BE.**
- **Patří sem i:** C-08 (adresář `search` vs `q` → vyhledávání nefunkční), C-14 (displayName FE 64 vs BE 32).

### N-7 — 🔴 BEZPEČNOST: `GET /worlds/:id/members` bez auth guardu 🐛 POTVRZENO (C-03)
- **Soubor:** `backend/.../worlds.controller.ts:274-297` (`getMembers`), service `worlds.service.ts:915`
- **Důkaz:** metoda ani třída nemá `@UseGuards`; service nekontroluje visibility světa ani membership. Anonymní `GET /worlds/<id>/members` vrátí usernames + avatary členů **privátního** světa.
- **Dopad:** únik členské základny privátních světů bez přihlášení. Auth-leak (porušení auth-leak-policy).
- **Návrh:** `@UseGuards(JwtAuthGuard)` + v service ověřit přístup (member nebo Sa/Admin; public/open svět dle politiky). **Rozhodnutí o politice (kdo smí vidět členy) → ráno.**

### N-8 — 🔴 BEZPEČNOST: `room:join` bez membership checku 🐛 POTVRZENO (C-04)
- **Soubor:** `backend/.../app.gateway.ts:12-22` (`@SubscribeMessage('room:join')`)
- **Důkaz:** handler validuje jen regex formátu `^[a-z]+:[a-zA-Z0-9]+$`, pak `joinRoom` bez kontroly. Klient joinne `world:{cizíId}` a dostává weather/world eventy cizího světa. Kontrast: `maps.gateway.ts:146` `map:join-world` membership správně ověřuje.
- **Dopad:** únik real-time eventů (počasí, world signály) napříč světy bez členství.
- **Návrh:** v `room:join` ověřit membership pro `world:*` roomy (injektovat membership repo, async check), nebo směrovat přes ověřený handler. **Architektonická změna → ráno.**

### N-9 — 🟠 BEZPEČNOST: `sound:play` důvěřuje `userId` z payloadu 🐛 POTVRZENO (C-11)
- **Soubor:** `backend/.../chat.gateway.ts:181-203`
- **Důkaz:** role check `resolveChannelPresenceRole(payload.channelId, payload.userId)` bere `userId` z klientského payloadu, ne z ověřeného `socket.data` (JWT je v `handleConnection` parsován, ale zde nepoužit). Kód to sám přiznává v komentáři 172-179.
- **Dopad:** útočník pošle `sound:play` s `userId` PJ → projde role check → pustí zvuk všem (spoofing oprávnění).
- **Návrh:** brát identitu z `@ConnectedSocket() client.data.userId` (JWT), payload `userId` ignorovat. Malá, ale bezpečnostně důležitá BE oprava. → ráno (rychlé).

### Další potvrzené nálezy (souhrn)

| ID | Nález | Soubor | Závaž. | Návrh |
|---|---|---|---|---|
| N-10 | `assertSubdocAccess` ignoruje `_options.action` → hráč 403 i na GET kalendáře Lokace (spec 9.2 nesplněn) | `characters.service.ts:127` | 🟠 | použít `action` v rozhodování (read→member, write→PomocnyPJ+) |
| N-11 | `themeId` bez `@IsIn` → uloží libovolný string | `update-user.dto.ts:37` | 🟡 | `@IsIn(THEME_IDS)` (seznam sdílet/exportovat z FE) |
| N-12 | Diskuze paginace `total` (DB count) ≠ vrácené `items` (po access filtru) → špatný počet stránek | `ikaros-discussions.service.ts:209-215` | 🟡 | filtrovat v DB query, nebo dopočítat total po filtru |
| N-13 | Embedding ignoruje `sections[].content` → semantic search nevidí obsah sekcí; změna sekce ani nere-indexuje | `embedding-search.service.ts:307-333` | 🟡 | přidat `sections[].content` do `buildChunks` + `computePageHash` |
| N-14 | PJ (world role) v BE `ADMIN_ROLES` článků (platformový obsah) → wrong-layer; PJ schválí přes API | `ikaros-articles.service.ts:26` | 🟡 | odebrat PJ z ADMIN_ROLES (články = jen globální role) |

**Nejasné / neověřené:** C-17 (SVG upload bez sanitizace potvrzen, XSS dopad závisí na FE renderu — doověřit FE), C-18 (`map:reassigned` double-listener), C-19 (`enrichTokens` N+1) — neověřeno, nižší priorita.

---

## Nálezy z bug-huntingu — 2. kolo (N-15…N-29)

> Hloubkové ověření [auto] bodů ve 4 nejrizikovějších oblastech. Agenti ověřovali **obě strany**
> (BE+FE) → úroveň **L2**. 🔴 nejkritičtější jsem navíc **spot-checkl sám** (označeno ✓).

### Svět — základ (06)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-15 | Po `transferOwnership` se emituje `world.membership.changed` **bez** `membership` → gateway pošle `undefined` klientům | `worlds.service.ts:1691` × `worlds.gateway.ts:47` | 🔴 |
| N-16 | `isPJ` ve `WorldContext` nezahrnuje `membership.role >= PomocnyPJ` (na rozdíl od `isPJForNav`) → PomocnyPJ vidí `isPJ=false`, mizí mu PJ UI (tlačítko „Nová stránka") | `WorldLayout.tsx:290` | 🔴 |
| N-17 | `Zadatel` (role=0) má membership → `useWorldStatus` ho vyhodnotí jako `'member'` → vidí plný dashboard, akce pak BE 403 | `useWorldStatus.ts:30` | 🟠 |
| N-18 | `worldId` v URL membership endpointů (`leave`/`role`/`group`/`akj`) BE vůbec nevaliduje — dekorativní param, narušená multi-tenant konzistence | `worlds.controller.ts:299,363` | 🟠 |

### Svět — chat (07)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-19 | `broadcastUnreadUpdate` vylučuje jen `Zadatel`, ne `Ctenar` → Čtenář dostává `chat:unread` (badge) i pro kanály, kam nemá přístup | `chat.service.ts:1214` | 🔴 |
| N-20 | `syncLinkedChannelMembers` rozhoduje jen dle skupiny, ignoruje roli → PomocnyPJ+ s `group=null` je odstraněn z linked „members" kanálů → 403 na getMessages/send | `chat.service.ts:1443` | 🔴 |
| N-21 | FE typ `ChatGroup` nedeklaruje `linkedWorldGroup` (BE ho vrací) → tiše se zahazuje, regresní riziko | `chat/lib/types.ts:18` | 🟡 |

### Svět — postavy / ekonomika (09)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-22 | **Obchod prázdný pro hráče** — `resolveScope` vrací hráči `{worldId, ownerId:self}`, ale shop items vlastní PJ → hráč nevidí žádné položky, nemůže nakupovat ✓ | `campaign.service.ts:84` | 🔴 |
| N-23 | Refund: FE vždy zobrazí „Vrátit", ale `adjust`→`assertCanAdjust` dá hráči 403 pokud `allowPlayerSelfAdjust=false` → němá chyba | `campaign-purchase.service.ts:240` | 🟠 |
| N-24 | `listPurchases` pro hráče volá `findByUserAndWorld` (`findOne`) → hráč s víc postavami vidí nákupy jen jedné, ostatní nelze stornovat | `campaign-purchase.service.ts:283` | 🟠 |

### Svět — taktická mapa (11)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-25 | **`diceRolls` chybí v `toEntity`** mapperu (je ve schématu) → log hodů na mapě se po každém reloadu/refetchi smaže ✓ | `maps.repository.ts` toEntity × `map-scene.schema.ts:42` | 🔴 |
| N-26 | **Hráč nemůže nastavit iniciativu vlastního tokenu** — `allowedPlayerFields={currentHp,injury}` bez `initiative`, ale FE `InitiativeBar` ji posílá → 403 ✓ | `operations-authorizer.service.ts:135` × `InitiativeBar.tsx:108` | 🔴 |
| N-27 | `useMapWeather` emituje `room:join`, ale `maps.gateway` nemá `room:join` handler → hráč nedostane live počasí na mapě (jen initial load). Souvisí s N-8 | `useMapWeather.ts:82` | 🔴 |
| N-28 | `map:leave-world` — BE handler neexistuje → socket zůstane v world roomu po opuštění panelu (overhead, stale eventy) | `useActiveScenes.ts:69` | 🟠 |
| N-29 | `token.update` authorizer nekontroluje per-token `isLocked` → hráč může editovat HP zamčeného tokenu (nesoulad s FE gatingem) | `operations-authorizer.service.ts:120` | 🟠 |

---

## Nálezy z bug-huntingu — 3. kolo (N-30…N-41)

> Zbylé velké oblasti (chat/pošta, stránky/search, herní nástroje). L2 (obě strany).

### Chat / pošta / notifikace (05)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-30 | `GET /global-chat/rooms/presence` má controller-level `JwtAuthGuard`, ale FE ho volá i pro anonyma (sidebar) → 401 spam, badge se nenačte | `global-chat.controller.ts:71` × `useGlobalChat.ts:59`, `IkarosLayout.tsx:189` | 🔴 |
| N-31 | Whisper jde přes WS do `user:{id}` roomu; FE `handleMessage` nekontroluje `channelId` → šeptaná zpráva se zobrazí ve špatně otevřené místnosti (sdílený socket) | `global-chat.gateway.ts:402` × `ChatRoom.tsx:124` | 🔴 |
| N-32 | `handlePresence` leave filtruje `userId !== e.userId && username !== e.username` → odejde i nevinný uživatel se stejným jménem / ghost po přejmenování | `ChatRoom.tsx:188` | 🟠 |
| N-33 | `useEvents` invaliduje cache při **každém** `ikaros:new-message` (i běžná pošta) → zbytečné refetchy/blikání záložky Události | `useEvents.ts:24` | 🟠 |
| N-34 | Race: kořen vlákna uložen s `conversationId=''`, pak update → mezi tím může `MailDetail` načíst prázdný `conversationId` → vlákno se nedotáhne | `ikaros-messages.service.ts:80` × `MailDetail.tsx:32` | 🟡 |

### Svět — stránky / search (08)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-35 | **AKJ leak v search:** `findByWorld(worldId)` bez `userId` přeskočí AKJ filtr → `validSlugs` obsahuje i chráněné stránky → hráč dostane název+slug utajené stránky ve výsledcích | `search.controller.ts:76` × `pages.service.ts:100` | 🔴 |
| N-36 | `POST/DELETE /:slug/favorite` nepředává `userId`, neověřuje membership → kdokoli přihlášený přidá slug do favorit **cizího** světa (vandalismus) | `pages.controller.ts:176` × `pages.service.ts:524` | 🔴 |
| N-37 | **AKJ leak:** `GET .../pages/dataSlugs` (`findAllSlugs`) bez membership/AKJ check → slugy chráněných stránek viditelné všem přihlášeným (WikilinkSuggestion má být PomocnyPJ+) | `pages.controller.ts:70` × `pages.service.ts:379` | 🟠 |
| N-38 | `useUpdatePage` bere `previousSlug = vars.input.slug` (= nový slug) → po rename se podmínka `!==` nikdy nesplní → stará slug-cache se nesmaže (stale data) | `useUpdatePage.ts:35` | 🟠 |
| N-39b | `POST /search/reindex` hledá slug přes `findAll()` (cross-world); slug unikátní jen per-world → při kolizi zaindexuje náhodnou stránku | `search.controller.ts:129` | 🟡 |

### Svět — herní nástroje (10)
| ID | Nález | Soubor | Záv. |
|---|---|---|---|
| N-39 | `clearMapWeather` emituje `weather.updated` s `generatorId:null`; FE `useWeatherWsSubscribe` patchuje jen `g.id === generatorId` → nikdy se netrefí → karty generátorů zůstanou se starým počasím | `world-weather.service.ts:1150` × `useWeatherWsSubscribe.ts:28` | 🔴 |
| N-40 | `useAllWorldGameEvents` (CalendarPage) posílá bez `fromDate` → BE clamp na 24h cutoff pro Hráče → hráč nevidí v kalendáři historické události | `useGameEvents.ts:79` × `game-events.service.ts:136` | 🟠 |
| N-41 | `SetInGameDateModal` má Únor hardcoded `daysCount:29`; BE `setUTCFullYear(rok,1,29)` v nepřestupném roce přeroluje na 1.3 → tiše uloží jiné datum | `SetInGameDateModal.tsx:42` × `world-weather.service.ts:797` | 🟠 |

**Drobné (🟡, neeskalováno do N):** `CalendarConfigsPage` render-phase setState anti-pattern (`:65`); `advanceCustomCalendar` možný špatný rok při záporném epochOffset (`world-weather.service.ts:947` — agent si nebyl jistý, doověřit).

---

**CELKEM POTVRZENÝCH NÁLEZŮ: 41 (N-1…N-41)** + 3 false-positive + ~5 drobných/neověřených.

### ✅ Opraveno (necommitnuto)
- **N-1** test mock · **D-029** PWA ikony
- **N-9** sound:play bere ověřený `client.data.userId` (anti-spoofing) + 2 M7 testy `chat.gateway.ts`
- **N-16** isPJ ve WorldContext zahrnuje membership PomocnyPJ+ (`WorldLayout.tsx`)
- **N-22** obchod: `resolveShopScope` — hráč vidí `isShared` položky (+ regresní testy) `campaign.service.ts`
- **N-25** `diceRolls` doplněn do `MapScene` interface + `toEntity` mapperu
- **N-26** hráč smí nastavit `initiative` vlastního tokenu (`operations-authorizer`)
- **N-36** favorite světa = kurátorství → `assertCanWrite` (PJ+) `pages.service/controller`
- **N-37** `dataSlugs` gate na PomocnyPJ+ (AKJ leak slugů) + 4 testy `pages.service`
- **N-39** → **false-positive** (clearMapWeather je o mapové atmosféře, ne o kartách generátorů)
- **N-6a** contract drift naming FE→BE — 7 endpointů: email verify/resend/change-confirm/change-request, admin request-deletion/cancel-deletion/admin-permissions(PATCH) `useEmailVerify/Change*, useAdminUsers`
- **N-28** doplněn `map:leave-world` handler (`maps.gateway`)
- **N-30** `useRoomPresenceCounts` enabled jen pro přihlášené (anon 401 spam) `useGlobalChat`
- **N-32** chat presence leave filtr jen dle `userId` (ghost/kolize jmen) `ChatRoom`

> Testy: BE maps 162 ✓, campaign 52 ✓, chat.gateway 30 ✓, pages 58 ✓; FE chat 14 ✓, auth/admin/profile 98 ✓, WorldLayout 5 ✓; tsc+eslint čisté.
> **Probíhá:** full BE jest + FE vitest (ověření že globálně nic nerozbito).

### ✅ Opraveno — 2. vlna
- **N-7** members guard (OptionalJwtAuthGuard + findByIdForRequester, private→404) + regresní test
- **N-15** membership.changed odebrán z transferu (15C — world.updated pokryje refetch)
- **N-29** token.update zamčeného tokenu → 403 i pro hráče (29A) + regresní test
- **Nástroj `npm run audit:ws`** — WS kontrakt audit (potvrdil N-4/N-5 nezávisle: 7 mrtvých listenerů, 2 zahozené emity)

### ✅ Opraveno — WS gateways (N-4/N-5)
- **N-4** `FriendshipsGateway` — most EventEmitter2 → Socket.IO (`friend:*` eventy) + 6 testů
- **N-5** `PresenceGateway` — in-memory registry + idle + snapshot (`presence:*`) + 7 testů
- **Ověřeno:** `audit:ws` **čistý** (0 mrtvých listenerů, 0 zahozených emitů), DI bootstrap OK (forwardRef bez cyklu), full BE jest 1835 ✓

### ✅ Opraveno — drobné + N-35
- **N-21** FE `ChatGroup` typ doplněn o `linkedWorldGroup` (BE pole se zahazovalo)
- **N-24** `listPurchases` — hráč vidí nákupy všech svých postav (+ repo `findManyByUserAndWorld`)
- **N-38** `useUpdatePage` — `previousSlug` z callera (úklid staré cache po rename)
- **N-41** `SetInGameDateModal` Únor leap-aware (gregoriánský fallback)
- **N-35** AKJ leak v search — `pages.service.findVisibleSlugs` + filtr ve `search.controller` (DI bez cyklu, bootstrap ověřen) + regresní test

### ✅ / ⚠️ Vyhodnoceno bez opravy
- **N-40** → **by-design.** BE archive policy (9.1-I, cut-off 24h) záměrně omezuje hráče (`role < PomocnyPJ`) na nedávné/nadcházející události; archiv je PJ-only. FE komentář „5.5c minulé i budoucí" je zastaralý (předchází policy). Pokud má hráč vidět historii v kalendáři = **produktové rozhodnutí o archive policy**, ne technický bug.

### ⏳ Zbývá — k samostatnému řešení
- **N-6b** chybějící BE features — **spec níže** (self-delete, reactivace, username-request base, admin-friendships). Velké + citlivé (mazání účtů) → samostatná session, spec→souhlas.
- **N-8/N-27** weather room membership — zásah do sdílené `BaseGateway` (auth do base nebo dedikovaný membership-aware handler pro `world:*` join). Návrh: přidat `world:join` handler do `maps.gateway` (membership Čtenář+) + překlopit `useMapWeather` z obecného `room:join` na něj.
- **N-33** events invalidace — rozšířit BE `ikaros:new-message` payload o `system: boolean` (z `senderId === 'system'`) → FE `useEvents` invaliduje jen při systémové poště. Malé BE+FE.

### 📋 N-6b — průběžný stav (po dílčí implementaci)
- ✅ **username-request** (POST/GET/DELETE base) — DOPLNĚNO (repo logika už byla; service+controller+DTO+7 testů). Route audit FE↔BE sedí.
- ✅ **admin-friendships** — DOPLNĚNO **mappingem** (řešení schema driftu bez migrace): BE `Friendship`+`FriendBlock` → FE `AdminFriendshipView` (rejected→declined, blok→blocked, requester=A/recipient=B, dates→ISO). `AdminFriendshipsService` + `repo.findAllForUser` + 3 routes (AdminGuard) + 6 testů. DI bootstrap OK, route audit sedí.
- 📋 **self-deletion + reaktivace** — **celá 1.3c funkcionalita chybí v BE** (ne jen endpoint: soft-delete pole na User, 30denní hold, tombstone, PJ handover, `requestSelfDeletion`/`reactivate` service, mailer notif, **vazba na N-3 cron** — taky chybí). Nejcitlivější (mazání účtů, GDPR, ztráta dat při chybě). → **samostatný spec→souhlas, ne v rámci bug-audit session.**

### 📋 N-6b — implementační spec (k provedení po souhlasu)
Chybějící BE endpointy (FE je už volá — viz N-6 mapa). Pořadí dle hodnoty/rizika:
1. **`POST /auth/email-verify` alias** — *hotovo přes N-6a* (FE přesměrován na `verify-email`). ✅
2. **username-request** (`GET/POST/DELETE /users/me/username-request`) — BE má jen sub-routy (`…/last-unseen-decided`, `…/:id/seen`). Doplnit base CRUD nad `UsernameChangeRequest` (entita existuje). Střední, low-risk.
3. **admin-friendships** (`GET /admin/friendships`, `…/by-pair`, `POST …/:id/reset-cooldown`) — nový read+reset modul nad `friendships` repo (cooldown logika existuje). Střední.
4. **self-deletion + reaktivace** (`GET/POST users/me/deletion-request`, `POST auth/reactivate-deletion`) — **nejcitlivější** (mazání účtů, GDPR, soft-delete hold, PJ handover). Vyžaduje: soft-delete pole na User, `requestSelfDeletion`/`reactivate` service, mailer notif, cron napojení (souvisí s **N-3 cron**!). Vlastní spec→souhlas.

> Pozn.: položky 2–4 znamenají implementovat **chybějící funkcionalitu**, ne opravit překlep. FE je očekává, ale je legitimní je zatím skrýt na FE (feature-flag), dokud BE nedožene — to je tvé produktové rozhodnutí.

### ⏳ Vyžaduje tvé rozhodnutí (nedělám naslepo)
- **N-35** AKJ leak v search — oprava potřebuje page-level access filtr; architektura: injektovat PagesService do SearchModule (riziko DI cyklu pages↔search). Návrh: `pages.service.findVisibleSlugs(worldId, requester)` + filtr výsledků.
- **N-7** members bez guardu — politika: kdo smí vidět členy? (návrh: člen+ / Sa+Admin; public svět dle nastavení)
- **N-8** room:join bez membership — architektura: membership check ve world room join (injektovat membership do AppGateway)
- **N-4/N-5** WS gateways (friendship/presence) — A) doplnit gateways dle 1.5/1.8, nebo B) presence překlopit na REST poll
- **N-6** contract drift — směr sjednocení (FE→BE / BE→FE) + chybějící BE endpointy

---

## Kandidáti na bugy z plánu (L1 — našli agenti čtením, NEOVĚŘENO)

> Pozor: tohle jsou **hypotézy** z hloubkového čtení kódu. Každý nutno ověřit (L1→L3) než se prohlásí
> za bug. Agent mohl přehlédnout kontext (globální guard, URL rewrite, jiná větev). Řazeno dle závažnosti.
>
> **Ověřeno k 2026-06-03:** C-01 → 🐛 N-4 · C-02 → 🐛 N-5 · C-05/C-06/C-07 → 🐛 N-6 (potvrzeno).
> C-03, C-04, C-08–C-20 zatím **neověřeno** (čeká na exekuci).

| ID | Kandidát | Verdikt | Důkaz |
|---|---|---|---|
| C-01 | Friendship WS most chybí | 🐛 **N-4** | viz N-4 |
| C-02 | Presence WS mrtvá | 🐛 **N-5** | viz N-5 |
| C-03 | members bez guardu (auth-leak) | 🐛 **N-7** | `worlds.controller.ts:274-297` getMembers bez `@UseGuards` |
| C-04 | room:join bez membership | 🐛 **N-8** | `app.gateway.ts:12-22` jen regex formátu |
| C-05 | email-change URL | 🐛 **N-6** | FE `email-change-request` vs BE `request-email-change` |
| C-06 | admin deletion URL | 🐛 **N-6** | FE `deletion-request` vs BE `request-deletion`/`cancel-deletion` |
| C-07 | admin-permissions POST/PATCH | 🐛 **N-6** | FE POST vs BE PATCH (`admin.controller.ts:193`) |
| C-08 | adresář search vs q | 🐛 **N-6** | FE `usePublicUsers.ts:17` `search` vs BE `users.controller.ts:189` `q` |
| C-09 | assertSubdocAccess `_options` mrtvý | 🐛 **N-10** | `characters.service.ts:127` `_options` nepoužitý → hráč 403 na GET lokace |
| C-10 | isLocation vs kind | ✅ FALSE-POS | mrtvý kód; Lokace přes Pages API, `useCreateCharacter` nevolán |
| C-11 | sound:play userId spoof | 🐛 **N-9** | `chat.gateway.ts:181-203` bere `payload.userId`, ne JWT |
| C-12 | route order set-in-game-date | ✅ FALSE-POS | `world-weather.controller.ts:49-83` pořadí správné (před `:id`) |
| C-13 | themeId bez @IsIn | 🐛 **N-11** | `update-user.dto.ts:37` jen `@MaxLength(64)` |
| C-14 | displayName 64 vs 32 | 🐛 **N-6** | FE `profileSchemas.ts:15` max 64 vs BE `update-user.dto.ts:13` `@MaxLength(32)` |
| C-15 | diskuze paginace total | 🐛 **N-12** | `ikaros-discussions.service.ts:209-215` total=DB count, items po access filtru |
| C-16 | embedding ignoruje sekce | 🐛 **N-13** | `embedding-search.service.ts:307-323` buildChunks bere jen title/plainText/table |
| C-17 | SVG upload XSS | ⚠️ NEJASNÉ | SVG bez sanitizace potvrzeno (`upload.service.ts:20`), XSS závisí na FE renderu |
| C-18 | map:reassigned double-listener | ⬜ neověřeno | nižší priorita (race) |
| C-19 | enrichTokens N+1 | ⬜ neověřeno | nižší priorita (perf) |
| C-20 | PJ wrong-layer články | 🐛 **N-14** | BE `ikaros-articles.service.ts:26` ADMIN_ROLES obsahuje PJ (world role v platf. obsahu) |

**Skóre verifikace:** 16 potvrzeno · 2 false-positive · 1 nejasné · 2 neověřeno (z 20 kandidátů).

---

## Opravené v této kontrole
- N-1 ✅ model-runtime.spec.ts mock
