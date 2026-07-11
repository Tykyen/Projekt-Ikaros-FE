# bug — 04 Ikaros komunita · dosažená L2–L3 (cíl L3)

Oblast: `docs/bug-plan/04-komunita.md` (107 bodů KM-01..107). Styl bug, registr `docs/bug-audit.md` (prefix N-).
BE moduly: ikaros-articles / -gallery / -discussions / -categories / -news / -events (+gallery-categories).
FE: features/ikaros/pages (Articles, Gallery, Discussions, Novinky, Akce, Favorites, Help, Terms) + hooky.

## Verdikt
Oblast je v **velmi dobrém stavu**. Známé nálezy z registru **opravené a ověřené**: N-12 (diskuze paginace `total`), N-14 (PJ mimo článkové ADMIN_ROLES), plus FIX-9/FIX-64/FIX-65/N-RUN-01/R-RUN-03. Žádný 🔴 ani ⭐. Nové nálezy = 6× 🟡 (drobné korektnostní/konzistenční + 1 perf). Mass-assignment nemožný (globální `ValidationPipe whitelist+forbidNonWhitelisted`, main.ts:68-69).

---

## 🆕 Nové nálezy (všechny 🟡)

**N-RUN-K1 · [články/konzistence] unread-count nafouknutý o moderačně skryté Published**
- Kde: `backend/.../ikaros-articles/repositories/ikaros-articles.repository.ts:258-264` (`findPublishedIds` — BEZ `moderationHidden` filtru) vs `:57` (`findPublished` filtruje `moderationHidden:{$ne:true}`).
- Dopad: článek Published skrytý moderací (B4b) zůstává v jmenovateli `unreadCountForUser` (service.ts:768), ale je neviditelný v listu → badge nepřečtených nikdy nespadne na 0. Edge (moderační skrytí Published je vzácné).
- Návrh: přidat `moderationHidden:{$ne:true}` do `findPublishedIds`. Test: skrytý Published nezvyšuje unread-count. L2.

