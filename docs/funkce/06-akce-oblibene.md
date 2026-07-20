# 06 — Akce & oblíbené

Kapitola pokrývá platformový kalendář globálních akcí a osobní záložky (oblíbené + připnuté) napříč komunitními moduly. Vše ověřeno v kódu FE i BE.

---

### Kalendář akcí platformy
- **Co to je:** Měsíční kalendář globálních (platformových, "Ikaros") akcí — minulých i budoucích. S možností potvrdit účast (RSVP).
- **Kde:** route `/ikaros/akce` (`AkcePage`). Menu: "Akce". Loader `requireAuth`.
- **Kdo:**
  - FE — jen přihlášený (loader). Tlačítko "Nová akce" a kebab (Upravit/Smazat) vidí jen **Admin/Superadmin** (`currentUser.role`).
  - BE — celý controller `ikaros-events` za `JwtAuthGuard` (`ikaros-events.controller.ts:46-48`). Čtení = každý přihlášený; mutace (create/update/delete) = jen Admin/Superadmin (`assertCanWrite` `ikaros-events.service.ts:35-41`, voláno z create `:71` / update `:103` / delete `:142`, jinak 403 `FORBIDDEN_PLATFORM_ROLE`); RSVP = každý přihlášený (`confirm` `:163` — žádná role kontrola). PJ je world-scoped a sem nemá přístup (viz komentář `:32-34`, D-069).
- **Co jde dělat:**
  - **Desktop:** měsíční mřížka (`buildMonthGrid`), akce jako chip s časem v buňce dne. Listování šipkami (`shiftMonth ±1`), tlačítko "Dnes". Klik na chip → modal "Detail akce" (`IkarosEventCard`).
  - **Mobil (≤768 px):** místo mřížky seznam rozdělený "Nadcházející" / "Proběhlé" (řazený podle data).
  - **RSVP (Zúčastním se):** tlačítko na kartě (jen pokud `event.confirmable`), `POST /ikaros-events/:id/confirm` toggluje účast. Karta ukazuje počet účastníků a první 4 jména + "+N".
  - **Admin — vytvoření/úprava akce** (`IkarosEventModal`): Název (max 200, povinný), Datum a čas (`datetime-local`, povinné, ISO), Obrázek (volitelný, max 10 MB, s nastavením středu výřezu / zoom / fit cover|contain), Popis (max 5000), checkbox "Povolit potvrzení účasti" (`confirmable`, default true).
  - **Admin — smazání:** kebab → Smazat (ConfirmDialog). BE = **hard delete** (`findByIdAndDelete`, `repositories/ikaros-event.repository.ts:86`) — od CD-RUN-4b (2026-06-20) nahradilo dřívější soft-delete `isActive:false`, který neměl žádnou cestu k obnově a jen se hromadil + leakoval blob. Před smazáním se načte entita a starý obrázek se pošle do úklidu (`media.orphaned`, `ikaros-events.service.ts:141-157`).
- **Datový tvar akce (BE response):** id, title, date, description, imageUrl + image focal/zoom/fit, `confirmable`, `confirmedCount`, `confirmedBy[]` (userId+userName), `myRsvp` ('confirmed'|'none'), authorId/authorName, createdAtUtc, isActive (`ikaros-events.service.ts:215-240`). Pozn.: `isActive` v response zůstalo, ale po přechodu na hard delete už je vždy `true` u čtených akcí — čtecí repo metody filtrují `isActive: true` (`ikaros-event.repository.ts:42`/`:53`).
- **Hranice / co neumí:**
  - Akce jsou **platformové, nikoli světové** — herní akce konkrétního světa jsou samostatný modul (`world-news` / game-events), sem se nemíchají.
  - **Žádné kapacitní limity / čekací listina** RSVP — jen toggle účasti, neomezený počet.
  - Žádná opakující se / vícedenní akce (jeden timestamp `date`, žádné `endDate`).
  - Žádné kategorie/štítky akcí, žádné připomenutí e-mailem.
  - Mřížka i mobilní seznam pracují s **lokálním časem prohlížeče** (`new Date(...).getHours()` apod.) — žádná timezone konfigurace.
  - `findUpcoming` (dashboard) má limit default 5, max 20; samotná `AkcePage` načítá `useIkarosEvents()` = `findAll` (všechny aktivní, bez stránkování).
