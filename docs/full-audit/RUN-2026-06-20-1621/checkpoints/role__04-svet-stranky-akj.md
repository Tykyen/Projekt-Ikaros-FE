# role / 04-svet-stranky-akj — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Metoda: statické čtení M1/M2/M4. Kód HEAD.

---

## Pokrytí

| Sekce plánu | Body | Pokryto |
|---|---|---|
| A. Inventura dveří (PC) | SP-01..04 | SP-01/02 ✅prev · SP-03 ✅ · SP-04 🐛nový |
| B. AKJ page-level | SP-05..08 | SP-05 ✅ · SP-06 ✅ · SP-07 doc-fix · SP-08 ✅ |
| C. AKJ tab-level | SP-09..12 | SP-09 ✅prev · SP-10 doc-fix · SP-11 ✅ · SP-12 ✅ |
| D. Zápis stránek | SP-13..16 | SP-13 ✅ · SP-14 ✅ · SP-15 ✅ · SP-16 ✅ |
| E. Matice persona×akce | plná | viz nálezy |
| Přidaná dveří mimo plán | `GET /pages/data` (findRandom) | 🐛 nový |
| `GET /pages/directory` chybějící world gate | — | 🐛 nový |
| `GET /pages/meta/:slug` chybějící world gate | — | 🐛 nový (nízká) |

Soubory projity:
- BE: `pages.service.ts` (celý), `pages.controller.ts`, `world-page-templates.service.ts`, `world-page-templates.controller.ts`, `users.service.ts` (setFavoritePages/setFavoriteCharacters), `users.controller.ts` (favorite-pages)
- FE: `PageViewerPage.tsx`, `PageViewer.tsx`, `PageHeader.tsx`, `WithAkjTabs.tsx`, `AkjLockedPanel.tsx`, `PageEditorPage.tsx`, `PageTemplatesTab.tsx`, `useFavoritePages.ts`, `usePageMeta.ts`, `usePagesDirectory.ts`, `router.tsx` (worldové routy)

---

## Dosažená L vs cílová L

| Oblast | Cílová L | Dosažená | Poznámka |
|---|---|---|---|
| SP-01/02 (search+embedding) | L4 | L2 (prev) | ověřeno předchozím sweepem |
| SP-03 (dataSlugs) | L3 | L2 | staticky OK |
| SP-04 (favorite cizí svět) | L4 | L2 | nový nález: BE bez membership check |
| SP-05..07 (assertAccess) | L3 | L2 | čtení kódu |
| SP-08 (FE nerekomputuje AKJ) | L2 | L2 | OK, FE jen renderuje BE data |
| SP-09..12 (tab-level) | L3 | L2 | SP-09 prev L2, ostatní staticky OK |
| SP-13..16 (write/šablony/editor) | L2 | L2 | parita OK |
| R-RUN-01 (findRandom bez gate) | — | L1 | NOVÝ nález |
| R-RUN-02 (findDirectory bez world gate) | — | L1 | NOVÝ nález |

Live-infra vrstvy (L3+ vyžadující spuštění): **neoznačuji za hotové** — viz PROOF-REQUEST.

---

## Nálezy

### R-RUN-01 — `GET /worlds/:id/pages/data` (findRandom) bez membership gate 🐛🟠 (střední — content leak) 🆕

- **Osa:** `PC` `LK` `ES`
- **Kde:** `pages.service.ts:578-580` (`findRandom` — zero checks), `pages.controller.ts:81-90` (`getData`, `@UseGuards(JwtAuthGuard)` je ale **žádný** `@CurrentUser`, žádný membership call)
- **Dopad:** Každý autentizovaný uživatel, který zná `worldId` soukromého světa, může zavolat `GET /worlds/{foreignWorldId}/pages/data?number=50` a dostat náhodných 50 stránek s plným `content` / `plainText` / `akjTabs` — bez ohledu na membership. Content (ne jen stub) leakuje. FE konzument neexistuje (grep v FE pro `/pages/data` = 0 hitů), takže útok vyžaduje ruční request.
- **Návrh:** Přidat `@CurrentUser() user` do `getData` a volat `this.pagesService.findRandom(worldId, count, user.id, user.role)` + v service přidat `assertCanViewWorld` (vzor `findByWorld`). Alternativně endpoint smazat, pokud nemá konzumenta.
- **L1** (jen čtení, endpoint neověřen živě)

---

### R-RUN-02 — `GET /worlds/:id/pages/directory` bez world-level membership gate 🐛🟠 (střední — existence leak soukromého světa) 🆕

