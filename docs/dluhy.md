# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-NEW-SYS-PRESET-SEED-DRIFT — BE diarySchema seed nemá preset pro 5 systémů
> **FE část vyřešena 2026-06-23 (16.2a, ✅ ŘEŠENÍ fe.md).** Původní `D-NEW-SYS-DIARY-DRIFT` (Dračí Hlídka) byl jen špička: FE sheet/plugin lookup spadl na generic u **tří** systémů (`draci-hlidka`/`drd-plus`/`call-of-cthulhu`). Opraveno aliasy v obou FE registry + parity guard test. **Zbývá níže popsaná druhá, nezávislá porucha na BE.**

**Soubor:** `backend/src/modules/system-presets/presets/index.ts` + `system-presets.service.ts` (`findOne`, striktní `p.system === system`) ↔ `world.system` z `RPG_SYSTEMS`.
**Problém:** Při vytvoření/změně systému světa BE seeduje `diarySchema` přes `SystemPresetsService.findOne(world.system)`. BE presety mají **vlastní, jinou sadu id** (`matrix-custom`, `drd-hero`, `drd16-warrior/wizard/thief/ranger/alchemy`, `call-of-cthulhu`…). Pro uložené `world.system` **`matrix`, `drd16`, `drd2`, `drd-plus`, `draci-hlidka`** BE žádný preset nenajde (`drd2` a `drd-plus` chybí úplně) → **seedne prázdné `diarySchema`**.
**Dopad:** Nízký–střední — maskováno tím, že per-system schémata jsou canonical na FE (`project_schema_be_fe_sync`) a BE jede soft-mode; reálná data deníku jedou přes FE sheet (ten už funguje). Ale BE seed je mrtvý/nekonzistentní pro tyto systémy a `system-presets` granularita (`drd16` rozpadlý na 5 povolání, `drd-hero` ≠ `drdh`) neodpovídá FE modelu.
**Řešení (k rozhodnutí):** buď přidat alias/normalizaci i do BE `findOne` (zrcadlo FE), nebo BE `system-presets` přemapovat na FE-canonical id, nebo BE seed úplně opřít o export-schemas z FE a `system-presets` retírovat. **Po BE změně restart** (`feedback_be_restart_required`).
**Kdy:** Při dotahování BE strany 16.2 (ne blokuje FE grafický průchod 16.2a).