- **Zvláštnosti:** Modal detailu drží jen `selectedId` a akci derivuje z čerstvé query (po RSVP/edit/delete se obsah otevřeného modalu obnoví — C-40). Na kartě "DNES!"/"ZÍTRA!" odznak pro akce do 24 h. WS event `ikaros-events.changed` se emituje po každé mutaci (real-time refresh).
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/AkcePage/AkcePage.tsx:29` (admin gating `:31-33`, `isAdmin` větve `:98`/`:221`), karta `src/features/ikaros/components/IkarosEventCard.tsx:42` (účastníci `:91`), modal `src/features/ikaros/components/IkarosEventModal.tsx:35`. BE controller `backend/src/modules/ikaros-events/ikaros-events.controller.ts:51` (findAll) / `:58` (upcoming, `parseLimit` `:34-38`) / `:69` (create) / `:77` (**update = `PUT :id`**) / `:91` (delete, 204) / `:101` (confirm), service `ikaros-events.service.ts:53` (findAll) / `:58` (upcoming) / `:66` (create) / `:97` (update) / `:141` (delete) / `:163` (confirm), DTO `ikaros-events/dto/create-ikaros-event.dto.ts`.

---

### Oblíbené / záložky
- **Co to je:** Osobní záložky (bookmarky) napříč třemi komunitními moduly + jejich "připnutí" do pravého panelu.
- **Kde:** route `/ikaros/oblibene` (`FavoritesPage`). Menu: "Oblíbené". Loader `requireAuth`. Tři taby v URL `?typ=` (diskuze / clanky / obrazky).
- **Kdo:** Jen přihlášený (loader). Záložky jsou čistě osobní (vázané na účet).
- **Co jde dělat:**
  - **Tab Diskuze / Články / Obrázky** — seznam položek, které máš v oblíbených.
  - **Připnutí (PinToggle, špendlík)** — přepne, zda se položka zobrazí v pravém panelu. Limit **max 5 na typ** (`MAX_PINNED`). Připnout lze jen oblíbenou položku.
  - Karty vedou na detail (`/ikaros/diskuze/:id`, `/ikaros/clanky/:id`, `/ikaros/galerie/:id`); u obrázků thumbnail (Cloudinary).
  - Přidávání/odebírání z oblíbených (heart/záložka) se děje **na detailu nebo kartě v daném modulu** (Diskuze/Články/Galerie), ne přímo na této stránce — `FavoritesPage` jen agreguje a umožňuje připínání.
- **Kde se ukládá (BE — důležité zjištění):**
  - **Vše na dokumentu User** (`backend/src/modules/users/schemas/user.schema.ts`), jako pole ID:
    - Oblíbené: `favoriteDiscussionIds`, `favoriteArticleIds`, `favoriteGalleryIds` (string[]).
    - Připnuté: `pinnedDiscussionIds`, `pinnedArticleIds`, `pinnedGalleryIds` (string[]) — podmnožina oblíbených, max 5/typ.
    - Související: `likedDiscussionIds` (lajky diskuzí, samostatné od oblíbených).
  - **Toggly žijí v modulu daného obsahu**, ne v centrálním "favorites" modulu:
    - Diskuze: `GET /ikaros-discussions/my-favorites` (`ikaros-discussions.controller.ts:87`), `POST /ikaros-discussions/:id/toggle-favorite` (`:167`), `POST /:id/toggle-pin` (`:174`) (limit + kontrola NOT_FAVORITE → 409 `PIN_LIMIT` / `NOT_FAVORITE`).
    - Články a Galerie mají analogické endpointy (FE hooky `useMyFavoriteArticles/Gallery`, `useTogglePinArticle/Gallery`).
    - **Vlastní logika toggle je ale sdílená** — všechny tři moduly volají společný util `backend/src/modules/users/favorites-toggle.util.ts` (`toggleFavoriteId` `:38`, `togglePinnedId` `:71`, `MAX_PINNED = 5` `:14`, limit check `:92`); per-modul zůstává jen tenký wrapper s názvy polí a hláškami.
  - **✅ OPRAVENO 2026-07-05 (SEC-22/FIX-9, RUN-2026-07-05), ověřeno 2026-07-20:** `my-favorites` (Diskuze i Galerie) dřív vracelo položky **bez ohledu na stav** — pokud sis oblíbil diskuzi/obrázek, který mezitím zůstal `Draft`/`Pending`/byl zamítnut (nebo šlo o cizí neschválený obsah, na který ses dostal oblíbením), viděl jsi ho dál v `/ikaros/oblibene`. Teď `findMyFavorites` filtruje viditelnost stejně jako běžné čtení (`Published` každý, `Pending` navíc admin, `Draft`/`Rejected` jen autor) — cizí neschválený obsah se přes oblíbené už nezobrazí. Fix drží: `ikaros-discussions.service.ts:271` → filtr přes `canAccessDiscussion` (`:279-281`).
  - Stav připnutí FE čte z `currentUser.pinnedXIds` (pole na uživateli), oblíbené z `GET …/my-favorites`.
- **Záložky uvnitř světů (samostatné, nesouvisí s touto stránkou):**
  - `favoriteCharacters: Map<worldId, slug[]>` — oblíbené postavy per svět (sdíleno napříč zařízeními, nahradilo localStorage).
  - `favoritePageSlugs: Map<worldId, slug[]>` — osobní oblíbené wiki stránky per svět, pořadí významné (reorder); zobrazují se v dashboardu světa a indexu stránek (hvězdička / klávesa `f`). Toto je per-user, nahradilo dřívější sdílené `world.favoritePageSlugs`.
- **Hranice / co neumí:**
  - Oblíbené pokrývají **jen 3 globální moduly** (Diskuze, Články, Galerie). Akce, novinky, uživatelé, světy se do "Oblíbených" přidat nedají.
  - Připnutí je **max 5 na typ** (tvrdý limit, 409 při překročení) — žádná konfigurace.
  - Žádné složky / tagy / poznámky u záložky; jen plochý seznam per typ.
  - Pin-toggle vyžaduje, aby položka byla nejdřív oblíbená (jinak `NOT_FAVORITE`).
- **Zvláštnosti:** "Oblíbené" (favorite) a "Připnuté" (pinned) jsou dvě úrovně — připnuté je podmnožina oblíbených promítaná do pravého panelu. Architektura je **denormalizovaná na User** (pole ID), ne přes join/kolekci "favorites" — každý modul si svůj toggle řeší sám, ale zapisuje do polí uživatele.
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/FavoritesPage.tsx:54` (taby `:29-34`, vlastní FE konstanta `MAX_PINNED = 5` `:37`), hooky `src/features/ikaros/api/useDiscussions.ts` / `useArticles.ts` / `useGallery.ts`, `src/features/ikaros/components/PinToggle.tsx`. BE pole `backend/src/modules/users/schemas/user.schema.ts:41-50` (+ `:148` favoriteCharacters, `:154` favoritePageSlugs), sdílený util `backend/src/modules/users/favorites-toggle.util.ts:14/38/71`, toggly `backend/src/modules/ikaros-discussions/ikaros-discussions.service.ts:472` (toggleFavorite) / `:486` (togglePin), controller `ikaros-discussions.controller.ts:87` (my-favorites) / `:167` (toggle-favorite) / `:174` (toggle-pin); analogicky `ikaros-articles.service.ts:725`/`:738` a `ikaros-gallery.service.ts:609`/`:622`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)
- **Žádný centrální "favorites" modul — ČÁSTEČNĚ VYŘEŠENO (ověřeno 2026-07-20).** Oblíbené/připnuté jsou pořád pole ID denormalizovaná na `User` dokumentu (`user.schema.ts:41-50`), žádná samostatná kolekce/modul. **Duplicita logiky ale zmizela:** společný util `backend/src/modules/users/favorites-toggle.util.ts` (`toggleFavoriteId:38`, `togglePinnedId:71`, `MAX_PINNED:14`) používají všechny tři moduly (`ikaros-discussions.service.ts:476`/`:490`, `ikaros-articles.service.ts:725`/`:738`, `ikaros-gallery.service.ts:609`/`:622`) — 4. typ obsahu tedy jen doplní názvy polí + hlášky, nekopíruje se limit/pin logika. Zbytkový dluh: FE si drží vlastní kopii `MAX_PINNED = 5` (`FavoritesPage.tsx:37`) nezávisle na BE konstantě → při změně limitu nutno měnit dvě místa.
- **Dvojí význam "oblíbené".** Globální záložky (`favoriteDiscussionIds` atd. — stránka `/ikaros/oblibene`) vs. in-world oblíbené (`favoriteCharacters`, `favoritePageSlugs` — dashboard světa / index stránek) jsou nezávislé systémy se stejným jménem. Pro uživatelského průvodce nutno odlišit.
- **Akce nejdou přidat do oblíbených** — RSVP "Zúčastním se" je jediný způsob, jak si akci "uložit". Žádná vazba mezi akcemi a stránkou Oblíbené.
- **`confirmedBy` vrací prázdné jméno u smazaných uživatelů — PLATÍ (ověřeno 2026-07-20).** `ikaros-events.service.ts:217` mapuje `userName: names.get(uid) ?? ''`; jména se plní jen pro uživatele, které `usersRepo.findById` najde (`:209-214`), takže smazaný účastník zůstane s prázdným řetězcem. FE `IkarosEventCard.tsx:91` bere `confirmedBy.slice(0, 4)` a na `:201` vypíše `{a.userName}` bez fallbacku/filtru → prázdný chip účastníka se opravdu vyrenderuje. (Autor má fallback na legacy snapshot `authorName` `:236`, účastníci ne.)
- **Akce pracují s lokálním časem prohlížeče — PLATÍ (ověřeno 2026-07-20).** Žádná timezone normalizace: čas chipu `d.getHours()/getMinutes()` (`AkcePage.tsx:21`), zařazení do buňky dne `day.getMonth()`/`getDate()` (`:155`/`:164`), kurzor měsíce `getFullYear()/getMonth()` (`:80`/`:86`), hlavička `toLocaleDateString('cs-CZ')` (`:92`) — nikde `timeZone`. Uživatelé v jiných pásmech mohou vidět akci v jiném dni/čase, než autor zamýšlel.
- ✅ VYŘEŠENO (CD-RUN-4b, 2026-06-20; ověřeno 2026-07-20) — **Soft-delete akcí zrušen, retence už není otevřená otázka.** Mazání je hard delete (`ikaros-event.repository.ts:86` `findByIdAndDelete`), takže se v DB nic nehromadí a žádný cleanup job není potřeba; obrázek smazané akce jde do úklidu přes `media.orphaned` (`ikaros-events.service.ts:153-155`). Důvod změny je zapsán přímo v kódu (`ikaros-events.service.ts:143-145`, `interfaces/ikaros-event-repository.interface.ts:30-31`): soft-delete neměl žádnou cestu k obnově → jen rostl a leakoval blob.
