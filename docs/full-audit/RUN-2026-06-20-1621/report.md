# Plný audit (hloubková brána) — RUN 2026-06-20-1621 (FE 96460577 / BE fb0f8b0)

Spuštěno přes skill `plny-audit` na čistý běh „od začátku" (na žádost uživatele). Rozsah: **všech 16 stylů, plná hloubka Fáze B** (vyčerpávající agentní průchod **všech 103 oblastí**, 1 agent = 1 oblast, statika L1-L3). Proof-vrstvy: **+e2e** (replSet) spuštěno; **+db** lokální Mongo dole (prod čeká souhlas) ⏭️; **+formal** žádné `.tla` modely ⏭️; **+teeth** Stryker nespuštěno ⏭️.

> Pozn.: tento běh je hloubkově nad rámec ranního RUN-2026-06-20-1303 (ten dělal jen centrální SWEEP L1-L2, 0 checkpointů Fáze B). Tady proběhl plný fan-out se 103 checkpointy.

## TL;DR
- **103/103 oblastí** prošlo do plné statické hloubky (L2-L3). Checkpointy v `checkpoints/`.
- **Čerstvé nálezy (RUN): ~14 🔴 · ~75 🟠 · ~260 🟡** (po dedupu napříč audity). Mnoho křížově potvrzeno (vyšší jistota).
- **META brána** (`audit:regression --ci`): ✅ **0 regresí** (každý dříve opravený důležitý nález má pojistku G≥2; 3 fixed&G0 = warn).
- **e2e seed-scenario:** ✅ PASS (replSet, páteř drží na HEAD). **race e2e:** běží.
- **Freshness (Fáze A):** plány sedí na HEAD; drift (10 položek) = známý povrch 2FA(14.1)+export(14.7), baseline jen neaktualizován.
- **Systémové kořeny** (opakují se napříč audity): viz sekce „Systémové vzorce".

---

## 🔴 Kritické nálezy (čerstvé, RUN) — kandidáti na Fázi E

| ID | Audit/oblast | Popis · Kde | Třída |
|---|---|---|---|
| **N-RUN-01** | bug/01-auth | Ban nerevokuje refresh tokeny + `auth.service.refresh()` nekontroluje `bannedAt` → zabanovaný refreshuje tokeny až 30 d. `auth.service.ts` refresh + `banUser`. | 🆕 bezpečnost |
| **N-RUN-01** | bug/02-uzivatele | FE posílá `search=`, BE čte `q=` → **vyhledávání uživatelů nikdy nefunguje**. `useUsers`/`users.controller`. | 🆕 funkční |
| **N-RUN-05** | bug/02-uzivatele | `getStatus` nevrací `friendshipId` → tlačítka Přijmout/Odmítnout na profilu se nikdy nezobrazí. | 🆕 funkční |
| **N-RUN-01** | bug/03-profil | `DeleteAccountModal` čte `data.preview`, BE vrací plochý objekt → PJ-handover promotions se nikdy nezobrazí (smazání účtu UX broken). `useDeleteAccount.ts:43` × `users.service.ts:749`. | 🆕 funkční |
| **N-RUN-01 / R-RUN-01** | bug/04 = role/02 | `addPost` nevolá `canAccessDiscussion` → kdokoli přihlášený píše do uzamčené diskuze (zná-li ID). `ikaros-discussions.service.ts:496`. **3× potvrzeno.** | 🆕 authz bypass |
| **N-SHG-01** | bug/10-svet-hra | `daysInMonth` `mod(n,0)`→NaN→TypeError při `config.months=[]` → crash FantasyDatePicker. `absDay.ts:114`. | 🆕 crash |
| **N-AD-01** | bug/12-admin | `requestUserDeletion`/`cancel`: actor bez `adminPermissions` z JWT → Admin s `canModerateContent` vždy 403. `admin.service.ts:471,561`. | 🆕 funkční |
| **N-AD-02 / N-RUN-07** | bug/12 = bug/02 | FE `hasPendingRequest` vs BE `@Query('hasPendingDeletion')` → admin filtr „čeká na smazání" nefunguje. | 🆕 funkční |
| **F-RUN-02** | form-schema/00 | `page.customData` (typ Noviny) **bez `sanitizeRichText`** → stored XSS přes `dangerouslySetInnerHTML` (`NovinyLayout.tsx:66`). Stejná třída jako opravený F-02 timeline. `pages.service.ts:242,384`. | 🆕 **XSS** |
| **F-RUN-CH-01** | form-schema/05 | `CustomDiaryBlockDto` chybí `imageUrl`/`expression` → „Vlastní šablona deníku" s image blokem = 400 (`forbidNonWhitelisted`). `update-character-diary.dto.ts:42`. | 🆕 funkční |
| **RC-D7** | race/04-mazani | `WorldCleanupCron.sweep()` + `hardDelete` nekontroluje `isActive`/`deletedAt` → Admin `restore` v okně mezi `findExpiredDeleted` a `hardDelete` = **trvalá ztráta celého světa** (~35 kolekcí). | 🆕 data-loss |
| **UM-RUN-01** | upload/00 | `SendImageToChatDialog` posílá `publicId:''` → `assertAttachmentsOrigin` (UM-08 fix) odmítne → **„pošli obrázek scény do chatu" nefunguje od UM-08**. Regrese fixu. | ♻️ regrese |
| **W-RUN-07-02 / R-RUN-02** | ws/07 = role/09 | `map:join` ověřuje jen existenci membership, ne roli → `Zadatel(0)` (pending člen) dostává live `map:operation` (HP/pozice/fog). `maps.gateway.ts:122`. **4× potvrzeno.** | 🆕 leak |
| **W-RUN-01 (PRES-13)** | ws/04-presence | `PresenceGateway.handleConnection` nečte `hiddenPresence` → uživatel v „neviditelném módu" se zobrazuje online přes WS. Privacy. | 🆕 privacy |

