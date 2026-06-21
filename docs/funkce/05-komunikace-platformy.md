# 05 — Komunikace platformy

Kapitola pokrývá platformovou (mimo-světovou) komunikaci: **globální chat** (Hospoda + Rozcestí I.–III.), **poštu / soukromé zprávy**, **notifikace a web push** a **použití emotů**. Vše ověřeno přímo v kódu FE i BE.

> Pozn.: **Chat uvnitř světa** (`/svet/:slug/chat`) je samostatná funkce a patří do kapitoly o světech. Custom obrázkové emoty jsou tam (viz sekce „Emoty" níže).

---

### Globální chat — Hospoda
- **Co to je:** Veřejná real-time klábosna platformy („Interdimenzionální hospoda") — jeden sdílený kanál pro všechny přihlášené napříč světy.
- **Kde:** route `/chat` (`ChatPage` → `ChatRoom room="hospoda"`). Levý panel: sekce „Chat" s počtem přítomných, položka „Hospoda".
- **Kdo:**
  - **FE:** `loader: requireAuth` (router `:167`) — anon **nemá** přístup.
  - **BE:** celý `GlobalChatController` za `JwtAuthGuard` (`global-chat.controller.ts:69`). Žádné role-gate pro čtení/psaní — stačí být přihlášen. Mazání zprávy = `AdminGuard` (`role ≤ Admin`, tj. jen `Superadmin`/`Admin`; `admin.guard.ts:17`).
- **Co jde dělat:**
  - Psát zprávy (text + barva `chatColor` z profilu), **odpovídat** na zprávu (reply preview), **reagovat** emoji reakcí, **nahrávat přílohy** (max **10 MB**).
  - **Šeptat** (whisper) konkrétnímu uživateli přes WS `ikaros:whisper` (`visibleTo` → vidí jen příjemce a odesílatel) — `ChatRoom.tsx:333`, service `sendWhisper`.
  - Vidět **seznam přítomných** (`UserList`), **indikátor psaní** (`TypingIndicator`), systémové hlášky o příchodu/odchodu.
  - Admin: **smazat** zprávu (`DELETE /global-chat/messages/:id`).
- **Hranice / co neumí:**
  - **Zprávy mizí po 1 hodině** — TTL `MESSAGE_TTL_MS = HOUR_MS` (`global-chat.service.ts:42`/`:233`); historie se navíc načítá omezeně (limit ≤ 100) a cron `EVERY_2_HOURS` fyzicky maže expirované (`clean-messages.job.ts`).
  - Žádné trvalé vlákno/archiv, žádné kategorie. Mazání jen Admin+ (uživatel nesmaže ani vlastní).
- **Zvláštnosti:**
  - **Identita autora zprávy = účet** (`username` + `avatarUrl`). Od **4.2e** se ukládá jako **snapshot** při odeslání (`resolveSenderIdentity` → `senderName`/`senderAvatarUrl`, `global-chat.service.ts`) — zpráva si jméno+avatar pamatuje natrvalo. FE má navíc fallback resolver z presence pro zprávy bez snapshotu (`roomAvatarFor`). Dřív zprávy ukazovaly jen iniciálu (avatar se neplnil).
  - **Každá odeslaná zpráva spustí web push `notifyAll` na všechna zařízení** (fire-and-forget, `global-chat.service.ts:242`) — i lidem, co v chatu nejsou. Payload bez `url` → bublina otevře jen `/`.
  - Presence je per-socket multi-room; socket je sdílený celou appkou (pošta, online stav, přátelé) — proto se při opuštění chatu neodpojuje, jen odebere z presence. Heartbeat `chat:heartbeat` udržuje „naživu", neaktivita → auto-odhlášení z presence.
- **Stav:** ✅
- **Kód:** FE `src/features/chat/pages/ChatPage.tsx`, `components/ChatRoom.tsx`, `components/ChatInput.tsx`, `api/useGlobalChat.ts`, `api/useSocket.ts`. BE `backend/src/modules/global-chat/global-chat.controller.ts`, `global-chat.service.ts`, `global-chat.gateway.ts`.

### Globální chat — Rozcestí I.–III.
- **Co to je:** Tři atmosférické roleplay místnosti se **sdíleným prostředím** (vizuální styl + lokace) a ilustračním pozadím scény. Technicky tři další kanály téhož globálního chatu.
- **Kde:** routy `/chat/rozcesti`, `/chat/rozcesti2`, `/chat/rozcesti3` (`RozcestiPage` → `RozcestiRoom`). Levý panel: „Rozcestí I./II./III." s počty přítomných.
- **Kdo:**
  - **FE:** `requireAuth` (router `:169`–`:171`).
  - **BE:** stejný controller; `RoomKey` = `hospoda | rozcesti-1 | rozcesti-2 | rozcesti-3` (`global-chat.service.ts:24`).
  - **Změna prostředí** scény = jen role s platformovou funkcí: `Superadmin`, `Admin`, `SpravceClanku`, `SpravceGalerie`, `SpravceDiskuzi` (`ROOM_STAFF_ROLES` / `RolesGuard`, `global-chat.controller.ts:46`; FE `STAFF_ROLES` v `RozcestiPage.tsx:22`).
- **Co jde dělat:**
  - Vše jako v Hospodě (psát, reply, reakce, přílohy, šepty, presence).
  - **Vystupovat za postavu** — na rozdíl od Hospody nese zpráva i panel přítomných **jméno + avatar postavy** z profilu („Postava v Rozcestí": `characterName`/`characterAvatarUrl`), ne účet. Kdo postavu nevyplnil → fallback na účet.
  - Staff: vybrat **styl** (např. `fantasy`) + **lokaci** (place) — `PUT /global-chat/rooms/:room/environment`; změna se přes WS `chat:room:environment` rozešle všem v místnosti a nastaví pozadí + popis scény (`RozcestiHeader`/`RozcestiDescription`).
- **Hranice / co neumí:** prostředí je **sdílené pro celou místnost** (ne osobní), výběr jen z předdefinovaných stylů/míst (`rozcestiPlaces` na FE). Postava je **globální** (jedna napříč všemi Rozcestími, z profilu) — ne per-místnost. **Jméno** ve zprávě se opraví až novým snapshotem; staré zprávy (před 4.2e) ukazují `username` do vypršení 1h TTL (FE řeší jen avatar, ne jméno). Stejné 1h TTL zpráv.
- **Zvláštnosti:**
  - **Identita postavy = snapshot při odeslání** (4.2e): zpráva si pamatuje, za kterou postavu byla psána, i když hráč postavu/avatar později změní (záměr pro roleplay — opak render-time PJ persony ve světovém chatu). `resolveSenderIdentity(room≠hospoda)` v `global-chat.service.ts`; FE pravidlo `roomAvatarFor` + panel `UserList` mode `character`.
  - Přepnutí mezi Rozcestími dělá čistý remount (`key`). Prostředí drží React Query cache (REST seed + WS + optimistická lokální změna), aby se neduplikovalo do useState.
- **Stav:** ✅
- **Kód:** FE `src/features/chat/pages/RozcestiPage.tsx`, `components/ChatRoom.tsx`, `lib/roomAvatar.ts`, `components/RozcestiHeader.tsx`, `RozcestiDescription.tsx`, `lib/rozcestiRooms.ts`, `lib/rozcestiPlaces.ts`. BE `global-chat.service.ts` (`resolveSenderIdentity`/`sendMessage`/`sendWhisper`), `global-chat.controller.ts:179`, `global-chat.gateway.ts:175`. Spec `docs/arch/phase-4/spec-4.2e.md`.

---

### Pošta / soukromé zprávy
- **Co to je:** Vnitroplatformová schránka — soukromé zprávy mezi uživateli i systémová oznámení, organizovaná do konverzačních vláken.
- **Kde:** route `/ikaros/posta` (`MailPage`: `MailList` + `MailDetail` + `ComposeModal`). Otevření „Napsat" lze i deep-linkem `?komu=<id>&komuJmeno=<jméno>` (z profilu uživatele).
- **Kdo:** jen přihlášený — celý controller za `JwtAuthGuard` (`ikaros-messages.controller.ts:28`), route `requireAuth` (router `:179`). Bez role-gate (každý uživatel má schránku).
- **Co jde dělat:**
  - **Doručené** (`/inbox`, volitelně `?system=true` pro systémová), **Odeslané** (`/sent`), **počet nepřečtených** (`/unread-count` → badge u zvonku).
  - Otevřít zprávu (`GET /:id` ji označí jako přečtenou), zobrazit **celé vlákno** (`/conversation/:conversationId`).
  - **Napsat** novou zprávu (příjemce, předmět, tělo) nebo **odpovědět** ve vláknu (`POST /ikaros-messages`).
  - **Smazat** zprávu — soft delete jen pro aktuálního uživatele (`DELETE /:id`).
- **Hranice / co neumí:**
  - **Friend-only filtr (D-057):** pokud má příjemce `profileVisibility = 'friends'`, smí mu novou konverzaci založit jen **přítel** (jinak 403). Systémové zprávy (`senderId='system'`) tento filtr **obcházejí** (`ikaros-messages.service.ts:99`).
  - Žádné přílohy v poště (jen text/předmět), žádné hromadné akce, žádné štítky/složky kromě Doručené/Odeslané/Systémové.
  - Mazání je per-uživatel (druhá strana zprávu pořád vidí).
- **Zvláštnosti:**
  - **Real-time:** nová zpráva emituje WS `ikaros:new-message` do `user:{recipientId}` (`ikaros-messages.gateway.ts:37`) → badge a feed se aktualizují bez refreshe.
  - **Systémové zprávy** generuje `system-events.listener` (schválení vstupu do světa `world.access.approved`, přiřazení postavy `world.character.assigned`) a service modulů (schválení/vrácení článku, galerie, diskuze posílají poštu autorovi/adminům).
  - **NEposílá web push** — nová pošta jen WS + badge; na telefon push nechodí (push má jen novinky a globální chat; svět-chat má vlastní notifyUsers).
  - `conversationId` se generuje předem (`=== _id` kořene vlákna, N-34), aby reply hned trefil správné vlákno.
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/MailPage/` (`MailPage.tsx`, `ComposeModal.tsx`, `MailDetail.tsx`, `MailList.tsx`), `api/useMail.ts`. BE `backend/src/modules/ikaros-messages/ikaros-messages.controller.ts`, `ikaros-messages.service.ts`, `ikaros-messages.gateway.ts`, `system-events.listener.ts`.

---

### Notifikace (centrum / zvonek)
- **Co to je:** Vyskakovací centrum upozornění v headeru (zvonek) se třemi taby; agreguje chat, události a frontu ke zpracování.
- **Kde:** `NotificationCenter` v `IkarosLayout` (zvonek v hlavičce). Taby: **Chaty**, **Události**, **Ke zpracování** (poslední jen když je co řešit).
- **Kdo:** přihlášený. Tab „Ke zpracování" se zobrazí jen těm, kdo mají pending položky (PendingActions providery — recenzenti článků/galerie/diskuzí, PJ světa apod.).
- **Co jde dělat:**
  - **Chaty** (`ChatFeedTab`) — souhrn nepřečtených zpráv **napříč všemi mými světy** (cross-world feed `GET /chat/feed`, cursor paginace; access-safe). **Klik na položku** otevře daný svět + konverzaci a doscrolluje/zvýrazní konkrétní zprávu (deep-link `/svet/:slug/chat?konverzace=&zprava=`; feed nese `worldSlug`). Zpráva mimo načtené okno historie (~50) → konverzace se otevře, ale skok je no-op.
  - **Události** (`EventsTab`) — co mi schválili / přiřazení postavy apod.
  - **Ke zpracování** (`PendingTab`) — fronta schvalování (články/galerie/diskuze, …) přes `usePendingActionsCount`.
  - Patička: **přepínač web push** na tomto zařízení (`PushToggle`).
- **Hranice / co neumí:** není to plnohodnotný „seznam všech notifikací" — je to agregace tří zdrojů. Žádné „označit vše přečtené" napříč typy z jednoho místa (řeší se per zdroj).
- **Zvláštnosti:** badge u nav položek (Diskuze/Články/Galerie) zrcadlí pending count; „Chaty" se aktualizuje živě přes WS (`useChatFeedLive`).
- **Stav:** ✅
- **Kód:** FE `src/features/notifications/components/NotificationCenter.tsx`, `ChatFeedTab.tsx`, `EventsTab.tsx`, `PendingTab.tsx`, `model/centerStore.ts`. BE chat feed `backend/src/modules/chat/chat-feed.controller.ts`.

### Web push (notifikace na telefon)
- **Co to je:** Standardní Web Push (VAPID) — bubliny i na zamčený telefon přes service worker, i když je appka zavřená.
- **Kde:** přepínač v patičce centra notifikací (`PushToggle`), seznam zařízení `PushDevicesList`. Service worker `public/sw.js`.
- **Kdo:** přihlášený, na zařízení s podporou push. Bez role-gate.
- **Co jde dělat:**
  - Získat veřejný klíč (`GET /push/vapid-public-key`, veřejné), **přihlásit** zařízení (`POST /push/subscribe`, upsert dle endpointu, ukládá user-agent), **odhlásit** (`/unsubscribe` dle endpointu nebo `DELETE /subscriptions/:id`), vypsat **vlastní zařízení** (`GET /push/subscriptions`, bez klíčů).
  - SW zobrazí notifikaci z payloadu `{title, body, icon?, url?, tag?}` a na klik naviguje na `url` (deep-link), jinak na `/` (`sw.js`). `tag` slučuje bubliny stejné konverzace (`renotify:true` znovu upozorní).
- **Co reálně pushuje:**
  - **Nová platformová novinka** → `notifyAll` (kap. 04).
  - **Každá zpráva v globálním chatu** → `notifyAll` (viz výše).
  - **Chat ve světě** → `notifyUsers` cílově, s `tag`/`topic = chat-{channelId}` (mimo tuto kapitolu; viz [spec-13.2c-push-delivery](../arch/phase-13/spec-13.2c-push-delivery.md)).
- **Doručovací politika (13.2c-push-delivery, 2026-06-19):** každý push nese **TTL** (default 4 h, konst. `DEFAULT_TTL_SECONDS`) — provider po vypršení notifikaci zahodí, takže offline telefon už nedostane **dny staré** zprávy. Validní **`topic`** (server-side collapse, RFC 8030) navíc nahradí předchozí nedoručenou ve frontě → jen poslední, ne hromada. (`push.service.ts` `sendToSubscriptions`.)
- **Hranice / co neumí:**
  - **Pošta nepushuje** (jen WS) — soukromá zpráva na telefon nedorazí jako push.
  - **Žádné per-typ předvolby** — jediný přepínač zapne/vypne push na zařízení; nelze si zvolit „jen pošta, ne chat".
  - **`notifyAll` payloady nemají `url`** → deep-link se u novinek a globálního chatu nevyužije, bublina otevře `/`. (Nemají ani `tag`/`topic` → broadcast push se neslučuje.)
  - iOS vyžaduje PWA přidanou na plochu (standardní omezení Safari pro Web Push) — 15.1 install hint to usnadňuje instrukcí „Sdílet → Přidat na plochu" (viz blok „Instalace na plochu (PWA)" níže).
- **Zvláštnosti:**
  - Neplatné subscription (HTTP 404/410) se automaticky promazávají (`push.service.ts`). VAPID klíče z env (`VAPID_SUBJECT/PUBLIC_KEY/PRIVATE_KEY`); chybí-li, modul při startu spadne na `!` non-null assertu.
  - **Úklid rotovaných odběrů (13.2c-push-delivery):** SW má `pushsubscriptionchange` handler → re-subscribe (auth není v SW dostupný, BE origin dostává query `?api=` z `main.tsx`). Nahlášení nového endpointu řeší FE `usePush` autentizovaně — na mountu porovná endpoint s `localStorage['push:endpoint']`, při změně pošle `POST /push/subscribe` s `oldEndpoint` → BE starý smaže (`subscribe` v `push.service.ts`). Bez toho se mrtvé endpointy hromadily → **duplicitní push na jedno zařízení**.
- **Stav:** 🚧 — infrastruktura funkční (subscribe/unsubscribe/SW/cleanup, TTL/topic dedup, rotace odběru), ale dle MEMORY zbývá ověřit doručení na reálném telefonu a deep-linky u broadcast push nejsou naplněné.
- **Kód:** FE `src/features/notifications/api/usePush.ts`, `components/PushToggle.tsx`, `PushDevicesList.tsx`, `public/sw.js`, `src/app/main.tsx`. BE `backend/src/modules/push/push.controller.ts`, `push.service.ts`, `dto/subscribe.dto.ts`; chat push `backend/src/modules/chat/chat.service.ts`.

---

### Instalace na plochu (PWA) + offline režim
- **Co to je:** Aplikace jde nainstalovat na plochu telefonu/desktopu jako „appku" (ikona, fullscreen, vlastní okno) a po výpadku sítě ukáže tematickou **offline stránku** místo chybové hlášky prohlížeče. Manifest + push SW byly z 13.2c; **15.1** doplnilo offline cache, aktivní install hint a iOS metadata.
- **Kde:** install banner se sám zobrazí dole na libovolné stránce (i nepřihlášenému). Manifest `public/manifest.webmanifest`, offline stránka `public/offline.html`, SW `public/sw.js`.
- **Kdo:** kdokoli (i nepřihlášený) na zařízení s podporou PWA. Bez role-gate.
- **Co jde dělat:**
  - **Nainstalovat appku** — Android/desktop Chromium: vlastní tlačítko „Nainstalovat" (zachycený `beforeinstallprompt`, `useInstallPrompt`). iOS Safari: banner ukáže **instrukci** „Sdílet → Přidat na plochu" (`beforeinstallprompt` na iOS neexistuje).
  - **Zavřít banner** (×) — dismiss se uloží do `localStorage['pwa:install-dismissed']`, re-nabídka až po **14 dnech**. Ve standalone režimu (už nainstalováno) se banner nezobrazí vůbec.
  - **Offline:** při výpadku sítě navigace zobrazí `offline.html` (tlačítko „Zkusit znovu" = reload). Po prvním načtení appka startuje rychleji (JS/CSS z cache).
- **Hranice / co neumí:**
  - **Žádná offline data** — záměrně se cacheuje jen app shell (`/assets/*` cache-first) a offline fallback; reálný obsah (chat, mapa, novinky, API) offline nefunguje, appka je real-time. Navigace je network-first → offline = jen statická hláška, ne použitelná appka.
  - **Cache jen v produkci** — SW dostává `mode=prod` jen v prod buildu; v dev je SW push-only (jinak by `fetch` handler rozbil Vite HMR). Offline režim tedy nejde ověřit `npm run dev`, jen z `npm run build` / nasazeného webu.
  - **Bobtnání assets cache** — staré hashované assety po deployi v cache zůstanou (drobnost; řeší bump `CACHE = 'ikaros-shell-v1'` v `sw.js` + browser eviction dle kvóty).
- **Zvláštnosti:**
  - `apple-touch-icon` = existující `/icons/icon-192.png` (colorType 2, bez alfy → iOS nepodloží černou). iOS meta v `index.html`: `apple-mobile-web-app-capable/-status-bar-style(black-translucent)/-title`.
  - Banner detekuje standalone přes `matchMedia('(display-mode: standalone)')` || `navigator.standalone` (iOS); iPadOS 13+ se hlásí jako Mac → fallback přes `maxTouchPoints`.
  - **Váže na push:** na iOS Web Push **vyžaduje** PWA přidanou na plochu — install hint je tedy předpoklad pro push na iPhonu (viz blok Web push výše).
- **Stav:** ✅ — manifest/SW/offline/install hint hotové, build ✓, mobil-desktop ✓. (Reálné chování install promptu a iOS „Přidat na plochu" ověřitelné jen na zařízení / nasazeném HTTPS.)
- **Kód:** FE `src/features/pwa/InstallBanner.tsx`, `useInstallPrompt.ts`, `index.ts`, `InstallBanner.module.css`; `public/sw.js` (fetch/cache lifecycle), `public/offline.html`, `index.html`, `src/app/main.tsx` (`mode=prod` + mount banneru), `scripts/stamp-pwa-icons.mjs`. Spec [spec-15.1.md](../arch/phase-15/spec-15.1.md).

---

### Emoty — použití v chatu a zprávách
- **Co to je:** Dva oddělené systémy „emotů". (1) **Textové emotikony** v globálním chatu — `:)` → 🙂, `:shortcode:` → unicode emoji. (2) **Custom obrázkové emoty** (modul `emotes`) — vlastní obrázek + zkratka, dostupné **v chatu uvnitř světa**.
- **Kde:**
  - Globální chat (`/chat`, Rozcestí): textová konverze v `MessageItem` (fallback `parseEmotes`) + emoji picker (`EmojiPickerPopover`, knihovna `frimousse`).
  - Custom obrázkové emoty: `features/world/chat` (autocomplete `EmoteAutocomplete`, render `renderChatContent`, API `useGlobalEmotes`/`useWorldEmotes`).
- **Kdo (použití):** každý člen příslušného chatu může emoty/emoji vkládat a vidět. Custom emoty čte člen světa (`emotes/:worldId` za `assertIsMember`); globální custom emoty (`emotes/global`) čte každý přihlášený.
- **Co jde dělat:**
  - V globálním chatu: psát emotikony (`:)`, `:D`, `:P`, …) → automaticky se vykreslí jako emoji; vybrat emoji z pickeru; dávat emoji **reakce** na zprávy.
  - V chatu světa: psát `:zkratka:` custom emote → vykreslí se jako `<img>` (obrázek); autocomplete při psaní.
- **Hranice / co neumí:**
  - **V globálním chatu/poště se custom OBRÁZKOVÉ emoty NEPOUŽÍVAJÍ** — `MessageItem` tam jede jen textovou konverzi (`emotes.ts`); modul `emotes` konzumuje výhradně `features/world/chat`.
  - **Pošta** nemá emote/emoji picker (čistý text/předmět).
  - Sada textových emotikonů je pevná (mapa v `chat/lib/emotes.ts`).
- **Zvláštnosti:** rozlišuj „emoji reakce" (toggle na zprávě, WS `chat:message:reaction`) vs. „emoty v textu". Globální custom emoty mají vlastní `emotes/global` endpoint a admin správu.
- **Stav:** ✅ (globální chat textové; world custom obrázkové)
- **Správa emotů (admin):** vytváření/úprava/mazání custom emotů — **viz kapitola 08** (platformová správa). Globální: jen `Admin+` (`/emotes/global`, `assertGlobalCanManage`). Per-svět: `PJ`/`PomocnyPJ`+ (`/emotes/:worldId`, `assertWorldCanManage`).
- **Kód:** FE globální `src/features/chat/lib/emotes.ts`, `components/MessageItem.tsx`, `EmojiPickerPopover.tsx`; world custom `src/features/world/chat/emotes/`, `lib/renderChatContent.tsx`. BE `backend/src/modules/emotes/emotes.controller.ts`, `emotes.service.ts`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Globální chat pushuje každou zprávu všem.** `GlobalChatService.sendMessage` volá `pushService.notifyAll` na **každou** zprávu (`global-chat.service.ts:242`) — při živé Hospodě to znamená web push na všechna zařízení za každou hlášku. Silný spam-vektor; chybí throttling / opt-out / exclude odesílatele.
2. **Push bez deep-linku.** `notifyAll` payloady (novinky i globální chat) neobsahují `url`, takže klik na bublinu otevře jen `/`, ne konkrétní místnost/novinku. SW deep-link (`sw.js:35`) je připravený, ale nenaplněný. (Shoduje se s MEMORY: deep-link schválit a doplnit `url` do payloadu.)
3. **Pošta bez push.** Soukromá/systémová zpráva nikdy nedorazí jako push na telefon (jen WS + badge). Pro uživatele matoucí, když chat pushuje a pošta ne.
4. **Žádné per-typ push předvolby.** Jediný přepínač zapne/vypne vše; nelze odlišit „novinky vs. chat vs. pošta". Společně s bodem 1 dělá push prakticky nepoužitelný pro aktivní uživatele Hospody.
5. **Dva nezávislé „emote" systémy se snadno zamění.** Globální chat = textové emoji; svět = custom obrázkové. Sdílí UI termín „emoty", ale ne kód ani datový zdroj. V průvodci jasně oddělit, aby amatér nehledal v Hospodě obrázkové emoty světa.
6. **1h TTL globálního chatu** není v UI nikde explicitně komunikováno — uživatel může být překvapen, že se historie „ztrácí". Vhodné zmínit v nápovědě.
7. **VAPID fail-fast.** Bez env klíčů push modul spadne na non-null assertu při startu (`push.service.ts:31`) — provozní závislost; ověřit, že produkce má klíče (dle MEMORY 3/3 OK).
