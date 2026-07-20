# 05 — Komunikace platformy

Kapitola pokrývá platformovou (mimo-světovou) komunikaci: **globální chat** (Putyka + Voice krčma + Camp: Fantasy/Mystery/Sci-fi), **poštu / soukromé zprávy**, **notifikace a web push** a **použití emotů**. Vše ověřeno přímo v kódu FE i BE.

> Pozn.: **Chat uvnitř světa** (`/svet/:slug/chat`) je samostatná funkce a patří do kapitoly o světech. Custom obrázkové emoty jsou tam (viz sekce „Emoty" níže).

---

### Globální chat — Putyka
- **Co to je:** Veřejná real-time klábosna platformy („Dimenzionální Putyka") — jeden sdílený kanál pro všechny napříč světy. **15.8 — i pro nepřihlášené (host).**
- **Kde:** route `/chat` (`ChatPage` → `ChatRoom room="hospoda"`). Levý panel: sekce „Chat", položka „Putyka" (viditelná i anonimovi z 15.7). Pozn.: interní klíč místnosti + WS eventy zůstávají `hospoda` (kontrakt s BE, přejmenoval se jen zobrazený název).
- **Kdo:**
  - **FE:** `/chat` je **veřejné** (15.8 — zrušen `requireAuth`). Nepřihlášený bez host session vidí captcha bránu `AnonChatGate`; po ověření má guest session a vejde v „host módu".
  - **BE:** `GlobalChatController` za `GuestOrMemberGuard` (`global-chat.controller.ts`) — pustí člena (plný member gate) i hosta (guest JWT, role `Guest`). **Host smí jen Putyku** (`assertGuestScope` → Camp 403), **jen text** (upload → 403). Mazání = `AdminGuard`. Ban hosta = `POST /global-chat/anon-ban` (Admin, váže na anon-id).
- **Host (anonym) — 15.8:**
  - **Vstup:** captcha (Turnstile) → `POST /auth/anon-session` → guest JWT (role `Guest`, TTL `ANON_SESSION_TTL` = 14 d — od 24.2 je proměnná explicitně v prod compose/`deploy.yml`/`.env.example`, dřív žila jen jako skrytý default `'14d'` v `auth.service.ts:848`; chování se nezměnilo, jen jde ladit bez zásahu do kódu) + náhodné jméno `anonym{1000–9999}`. Session v `localStorage: ikaros.anonToken` (oddělená od členské), drží přes reload/reconnect. Po registraci/přihlášení se zahodí.
  - **Smí:** číst Putyku + psát **text**, vidět přítomné. Zpráva nese odznak „host" (`isAnonymous`), bez avataru.
  - **Nesmí:** upload příloh, šepot, mazání, Camp, cokoli mimo Putyku (guest token scope + sentinel `UserRole.Guest = 99` nikdy neprojde gating).
  - **Moderace:** Admin zabanuje `anon-id` (kolekce `anon_bans`) → 403 při psaní; **rate-limit 10 zpráv/min** per anon-id (in-memory, jen host).
- **Co jde dělat:**
  - Psát zprávy (text + barva `chatColor` z profilu), **odpovídat** na zprávu (reply preview), **reagovat** emoji reakcí, **nahrávat přílohy** (max **10 MB**).
  - **Šeptat** (whisper) konkrétnímu uživateli přes WS `ikaros:whisper` (`visibleTo` → vidí jen příjemce a odesílatel) — `ChatRoom.tsx:333`, service `sendWhisper`.
  - Vidět **seznam přítomných** (`UserList`), **indikátor psaní** (`TypingIndicator`), systémové hlášky o příchodu/odchodu.
  - **Nahlásit** (20.1): přihlášený člen může z akcí u cizí zprávy otevřít report (`ReportModal targetType="chat_message"` → moderační fronta, kap. 08). Platí pro Putyku i Camp (sdílený `MessageItem`); vlastní zprávu nahlásit nelze, guest/host nahlásit nemůže (BE vyžaduje účet). *(Světový chat report na zprávy zatím nemá.)*
  - Admin: **smazat** zprávu (`DELETE /global-chat/messages/:id`).
- **Hranice / co neumí:**
  - **Zprávy mizí po 1 hodině** — TTL `MESSAGE_TTL_MS = HOUR_MS` (`global-chat.service.ts:42`/`:233`); historie se navíc načítá omezeně (limit ≤ 100) a cron `EVERY_2_HOURS` fyzicky maže expirované (`clean-messages.job.ts`).
  - Žádné trvalé vlákno/archiv, žádné kategorie. Mazání jen Admin+ (uživatel nesmaže ani vlastní).
- **Zvláštnosti:**
  - **Identita autora zprávy = účet** (`username` + `avatarUrl`). Od **4.2e** se ukládá jako **snapshot** při odeslání (`resolveSenderIdentity` → `senderName`/`senderAvatarUrl`, `global-chat.service.ts`) — zpráva si jméno+avatar pamatuje natrvalo. FE má navíc fallback resolver z presence pro zprávy bez snapshotu (`roomAvatarFor`). Dřív zprávy ukazovaly jen iniciálu (avatar se neplnil).
  - **15.9 — push jen z Putyky a opt-in:** odeslaná zpráva spustí web push **jen v Putyce** (`room === 'hospoda'`), přes `notifyAll(payload, 'hospoda', { excludeUserId })` (fire-and-forget). Kategorie `hospoda` je v preferencích **default VYP** → defaultně push nedostane nikdo, jen kdo si Putyku výslovně zapnul v profilu. Camp push **negeneruje** (dřív sdílená `notifyAll` spamovala všechny i ze zpráv z Campu — opraveno). **D-NEW-INV-PUSH (2026-07-12):** payload nese `url: '/chat'` (klik na bublinu otevře Putyku) a `excludeUserId` = odesílatel **nedostane push na vlastní zprávu**. (`global-chat.service.ts` `sendMessage`.)
  - Presence je per-socket multi-room; socket je sdílený celou appkou (pošta, online stav, přátelé) — proto se při opuštění chatu neodpojuje, jen odebere z presence. Heartbeat `chat:heartbeat` udržuje „naživu", neaktivita → auto-odhlášení z presence.
- **Stav:** ✅
- **Kód:** FE `src/features/chat/pages/ChatPage.tsx`, `components/ChatRoom.tsx`, `components/ChatInput.tsx`, `components/AnonChatGate.tsx` (15.8 brána), `store/anonSession.ts`, `api/useAnonSession.ts`, `api/useGlobalChat.ts`, `api/useSocket.ts`. BE `backend/src/modules/global-chat/global-chat.controller.ts`, `global-chat.service.ts`, `global-chat.gateway.ts`, `anon-ban.service.ts`, `common/guards/guest-or-member.guard.ts`, `auth/auth.service.ts` (`createAnonSession`). Spec 15.8.

### Globální chat — Voice krčma (17.6)
- **Co to je:** Globální **hlasová** místnost („Voice krčma") pro pokec na mikrofonu — voice-first (velké dlaždice účastníků), text pokec běží vedle. Hlas / video / sdílení obrazovky pohání **Jitsi** (`meet.jit.si`) za **provider adaptérem** (připraveno na pozdější výměnu za LiveKit bez přepisu UI). **Jen registrovaní** (host ji nevidí ani do ní nevejde).
- **Kde:** route `/chat/voice` (`VoiceKrcmaPage` → `VoiceKrcmaRoom`). Levý panel „Chat": položka „Voice krčma" **mezi Putykou a Campy** (`CHAT_ROOMS`, `anonHidden`). Interní klíč místnosti `voice-krcma`.
- **Kdo:**
  - **FE:** `chat/voice` je `requireAuth`. Host nemá položku v sidebaru (`anonHidden`) a přímý přístup na URL ho vrátí do Putyky.
  - **BE:** stejný `GlobalChatController` / `RoomKey` = `… | voice-krcma`; host → 403 **automaticky** (`assertGuestScope` / guest gate pouští jen `hospoda`). Identita autora textu = **účet** (jako Putyka, ne postava).
- **Co jde dělat:**
  - **Usednout k mikrofonu** → připojení k Jitsi hovoru (mikrofon zap, kamera vyp — účel je hlas). Ovládání vlastními tlačítky: **mikrofon**, **kamera** (volitelná), **sdílet obrazovku**, **odejít**.
  - **Text pokec** vedle hovoru (reuse `ChatRoom`) — psát i mluvit zároveň.
  - **Otevřít v samostatném okně** (`⧉`) → `window.open` na druhý monitor (pop-out; jen hlasová plocha, `?popout`).
  - Vidět **roster** „kdo je na mikrofonu" + jeho stav mikrofonu (WS voice presence).
- **Zvláštnosti:**
  - **Náš rám je skin-aware** (voice-bar / dlaždice / ovladače přes `--theme-*` → přebarví se s platformovým skinem; identita „Řezbářská krčma" ve tvaru/ornamentu zůstává). **Vnitřek Jitsi iframe** (video mřížka) se jen sladí — plnou kontrolu dá až LiveKit.
  - **Voice presence** (`voice:join/leave/state` → `chat:voice:presence/state`) je oddělená od textové presence („být v místnosti" ≠ „být v hovoru"); anti-spoof z ověřeného JWT, multi-tab dedup, reconnect re-join.
  - **Jitsi nedělá signaling na našem BE** — audio/WebRTC/TURN běží uvnitř iframe pod CSP Jitsi; náš BE drží jen textový pokec + roster metadat.
  - **CSP + Permissions-Policy** povolují `meet.jit.si` (script/frame/connect + delegace kamery/mikrofonu do iframe).
- **Voice i ve světě (17.6 rozšíření):** hlas+video **i ve světovém chatu a na taktické mapě** — tlačítko 📞 v hlavičce světového chatu (`ChannelView`) a na mapě (`weatherSlot`). **Jeden hovor na svět** (`ikaros-world-{worldId}`), sdílený chatem i mapou; **přežije přechod mapa↔chat** (`WorldVoiceHost` v `WorldLayout` mimo `<Outlet/>` + `worldVoiceSessionAtom`, jotai). Bez BE změn — Jitsi ukazuje účastníky, náš roster jen v krčmě. Kód: `src/features/voice/{store.ts, components/WorldVoiceHost.tsx, WorldVoiceButton.tsx}`.
- **Stav:** ✅ implementováno (BE jest 118/118; FE build/tsc/eslint/vitest ✓). ⚠️ **Čeká BE restart + CSP redeploy + živý test hlasu/videa na reálném zařízení** ([[feedback_be_restart_required]]). Room-name na veřejném `meet.jit.si` NENÍ bezpečnost (self-host Jitsi + JWT = follow-up).
- **Kód:** FE `src/features/voice/` (`components/VoiceKrcmaRoom.tsx`, `useVoice.ts`, `provider/{loadJitsiApi,JitsiVoiceProvider,types}.ts`, `api/useVoicePresence.ts`, `config.ts`), `pages/VoiceKrcmaPage.tsx`; route `app/router.tsx`, sidebar `IkarosLayout.tsx` `CHAT_ROOMS`, typy `features/chat/lib/types.ts`. BE `global-chat.service.ts` (`RoomKey`/`ROOM_DEFS`/`resolveSenderIdentity`), `global-chat.gateway.ts` (voice presence), `presence-messages.ts`; kontrakt `docs/websocket-api.md`. CSP `default.conf.template`. Spec `docs/arch/phase-17/spec-17.6.md`.

### Globální chat — Camp (Fantasy · Mystery · Sci-fi)
- **Co to je:** Tři atmosférické roleplay místnosti se **sdíleným prostředím** (žánr + lokace) a ilustračním pozadím scény, pro **hru na jeden večer**. Každý Camp má **zamčený žánr** (default: camp-1 = Fantasy, camp-2 = Mystery/`mystic`, camp-3 = Sci-fi) → **název = žánr** („Fantasy camp" / „Mystery camp" / „Sci-fi camp"). Technicky tři kanály téhož globálního chatu. (16.6 — pivot z „Camp I./II./III.")
- **Kde:** routy `/chat/camp`, `/chat/camp2`, `/chat/camp3` (`CampPage` → `CampRoom`); interní klíče `camp-1/2/3` a routy **beze změny** (rename jen zobrazený název). Levý panel: „Fantasy/Mystery/Sci-fi camp" (`CHAT_ROOMS`, stabilní domovský žánr) s počty přítomných. Hlavička místnosti = **dynamický název dle aktuálního žánru** (`genreLabel(env.style)`) — při staff override se přepne.
- **Kdo:**
  - **FE:** `requireAuth` (router `:194`–`:197`).
  - **BE:** stejný controller; `RoomKey` = `hospoda | camp-1 | camp-2 | camp-3`; Camp klíče `CAMP_ROOM_KEYS` (`global-chat.service.ts`).
  - **Změna scény** (žánr/lokace) = jen role s platformovou funkcí: `Superadmin`, `Admin`, `SpravceClanku`, `SpravceGalerie`, `SpravceDiskuzi` (`ROOM_STAFF_ROLES` / `RolesGuard`; FE `STAFF_ROLES` v `CampPage.tsx`). Hráč scénu **nemění** (read-only štítek + zamčená lokace).
  - **Default žánr Campu** = admin (`Superadmin`/`Admin`): `PUT /global-chat/rooms/:room/default` (trvalé přerozdělení, např. víc fantasy). `GET /global-chat/rooms/defaults` čte kdokoli člen.
  - **Uložit/načíst hru** = **přihlášený člen** (host/anon → 403 `GUEST_NO_SAVED_GAME`).
- **Co jde dělat:**
  - Vše jako v Putyce (psát, reply, reakce, přílohy, šepty, presence) + **vystupovat za postavu** (jméno/avatar postavy z profilu, fallback účet).
  - Staff: **override lokace i žánru** — `PUT /global-chat/rooms/:room/environment`; přes WS `chat:room:environment` všem; nastaví pozadí + popis (`CampHeader`/`CampDescription`). Override je **dočasný do dalšího rotačního okna** (viz Zvláštnosti).
  - **📜 Uložit hru** (hráč) — `POST /global-chat/rooms/:room/save-game`: snímek scény (žánr+lokace) + **posledních 20 veřejných zpráv** (`SavedChatLine`: jméno/text/barva/čas; vynechá system + šepty) → **1 slot per hráč** (upsert, přepíše). Tlačítko aktivní jen když je log neprázdný.
  - **📂 Načíst hru** (hráč) — `POST /global-chat/saved-game/load`: přepne scénu Campu, kde byla hra uložena, na uloženou (žánr+lokace) a publikuje blok **„Tady jste skončili"** (`StartHereBlock`) nad živým logem; FE přenese hráče do toho Campu. Vidí ho **všichni přítomní** (i nově příchozí přes targeted WS emit). `GET /global-chat/saved-game` (můj slot), `DELETE` (smaž).
- **Hranice / co neumí:** prostředí **sdílené pro celou místnost** (ne osobní), výběr jen z předdefinovaných žánrů/míst (`campPlaces`). Postava **globální** (jedna napříč Campy). **1 uložená hra per hráč** (další uložení přepíše — žádná historie/pojmenované sloty). Blok „Tady jste skončili" je **read-only kotva** (ne obnova celé session; žádná taktická mapa/tokeny — pivot proti roadmapě). Načtení **přepíše scénu i cizí probíhající hře** ve veřejném Campu (záměr — veřejný prostor). Prostředí + `startHere` **in-memory** (restart BE → reset na default žánr + placeId 1); uložené hry v DB (`campsavedgames`) přežijí. TTL zpráv **1 h**.
- **Zvláštnosti:**
  - **Auto-rotace lokace** — `CampRotationJob` (`@Cron('0 0,12 * * *')`, tj. **12:00 a 00:00**) přepne každý Camp na **default žánr + náhodnou lokaci** a **vyresetuje `startHere`** (`applyRotation` na gateway). Tím jakýkoli staff override „dojede" — **žádné trackování času**, cron ho ve fixním okně přepíše.
  - **`startHere` = sdílený in-memory stav místnosti** (WS `chat:room:startHere` s obálkou `{room, startHere|null}`); `null` = blok zhasne (rotace/clear). Nově příchozí dostane stav targeted emitem při `chat:room:join`. FE `useStartHere(room)`; lokální × jen skryje (do dalšího loadu).
  - **Identita postavy = snapshot při odeslání** (4.2e): zpráva si pamatuje, za koho byla psána. `resolveSenderIdentity(room≠hospoda)`; FE `roomAvatarFor` + `UserList` mode `character`.
  - **Sync názvů kanálů** při startu BE (`onModuleInit`) — přejmenuje i staré DB kanály „Camp I." → „Fantasy camp" (idempotentní), ať neprosakují do souhrnů chatů.
  - Přepnutí mezi Campy = čistý remount (`key`). Prostředí drží React Query cache (REST seed + WS + optimistická změna).
  - **15.9 — Camp negeneruje web push** (jen `room === 'hospoda'`).
- **Stav:** ✅ (BE čeká restart — in-memory env/startHere + cron/DI + sync názvů; [[feedback_be_restart_required]])
- **Kód:** FE `src/features/chat/pages/CampPage.tsx`, `components/ChatRoom.tsx` (`scene.logTopNode`), `components/CampHeader.tsx`, `CampDescription.tsx`, `StartHereBlock.tsx`, `lib/campRooms.ts`, `lib/campPlaces.ts` (`CAMP_DEFAULT_GENRE`/`genreLabel`), `api/useSavedGame.ts`, `lib/roomAvatar.ts`. BE `global-chat.service.ts` (saveGame/loadGame/getSavedGame/deleteSavedGame/defaults, `CAMP_DEFAULT_GENRE`, `genreLabel`, `randomPlaceId`), `global-chat.gateway.ts` (`startHere`/`applyRotation`/per-room default env), `global-chat.controller.ts` (6 endpointů), `camp-rotation.job.ts`, `schemas/camp-saved-game.schema.ts`, `schemas/camp-room-config.schema.ts`. Spec `docs/arch/phase-16/spec-16.6.md` (+ 4.2a/4.2e základ).

---

### Pošta / soukromé zprávy
- **Co to je:** Vnitroplatformová schránka — soukromé zprávy mezi uživateli i systémová oznámení, organizovaná do konverzačních vláken.
- **Kde:** route `/ikaros/posta` (`MailPage`: `MailList` + `MailDetail` + `ComposeModal`). Otevření „Napsat" lze i deep-linkem `?komu=<id>&komuJmeno=<jméno>` (z profilu uživatele).
- **Kdo:** jen přihlášený — celý controller za `JwtAuthGuard` (`ikaros-messages.controller.ts:28`), route `requireAuth` (router `:179`). Bez role-gate (každý uživatel má schránku).
- **Co jde dělat:**
  - **Doručené** (`/inbox`, volitelně `?system=true` pro systémová), **Odeslané** (`/sent`), **počet nepřečtených** (`/unread-count` → badge u zvonku).
  - Otevřít zprávu (`GET /:id` ji označí jako přečtenou), zobrazit **celé vlákno** (`/conversation/:conversationId`).
  - **Napsat** novou zprávu (příjemce, předmět, tělo) nebo **odpovědět** ve vláknu (`POST /ikaros-messages`).
  - **Nahlásit** (20.1): u **přijaté** zprávy tlačítko „Nahlásit" (`ReportButton targetType="mail_message"`) → moderační fronta (kap. 08). Vlastní odeslané zprávy se nenahlašují.
  - **Smazat** zprávu — soft delete jen pro aktuálního uživatele (`DELETE /:id`).
- **Hranice / co neumí:**
  - **Friend-only filtr (D-057):** pokud má příjemce `profileVisibility = 'friends'`, smí mu novou konverzaci založit jen **přítel** (jinak 403). Systémové zprávy (`senderId='system'`) tento filtr **obcházejí** (`ikaros-messages.service.ts:99`).
  - Žádné přílohy v poště (jen text/předmět), žádné hromadné akce, žádné štítky/složky kromě Doručené/Odeslané/Systémové.
  - Mazání je per-uživatel (druhá strana zprávu pořád vidí).
- **Zvláštnosti:**
  - **Real-time:** nová zpráva emituje WS `ikaros:new-message` do `user:{recipientId}` (`ikaros-messages.gateway.ts:37`) → badge a feed se aktualizují bez refreshe.
  - **Systémové zprávy** generuje `system-events.listener` (schválení vstupu do světa `world.access.approved`, přiřazení postavy `world.character.assigned`) a service modulů (schválení/vrácení článku, galerie, diskuze posílají poštu autorovi/adminům).
  - **Web push (D-NEW-INV-PUSH, 2026-07-12):** nová zpráva pošty **pushuje příjemci** — kategorie `posta` (default **ZAP**, vypnutelná v profilu → Notifikace), titulek „Nová zpráva v Poště", body `odesílatel: předmět` (ořez 120), deep-link `url: '/ikaros/posta'`, `tag: posta-<conversationId>` (bubliny téhož vlákna se na zařízení slučují). Odesílatel push nedostává (guard `recipientId !== sender.id`). Fire-and-forget. (`ikaros-messages.service.ts:114-133`.) Dřív jen WS + badge — zavřená appka nic nedostala.
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
  - Patička: **přepínač web push** na tomto zařízení (`PushToggle`); **výběr typů** notifikací je v profilu (sekce „Notifikace", 15.9).
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
- **Co reálně pushuje (15.9 — každý push nese kategorii a respektuje `notificationPreferences` příjemce):**
  - **Chat ve světě** → `notifyUsers(..., 'worldChat')`, `tag`/`topic = chat-{channelId}` (kap. 13; viz [spec-13.2c-push-delivery](../arch/phase-13/spec-13.2c-push-delivery.md)).
  - **Akce ve světě** → vytvoření hry `notifyUsers(..., 'worldEvent')` + připomínky **24 h a 1 h** před začátkem (cron à 15 min, `game-event-reminder.job.ts`, kap. 15).
  - **Vlastní diskuse** → nový příspěvek **autorovi diskuse** `notify(..., 'ownDiscussion')` s `url` na diskusi (kap. 04).
  - **Vlastní článek / galerie** → schválení / zamítnutí / nové hodnocení **autorovi** `notify(..., 'ownContent')` s `url` (kap. 04).
  - **Novinky světa** → členům světa (mimo Zadatele) `notifyUsers(..., 'worldNews')` (kap. 13).
  - **Novinky Ikarosu** → `notifyAll(..., 'ikarosNews')` s `url: '/ikaros/novinky'` (deep-link na stránku novinek — detail route neexistuje; D-NEW-INV-PUSH) (kap. 04).
  - **Putyka** → `notifyAll(..., 'hospoda', { excludeUserId })`, **opt-in** (kategorie default VYP); `url: '/chat'`, odesílatel bez push (D-NEW-INV-PUSH).
  - **Pošta** → příjemci `notify(..., 'posta')` s `url: '/ikaros/posta'` + `tag: posta-<conversationId>`; default ZAP (D-NEW-INV-PUSH, 2026-07-12 — viz sekce Pošta výše).
  - **Chat správy platformy** → členům kanálu `notifyUsers(..., 'adminChat')` s `url: '/admin/chat'` + `tag: admin-chat-<channelId>` (20.5; jen tým správy).
  - Filtr příjemců dle preferencí běží v `PushService` (`filterByCategory`/`userWantsCategory` → `wantsPush`); `undefined` pole = default z kódu. Viz funkce „Nastavení notifikací" níže.
- **Doručovací politika (13.2c-push-delivery, 2026-06-19):** každý push nese **TTL** (default 4 h, konst. `DEFAULT_TTL_SECONDS`) — provider po vypršení notifikaci zahodí, takže offline telefon už nedostane **dny staré** zprávy. Validní **`topic`** (server-side collapse, RFC 8030) navíc nahradí předchozí nedoručenou ve frontě → jen poslední, ne hromada. (`push.service.ts` `sendToSubscriptions`.)
- **Hranice / co neumí:**
  - **Granularita jen per-typ, ne per-svět** — nelze ztlumit konkrétní svět (plánováno jako pozdější rozšíření).
  - iOS vyžaduje PWA přidanou na plochu (standardní omezení Safari pro Web Push) — 15.1 install hint to usnadňuje instrukcí „Sdílet → Přidat na plochu" (viz blok „Instalace na plochu (PWA)" níže).
- **Zvláštnosti:**
  - Neplatné subscription (HTTP 404/410) se automaticky promazávají (`push.service.ts`). VAPID klíče z env (`VAPID_SUBJECT/PUBLIC_KEY/PRIVATE_KEY`); chybí-li, modul při startu spadne na `!` non-null assertu.
  - **Úklid rotovaných odběrů (13.2c-push-delivery):** SW má `pushsubscriptionchange` handler → re-subscribe (auth není v SW dostupný, BE origin dostává query `?api=` z `main.tsx`). Nahlášení nového endpointu řeší FE `usePush` autentizovaně — na mountu porovná endpoint s `localStorage['push:endpoint']`, při změně pošle `POST /push/subscribe` s `oldEndpoint` → BE starý smaže (`subscribe` v `push.service.ts`). Bez toho se mrtvé endpointy hromadily → **duplicitní push na jedno zařízení**.
- **Stav:** 🚧 — infrastruktura funkční (subscribe/unsubscribe/SW/cleanup, TTL/topic dedup, rotace odběru), **15.9** doplnilo per-typ předvolby + filtr příjemců, **D-NEW-INV-PUSH (2026-07-12)** doplnil deep-link `url` do broadcast payloadů (novinky Ikarosu, Putyka), push pošty a exclude odesílatele; zbývá ověřit doručení na reálném telefonu.
- **Kód:** FE `src/features/notifications/api/usePush.ts`, `components/PushToggle.tsx`, `PushDevicesList.tsx`, `public/sw.js`, `src/app/main.tsx`. BE `backend/src/modules/push/push.controller.ts`, `push.service.ts`, `dto/subscribe.dto.ts`; chat push `backend/src/modules/chat/chat.service.ts`.

### Nastavení notifikací (preference) — 15.9
- **Co to je:** Per-uživatelské předvolby, **na co** chodí web push. Master vypínač + 9 kategorií. Filtr běží na BE před každým odesláním push.
- **Kde:** sekce **„Notifikace"** v profilu (`/ikaros/profil`, `NotificationPreferencesSection`, mezi Soukromím a Bezpečností).
- **Kdo:** přihlášený, jen vlastní preference (`PATCH /users/me/notification-preferences`, `JwtAuthGuard`). Bez role-gate.
- **Co jde dělat:**
  - **Master `pushEnabled`** (default ZAP) — vypnutím se ztlumí veškerý push bez ohledu na kategorie.
  - **9 kategorií** v 5 skupinách (default ZAP kromě Putyky): *Můj svět* — `worldChat`, `worldEvent`; *Můj obsah* — `ownDiscussion`, `ownContent`; *Novinky* — `worldNews`, `ikarosNews`; *Komunita* — `posta` (default ZAP; D-NEW-INV-PUSH 2026-07-12), `hospoda` (default **VYP**); *Správa platformy* — `adminChat` (default ZAP; 20.5 — přepínač vidí každý, push ale chodí jen členům admin chatu).
  - **Per-device přepínač** (reuse `usePush`) — povolení push na tomto zařízení (hardware brána, nezávislá na kategoriích).
- **Hranice / co neumí:**
  - **Řídí jen push bublinu**, ne obsah notifikačního centra (zvoneček ukazuje vše vždy).
  - **Granularita per-typ, ne per-svět** — nelze ztlumit konkrétní svět.
  - Hodnocení článku/galerie pushuje **za každé hodnocení** (žádný throttle/souhrn — možné pozdější rozšíření).
- **Zvláštnosti:**
  - **Dual-source defaulty** — kategorie/defaulty jsou na FE (`features/notifications/lib/notificationPreferences.ts`) i BE (`common/notifications/notification-preferences.ts`); při změně měň obě.
  - Defaulty se **neukládají do DB** — nenastavené pole zůstává `undefined`, default žije v kódu (`wantsPush`/`resolvePref`).
  - **Delta merge** na PATCH — pošle se jen měněné pole, ostatní zůstanou.
- **Stav:** ✅ (BE filtr + endpoint + FE sekce hotové, ověřeno jest+build; čeká BE restart pro nasazení).
- **Kód:** FE `src/features/profile/components/NotificationPreferencesSection.tsx`, `api/useNotificationPreferences.ts`, `features/notifications/lib/notificationPreferences.ts`. BE `common/notifications/notification-preferences.ts`, `modules/push/push.service.ts` (`filterByCategory`), `modules/users/users.service.ts` (`updateNotificationPreferences`), `users.controller.ts`, `dto/update-notification-preferences.dto.ts`.

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
  - Globální chat (`/chat`, Camp): textová konverze v `MessageItem` (fallback `parseEmotes`) + emoji picker (`EmojiPickerPopover`, knihovna `frimousse`).
  - Custom obrázkové emoty: `features/world/chat` (autocomplete `EmoteAutocomplete`, render `renderChatContent`, API `useGlobalEmotes`/`useWorldEmotes`).
- **Kdo (použití):** každý člen příslušného chatu může emoty/emoji vkládat a vidět. Custom emoty čte člen světa (`emotes/:worldId` za `assertIsMember`); globální custom emoty (`emotes/global`) čte každý přihlášený.
- **Co jde dělat:**
  - V globálním chatu: psát emotikony (`:)`, `:D`, `:P`, …) → automaticky se vykreslí jako emoji; vybrat emoji z pickeru; dávat emoji **reakce** na zprávy.
  - V chatu světa: psát `:zkratka:` custom emote → vykreslí se jako `<img>` (obrázek); autocomplete při psaní.
  - **Klikací odkazy (20.6):** http(s) URL v textu se v OBOU chatech (globální Putyka/Camp i světový) automaticky převede na klikací odkaz (`target=_blank`, `rel=noopener noreferrer nofollow`). Jen `http(s)://` (ne `javascript:`/`data:` — XSS-safe, render přes React `<a>`, žádné `dangerouslySetInnerHTML`); sdílené `chat/lib/linkify.tsx` (global/admin přes `renderPlainChatContent`, world přes `renderChatContent` na plain segmentech mezi mentions).
- **Hranice / co neumí:**
  - **V globálním chatu/poště se custom OBRÁZKOVÉ emoty NEPOUŽÍVAJÍ** — `MessageItem` tam jede jen textovou konverzi (`emotes.ts`); modul `emotes` konzumuje výhradně `features/world/chat`.
  - **Pošta** nemá emote/emoji picker (čistý text/předmět).
  - Sada textových emotikonů je pevná (mapa v `chat/lib/emotes.ts`).
  - **Plná paleta pickeru závisí na cizí CDN** — `frimousse` si `emojibase-data` `fetch`uje z `cdn.jsdelivr.net`. Lokální český quick-pick (`czechEmoji.ts`, ~120 emoji + český fulltext) funguje nezávisle, plná paleta ne. Výpadek jsdelivr = paleta visí na „Načítám…". Self-host dat → **D-075**.
- **Zvláštnosti:** rozlišuj „emoji reakce" (toggle na zprávě, WS `chat:message:reaction`) vs. „emoty v textu". Globální custom emoty mají vlastní `emotes/global` endpoint a admin správu.
  - ⚠️ **Do 24.2 byla plná paleta v produkci rozbitá** — CSP `connect-src` neznala `cdn.jsdelivr.net`, takže fetch emoji dat enforce zablokovala. Nevšiml si toho nikdo, protože český quick-pick fungoval dál a picker vypadal funkčně; **částečně funkční UI nevyvolá hlášení**. Nalezeno až auditem nad buildem (`CH-125`) — v `src/` po té URL není stopa, skládá ji knihovna uvnitř `node_modules`.
- **Stav:** ✅ (globální chat textové; world custom obrázkové)
- **Správa emotů (admin):** vytváření/úprava/mazání custom emotů — **viz kapitola 08** (platformová správa). Globální: jen `Admin+` (`/emotes/global`, `assertGlobalCanManage`). Per-svět: `PJ`/`PomocnyPJ`+ (`/emotes/:worldId`, `assertWorldCanManage`).
- **Kód:** FE globální `src/features/chat/lib/emotes.ts`, `components/MessageItem.tsx`, `EmojiPickerPopover.tsx`; world custom `src/features/world/chat/emotes/`, `lib/renderChatContent.tsx`. BE `backend/src/modules/emotes/emotes.controller.ts`, `emotes.service.ts`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-PUSH) — **Broadcast push má deep-link.** `notifyAll` payloady nesou `url` (novinky Ikarosu `/ikaros/novinky`, Putyka `/chat`) + Putyka `excludeUserId` (odesílatel bez push na vlastní zprávu). (`ikaros-news.service.ts:135`, `global-chat.service.ts:459`)
2. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-PUSH) — **Pošta pushuje.** Nová zpráva → push příjemci, kategorie `posta` (default ZAP, toggle v profilu → Notifikace, skupina Komunita), `url: '/ikaros/posta'`, `tag` per vlákno, odesílatel excluded. (`ikaros-messages.service.ts:114-133`, `notification-preferences.ts`)
3. **Dva nezávislé „emote" systémy se snadno zamění.** Globální chat = textové emoji; svět = custom obrázkové. Sdílí UI termín „emoty", ale ne kód ani datový zdroj. V průvodci jasně oddělit, aby amatér nehledal v Putyce obrázkové emoty světa.
4. **1h TTL globálního chatu** není v UI nikde explicitně komunikováno — uživatel může být překvapen, že se historie „ztrácí". Vhodné zmínit v nápovědě.
5. **VAPID fail-fast.** Bez env klíčů push modul spadne na non-null assertu při startu (`push.service.ts:31`) — provozní závislost; ověřit, že produkce má klíče (dle MEMORY 3/3 OK).
6. **Push granularita jen per-typ, ne per-svět** (15.9) — uživatel nemůže ztlumit konkrétní svět, jen celou kategorii. Plánováno jako pozdější rozšíření.

> **Vyřešeno 15.9 (smazáno z výše):** globální chat už nepushuje každou zprávu všem (Putyka opt-in, Camp push zrušen, exclude přes preference); per-typ předvolby existují (sekce „Nastavení notifikací").