> seed-scenario hlásil 6× 🔴 — to jsou **test-coverage gaps** (chybějící e2e specs FA/mazání/MG/PB), ne kódové bugy. V samostatné kategorii níže.

---

## ✅ Fáze E — provedené opravy (ověřeno, NEcommitnuto — po BE změně nutný restart)

**BE** — typecheck ✅, jest discussions+pages 125/125 ✅, admin 37/37 ✅:
- **F-RUN-02 (XSS 🔴)** — `pages.service.ts`: nový `sanitizeCustomData()` + aplikace v create i update. `customData` (Noviny) se sanitizuje jako content/table.
- **N-RUN-01 / R-RUN-01 (addPost authz 🔴)** — `ikaros-discussions.service.ts` + controller: `addPost` volá `canAccessDiscussion` (nový role param). + regresní test (nepozvaný → 403).
- **N-AD-01 (admin permission 🔴)** — `admin.service.ts` requestUserDeletion + cancelUserDeletion: `actorFull` z DB (`findById`) místo RequestUser bez `adminPermissions` → Admin s `canModerateContent` projde místo 403.

**FE** — eslint ✅, build (tsc-b+vite) ✅, vitest calendarEngine 17/17 ✅:
- **N-SHG-01 (crash 🔴)** — `absDay.ts`: guard na prázdné `months` (degraduje na 0 místo NaN/TypeError). + regresní test.
- **N-RUN-01 (search 🔴)** — `usePublicUsers.ts`: FE posílá `?q=` (ne `?search=`) → hledání uživatelů konečně filtruje.
- **N-AD-02 (hasPending 🔴)** — `useAdminUsers.ts`: FE posílá `?hasPendingDeletion=` → admin filtr funguje.

### ⚠️ Verifikační korekce (čtení kódu přebilo agentní nález)
- **bug/01 N-RUN-01 (refresh ban) — VYVRÁCENO:** `admin.service.banUser` **revokuje** refresh tokeny (`refreshTokenRepo.revokeAllForUser`, ř.383) → revoked token = refresh selže, žádná 30denní díra. Agent revokaci přehlédl. `bannedAt` v `refresh()` = jen defense-in-depth, ne 🔴.

### ✅ Skupina B — provedené opravy (2. dávka, ověřeno, NEcommitnuto)
**BE** — typecheck ✅, jest maps.gateway 6/6 + sounds 39/39 ✅:
- **W-RUN-07-02 / R-RUN-02 (map:join 🔴)** — `maps.gateway.ts`: sjednoceno s REST `assertCanReadScene` (PomocnyPJ+ vše, ostatní jen vlastní `currentSceneId`; Zadatel i cizí scéna odmítnuty). + 6 testů.
- **W-RUN-07-03 (map:ping 🟠)** — room-membership check (jen scéna, kde klient je) → konec cross-scene spoof.
- **R-RUN-01 (world-sounds 🟠)** — `sounds.service.assertIsMember` + GET findAll/findOne gate (leak privátního světa). + 4 testy.
- **CD-RUN-5/6 (cascade orphan 🟠)** — `WORLD_SCOPED_COLLECTIONS` +3: `worldMapEntries`, `worldMapFolders`, `diary_schema_versions` (jinak orphan po hard-delete světa).
- **RC-D7 (restore-race 🔴)** — `world-hard-delete.service.ts`: guard `deletedAt != null` před kaskádou → Admin restore v okně už netriggeruje trvalou ztrátu světa. (e2e db-lifecycle pojistka)

