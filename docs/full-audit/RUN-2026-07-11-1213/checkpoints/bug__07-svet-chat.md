# Checkpoint — bug / 07-svet-chat

**Oblast:** `docs/bug-plan/07-svet-chat.md` (chat / kostky / zvuky / emoty)
**Styl:** bug (registr `docs/bug-audit.md`, prefix N-; RUN prefix `N-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L1–L2 (statické čtení + FE↔BE kontrakt/mapper cross-check). Testy (M3) nespuštěny — baseline BE jest zelený dle registru; kritické cesty zhardenované předchozími koly.
**Cílová L:** L2–L3.

---

## Nové nálezy (🆕)

### N-RUN-07-01 — [F. Emoty / SC-67] Emote `tags` se při vytvoření zahazují (field-drop v repo `create`)
- **Kde:** `backend/src/modules/emotes/repositories/custom-emotes.repository.ts:69-81` (`create`) — `this.model.create({ worldId, name, shortcode, imageId, imageUrl, createdBy })` **neobsahuje `tags`**. Navíc `updateById` (`:83-97`) má typ `Pick<CustomEmote,'name'|'shortcode'|'imageId'|'imageUrl'>` → `tags` nejde ani updatnout; service `applyUpdate` (`emotes.service.ts:202-208`) je taky nezahrnuje.
- **Důkaz:** pole `tags` je plnohodnotné napříč vrstvami: schema `custom-emote.schema.ts:28-30` (`@Prop({type:[String],default:[]})`), DTO `create-emote.dto.ts:31-37` (validované, max 10), interface `custom-emote.interface.ts:12`, service `create`/`createGlobal`/`copy` všechny předávají `tags: dto.tags ?? []` / `emote.tags ?? []`, FE typ `emotes/lib/types.ts:21,31` a FE `EmoteGrid.tsx:33,40` z tagů staví filtrační chipy. Jediné `create` v repo je zahodí → v DB vždy `[]`. (Srovnej `sounds.repository.ts:86` `create(data)` = spread → tagy uloží; emote repo je jediný s explicitním výčtem polí.)
- **Dopad:** 🟡 Feature „kategorie/tagy emotů" je end-to-end mrtvá — žádný emote nikdy nemůže mít neprázdné `tags` (create dropne, update neumí, copy kopíruje z už-prázdného). Filtr v admin gridu se proto nikdy nezobrazí. Bez bezpečnostního/data-loss dopadu na uživatelský obsah.
- **Návrh:** do `MongoCustomEmotesRepository.create` doplnit `tags: data.tags ?? []`; rozšířit `updateById` Pick + service `applyUpdate` whitelist o `tags` (a DTO update už `tags` podporuje? ověřit `update-emote.dto.ts`). Regresní test na repo (custom-emotes repo spec dnes chybí → gap).
- **L:** L2 (kontrakt schema↔DTO↔service↔repo↔FE ověřen čtením). Klasifikace: 🆕 (není v `bug-audit.md` ani `dluhy.md`).

### N-RUN-07-02 — [B. Zprávy / SC-31, SC-23] Unread badge počítá i cizí neviditelné whispery
- **Kde:** `backend/src/modules/chat/repositories/chat-message.repository.ts:136-145` (`countAfter`) + `:151-165` (`countMentionsAfter`) — počítají všechny non-deleted zprávy po `lastReadId` v kanálu **bez `visibleTo` filtru**. Souběžně `chat.service.ts:1796-1815` (`broadcastUnreadUpdate`) posílá live `count:-1` increment všem členům s **kanálovým** přístupem (`hasAccessGivenMembership`), volá se z `sendMessage:1460` i pro whisper.
- **Důkaz:** doručení zprávy whisperem je správně omezené na `visibleTo` (gateway `chat.gateway.ts:254-262` emituje jen do `user:{id}` roomů příjemců). Ale unread cesta je asymetrická: A šeptne B v `all` kanálu → C/D/E (kanálový přístup, ne příjemci) dostanou live badge increment a při reloadu jim `countAfter` tu whisper taky započítá (visibleTo ignoruje). N-19 řešil jen kanálovou úroveň (Čtenář vs Zadatel), whisper úroveň zůstává.
- **Dopad:** 🟡 Nafouknutý unread badge + slabý metadata signál („v kanálu proběhlo něco skrytého") pro ne-příjemce whisperu; `countMentionsAfter` navíc bumpne mentionCount i uživateli zmíněnému (`@C`) ve whisperu, který nevidí. Jen počet (číslo), NE obsah → není content-leak. Po otevření kanálu (markAsRead) se badge srovná.
- **Návrh:** `countAfter`/`countMentionsAfter` přidat stejný `$or [visibleTo neexistuje/prázdné/obsahuje userId]` filtr jako `findByChannelId` (visibilityUserId) a `findFeed`; `broadcastUnreadUpdate` u whisper zpráv (`channel` + `message.visibleTo`) omezit increment jen na `visibleTo` příjemce.
- **L:** L1–L2 (chování ověřeno čtením; confidence vysoká na chování, střední zda se řeší vs. akceptuje jako kosmetika). Klasifikace: 🆕.

---

## Prošlé / ověřené OK (bez nového nálezu)

**BE chat (zhardenováno předchozími koly, potvrzeno čtením):**
- `chat.gateway.ts` — N-9 opraveno: `sound:play`/`sound:stop` i `chat:channel:join` berou identitu z ověřeného `client.data.userId` (JWT handshake), ne z payloadu (W-3/N-9). Sound gate `>= PomocnyPJ` (SC-57). Presence leave multi-tab safe (SC-40). Whisper echo jen do `user:{id}` (SC-24). Channel/group/reorder eventy leak-safe `{worldId}` signál (W-4/FIX-B, SC-12/13).
- `chat.service.ts` — N-19 opraveno (`broadcastUnreadUpdate` používá `hasAccessGivenMembership`, řádek 1808), N-20 opraveno (`syncLinkedChannelMembers` respektuje `isStaff`, ř. 2217). `hasChannelAccess`/`canJoinChannelRoom` (R-04/FIX-1B) OK. Mentions 2-fázový resolve (SC-21), `@all`/`@here` přes `resolveChannelRecipients` (SC-22). Idempotentní nonce (SC-18). Edit/delete gaty vč. dice guard (SC-25/26). `lastMessagePreview` attachment-only → `📎 Příloha` (SC-29). `markAsRead` → `count:0` event (SC-32). Appearance partial update + supporter dice gate (SC-76/77/19.4). Reactions CAS toggle (SC-30). Presence role autoritativně z membershipu (SC-39/42).
- `chat-presence.service.ts` — in-memory dedup dle userId, čistí prázdné mapy (SC-42). Multi-instance dluh známý (`D-NEW-chat-presence-scale`).
- `sounds.service.ts` + controllery — member/manage gaty (assertIsMember/assertCanManageWorld, R-RUN-01), dup check nominace (SC-64), approve/reject jen pending (SC-65). `create` repo spread → tagy uloží.
- `emotes.service.ts` + `emotes.controller.ts` — limity 100/200 (SC-67), collision check, image-pair (SC-68), copy = gate na OBA světy (`emotes.controller.ts:158-159`, SC-69/74), orphan cleanup (UM-11). `emotes.gateway.ts` leak-safe (strip `createdBy`, FIX-B), world/global eventy správně (SC-70).
- Repository mappery: `chat-group.repository.ts:50-62` (color/iconKey/linkedWorldGroup/imageUrl — SC-04 ✓), `chat-channel.repository.ts:216-244` (imageUrl/lastMessagePreview/type/combatants — SC-05 ✓), `sounds.repository.ts:131` (tags/proposedBy — ✓). Jen emote repo `create` dropuje (viz N-RUN-07-01).

**FE:**
- `dice/lib/rollEngine.ts` — `secureRandomInt` rejection sampling proti modulo bias (SC-54), `rollFate` (SC-46), `rollGenericDice('d100')` 00+0→100 (SC-47), `rollPool`/`rollMixedDice` faceTypes délka (SC-55). `dicePayload.ts` — `buildFatePayload` modifier→total, overpressure z total (SC-49), `parseDicePayload` defensive (type/faces/sum/total, SC-50). Vše korektní.
- `useOptimisticSend.ts` — optimistic pending + nonce swap (SC-19/20). **SC-56 je OPRAVENÉ** (FIX-6, ř. 160-164: retry propaguje `dicePayload`/`diceSkin`/`mapRef`) — oblastní doc + „Známá rizika" SC-56 jsou STALE.
- `emotes/api/useWorldEmotes.ts:37,57` — filtr `emote.worldId === worldId` (SC-71 ✓), reconnect refetch (FIX-5). `useGlobalEmotes.ts` — global eventy (SC-70 ✓).

---

## Nesrovnalosti v doc (stale, ne bug)
- **SC-56** (dice retry drops payload) — v oblastním doc i „Známá rizika" veden jako otevřené riziko, ale kód opraven `useOptimisticSend.ts:160-164` (FIX-6). Doporučeno přeznačit ✅.
- **SC-58 / N-9** (sound userId spoofing) — „Známá rizika" SC-58 stale; opraveno (`client.data.userId`).

## PROOF-REQUESTy (pro proof vrstvy / follow-up)
- **+db/+e2e:** vytvořit emote s `tags:['x']` → GET vrátí `tags:[]` (potvrzení N-RUN-07-01). Chybí `custom-emotes.repository.spec.ts`.
- **+e2e:** whisper A→B v `all` kanálu → ověřit, že `getUnreadCounts` pro C (ne-příjemce) NEzapočítá whisper (dnes započítá — N-RUN-07-02).
- **M3:** spustit `emotes.service.spec.ts`, `sounds.service.spec.ts`, `chat.service.spec.ts`, `chat.gateway.spec.ts`, `rollEngine.spec.ts` — ověřit zelené na HEAD (nebyly spuštěny v tomto běhu).

## Co jsem NEprošel do hloubky (kandidáti na dodělání)
- FE komponenty: `WorldChatRoom`, `ChannelView`, `ChannelComposer`, `MentionAutocomplete`, `ChatSearchModal`, `SoundNowPlayingBanner`, per-system rail bestie panely (jen `[human]`/render body SC-34/36/45/53/60/72/73). `youtubeId.ts` (SC-62) nečteno.
- `scheduled-messages.job.ts` — potvrzuje známý `D-SEC-GAP` (findDue→setStatus bez atomického claimu, double-send při 2 replikách) — NEhlásím jako nové.
- FE typy `chat/lib/types.ts` (SC-06/07) — N-21 už řešeno; plný diff proti BE interface neproveden.
