# 13 — Komunikace světa

Hloubková, kódem ověřená inventura chatu a novinek světa. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.

**Pozor na názvosloví (FE ↔ BE inverze, viz `feedback_chat_naming`):**
- FE **„kanál"** = BE `ChatGroup` (rozbalovací složka v sidebaru).
- FE **„konverzace"** = BE `ChatChannel` (samotné vlákno zpráv).

Role: world Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ; platform Superadmin(1)/Admin(2) (nižší = vyšší).

---

## Chat světa (`WorldChatPage` / `WorldChatRoom`)

### Přehled
- **Co to je:** stránka `/svet/:slug/chat`. Orchestrátor `WorldChatRoom` = sidebar (kanály+konverzace) + okno konverzace (`ChannelView`) + panel Přítomní (`ChannelMemberPanel`, PJ-only).
- **Kde:** FE `pages/WorldChatPage.tsx` → `chat/components/WorldChatRoom.tsx`. BE modul `modules/chat` (controller `worlds/:worldId/chat`, service, gateway).
- **Kdo (FE):** route `memberOnly(p(WorldChatPage))` — Čtenář+. **Kdo (BE):** celý controller `@UseGuards(JwtAuthGuard)`; čtení struktury navíc přes world-level bránu `assertCanViewWorldChat` (privátní svět → jen člen/Admin, jinak 403 friendly, R-09b — `chat.service.ts:205-226`).
- **Stav:** ✅
- **Kód:** `WorldChatRoom.tsx`, `chat.controller.ts`, `chat.service.ts`.