### ✅ Skupina B — 3. dávka (po rozhodnutích uživatele, ověřeno, NEcommitnuto)
**BE** — typecheck ✅, jest (characters/ikaros 187 · friendships 17 · presence 20) ✅:
- **CD-RUN-7..12 (blob leak 🟠)** — `world-hard-delete.service.ts`: `BLOB_COLLECTIONS` + `collectBlobs` → před hard-delete světa se posbírají `imageUrl`/`avatarUrl` z emotes/scén/ikon/bestií/atlasu/membership a emitne `media.orphaned` (úklid Cloudinary).
- **R-RUN-02 (characters directory 🟠)** — gate dle `accessMode` (veřejný svět = veřejně, privátní = jen členové) + OptionalJwt. *(Rozhodnutí uživatele #2.)*
- **R-RUN-03 (Tyky backdoor 🟠)** — odstraněn `username === 'Tyky'` ze 3 ikaros modulů; Tyky drží plnou moc přes roli Superadmin v ADMIN_ROLES (konec rename-útoku). + testy aktualizovány. *(Rozhodnutí uživatele #1.)*
- **N-RUN-05 (getStatus friendshipId 🔴)** — BE-only: getStatus vrací `friendshipId` (FE profil + typ ho už čekaly → tlačítka Přijmout/Odmítnout konečně fungují).
- **W-RUN-01 (hiddenPresence 🟠 privacy)** — `presence.gateway.ts`: neviditelný mód respektován na všech 4 broadcast místech (online/offline/idle/snapshot) + fail-safe (chyba DB = viditelný). + UsersModule DI + 4 testy.

> ⚠️ **CH-011 (zachycená vlastní regrese):** první verze characters-directory gate byla přímo v `getDirectory()`, ale tu metodu volá i `chat.service` interně (enrich postav) bez user kontextu → **403 regrese chat kanálů** (e2e seed-scenario-isolation červené). Diagnóza bisekcí `git stash`+e2e. Oprava: gate vytažen do samostatné `assertCanViewDirectory()` volané jen z HTTP controlleru. e2e 21/21 zelené. Zapsáno do chybového deníku.

**Ověření celé Fáze E:** e2e seed-scenario+isolation 21/21 ✅ · race 26/26 ✅ · db-lifecycle 4/4 ✅ · META brána 0 regresí ✅ · FE build+vitest ✅ · BE lint ✅.

### ✅ Skupina B — 4. dávka (rozhodnutí #1/#2/#3, ověřeno, NEcommitnuto)
- **#3 TOTP_ENC_KEY (PC-RUN-01, OPS)** — doplněn do `docker-compose.prod.yml` (`${TOTP_ENC_KEY:-}`, opt-in ne boot-fatal), `deploy.yml` (passthrough secret) a `.env.example`. ⚠️ **Ty musíš nastavit GitHub secret `TOTP_ENC_KEY`** — to za tebe nejde.
- **#2a reconnectSocket (S-RUN-04)** — `useSocket.ts`: `useSocketReconnect` sleduje `socketStatusAtom` (jako useSocketEvent) → po `reconnectSocket()` se re-join callbacky (~14 call-sites) přeregistrují na novou instanci. + 1 nový test (4/4 vitest).
- **#2b WS leak-safe (R-RUN-01)** — `worlds.gateway.ts`: `world:updated` i `world:membership:changed` emitují **leak-safe signál** (`{worldId}` / `{worldId,membershipId}`) místo plného `World`/`WorldMembership` (privátní data). FE jen invaliduje → ověřeno, payload nečte. + 2 testy (7/7).
- **#2c DeleteAccountModal (N-RUN-01 🔴)** — FE: `DeletionResponse` sjednocen na **plochý** BE tvar (`{promotions, deletionRequestedAt, scheduledHardDeleteAt}`); `DeleteAccountModal` čte `data` (ne `data.preview`) → PJ-handover promotions se konečně zobrazí. FE build ✅.
- **#1 +db** — pipeline materializován (`proof/integrity-scan.mjs` + `orphan-scan.mjs`) a **validován** proti lokální mongo (běží, EXIT 0). ⚠️ **Reálná DI-* kvantifikace potřebuje prod read-only connection string** (`www.projekt-ikaros.com`) — není v repu (deploy secret). Lokální/seed DB je čistá → 0 nálezů (DI-* problémy žijí jen v migrovaných prod datech).

**Celkem opraveno: 22 nálezů + 3 deploy/OPS místa. Vlastní regrese CH-011 zachycena+opravena.**

### Uzavření (2026-06-20)
- **BE commitnuto + pushnuto na main** (`252f840`, 27 souborů) → trigger deploy.
- **TOTP_ENC_KEY** GitHub secret nastaven uživatelem ✅ (2FA prod se zprovozní deployem).
- **+db DI-* kvantifikace: volba A** — ponecháno ⏭️. Prod Mongo běží v interní docker síti (`mongodb://mongo:27017`), zvenčí nedostupná; nálezy jsou staticky identifikované (které kolekce), chybí jen počty pro prioritizaci. Skripty připravené v `proof/` pro budoucí běh na serveru.

### Odloženo do skupiny B (nuance / BE+FE koordinace / architektura)
- **getStatus friendshipId** — BE return rozšíření + FE konzument (koordinace).
- **DeleteAccountModal preview** — celý kontrakt-redesign (FE typ `{preview,state}` × BE plochý `{promotions,...}`; tvar nesedí ani v polích).
- **UM-RUN-01 SendImageToChatDialog** — vyžaduje rozhodnutí o `assertAttachmentsOrigin` (publicId vs vlastní URL).
- **world-gate characters/sounds** — spec otázka „veřejný adresář" vs leak privátního světa.
- **map:join role · hiddenPresence** — WS, vyžadují socket testy.
- **Skupina B celá** — viz níže.

> Zbývající 🔴/🟠 viz tabulka výše + sekce „k rozhodnutí".

## Systémové vzorce (kořeny opakované napříč audity)

1. **Chybějící world-level gate na read endpointech** — `pages/data` (findRandom), `pages/directory`, `characters`, `characters/directory`, `sounds` → nečlen privátního světa čte obsah/seznamy. Potvrzeno bug/08 + role/04+05 + error-contract/04 (4-5×). Vzor: `pages.service`/`chat.service` mají `assertCanViewWorld` (R-09b), tyto moduly ho nedostaly.
2. **`reconnectSocket()` slepota** — `useSocketReconnect` má `deps=[]`; po `reconnectSocket()` (toggle hiddenPresence) re-join callbacky (~14 call-sites) se nespustí → real-time slepota do F5. ws/09 + ws/04 + state/00 (S-RUN-04). `useSocket.ts:57`.
3. **`WorldHardDeleteService` blob leak** — maže DB dokumenty, ale nesbírá `imageUrl` do `media.orphaned`: custom_emotes, membership avatary, mapScenes, chatgroups, bestiae. + `worldMapEntries/folders` chybí ve `WORLD_SCOPED_COLLECTIONS` (orphan). cascade/00 (9 nálezů) + upload/02-05.
4. **FE čte `data.code` flat místo `data.error.code`** — 7 souborů → ~13 error-mapping větví mrtvých (TOTP login, nákup, adjust balance, change currency, emote). error-contract/02 + /08. M-CONTRACT scanner má blind spot.
5. **`forbidNonWhitelisted:true` naming-drop → 400** — DTO postrádá pole, které FE posílá: HexConfig HP toggle (šablona scény), MenuItem.imageUrl, TOTP disable password<6, bestie imageUrl clear, ikaros-event imageFit. form-schema napříč.
6. **WS broadcast plných objektů místo leak-safe signálu** — worlds.gateway (plný World), membership:changed (privátní data), emotes (createdBy/imageId), maps. role/09 + ws/06+08.
7. **`TOTP_ENC_KEY` chybí ve všech deploy zdrojích** (compose/deploy.yml/.env.example) → 2FA v prod fail-closed (503). prod-config 7×. **= OPS krok** (nastavit env), ne kód.

---

## Per audit (matice)

| Audit | Oblastí | Dosažená L | 🔴 | 🟠 | 🟡 | Pozn. |
|---|---|---|---|---|---|---|
| bug | 14/14 | L2-L3 | 6 | ~9 | ~20 | nejvíc funkčních bugů; world-gate + admin permission |
| role | 10/10 | L2 | 0 | ~10 | ~12 | world-gate read leaky, leave() ceiling, WS leaky, Tyky backdoor |
| ws-contract | 9/9 | L2 | 1 | ~8 | ~15 | maps join role, reconnectSocket, plné objekty, hiddenPresence |
| prod-config | 9/9 | L3 | 0 | ~6 | ~13 | TOTP_ENC_KEY (OPS), PC-15 Dockerfile downgrade |
| error-contract | 9/9 | L2-L3 | 0 | ~4 | ~12 | flat data.code (7 souborů), fields nečteno, WS 2 tvary |
| log-hygiene | 10/10 | L3 | 0 | 0 | ~12 | logError bypass ×3, vite drop console, audit trail gaps |
| form-schema | 11/11 | L2 | 2 | ~6 | ~15 | XSS customData, diary 400, naming-drop drifty |
| cache | 13/13 | L2-L3 | 0 | ~2 | ~20 | invalidation gaps, ChannelView reconnect, world-maps WS |
| upload-media | 8/8 | L3 | 1 | ~8 | ~10 | WorldHardDelete blob leak, editMessage origin, copy emote shared blob |
| state-consistency | 1/1 | L2 | 0 | 1 | 1 | S-RUN-04 reconnectSocket (systémový) |
| cascade-delete | 1/1 | L2 | 0 | 4 | 5 | WorldHardDelete blob leak (kořen) |
| db-integrity | 1/1 | L2 | 0 | 1 | ~6 | world deletedAt+isActive, orphan refs; 15 +db proof-req |
| race-condition | 5/5 | L1-L4 | 1 | ~4 | ~5 | RC-D7 restore race, undoLast $set fallback, leave() playerCount |
| seed-scenario | 1/1 | L1-L2 | (6 cov) | ~5 | 2 | chybějící specs FA/mazání/MG/PB (coverage, ne bug) |
| nav | 1/1 | L2-L6 | 0 | 0 | 1 | jen external link target=_blank; NAV-01..09 drží |
| anti-regression | META | ✅ | 0 | 0 | 0 | 0 regresí, brána zelená |

---

## Proof-vrstvy (Fáze C)

| Vrstva | Stav | Detail |
|---|---|---|
| **+e2e seed-scenario** | ✅ PASS | replSet, páteř (SE/IN/AC + IS izolace) zelená na HEAD |
| **+e2e race-condition** | ✅ PASS | race/* 7 suites / 26 testů (61s) — existující RC fixy D1-D6/E1-E5/P1-P4/R1-R5 drží; nové RC-D7/D8/D9 bez e2e pokrytí (staticky L1-L2) |
| **+db** | ⏭️ blokováno | lokální Mongo (localhost:27017) neběží; reálná čísla DI-* (orphan/dup/type) = **prod read-only, čeká explicitní souhlas** ([project_server_swap]) |
| **+formal (TLC)** | ⏭️ N/A | žádné `.tla` modely nenapsány (state/race plány je nemají) |
| **+teeth (Stryker)** | ⏭️ neproběhlo | BE config existuje; G-matice (266 pojistek) jako náhrada |

---

## 📈 Freshness / coverage drift (Fáze A)
Drift = 10 položek, **vše známý povrch** z 2FA(14.1) + world-export(14.7): trusted-device.schema, *-totp DTO, THROTTLER_REDIS, ikaros-event/trusted-devices delete cesty, trusted-devices query-keys. Plány sedí na HEAD; baseline jen neaktualizován (`--update-baseline` nespuštěn). Mezi RUN-1303 (FE 2a6c8e1c) a HEAD nepřibyl nový auditovatelný povrch (FE commity = testy/doc, BE = opravy).

---

## ⏭️ Neproběhlé vrstvy (jak odblokovat)
| Vrstva | Důvod | Jak odblokovat |
|---|---|---|
| +db reálná čísla (DI-01/03/05/07/08, cascade orphan/blob counts) | lokální Mongo dole; prod = produkce | nastartovat dev Mongo + seed, NEBO prod read-only s explicitním souhlasem (`www.projekt-ikaros.com`) |
| +formal TLC | žádné `.tla` modely | napsat TLA+ modely pro reconnect/ekonomiku (mimo rozsah tohoto běhu) |
| +teeth Stryker | nespuštěno (dlouhé) | `cd backend && npx stryker run` per modul na pozadí |

## Seed-scenario coverage gaps (test-debt, ne kódové bugy)
SS-RUN-03 (FA fault-injection), SS-RUN-04 (oblast 09 mazání), SS-RUN-07 (MG migrace-parita), SS-RUN-08 (PB parametrický režim) — e2e specs neexistují. SS-RUN-01/02 (playerCount/auto-konverzace tvrzení chybí v páteři). Doporučení: doplnit po dohodě, samostatná práce.