- **Osa:** `PC` `LK`
- **Kde:** `pages.service.ts:496-527` (`findDirectory` — NEVOLÁ `assertCanViewWorld`), `pages.controller.ts:48-68` (controller předá `user.id`, ale service ho používá POUZE pro per-page `shieldedBy` výpočet, ne pro world gate)
- **Dopad:** Nečlen soukromého světa dostane přes `GET /worlds/{foreignWorldId}/pages/directory` kompletní listing: `slug`, `title`, `type`, `order`, `imageUrl` (cover foto), `shieldedBy` (úroveň AKJ) — pro KAŽDOU stránku světa. Nevrací `content`, ale metadata (tituly, typy, slugy) leakují existenci a strukturu světa. Parita s `findByWorld` (má world gate) a `findBySlug` (má world gate) je rozbita.
- **Kontext:** `assertCanViewWorld` zkontroluje pouze `accessMode === 'private'` → takže pro open/closed světy je to by-design (veřejná struktura). Leak je jen pro `private` světy.
- **Návrh:** Přidat do `findDirectory` volání `assertCanViewWorld(worldId, userId, platformRole)` před `findDirectory` DB query. Vzor identický s `findByWorld` (ř. 153).
- **L1**

---

### R-RUN-03 — `PUT /users/me/favorite-pages/:worldId` bez membership check na worldId 🐛🟡 (nízká — OW, soft-link spam) 🆕