### Kanály a konverzace (struktura, vytváření)
- **Výchozí seed (idempotentní):** každý svět dostane kanál **Globální** (s konverzací „globální", `accessMode: 'all'`) a prázdný kanál **Postavy**. Za každou družinu (`customGroups`) vznikne kanál `members` jen pro členy družiny + vedení. Seeduje se lazy při prvním otevření chatu i boot backfillem (`chat.service.ts:1445-1566`).
- **Vytváření / správa:**
  - Skupina (kanál): `POST /…/chat/groups`, úprava `PATCH /…/groups/:id`, smazání `DELETE`.
  - Konverzace: `POST /…/groups/:gid/channels`, úprava `PATCH /…/channels/:id` (vč. přesunu mezi kanály přes `groupId` — cíl musí být ve stejném světě), smazání `DELETE`.
  - Reorder: `POST /…/groups/reorder` a `POST /…/channels/reorder` (bulk; konverzace jen v rámci jednoho kanálu, `MIXED_GROUPS` jinak).
- **Kdo (FE):** tvorba/úprava/reorder a panel Přítomní jen pro `isManager` = world role **PomocnyPJ+** (`WorldChatRoom.tsx:55-56`). **Kdo (BE):** všechny správní operace přes `canManageChat` = **PomocnyPJ+ / platform Admin+** (`chat.service.ts:96-107`).
- **accessMode konverzace:** `all` (globální — Hráč+; Čtenář/Žadatel nevidí), `members` (jen `allowedMemberIds`), nebo per-role (`allowedRoles`). Logika `hasAccessGivenMembership` (`chat.service.ts:165-177`).
- **Hranice:** Žadatel nevidí žádnou konverzaci. Cross-group drag konverzací není (jen přes edit `groupId`). Smazání konverzace soft-deletne zprávy.
- **Stav:** ✅
- **Kód:** FE `WorldChatRoom.tsx`, `components/ChannelSidebar.tsx`, `GroupDialog.tsx`, `ChannelDialog.tsx`; BE `chat.service.ts:359-594`.

### Přístup ke konverzaci (`hasChannelAccess`, PJ+ bypass)
- **Co to je:** kontrola přístupu pro čtení/odeslání i pro WS join.
- **Jak (ověřeno):**
  - `members` konverzace: přístup má kdo je v `allowedMemberIds`, **NEBO** vedení (PomocnyPJ+/Admin) přes `isWorldManagerByUserId` — PJ tedy vidí a píše i do soukromých 1:1, i když v `allowedMemberIds` není (`chat.service.ts:126-143`).
  - `all`/role konverzace: dle membershipu (`hasAccessGivenMembership`).
  - WS `room:join chat:{id}` gatuje `canJoinChannelRoom` (R-04) — bez něj by REST byl zamčený, ale WS otevřený (`chat.service.ts:155-163`).
- **Whispery (visibleTo):** zprávy s `visibleTo` vidí jen adresáti; **PomocnyPJ+ vidí všechny whispery** (`getMessages`, `chat.service.ts:784-791`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:96-177`, `:754-794`.

### Kanál „Postavy" (auto soukromé konverzace vázané na hráče)
- **Co to je:** kanál Postavy obsahuje per-hráč **soukromou** konverzaci (`accessMode: 'members'`, `type: 'character'`, `linkedMemberUserId = userId`), vázanou na HRÁČE (ne na konkrétní postavu).
- **Jak (ověřeno):** konverzace vzniká automaticky při přidělení postavy (`@OnEvent('world.character.assigned')` → `ensureCharacterChannel`), idempotentně per userId; existující se přejmenuje na jméno postavy. Backfill pro starší přiřazení při bootu. Legacy veřejnou konverzaci „hráči" cleanup smaže (jen prázdnou) — `chat.service.ts:1741-1816`, `:1477-1496`.
- **Avatar konverzace = portrét postavy:** ikona character konverzace je read-time override z `imageUrl` postavy přihlášeného hráče (přes `membership.characterPath` → adresář), single source of truth (6.8b, `chat.service.ts:268-298`).
- **Přístup:** člen (vlastník) + vedení (PJ+ přes `hasChannelAccess`, není v `allowedMemberIds`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:1462-1469`, `:1768-1816`.

### Per-membership prefs sidebaru (pořadí / sbalení)
- **Co to je:** osobní stav chat sidebaru per hráč — pořadí kanálů/konverzací, sbalené skupiny, pořadí připnutých, poslední aktivní konverzace (cross-device).
- **Jak (ověřeno):** FE `useChatPrefs` čte z `useMyWorlds().membership`, zapisuje **optimisticky do RQ cache** + **debounced (400 ms) PATCH** `…/chat/my-prefs`; unmount flushne pending. Server zapisuje jen do requesterova membershipu (`updateMyChatPrefs`, vyžaduje členství) — `useChatPrefs.ts`, `chat.service.ts:315-357`.
- **Pole:** `chatGroupOrder`, `chatChannelOrder` (mapa groupId→ids), `chatExpandedGroups`, `chatPinnedOrder`, `chatLastActiveChannelId`.
- **Hranice:** cizí membership měnit nelze (bere se `user.id` z JWT). Default „první kanál" čeká na server seed, aby nepřebil cross-device poslední konverzaci.
- **Stav:** ✅
- **Kód:** FE `chat/api/useChatPrefs.ts`; BE `chat.controller.ts:183-195`, `chat.service.ts:315`.

### PJ persona render (vedení → „PJ")
- **Co to je:** vedení světa (role ≥ PomocnyPJ) vystupuje v chatu (i v hlavičce světa) pod personou místo přihlašovacího jména. Politiku určuje `WorldSettings.pjChatPersona.mode`.
- **Režimy:**
  - `unified` (default) — všichni z vedení jako jedno anonymní „PJ" + 1 sdílený avatar (vlastní jméno persony max 40 znaků, prázdné → „PJ").
  - `individual` — každý člen vedení pod svou rolí („PJ" / „Pomocný PJ") + **vlastním avatarem** (`membership.pjPersonaAvatarUrl`, fallback účet), takže příjemce pozná, kdo píše.
- **Render-time (klíčové):** aplikuje se **při vykreslení** podle role odesílatele → projeví se **zpětně i na historických** zprávách a je živé (`makePjDisplayResolver`, `chat/lib/pjPersona.ts`). Priorita: NPC override (`overrideName`) > PJ persona > membership.
- **Nastavení (FE):** Nastavení světa → tab „PJ v chatu" (`PjChatTab`): přepínač režimu + sdílená persona = **PJ-only** (`PjChatPersonaEditor`, ukládá `PUT /settings`); „Můj obrázek vedení" = **PomocnyPJ+ self-service** (`MyPjAvatarEditor`, `PUT /…/members/me/pj-avatar`).
- **Kdo (BE):** persona v settings → `canAdminWorld` (PJ+); vlastní avatar → `updateMyPjAvatar` vyžaduje membership PomocnyPJ+ (`worlds.service.ts:1490-1519`).
- **Hranice:** když PJ píše „za bytost" (NPC override mód), zůstává tou bytostí (override vyhraje). Nečlen veřejného světa `pjChatPersona` nedostane (nulováno v `toPublicSettings`).
- **Stav:** ✅
- **Kód:** FE `chat/lib/pjPersona.ts`, `tabs/PjChatTab.tsx`, `components/PjChatPersonaEditor.tsx`; BE DTO `update-world-settings.dto.ts:79-101`.

### Portrét postavy jako avatar
- **Co to je:** v chatu i v hlavičce světa se jako avatar člena používá obrázek jeho **přiřazené postavy** ve světě (world-scoped), ne globální účet.
- **Jak:** ikona character konverzace „Postavy" = portrét postavy (read-time enrich, viz výše). V hlavičce světa persona slot bere postavu/vedení/účet přes `resolvePersona` (`WorldLayout.tsx:425-436`). Odeslaná zpráva nese `senderName = membership.characterPath || username` a `senderAvatarUrl = membership.avatarUrl` (`chat.service.ts:957-959`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:268-298`, `:957-959`; `WorldLayout/resolvePersona.ts`.

### Vazba skupina ↔ chat kanál (znak skupiny)
- **Co to je:** světová družina (`customGroups`) má linkovaný chat kanál (`ChatGroup.linkedWorldGroup`); znak družiny (`WorldSettings.groupImages`) se zrcadlí do ikony tohoto kanálu.
- **Jak (ověřeno):** `getGroupsWithChannels` čte `groupImages` a read-time přepíše `group.imageUrl` emblémem (single source of truth, znak vždy vyhraje nad ručně nastavenou chat ikonou) — `chat.service.ts:263-307`. Členství v linkovaném kanálu se dorovnává podle `member.group` (`createWorldGroupChannel`, `chat.service.ts:1502-1532`).
- **Nastavení znaku:** Nastavení → Členové → Skupiny a barvy (`GroupColorEditor`, ukládá `groupImages`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:263-307`, `:1502-1554`.

### Další funkce chatu (ověřeno v controlleru/service)
- Zprávy: cursor paginace (`GET …/channels/:id/messages`), odeslání, editace, smazání (soft / PJ hard), emoji reakce (`PUT …/reactions/:emoji`).
- **Mentions:** `@username`, `@all`, `@here`, i `@character-slug` (dvoukrokový resolve) — `chat.service.ts:967-1010`.
- **Vzhled mé zprávy:** per-svět barva + font + velikost (`GET/PATCH …/appearance`, z `WorldMembership`), server-side fill při neposlání (`chat.service.ts:961-965`).
- **Přílohy:** `POST …/upload` (max 10 MB, member-only guard přes `getMembershipAppearance`).
- **NPC mód:** `overrideName/overrideAvatarUrl/overridePageSlug` jen pro `canManageChat` (PomocnyPJ+) — `chat.service.ts:925-936`.
- **Hledání:** `GET …/search` (substring v zprávách světa).
- **Custom emoty:** per-svět + globální (mergeEmoteSets), správa v tabu Emoty světa.
- **Souhrn chatů (feed):** `getFeed` agreguje zprávy napříč všemi mými světy, access-safe (`chat.service.ts:810-885`).
- **Idempotence:** `clientNonce` dedupe při retry po WS dropu.

### Real-time (WebSocket)
- **Rooms:** `world:{id}` joinuje **jen** `WorldLayout` přes `useWorldSocket` (jediný vlastník celého světa, drží i reconnect re-join — W-7/W-9). `WorldChatRoom` room nedrží, jen poslouchá structure eventy (`WorldChatRoom.tsx:164-188`).
- **Zprávy:** do `chat:{channelId}` roomu join přes `chat:channel:join` (gatuje access). Eventy: `chat:message`, `chat:message:updated`, `chat:message:deleted`, `chat:presence`, `chat:typing`, `chat:sound:playing/stopped`, `chat:unread` (do `user:{id}`), `chat:feed:bump` (`chat.gateway.ts`).
- **Structure:** `chat:channel:created/updated/deleted`, `chat:group:created/updated/deleted`, `chat:groups:reordered`, `chat:channels:reordered` → FE invalidate groups query.
- **Whisper zprávy** se emitují do `user:{id}` roomů adresátů (ne do channel roomu) — `chat.gateway.ts:241`.
- **Push notifikace:** chat notifikace chodí na telefon přes web-push (notifyUsers), deep-link `?konverzace={channelId}` vybere konverzaci (adjustment-during-render) a uloží jako poslední aktivní (`WorldChatRoom.tsx:61-162`).
- **Deep-link na zprávu (13.2a):** `?zprava={messageId}` (z notifikačního feedu „Chaty") → po otevření konverzace `MessageList` na zprávu doscrolluje + zvýrazní (reuse `handleJump` skoku z citace). Předává se jen konverzaci, na kterou link mířil (`active.id === lastDeepLink`); zpráva mimo načtené okno = no-op. Param se po použití uklidí z URL.

---

## Novinky světa (`WorldNewsPage`)

### Přehled
- **Co to je:** stránka `/svet/:slug/novinky` — veřejná oznámení světa (aktivní) + archiv (pro správce). Karty `WorldNewsCard`, stránkování po 10.
- **Kde:** FE `pages/WorldNewsPage/WorldNewsPage.tsx`, editor `WorldNewsEditorModal`. BE modul `modules/world-news` (controller `world-news`, service).
- **Kdo (FE):** route `memberOnly(p(WorldNewsPage))` — Čtenář+. Správa (tvorba/edit/archiv/mazání + tab Archiv) jen `canManage` = global Admin+ **nebo** world role **PomocnyPJ+** (`WorldNewsPage.tsx:37-40`).
- **Stav:** ✅
- **Kód:** FE `WorldNewsPage.tsx`; BE `world-news.controller.ts`, `world-news.service.ts`.

### Kdo publikuje / viditelnost
- **Čtení (`scope=active`):** veřejné — `GET /world-news` má `OptionalJwtAuthGuard`, aktivní novinky vidí kdokoli (i anonym), `assertCanReadScope` propustí active bez kontroly (`world-news.service.ts:256-268`).
- **Archiv (`scope=archived`/`all`):** vyžaduje přihlášení + write oprávnění (PomocnyPJ+ / Admin).
- **Zápis (create/update/delete/archive/unarchive):** `assertCanWrite` (`world-news.service.ts:278-314`):
  - platform Admin/Superadmin vždy;
  - `worldId === null` (globální novinka) → **jen** Admin/Superadmin;
  - `worldId !== null` → Admin/Sa **nebo** world membership **PomocnyPJ+**.
  - Anti-leak: neexistující svět → 403 (ne 404).
- **`worldId` je immutable** — update s worldId v body → 400 (`WORLD_NEWS_WORLD_ID_IMMUTABLE`). Pro změnu scope smaž a vytvoř novou.
- **`createdBy`** je interní audit field, nikdy se nevrací v API (`toPublic` ho stripuje, `world-news.controller.ts:29-37`).
- **Globální novinky v UI světa:** PJ světa je needituje — FE `canManage && (isGlobalAdmin || news.worldId !== null)` (`WorldNewsPage.tsx:155-156`).
- **Stav:** ✅
- **Kód:** FE `WorldNewsPage.tsx`; BE `world-news.service.ts:256-314`.

### Pole novinky / co jde nastavit
DTO `create-world-news.dto.ts`: `title` (≤200), `content` (≤10000), `date` (ISO UTC), `type` (`info` | `alert` | `system`), `link` (URL s protokolem) nebo interní `linkPageSlug` (priorita), hero obrázek (`imageUrl` + focal X/Y + zoom 25–400 + fit cover/contain), fantasy datum (`calendarConfigId` + `calendarDate` = FantasyDate). Archivace přes `POST /:id/archive` a `/unarchive` (idempotentní). Limit listu 200, default 50.

### Real-time + push (15.9)
- **Web push při vytvoření novinky světa** (`worldId !== null`) → členům světa mimo Zadatele, kategorie `worldNews` (`world-news.service.ts` `notifyMembers`, fire-and-forget, respektuje `notificationPreferences`). Globální novinky (`worldId === null`) push negenerují — ty jdou přes „Novinky Ikarosu" (kap. 04/05). Viz „Nastavení notifikací" v kap. 05.
- BE emituje `world-news.changed` → `worlds.gateway` přemostí na WS `world:news:changed` do `world:{id}` roomu (leak-safe signál, globální novinka se neemituje) — `worlds.gateway.ts:51-58`.
- FE: listener v `useWorldSocket` (na úrovni `WorldLayout`) invaliduje `['world-news', worldId]` → dashboard widget i stránka se obnoví bez čekání na staleTime (`useWorldSocket.ts:49-55`). Lokální mutace navíc invalidují přímo.
- **Stav:** ✅

### Kde se novinky ještě zobrazují
- Úvodní dashboard světa — sloupec Novinky (`WorldDashboard/columns/NewsColumn.tsx`, `WorldNewsCard`), spec 5.2.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Názvoslovná inverze FE↔BE je trvalý zdroj záměn.** FE „kanál" = BE `ChatGroup`, FE „konverzace" = BE `ChatChannel`. Dokumentace i UI to musí držet konzistentně; každý nový kód riskuje záměnu (`feedback_chat_naming`).
2. **PJ persona se aplikuje render-time na FE** (`makePjDisplayResolver`), zatímco uložené `senderName` ve zprávě zůstává jméno postavy/účtu. Externí konzumenti (feed, push payload, případný export) personu nemusí aplikovat → mimo chat UI může uniknout reálné jméno odesílatele vedení. K ověření v push/feed cestě.
3. **`type: 'system'` novinky** nemá v BE žádné zvláštní oprávnění oproti `info`/`alert` — vizuální rozlišení je čistě na FE kartě. Pokud má „system" znamenat „jen platforma", chybí gate (kdokoli PomocnyPJ+ ji může nastavit).
4. **Dvě čtecí cesty settings pro chat:** persona/groupImages čte interní `getSettings` (plný objekt), zatímco REST GET filtruje nečleny. Při přidání citlivého settings pole je nutné aktualizovat `toPublicSettings` (riziko leaku přes REST), jinak chat (interní) funguje, ale REST nečlenovi unikne. Field-drift checklist.
5. **`backfillCharacterChannels` + lazy seed běží při každém otevření chatu** (`getGroupsWithChannels` → `ensureWorldChat`). U světů s mnoha družinami/členy je to opakovaná práce na čtecí cestě — sledovat výkon (není to bug, ale potenciální zátěž).
6. **Globální emoty + per-svět emoty mají oddělené limity a zdroje** (`mergeEmoteSets`); kolize shortcode mezi globálním a světovým emote — ověřit, který vyhrává v merge (priorita v `mergeEmoteSets`).
