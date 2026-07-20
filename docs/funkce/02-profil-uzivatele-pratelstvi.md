# 02 — Profil, uživatelé & přátelství

> Kódem ověřená inventura. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.
> Globální role (UserRole): Superadmin(1), Admin(2), Ikarus(9), SpravceClanku(10), SpravceGalerie(11), SpravceDiskuzi(12).
> Pozn.: BE má číselné role nižší než Admin = vyšší pravomoc; `requester.role > UserRole.Admin` = „není admin".

---

### Vlastní profil
- **Co to je:** Self-edit stránka uživatele se všemi osobními, vzhledovými, soukromými, bezpečnostními a účtovými sekcemi.
- **Kde:** Route `/ikaros/profil` (`ProfilePage`), chráněná `requireAuth`. V menu „Profil".
- **Kdo:** Přihlášený (vlastní účet). Editace přes `PATCH /users/me` (BE blokuje změnu username přes `/me` → musí jít přes žádost). `GET /users/me` hydratuje data.
- **Co jde dělat (sekce shora dolů):**
  - **Osobní karta (`ProfileHeader`):** read fields — Uživatelské jméno, Jméno (displayName), E-mail (+ badge Ověřeno/Neověřeno + „Poslat znovu" + „Změnit"), Město, Účet založen, Poslední přihlášení, Barva chatu (swatch + hex), Globální motiv, RoleStar (hvězda role). Edit mode: displayName (max 32), Město (max 100), avatar uploader (5 MB, server resize 512). E-mail v edit módu read-only, mění se přes `ChangeEmailModal`.
  - **Něco o mně (`BioSection`):** textarea bio max 1000 znaků (počítadlo).
  - **Postava v Campu (`CharacterSection`):** globální chat-postava napříč Ikaros chaty (Putyka + Camp). Pole: Jméno postavy (max 64), Popis (max 1000), Avatar postavy (samostatný slot, 5 MB, resize 256, fallback `being.webp`).
  - **Přátelé (`FriendsSection`):** kompaktní výpis přijatých přátel (avatar + jméno → klik na veřejný profil), odkaz „Spravovat →" do `/ikaros/uzivatele?tab=pratele`.
  - **Světy (`WorldsSection`), Moje postavy (`MyCharactersSection`), Akce (`ProfileEventsSection`):** dynamické sekce (cross-world membership/postavy/události).
  - **Komunita (`CommunitySections`, D-NEW-INV-PROFILE 2026-07-12):** „Moje diskuze / Moje články / Moje galerie" — reálné seznamy (název · datum · odkaz na detail, max 5 + „Zobrazit vše (N) →" do příslušné sekce, badge s počtem). Články/galerie přes `useMyArticles`/`useMyGalleryImages`; diskuze od 2026-07-13 **nativní `GET /ikaros-discussions/my`** (`useMyDiscussions` — BE vrací vše tvůrce vč. pending/uzamčených, řazené `createdAtUtc` desc; nahradil klientský filtr nad celým výpisem). Empty/error stavy přes sdílené `EmptyState`/`ErrorState`. Dřív statické placeholdery „fáze 3".
  - **Vzhled (`AppearanceSection`):** Globální motiv (ThemeSwitcher, ukládá lokálně i na server), Doladění vzhledu (**Velikost rozhraní** slider 100–150 % → `themeSettings.uiScale`, spec 5.9c; jas/kontrast slidery 70–130 %, override barev → `themeSettings.adjust`/`overrides`), Barva chatu (`ChatColorPicker`, hex #RRGGBB, + rozbalovací **nápovědní paleta** 18 pojmenovaných barev — 16.1g `NamedColorPalette`, klik = rychlá volba; sekce defaultně sbalená). Stejná sdílená paleta (`src/shared/ui/NamedColorPalette`) je i u ostatních color pickerů světa (barva zprávy v chatu, barva textu stránky, pruh v deníku, těleso univerza, barva skupiny, tokeny motivu).
  - **Soukromí (`PrivacySection`):** 3 přepínače — „Neviditelný mód" (`hiddenPresence`, po změně reconnect socketu), „Skrýt v adresáři uživatelů" (`hiddenInDirectory`), „Jen pro přátele" (`profileVisibility: 'public'|'friends'`).
  - **Notifikace (`NotificationPreferencesSection`, 15.9):** master push vypínač + 9 kategorií v 5 skupinách (vč. „Pošta" — D-NEW-INV-PUSH 2026-07-12) + per-device přepínač. Řídí, na co chodí web push. Detail viz kap. 05 „Nastavení notifikací (preference)".
  - **Bezpečnost (`SecuritySection`):** Username (žádost o změnu — schvaluje admin, cooldown 30 dní), Změna hesla (viz kap. 01), 2FA (viz kap. 01), Důvěryhodná zařízení (viz kap. 01).
  - **Moderace (`ModerationSection`, 20.1):** „Moje hlášení" (co jsem nahlásil + stav Čeká/V řešení/Vyřízeno — pohled oznamovatele) a „Rozhodnutí o mém obsahu" (moderační zásahy vůči mému obsahu = statement of reasons dle DSA čl. 17: akce, odůvodnění, právní/smluvní základ, tlačítko **„Odvolat se"** kromě M0). Data `GET /moderation/reports/mine` a `/decisions/mine`. Renderuje se jen přihlášenému. Detail moderačního workflow viz kap. 08.
  - **Účet (`AccountSection`):** tlačítko „Stáhnout moje data (JSON)" (20.2), Smazat účet / banner naplánovaného smazání (viz kap. 01). U nezletilého (`isMinor`) navíc informativní hláška „Účet v režimu ochrany nezletilých" (`MinorNotice`).
- **Editovatelná pole přes `PATCH /users/me` (DTO `UpdateUserDto`):** displayName(32), avatarUrl(url), characterPath(slug), themeSettings(obj), chatPreferences(obj), hiddenPresence(bool), hiddenInDirectory(bool), profileVisibility(public/friends), chatColor(hex), city(100), bio(1000), characterName(64), characterBio(1000), themeId(z THEME_IDS), defaultAvatarType(male/female/being), characterAvatarUrl. **username přes `/me` zakázáno** (Forbidden `USERNAME_CHANGE_VIA_REQUEST`).
- **Hranice / co neumí:**
  - ~~„Moje diskuze" v profilu = klientský filtr nad celým výpisem~~ → ✅ VYŘEŠENO 2026-07-13: nativní `GET /ikaros-discussions/my` (`useMyDiscussions`), viz výše.
  - displayName na BE max 32, ale na rozdíl od username NEMÁ min/regex validaci.
  - Avatar upload limit 5 MB (multer), bez UI cropování (server jen resize).
  - Username nelze měnit přímo — jen žádostí se schválením + 30denní cooldown.
- **Zvláštnosti:**
  - Theme se ukládá lokálně i na server (sync napříč zařízeními), doladění vzhledu je per-user a aplikuje se na všech zařízeních.
  - **Velikost rozhraní (5.9c)** = CSS `zoom` na `<html>` (aplikuje `ThemeProvider`, `--ui-scale` + `zoom`), zvětší CELÉ rozhraní (text, tlačítka, ikony) napříč platformou, světy i chaty (Putyka/Camp/svět) — jedno hrdlo, žádná změna chat komponent. Ukládá se do `themeSettings.uiScale` (BE volný objekt + shallow-merge → koexistuje s jas/kontrast). **Taktická mapa (PIXI) je z zoomu vyňata** (`.viewport { zoom: calc(1/var(--ui-scale)) }`) → plátno zůstává 1:1; mapové HUD overlaye uvnitř `.viewport` se také nezvětšují.
  - Změna username řešena dedikovaným flow `me/username-request` (vytvořit/získat/zrušit) + admin schválení; po loginu toast o rozhodnuté žádosti (D-028 `last-unseen-decided`).
- **Stav:** ✅ funguje.
- **Kód:** FE `src/features/profile/pages/ProfilePage.tsx:27` (`ModerationSection` `:90`), `components/ProfileHeader.tsx:54`, `BioSection.tsx:13`, `CharacterSection.tsx:26`, `AppearanceSection.tsx:24`, `PrivacySection.tsx:19`, `SecuritySection.tsx:42`, `ModerationSection.tsx:71`, `AccountSection.tsx:54`, `CommunitySections.tsx:32`, BE `users.controller.ts:56` (`GET me`) / `:67` (`PATCH me`, blok username `:76`), `dto/update-user.dto.ts:15`.

---

### Avatar (uživatel + postava)
- **Co to je:** Dva nezávislé avatar sloty — osobní a chat-postava.
- **Kde:** ProfileHeader (osobní) a CharacterSection (postava), `AvatarUploader`.
- **Kdo:** Vlastní účet.
- **Co jde dělat:** Upload (`POST /users/me/avatar`, resize 512), smazat (`DELETE /users/me/avatar`); pro postavu `POST/DELETE /users/me/character/avatar` (resize 256). Bez souboru → 400 `NO_FILE`.
- **Hranice / co neumí:** Max 5 MB, žádné cropování v UI; fallback default avatar dle `defaultAvatarType` (male/female/being).
- **Stav:** ✅ funguje.
- **Kód:** BE `users.controller.ts:99` (POST avatar) / `:126` (DELETE avatar) / `:138`/`:165` (avatar postavy), FE `components/AvatarUploader/`.

---

### Veřejný profil jiného uživatele
- **Co to je:** Read-only profil cizího uživatele + akční zóna (přátelství, blokace, zpráva).
- **Kde:** Route `/ikaros/uzivatel/:id` (`PublicUserProfilePage`), chráněná `requireAuth`.
- **Kdo:** Každý přihlášený. `GET /users/profile/v14/:id` (throttle 60/min).
- **Co jde dělat:**
  - Zobrazí: hlavička, karta (role, počet světů, lastSeenAt), bio, postava v Campu (characterName/Bio/avatar), **badge Podporovatele** (19.4 — `isSupporter`/`supporterSince`; renderuje se jen když role nemá vlastní hvězdu, `PublicProfileHeader.tsx:48`).
  - Self-banner pokud `id === me.id`. Tombstone banner (pending/deleted) JEN pro admina.
  - **Akce (`PublicProfileActions`):** dle friendship statusu — „Přidat do přátel" / „Žádost čeká · Zrušit" / „Přijmout"+„Odmítnout" / „Přátelé · Odebrat" (confirm) / „Odblokovat"; kebab „Blokovat uživatele" (confirm); „Napsat zprávu" (→ `/ikaros/posta?komu=`); admin: „Otevřít v administraci" (→ `/admin?tab=uzivatele&search=<username>`, předvyplní hledání v admin tabulce; do 2026-07-13 vedlo na zastaralou `/ikaros/uzivatele?view=table`, mrtvou od relokace 12.1).
- **Kdo vidí (BE `publicProfileV14`):**
  - Tombstone (`isDeleted`) i pending-deletion → ne-admin dostane 404, admin vidí s `deleted`/`pendingDeletion` flagy.
  - `profileVisibility:'friends'` → nepřítel (a ne-admin, ne-self) dostane 403 `PROFILE_FRIENDS_ONLY`.
  - `lastSeenAt` null pro `hiddenPresence` nebo tombstone.
  - `lastLoginAt` jen pro platform admina (1.4 §15).
- **Hranice / co neumí:** Veřejný profil NENÍ veřejný pro anonyma (route za `requireAuth`); čte se přes `profile/v14/:id` za JWT (nechráněná `profile/:id` odstraněna 2026-06-18).
- **Zvláštnosti:** WS `user:identity:changed` (role/ban/username) invaliduje `public-user-profile` (role chip / overlay se obnoví).
- **Stav:** ✅ funguje.
- **Kód:** FE `users/pages/PublicUserProfilePage.tsx:21`, `components/PublicProfile/PublicProfileActions.tsx:56`, BE `users.controller.ts:267`, `users.service.ts:511` (tombstone gate `:528`, friend-only `:536-550`, lastSeenAt `:554-560`, admin-only lastLoginAt `:585-592`).

---

### Seznam uživatelů (adresář)
- **Co to je:** Komunitní adresář uživatelů s taby.
- **Kde:** Route `/ikaros/uzivatele` (`UsersPage`), chráněná `requireAuth`. Default tab „uzivatele".
- **Kdo:** Každý přihlášený. `visibleTabsForRole` vrací VŠEM stejné 3 taby (role parametr ignorován — `void role`).
- **Taby:**
  - **Přátelé (`FriendsTab`):** „Moji přátelé" (grid karet — karta ukazuje reálný počet světů přítele, `worldsCount` z BE; kebab Otevřít/Odebrat), „Odeslané žádosti" (collapsible), „Zablokovaní" (collapsible, default sbalený). Empty state s CTA do adresáře.
  - **Uživatelé (`UsersTab`):** grid veřejných karet, search (přezdívka/jméno, debounce 300 ms), sort (Nejnovější / Abecedně), stránkování (24/str). `GET /users` (`listPublic`, throttle 60/min).
  - **Zpracovat (`ZpracovatTab`):** osobní fronta pending akcí — agregátor přes `PendingActionType` (žádosti o přátelství, změnu přezdívky, vstup do světa, články/galerie/diskuze ke schválení, hlášené příspěvky, žádosti o vstup do diskuze). Badge s počtem v tabu. Group se skryje při 0 items.
- **Co kdo vidí per role:**
  - Všichni vidí stejné 3 taby. Obsah „Zpracovat" se ale liší podle reálných pending akcí (např. schvalování článků uvidí jen SpravceClanku/admin — řízeno BE providery, ne FE tabem).
  - Admin/Superadmin: `listPublic` vidí i skryté (`hiddenInDirectory`) a smazané (`includeDeleted`, `pendingDeletion` flagy). UsersTab ale na komunitní stránce posílá `includeDeleted:false` napevno.
  - **Hloubková admin správa uživatelů (tabulka, ban, bulk) byla PŘESUNUTA pod `/admin`** (PlatformAdminPage), na `/ikaros/uzivatele` už není.
- **Hranice / co neumí:**
  - Role nehraje roli ve viditelnosti tabů (`visibleTabsForRole` ignoruje roli) — komentář v kódu to potvrzuje (12.1).
  - „Skrýt v adresáři" skryje uživatele jen pro ne-adminy.
- **Zvláštnosti:** Silent redirect na fallback tab při nedostupném `?tab=`; reset page/view/sort/search při přepnutí tabu.
- **Stav:** ✅ funguje.
- **Kód:** FE `users/pages/UsersPage.tsx:30`, `users/components/usersPageTabs.helpers.ts:12` (`void role` `:13`, `defaultTabForRole` `:17`), `users/components/tabs/UsersTab/UsersTab.tsx:30`, `tabs/FriendsTab/FriendsTab.tsx:28`, `tabs/ZpracovatTab/ZpracovatTab.tsx:33`, BE `users.controller.ts:243` (listPublic).

---

### Přátelství (žádosti, přijetí, odmítnutí, odebrání)
- **Co to je:** Friend-request systém s pending/accepted stavy a cooldownem.
- **Kde:** PublicProfileActions, FriendsTab, ZpracovatTab. BE `Controller('friends')` celý za `JwtAuthGuard`.
- **Kdo:** Každý přihlášený.
- **Co jde dělat:**
  - **Poslat žádost:** `POST /friends/request {userId}`. Vznikne pending.
  - **Přijmout:** `POST /friends/:id/accept` (jen recipient).
  - **Odmítnout / zrušit / odebrat:** `DELETE /friends/:id` — recipient odmítá pending → mark rejected (cooldown); sender ruší pending nebo unfriend accepted → hard delete. `DELETE /friends/by-user/:userId` = podle partnera.
  - **Stav vztahu:** `GET /friends/status/:userId` → `self`/`none`/`pending_outgoing`/`pending_incoming`/`accepted`/`blocked_by_me` (úplný výčet `FriendStatusKind`, `friendships/interfaces/friendship.interface.ts:20-26`). **Cooldown NENÍ stav** — projeví se až při odeslání žádosti (429 `REJECTED_RECENTLY`), status ho nevrací.
  - **Seznamy:** `GET /friends` (accepted, paginated), `GET /friends/requests/outgoing` (moje odeslané pending).
- **Hranice / co neumí:**
  - **Cooldown 7 dní** po odmítnutí: odmítnutý requester nesmí 7 dní znovu poslat (`REJECTED_RECENTLY`, HTTP 429). Asymetrický — recipient může poslat zpět kdykoli. (`COOLDOWN_DAYS = 7` `friendships.service.ts:25`, kontrola `:105-121`.)
  - Žádost sám sobě → 400 `SELF_FRIEND`. Už přátelé → 409 `ALREADY_FRIENDS`. Existující pending → 409 `REQUEST_EXISTS`.
  - Žádné kategorie/skupiny přátel, žádné „nejlepší přátelé", žádná poznámka u přítele.
- **Zvláštnosti:**
  - Friend systém je provázán s poštou a `profileVisibility:'friends'` (přátelé obejdou friend-only profil i poštu).
  - WS eventy (do `user:{id}` roomu): `friend:request:incoming` (toast + akce „Zobrazit"), `friend:request:accepted` (toast), `friend:request:declined`, `friend:request:canceled`, `friend:removed`, `friend:blocked` (tichá invalidace). FE invaliduje `['friends']`, `['friendship-status']`, `['pending-actions']`. Po reconnectu refetch dotčených seznamů.
- **Stav:** ✅ funguje.
- **Kód:** FE `friendships/api/useFriendshipMutations.ts:22`, `hooks/useFriendshipsSocket.ts:38`, BE `friendships/friendships.controller.ts:27` (`@Controller('friends')`; routy `:32`/`:42`/`:49`/`:61`/`:71`/`:85`/`:94`), `friendships.service.ts:40` (`sendRequest`), `friendships.gateway.ts:39`.

---

### Blokace uživatelů
- **Co to je:** Zablokování uživatele (anti-stalk).
- **Kde:** PublicProfileActions (kebab „Blokovat"), FriendsTab → „Zablokovaní".
- **Kdo:** Každý přihlášený.
- **Co jde dělat:** `POST /friends/block/:userId` (zablokuje + smaže všechny aktivní friendship records mezi nimi), `DELETE /friends/block/:userId` (odblokovat), `GET /friends/blocks` (moje bloky).
- **Hranice / co neumí:**
  - Block sám sebe → 400 `SELF_BLOCK`. Pokud mě peer už blokuje → 403 `BLOCKED_BY_PEER`. Už zablokovaný → 409 `ALREADY_BLOCKED`.
  - Blok je jednosměrný záznam, ale ruší obousměrné přátelství.
- **Zvláštnosti (anti-stalk):**
  - Pokud mě CÍL zablokoval, žádost o přátelství vrátí 404 `USER_NOT_FOUND` (jako bych ho neviděl), a `getStatus` vrátí `none` (nesmím poznat, že mě blokuje).
  - Blok ze MÉ strany při žádosti → 409 `ALREADY_BLOCKED`.
  - WS `friend:blocked` jde tiše (blokovanému se nepushuje „byl jsi zablokován").
- **Stav:** ✅ funguje.
- **Kód:** BE `friendships.service.ts:358` (block), `:287` (getStatus; anti-stalk `:296-298`), `:51-61` (anti-stalk v `sendRequest` → `USER_NOT_FOUND`), `friendships.controller.ts:100`/`:106`/`:116`, FE `useFriendshipMutations.ts:99`.

---

### Pošta / soukromé zprávy (souvislost)
- **Co to je:** Z veřejného profilu „Napsat zprávu" vede na `/ikaros/posta?komu=:id`.
- **Hranice:** Detailně mimo rozsah této kapitoly (modul `ikaros-messages`). Friend-only privacy (`profileVisibility:'friends'`) omezuje, kdo může psát první; admin a lidé, kterým jsi psal první, mají přístup vždy (viz PrivacySection text).
- **Stav:** ✅ funguje (odkaz), detail viz kapitola o poště.
- **Kód:** FE `PublicProfileActions.tsx:191`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

- ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-PROFILE) — **Komunitní sekce profilu jsou funkční.** „Moje diskuze / Moje články / Moje galerie" zobrazují reálné seznamy s odkazy (`CommunitySections.tsx`, nad existujícími hooky modulů 3.x). Zbytkový dluh (diskuze filtrované klientsky) ✅ dořešen 2026-07-13 — nativní `GET /ikaros-discussions/my`.
- **Role nemá vliv na taby `/ikaros/uzivatele` — ZÁMĚR (12.1):** `visibleTabsForRole`/`defaultTabForRole` všem vracejí stejné 3 komunitní taby (zafixováno testy). `role` param je vestigiální (`void role`) — ponechán kvůli signatuře, ne mrtvý nález k opravě.
- **Veřejný profil endpoint SJEDNOCEN** (ověřeno 2026-06-27, D-NEW-INV-SEC): nechráněná `GET /users/profile/:id` byla **odstraněna 2026-06-18**; zůstal jen `profile/v14/:id` (JwtAuthGuard + friend-only/tombstone gating + throttle). Leak uzavřen.
- **`displayName` trim DOPLNĚN** (2026-06-27, D-NEW-INV-PROFILE): FE `headerSchema` + BE `UpdateUserDto` (`@Transform` trim, `transform:true`) → „jen mezery" se normalizují na prázdné (→ fallback na username). Min/regex (jako username) záměrně NE — displayName smí být kratší/volnější.
- ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-PROFILE) — **`FriendsTab` zobrazuje reálný počet světů přítele.** BE friend list shape nese `worldsCount` (1 batch aggregate pro celou stránku, žádný N+1 — `friendships.service.ts:248-277`); FE mapper `toPublicUserListItem` ho propaguje s `?? 0` runtime pojistkou proti staršímu BE (`FriendsTab.tsx:244`).
- **Friend systém bez kategorií:** žádné skupiny/poznámky/oblíbení přátelé — pro expanzi.
- **`getCalendarMonth`/`updateCalendarMonth` v users controlleru — POTVRZENO jako mrtvý legacy kód (ověřeno 2026-07-20).** Oba endpointy pořád existují (`users.controller.ts:417` GET, `:445` PUT), authz = self-or-admin (`requester.id !== id && requester.role > UserRole.Admin` → 403 `USER_FORBIDDEN`), zapisují do `themeSettings.calendarMonth`. **FE je nevolá vůbec** — grep `getCalendarMonth|updateCalendarMonth` napříč `src/` = 0 zásahů; jediné výskyty `calendarMonth` na FE patří k počasí světa (`world/api/usePreviewWeather.ts:161`, `WorldWeatherPage.tsx:214`), což je jiný koncept (měsíc herního kalendáře v generátoru počasí), ne tato user-pole. Zbývá tedy jako legacy z .NET migrace = kandidát na odstranění, ne funkce platformy.