- **Osa:** `OW` — horizontální (cizí svět)
- **Kde:** `users.service.ts:888-914` (`setFavoritePages` — ověřuje jen tvar worldId jako ObjectId, ne členství), `users.controller.ts:174-195` (`setFavoritePages` endpoint, `JwtAuthGuard` ale nula membership check)
- **Dopad:** Autentizovaný non-member si může zadat libovolné slug stringy pod cizí worldId do vlastního `User.favoritePageSlugs`. Samotný obsah stránek NETEČE (chráněn BE `findBySlug` → `assertCanViewWorld`). Jde o „prázdný bookmark" — kliknutí na favorit v cizím světě skončí 403. Riziko: spam/garbage v user profilu; FE to nečeká a může zobrazit mrtvé položky v oblíbených.
- **Kontext:** Sesterský endpoint `favorite-characters` má identický vzor (s explicitním komentářem „existenci světa neověřujeme — FE volá z členského kontextu, soft-link"). Design choice — ale pro konzistenci s role-maticí (cizí svět → ⛔) a anti-IDOR principem by membership check patřil.
- **Návrh (k rozhodnutí):** (a) potvrdit jako záměr (soft-link je OK, content nikdy neteče) a zapsat do přijatého dluhu; (b) přidat `membershipRepo.findByUserAndWorld(userId, worldId)` + 403 pokud null; varianta (a) konzistentní s favoriteCharacters vzorem.
- **L1**

---

### R-RUN-04 — `GET /worlds/:id/pages/meta/:slug` bez world-level membership gate 🐛🟡 (nízká — metadata leak) 🆕

- **Osa:** `PC` `LK`
- **Kde:** `pages.service.ts:582-605` (`findMeta` — žádné `assertCanViewWorld`), `pages.controller.ts:92-103` (endpoint, `JwtAuthGuard`)
- **Dopad:** Non-member soukromého světa dostane `{ isWoodWide, shieldedBy? }` pro libovolný slug. `isWoodWide` = lore meta-tag, `shieldedBy` = seznam AKJ požadavků stránky. Obsah neteče — jde o metadata (existuje stránka?, jaká AKJ úroveň?). FE `usePageMeta` comment explicitně říká: "Není auth-guarded jako findBySlug — vrací 404 jen pokud stránka opravdu neexistuje, i když user nemá přístup." Zdá se záměrné (UX: AccessDenied panel potřebuje shieldedBy bez toho, aby user mohl přečíst stránku). Pro veřejné světy: benigní. Pro soukromé světy: metainfo stránky leakuje cizímu uživateli.
- **Návrh:** Závisí na UX rozhodnutí: (a) ponechat jako záměr (AccessDenied UX > membership leak) — zapsat jako přijatý dluh; (b) přidat `assertCanViewWorld` = pak ale AccessDenied pro nečlena private světa nebude mít šieldedBy (fallback na generický panel).
- **L1**

---

### SP-07 — assertAccess hází 403, plán říkal 404 — ✅ doc-fix (kód správně) ♻️

- `pages.service.ts:824`: `throw new ForbiddenException({ code: 'PAGE_ACCESS_DENIED' })` = 403
- auth-leak-policy: „přihlášený, existuje, bez práv → 403". Kód je správný, plán byl nesprávný.
- Role-audit.md řádek 105 to už eviduje jako doc-fix. Beze změny.

---

### SP-10 — „nedostupné taby se odstraní" — ✅ překonáno spec update, kód OK ♻️

- `filterAkjTabsForViewer` nyní: in-fiction clearance taby → LOCKED (jméno bez obsahu), Role/prázdné taby → skryté. Plán říkal „odstraní" — ale spec-akj-locked-tabs-visible (2026-06-11) záměrně mění na LOCKED variantu. `lockedAkjTab` (ř. 106-113) stripuje `contentOverride` a posílá jen `id/name/order/access(AKJ/AKJType)`. Leak neexistuje.

---

## Shrnující matice (doplnění ⬜ bodů z plánu)

| Bod | Status | L |
|---|---|---|
| SP-01 search leak | ✅ OK | L2 (prev) |
| SP-02 embedding leak | ✅ OK | L2 (prev) |
| SP-03 dataSlugs PomocnyPJ+ | ✅ OK | L2 |
| SP-04 favorite cizí svět | 🐛 R-RUN-03 (nízká) | L1 |
| SP-05 assertAccess OR logika | ✅ OK | L2 |
| SP-06 bypass PomocnyPJ(4) | ✅ OK — ř. 813 | L2 |
| SP-07 404 vs 403 | ✅ doc-fix (403 správně) | L2 |
| SP-08 FE nerekomputuje AKJ | ✅ OK — WithAkjTabs renderuje BE data | L2 |
| SP-09 PomocnyPJ tab-bypass | ✅ K-R2 (prev) | L2 |
| SP-10 taby odstraněny | ✅ doc-fix (locked varianta) | L2 |
| SP-11 contentOverride leak | ✅ OK — lockedAkjTab stripuje | L2 |
| SP-12 sub-matice AKJ tab | ✅ OK — kód sedí | L2 |
| SP-13 create/update/delete world gate | ✅ OK — assertCanWrite ř. 933 | L2 |
| SP-14 FE canEdit parita | ✅ OK — oba PomocnyPJ(4) | L2 |
| SP-15 Korektor šablony | ✅ OK — FE minRole:Korektor, BE Korektor | L2 |
| SP-16 nova-stranka FE gate | ✅ OK — PageEditorPage ř. 27 redirect | L2 |
| NOVÝ: findRandom bez gate | 🐛 R-RUN-01 (střední) | L1 |
| NOVÝ: findDirectory bez world gate | 🐛 R-RUN-02 (střední) | L1 |
| NOVÝ: findMeta bez world gate | 🐛 R-RUN-04 (nízká) | L1 |

---

## PROOF-REQUEST

**PR-01 (SP-01/02 M8 red-team):** Spustit jako Hrac: `GET /search?worldId={id}&q={výraz_z_AKJ_stránky}` → ověřit, že výsledky NEOBSAHUJÍ slug/název AKJ-chráněné stránky. Důkaz: žádný hit pro výraz, který existuje jen v AKJ záložce nebo chráněné stránce. Vyžaduje běžící BE + testovací data. → L4.

**PR-02 (R-RUN-01 live):** Přihlásit se jako uživatel bez členství ve světě, zavolat `GET /worlds/{worldId}/pages/data?number=5` — ověřit, zda BE vrátí obsah nebo 403. Potvrdí či vyvrátí L1 nález.

**PR-03 (R-RUN-02 live):** Přihlásit se jako non-member soukromého světa, zavolat `GET /worlds/{privateWorldId}/pages/directory` → ověřit, zda BE vrátí seznam stránek (stub) nebo 403.

**PR-04 (SP-06 M8 — bypass práh):** Jako PomocnyPJ(4) zavolat `GET /worlds/{id}/pages/{akj_chranena_stranka}` — ověřit, že BE vrátí 200 (bypass OK). Pak jako Korektor(3) zavolat to samé — ověřit 403. Potvrdí přesný práh PomocnyPJ.

**PR-05 (SP-09 K-R2 — PomocnyPJ tab):** Jako PomocnyPJ zavolat `GET /worlds/{id}/pages/{stranka_s_AKJ_tabem_bez_grantu}` — ověřit, že BE vrátí záložku bez obsahu (nebo ji vynechá), ne s plným obsahem. Potvrdí BE-autoritativní filtr.