#### Mikro-dluh: alias mapa duplikovaná ve 2 FE registry
`SYSTEM_ALIASES` je samostatná kopie v `diary-systems/registry.ts` i `map-systems/registry.ts` (komentář tvrdí „jediná zdrojová pravda", fakticky 2 kopie → riziko driftu při příštím přidání systému). Extrahovat do sdíleného modulu (blokuje společný `SystemId` typ — dnes 2 nezávislé). Nízká priorita.

---

> **Dluhy z inventury funkcí (2026-06-18).** Devět seskupených `D-NEW-INV-*` níže vzniklo z kódem ověřené inventury [`docs/funkce/`](funkce/00-prehled.md). Master tracker + mapování na fáze: `docs/roadmap2.md` → **Průřez Ú**. Cíl: na konci Etapy II 0 otevřených. (Rychlé doc/text fixy se řeší zvlášť, ne tady.)

### D-NEW-INV-SEC — Inventura: bezpečnostní nálezy účtu/světa
> **Z větší části vyřešeno 2026-06-27 (4/5).** Zbývá jen persona-on-server (níže). **Po BE změně restart** ([[feedback_be_restart_required]]).
- **Heslo** `@MinLength(6)→(8)` na **obou** stranách — BE `register.dto` + FE `registerSchema` (+ spec). Sjednoceno s reset/změnou (už 8). Re-auth `PasswordConfirmDto` zůstává 6 (validuje **stávající** heslo → legacy 6-znaková hesla se nesmí zamknout). ✅
- **Veřejný profil endpoint** — `GET profile/:id` byl **už odstraněn 2026-06-18** (zůstal jen gated `profile/v14/:id`, JwtAuthGuard + gating + throttle). Nález byl zastaralý. ✅
- **themeUserOverrides** — `updateMyTheme` teď **reuse existujícího** `sanitizeThemeOverrides` (stejný jako world-level: `--theme-*` prefix, max 200 zn., max 60); `undefined`→`undefined` = BC. (Pozn.: nejdřív jsem napsal duplicitní private sanitizér — funkce inventura ř. 275 ukázala, že funkce už existuje → reuse.) ✅
- **POST /scenarios** — role-floor `< PomocnyPJ` → 403 (scénáře = PJ storyboard nástroj). Gate na **controlleru** (ne service) → mimo riziko interních volání (CH-011). ✅
- **Zbývá — persona-on-server:** render-time PJ persona (FE) se neaplikuje na **serverové** cesty (push payload, news/feed, export) → tam může prosáknout reálné jméno PJ. Cross-cutting (`push.service` + news + export + resolver persony) → vlastní krok, ne one-liner.
**Ověřeno (4/5):** BE typecheck ✓, lint:check + elevation guard ✓, jest `worlds`/`campaign`/`auth` **317/317** ✓ (worlds re-run po reuse 172/172). FE tsc -b ✓, `registerSchema` 11/11 ✓.
**Kdy:** persona zbytek Fáze 14. Zdroj: `docs/funkce/` kap. 01/02/10/13/15.

### D-NEW-INV-PUSH — Inventura: web push spam + chybějící deep-link
**Soubory:** BE `global-chat.service.ts` (`notifyAll` na každou zprávu), `ikaros-news.service` (`notifyAll` bez `url`), `push.service`; FE `public/sw.js` (deep-link připraven); pošta `ikaros-messages` (bez push).
**Problém:** globální chat pushuje **každou** zprávu **všem** (spam-vektor, bez throttlingu/opt-out/exclude odesílatele); push payloady nemají `url` → klik otevře jen `/` místo cílové místnosti/novinky; pošta nepushuje vůbec; jediný přepínač zapne/vypne vše (žádné per-typ předvolby).
**Dopad:** Střední — push prakticky nepoužitelný pro aktivní uživatele.
**Řešení:** `url` do payloadu; throttle + opt-out + vyloučit odesílatele u chatu; push i pro poštu; per-typ předvolby.
**Kdy:** Fáze 14.8 / 15.1 (PWA). Zdroj: kap. 04/05. Souvisí [[project_web_push_chat_status]].

### D-NEW-INV-ADMIN-UI — Inventura: BE endpointy bez FE (admin/účet)
**Soubory:** BE `users.controller` reset-password (Superadmin), `admin.controller` `POST /admin/users`, `data-export.controller` `/me`, `auth` `logout-all`; FE chybí.
**Problém:** funkční BE endpointy nemají FE: admin reset hesla, založení uživatele, GDPR export vlastních dat, „odhlásit všechna zařízení". Změna cizího e-mailu adminem neexistuje vůbec.
**Dopad:** Střední — GDPR export z UI nedostupný; admin operace jen přes API/skripty.
**Řešení:** doplnit FE konzumenty + admin formuláře; zvážit endpoint pro adminskou změnu e-mailu.
**Kdy:** Fáze 14.7 (export) / 20.2 (GDPR). Zdroj: kap. 01/08.

### D-NEW-INV-PROFILE — Inventura: profil & seznam uživatelů
> **Částečně vyřešeno 2026-06-27.** `displayName` + `void role` vyřízeny; zbývá worldsCount + komunitní stuby.
- **`displayName` trim** — FE `headerSchema` (`.trim()`) + BE `UpdateUserDto` (`@Transform` trim, `transform:true`) → „jen mezery" → prázdné (fallback na username). ✅ (BE jest 20/20 vč. trim test, FE+BE typecheck)
- **`void role` taby** — ZÁMĚR (12.1): všechny role vidí stejné 3 komunitní taby (zafixováno testy); param vestigiální, ne mrtvý nález. ✅ (vyjasněno, bez churnu)
- **Zbývá:** `FriendsTab` `worldsCount=0` natvrdo (chce BE doplnit count do friend shape — BE change); FE profil „Moje diskuze/články/galerie" stuby (napojit na existující moduly — větší).
**Dopad:** Nízký — kosmetika. **Kdy:** zbytek Fáze 15.6 / 16.4. Zdroj: kap. 02.

### D-NEW-INV-DATA-SYNC — Inventura: konzistence dat postav/měn
**Soubory:** BE `map-operations.service.ts` (token→Character sync TODO), `world-currencies` `updateCurrencies` (full-replace), `character-subdocs.service.ts` (finance/inventory create vs. read), `characters.repository.ts` (legacy `/characters/directory`).
**Problém:** staty/HP tokenu PC/NPC se z mapy nepropíšou do listiny postavy (žijí v `diary.customData`); `updateCurrencies` přepisuje celou sadu (riziko ztráty měn bez delta merge); subdoc finance/výbava se zakládají i pro NPC/Lokaci, ale `getFinance`/`getInventory` je pro ně blokuje 404 → orphan data; legacy adresářový endpoint zůstává vedle Pages directory (dvojí zdroj).
**Dopad:** Střední — tichá nekonzistence.
**Řešení:** dotáhnout token↔Character sync; delta merge měn; nezakládat nepoužitelné subdoky (nebo je zpřístupnit); odstranit legacy directory.
**Kdy:** Fáze 16.2. Zdroj: kap. 12/14.

### D-NEW-INV-MAPS — Inventura: taktická mapa nedotažené
**Soubory:** BE `maps`/`map-operations` (undo `inverse=null` u `scene.deactivate`, `member.bulkAssignToScene`; combat order), `world-maps.service.ts:47` (role práh PJ).
**Problém:** undo neúplné (některé operace nelze vrátit); role-prahy nejednotné (atlas „Mapy" = PJ, ale taktická mapa/zvuky/deník = PomocnyPJ); combat order má dvojí zdroj pravdy (`scene.combat.order` vs. live-sort dle initiative); „A* pohyb" reálně jen dosah, ne pathfinding přes překážky.
**Dopad:** Nízký–střední — UX pasti pro PJ.
**Řešení:** doplnit inverse pro chybějící operace; sjednotit role-prahy; vyjasnit jediný zdroj combat order; pathfinding buď doplnit (17.x), nebo opravit spec (rychlý fix).
**Kdy:** Fáze 17.x. Zdroj: kap. 14.

### D-NEW-INV-CASCADE-INGAME-DATE — in-game datum se nepromítne do „Dnes" v /kalendar
**Problém:** in-game datum (advance-day v Počasí) se nepromítne do „Dnes" v `/kalendar` — sjednotit zdroj in-game data. (Zbytek kaskád/času z inventury vyřešen plným auditem 14.9, 2026-06-20 — v git logu.)
**Dopad:** Nízký — UX.
**Kdy:** mimo 14.9. Zdroj: kap. 15.

### D-NEW-INV-CLEANUP — Inventura: úklid kódu (drift & mrtvé)
> **audit-log labely SJEDNOCENY 2026-06-27:** FE `AdminAuditAction` (shared/types) srovnáno s BE `admin-audit-log.interface.ts` — doplněno 16 chybějících akcí (DELETE/HARD_DELETE/BULK_*/WORLD_ELEVATION_*/ACCOUNT_*/USER_CREATE/PERMISSIONS_CHANGE/UNDELETE…) + labely + badge třídy (exhaustivní `Record` → TS hlídá úplnost). Dřív se prázdné. `FRIENDSHIP_COOLDOWN_RESET` zůstává FE-only phantom (BE ho nikde neemituje — drobnost: až BE začne logovat reset cooldownu, label je připraven; jinak FE drop). FE tsc ✓, PlatformAdminPage 6/6 ✓. **Zbytek úklidu níže neřešen.**
**Soubory (zbývá):** BE `user.interface.ts` (UserRole legacy 3–8), `UsersTable.tsx` (`canEditPlatformPages` mrtvý flag), 3× content service (`Tyky` bypass), `admin.service.ts` (`getUsers` in-memory filtr), `meili-search.service.ts` (tichý fail), favorites toggly (duplicitní).
**Problém:** BE `UserRole` stále drží legacy world role (3–8), FE už vyhodil (drift po D-053); `canEditPlatformPages` se ukládá, ale nikde nevynucuje; admin bypass přes username `=== 'Tyky'`; `getUsers` filtruje až po vytažení stránky (nekonzistentní paginace); MeiliSearch bez Dockeru vrací prázdno bez chyby; favorites toggle zkopírovaný v 3 modulech; audit-log labely se rozcházejí FE↔BE.
**Dopad:** Nízký — maintainability + 1 provozní past (Meili).
**Řešení:** vyčistit BE enum; odstranit mrtvý flag; bypass přes roli/flag; paginace v DB dotazu; surface Meili health/chybu; centralizovat favorites; sjednotit audit-log labely.
**Kdy:** Fáze 14.9. Zdroj: kap. 02/06/08.

---

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_

---

## Odložené (čeká na trigger)

### D-NEW-UM02-private-media-delivery — Privátní média mají veřejnou Cloudinary URL
**Soubory:** BE `upload.service.ts` (upload type), `images.controller.ts` (proxy); FE render privátních obrázků (mapy, AKJ, chat)
**Stav:** Cloudinary assety se nahrávají jako `type: 'upload'` (public). Privátní obsah (AKJ obrázky ve stránkách, privátní mapy `visibleToPlayerIds`, přílohy privátních zpráv) má veřejnou URL → kdo zná link, stáhne i bez oprávnění. BE access správně filtruje JSON odpovědi, ale URL samotná není chráněná. **Vědomě akceptováno (upload/media audit UM-02, 2026-06-14):** publicId je 20+ znaků náhodný (enumerace nemožná), únik vyžaduje aktivní sdílení oprávněným uživatelem. Pro single-svět hobby provoz je obscurity dostatečná.
**Trigger:** veřejný / komerční / multi-tenant provoz, kdy svět/postavy uvidí cizí lidé a obscurity přestane stačit (riziko hromadného scrape).
**Co bude potřeba:** rozhodnout (a) proxy endpoint s ACL pro NE-TipTap média (mapy/page.imageUrl/chat — jdou přes komponenty) vs (b) Cloudinary `authenticated` type + signed delivery URL (čistší, ale re-upload migrace ~3000+ assetů + signed URL expirace rozbije TipTap embedy). **Pozor:** AKJ obrázky vložené přímo v TipTap HTML (`section.content`) nezavře ani jedna varianta bez přepsání uloženého obsahu — known gap.

### D-NEW-UM10-storage-quota — Žádná per-user storage kvóta na uploady
**Soubory:** BE `upload.controller.ts` (rate-limit ✓ hotový), chybí storage tracking
**Stav:** Upload routy mají rate-limit (`@Throttle` 20/min/IP — UM-10, 2026-06-14), což brání rychlému spamu. Chybí ale **kumulativní per-user kvóta** (celková velikost nahraného obsahu) → trpělivý uživatel může postupně zaplnit Cloudinary úložiště.
**Trigger:** Cloudinary se blíží limitu free/placeného tieru, nebo komerční provoz s neznámými uživateli.
**Co bude potřeba:** sledovat součet `size` per uživatel (kolekce/agregace), gate v upload service při překročení.

### D-NEW-PC21-embedding-model-host — Embedding modely fyzicky hostovat (zbývá OPS krok)
**Soubor:** BE `backend/src/modules/search/embedding-search.service.ts:370-396` + `docker-compose.prod.yml` + `.env.example`
**Stav:** Production-config audit **PC-21 — konfigurační část HOTOVÁ:** model URL (granite107/278 ONNX+tokenizer) jsou teď explicitní a přepsatelné přes env (`EMBEDDING_GRANITE*_ONNX_URL`/`_TOKENIZER_URL`) v compose i `.env.example` (default = `www.patrikzplzne.cz`). Skrytá závislost zviditelněna. **Zbývá jen OPS krok** (mimo kód): nahrát model soubory na vlastní hosting (Cloudinary/S3/BE image) a přepsat ty env vars — to nelze udělat bez přístupu k souborům modelů.
**Trigger:** příprava ostrého provozu se sémantickým search, nebo nedostupnost `patrikzplzne.cz` ([[project_server_swap]] — sourozenec `newmatrix.patrikzplzne.cz` je mrtvý).
**Co bude potřeba:** stáhnout 4 model soubory, nahrát na vlastní úložiště, nastavit 4 env vars v GitHub vars / serverovém `.env`.

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** `ChatPresenceService` drží presence konverzací v `Map` v paměti procesu. Pro
single-instance BE (aktuální stav — žádné repliky, `SOCKET_IO_REDIS` vypnuté) je to
**správné rozhodnutí** — nulová latence, žádná infra závislost. Stejný vzor jako
in-memory rate-limiter (D-028).
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling) — presence
by se mezi instancemi neviděla (BE-1 vidí jen své sockety, BE-2 své).
**Infra ready:** Redis je v projektu (`ioredis`, `@socket.io/redis-adapter`, RedisModule,
docker-compose), Socket.IO Redis adapter je opt-in přes `SOCKET_IO_REDIS=1` v
`backend/src/socket-io.adapter.ts`. Chybí jen migrace samotné presence z `Map` na Redis
hash (~8-16 h: refactor join/leave/list na ioredis hash/set + TTL cleanup + failover
fallback na Map + testy).
**Kdy:** Při přechodu na multi-instance BE. **Dělat dřív = mrtvý kód** pro neexistující infru.

### D-NEW-color-tokens — Hardcoded barvy → theme tokeny (chrome drift)
**Plán:** [n2-color-mapping.md](n2-color-mapping.md) (mapa kategorií + tokeny + postup).
**Stav (2026-06-27):** **Bezpečný první krok HOTOV** — `ALLOW` v `scripts/lint-no-hardcoded-colors.mjs` rozšířen o datové dirs (`/chat/dice/lib/`, `/chat/dice/components/models/`, `polyhedralDice.css`, `/diary-systems/styles/`, `/diary-systems/sheets/`). `npm run lint:colors`: **4397 → 1622** (vyňato 2775 barev datové identity — kostkové skiny + per-system pergamen/HUD palety, záměrně fixní napříč tématy). Číslo narostlo od 2026-06-16 (2340) kvůli novým skinům 16.1d/16.2c.
**Zbývá (skutečný chrome drift, ~1622 ve ~160 souborech):** vizuální projití per komponenta napříč 2–3 tématy (proto **ne v automatickém commitu** — riziko rozbití skinů bez živé kontroly). Top cíle: `TemplateEditorModal`, `NotificationCenter`, `PostavaLayout`…
**Trigger:** sjednocení vzhledu / nový skin odhalí drift. **Měření:** `npm run lint:colors`.