**N-RUN-K2 · [články/konzistence] „Moje" list ukazuje autorovi moderačně skrytý obsah, detail 404**
- Kde: `ikaros-articles.repository.ts:124` (`findByAuthor` vrací i `moderationHidden` s plným `content`) vs service `findById:257` (404 i autorovi u `moderationHidden` — komentář ř.254-256 „vč. autora").
- Dopad: skrytý článek je vidět v „Moje články" (title+content), ale klik → 404. Nekonzistence list↔detail. Nízké (vlastní obsah autora, ne cizí leak).
- Návrh: rozhodnout politiku — buď `findMy` filtruje `moderationHidden`, nebo `findById` pustí autora. L1/L2.

**N-RUN-K3 · [diskuze/konzistence] `postCount` zahrnuje moderačně skryté příspěvky**
- Kde: `ikaros-discussions.service.ts:838-844` (`setPostModerationHidden` nemění postCount) + `adjustPostCount` klesá jen při delete; `getPosts` pro ne-reviewera skryté filtruje (posts.repo:41).
- Dopad: ne-reviewer vidí `postCount=N`, ale getPosts vrátí méně → FE počet stránek dle postCount přestřelí (prázdné/krátké koncové stránky). Stejná třída jako N-12, ale pro posty. Nízké.
- Návrh: expose viditelný count nebo FE fetch-until-empty. L2. (Souvisí s known ext-41 pagination class.)

**N-RUN-K4 · [diskuze/FE stav] DiscussionsNewPage dvoukrokový create uzamčené diskuze**
- Kde: `frontend .../features/ikaros/pages/DiscussionsNewPage.tsx:30-47` — uzamčená diskuze se vytvoří jako `isOpen:true` (default), pak samostatný `patch({isOpen:false})`.
- Dopad: když create projde a patch selže, catch ukáže „Nepodařilo se vytvořit" a nenaviguje, ale diskuze UŽ existuje jako **veřejná (otevřená)**; retry → duplicita + první omylem public. (Nález Agent B.)
- Návrh: nastavit `isOpen` už v create DTO (BE CreateDiscussionDto ho zatím nemá — přidat pole), nebo při selhání patche navigovat s varováním. L2.

**N-RUN-K5 · [články/perf] N+1 read-status v ArticlesPage**
- Kde: `frontend .../features/ikaros/pages/ArticlesPage.tsx:278-280` — každá `ArticleCard` volá `useArticleReadStatus(id)` → N× `GET /:id/read-status` (per-karta tečka „Nepřečteno"). Agregát `useUnreadCount` existuje, ale per-karta ho obchází.
- Dopad: přehled s 50+ články = 50+ samostatných requestů. Výkon/škála, ne korektnost. (Nález Agent A; spadá spíš pod perf-styl.)
- Návrh: batch endpoint `read-status?ids=` nebo množinový `readIds` v listu. L2.

**N-RUN-K6 · [novinky/FE stav] NovinkyPage `page` neklampovaný po smazání (kosmetika)**
- Kde: `frontend .../features/ikaros/pages/NovinkyPage/NovinkyPage.tsx` deleteMutation.onSuccess — `page` state se neklampne; po smazání může být „Strana 3 / 2" + prázdný list (Další disabled, sám se zotaví Předchozím). (Nález Agent C.)
- Návrh: `setPage(p=>Math.min(p,totalPages))` v onSuccess. L1.

**Info-exposure (poznámka, ne nález):** diskuzní `findAll/findById` vrací syrové `managerIds/invitedUserIds/joinRequestIds` (user IDy) každému s přístupem — potřeba pro FE `isManager`; resolvované jméno jen `getMembers` (manažer). Jen IDy, nízká priorita.

---

## ♻️ Známé (NEhlásím jako nové)
- **KM-32** useArticleVersions FE hook chybí (BE `GET /:id/versions` live: articles.controller:113) — **dokumentováno v bug-planu** (Test coverage gaps + KM-32). Agent A potvrdil: žádný FE konzument.
- Bulk approve/reject hooky (`useBulkApproveArticles/Reject`) — kontrakt `{ids}` sedí na `BulkApprove/RejectArticlesDto`, ale **nenapojené na UI** (jen ve spec). Feature-incomplete, dokumentováno v hlavičce hooku.
- Offset-paginace bez `_id` tiebreaku `ikaros-discussion-posts.repository.ts:43` (sort `createdAtUtc:1`) — **known ext-41** (⭐ tento RUN).
- `ikaros-news.service.create` `pushService.notifyAll` bez `url` / spam-vektor — **known dluh** (dluhy.md ř.109-110).

## 🔓 / Doc-drift bug-planu (kód SPRÁVNĚ, plán zastaralý — opravit plán, ne kód)
- **KM-15 & KM-31 & „Známá rizika/PJ v ADMIN_ROLES"**: N-14 už OPRAVENO — PJ NENÍ v článkových `ADMIN_ROLES` (service.ts:31-35). KM-15 (PJ approve→200) je nyní NEPLATNÝ (PJ→403). FE `REVIEWER_ROLES` bez PJ (ArticleDetailPage:38-42), PJ ani není v globálním UserRole enumu (D-053). Parita FE↔BE OK.
- **KM-18**: prázdné `ids` u bulk → nyní **400** (`@ArrayNotEmpty` v BulkRejectArticlesDto:12), ne `{succeeded:[],failed:[]}`.
- **KM-48**: route `ikaros-gallery-categories` neexistuje; skutečná je `gallery-categories` (KM-105 správně). Oba testují totéž pravidlo (Superadmin-only delete, controller:86-90 → GALLERY_CATEGORY_DELETE_FORBIDDEN).
- **KM-63/64/65**: diskuzní report/resolve endpointy ODSTRANĚNY, přesunuty do generického modulu `moderation` (controller komentář ř.244-247) — v této oblasti netestovatelné.
- Events controller Swagger „soft delete" (events.controller.ts:93), ale service dělá **hard delete** (events.service.ts:143) — kosmetický nesoulad doc.

---

## Co jsem prošel (plná hloubka L1-L3)
BE (celé, L2, kritické cesty L3 přes existující testy):
- articles: service+controller+repo+reads.repo+versions+moderation-listener+DTO (bulk/rate/update). Auth gating KM-01..26 ✓, mass-assignment ✓, sanitizeRichText ✓.
- gallery: service+controller+repo+DTO. rightsDeclared gate (20D), deleteImage best-effort (upload.service:727 swallowuje), moderationHidden parita ✓.
- discussions: service+controller+repo+posts.repo+DTO (patch/create). canAccessDiscussion, addPost gate, reject-guard, patch bez isApproved ✓.
- categories (článků i galerie): Superadmin-only delete, in-use 409, dup-key 409 ✓.
- news+events: scope auth (401/403), limit clamp, RSVP toggle, audit, gateways (leak-safe broadcast) ✓.
FE (L2, část L3 přes .spec):
- Agent A (články): body KM-27..33 ✓ (N-14 parita), N+1 read-status.
- Agent B (galerie+diskuze): KM-34..47, KM-70..73 ✓ (rightsDeclared FE↔BE, „Moje" tab by-design).
- Agent C (novinky/akce/oblíbené/help/terms): KM-74..107 ✓ (akce za requireAuth, MAX_PINNED 5=5, PIN_LIMIT toast).
- Cross-check: router.tsx:244 (akce requireAuth), FavoritesPage:37 MAX_PINNED, WS listenery useIkarosNews/Events (S-04 testy).

## PROOF-REQUESTy
- M3: `vitest run --project '!storybook'` na `features/ikaros/**` (ArticlesPage/FavoritesPage/useIkarosNews/useIkarosEvents spec) → potvrdit zelené (L3).
- M3: `jest` na `ikaros-*` modulech BE → potvrdit zelené (L3).
- M7: doplnit test „unread-count vynechá moderationHidden Published" (N-RUN-K1) a „findMy nevrací moderationHidden autorovi" (N-RUN-K2) → L4.
