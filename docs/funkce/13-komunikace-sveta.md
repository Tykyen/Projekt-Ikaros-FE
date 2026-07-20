# 13 — Komunikace světa

Hloubková, kódem ověřená inventura chatu a novinek světa. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.

**Pozor na názvosloví (FE ↔ BE inverze, viz `feedback_chat_naming`):**
- FE **„kanál"** = BE `ChatGroup` (rozbalovací složka v sidebaru).
- FE **„konverzace"** = BE `ChatChannel` (samotné vlákno zpráv).

Role: world Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ; platform Superadmin(1)/Admin(2) (nižší = vyšší).

---

## Chat světa (`WorldChatPage` / `WorldChatRoom`)

### Přehled
- **Co to je:** stránka `/svet/:slug/chat`. Orchestrátor `WorldChatRoom` = sidebar (kanály+konverzace) + okno konverzace (`ChannelView`) + **kontextový pravý rail** (`ChatContextRail`: hráč = svůj deník · PJ = Přítomní + hledání NPC/bestie + načtené deníky/statbloky — viz „Deník v chatu" níže).
- **Kde:** FE `pages/WorldChatPage.tsx` → `chat/components/WorldChatRoom.tsx`. BE modul `modules/chat` (controller `worlds/:worldId/chat`, service, gateway).
- **Kdo (FE):** route `memberOnly(p(WorldChatPage))` — Čtenář+. **Kdo (BE):** celý controller `@UseGuards(JwtAuthGuard)`; čtení struktury navíc přes world-level bránu `assertCanViewWorldChat` (privátní svět → jen člen/Admin, jinak 403 friendly, R-09b — `chat.service.ts:246-268`).
- **Stav:** ✅
- **Kód:** `WorldChatRoom.tsx`, `chat.controller.ts`, `chat.service.ts`.

### Kanály a konverzace (struktura, vytváření)
- **Výchozí seed (idempotentní):** každý svět dostane kanál **Globální** (s konverzací „globální", `accessMode: 'all'`) a prázdný kanál **Postavy**. Za každou družinu (`customGroups`) vznikne kanál `members` jen pro členy družiny + vedení. Seeduje se lazy při prvním otevření chatu (jen když svět **nemá žádný kanál**) i boot backfillem (`seedDefaultGroups` `chat.service.ts:1995-2019`, `syncWorldGroupChannels` `:2088-2104`, `ensureWorldChat` `:2110-2116`).
- **Vytváření / správa:**
  - Skupina (kanál): `POST /…/chat/groups`, úprava `PATCH /…/groups/:id`, smazání `DELETE`.
  - Konverzace: `POST /…/groups/:gid/channels`, úprava `PATCH /…/channels/:id` (vč. přesunu mezi kanály přes `groupId` — cíl musí být ve stejném světě), smazání `DELETE`.
  - Reorder: `POST /…/groups/reorder` a `POST /…/channels/reorder` (bulk; konverzace jen v rámci jednoho kanálu, `MIXED_GROUPS` jinak).
- **Kdo (FE):** tvorba/úprava/reorder a panel Přítomní jen pro `isManager` = world role **PomocnyPJ+** nebo `world.elevated` (`WorldChatRoom.tsx:68-70`). **Kdo (BE):** všechny správní operace přes `canManageChat` = **PomocnyPJ+ / elevovaný platform Admin+** (`worldAdminBypass`, `chat.service.ts:129-140`).
- **accessMode konverzace:** `all` (globální — Hráč+; Čtenář/Žadatel nevidí), `members` (jen `allowedMemberIds`), nebo per-role (`allowedRoles`). Logika `hasAccessGivenMembership` (`chat.service.ts:206-217`).
- **Hranice:** Žadatel nevidí žádnou `all`/role konverzaci (`role === Zadatel` → false); u `members` rozhoduje **jen** `allowedMemberIds`, takže ručně přidaný Žadatel by tu konkrétní konverzaci viděl (`chat.service.ts:206-210`). Cross-group drag konverzací není (jen přes edit `groupId`). Smazání konverzace soft-deletne zprávy.
- **Stav:** ✅
- **Kód:** FE `WorldChatRoom.tsx`, `components/ChannelSidebar.tsx`, `GroupDialog.tsx`, `ChannelDialog.tsx`; BE `chat.service.ts:400-690`.

### Přístup ke konverzaci (`hasChannelAccess`, PJ+ bypass)
- **Co to je:** kontrola přístupu pro čtení/odeslání i pro WS join.
- **Jak (ověřeno):**
  - `members` konverzace: přístup má kdo je v `allowedMemberIds`, **NEBO** vedení (PomocnyPJ+/Admin) přes `isWorldManagerByUserId` — PJ tedy vidí a píše i do soukromých 1:1, i když v `allowedMemberIds` není (`chat.service.ts:161-177`).
  - `all`/role konverzace: dle membershipu (`hasAccessGivenMembership`).
  - WS `room:join chat:{id}` gatuje `canJoinChannelRoom` (R-04) — bez něj by REST byl zamčený, ale WS otevřený; socket bez identity (ani guest anon session) dostane `false` (FIX-1B, `chat.service.ts:196-204`).
- **Whispery (visibleTo):** zprávy s `visibleTo` vidí jen adresáti; **PomocnyPJ+ vidí všechny whispery** — filtr jde do Mongo query (`getMessages`, `chat.service.ts:1149-1160`), v hledání se filtruje po overfetchi (`searchMessages`, `:1086-1096`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:129-217`, `:1131-1169`.

### Kanál „Postavy" (auto soukromé konverzace vázané na hráče)
- **Co to je:** kanál Postavy obsahuje per-hráč **soukromou** konverzaci (`accessMode: 'members'`, `type: 'character'`, `linkedMemberUserId = userId`), vázanou na HRÁČE (ne na konkrétní postavu).
- **Jak (ověřeno):** konverzace vzniká automaticky při přidělení postavy (`@OnEvent('world.character.assigned')` → `ensureCharacterChannel`), idempotentně per userId; existující se přejmenuje na jméno postavy. Backfill pro starší přiřazení při bootu. Legacy veřejnou konverzaci „hráči" cleanup smaže (jen prázdnou) — `chat.service.ts:2291-2320`, `:2323-2376`, `:2027-2045`.
- **Avatar konverzace = portrét postavy:** ikona character konverzace je read-time override z `imageUrl` postavy přihlášeného hráče (přes `membership.characterPath` → adresář), single source of truth (6.8b, `chat.service.ts:309-338`).
- **Přístup:** člen (vlastník) + vedení (PJ+ přes `hasChannelAccess`, není v `allowedMemberIds`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:2007-2018` (prázdný kanál Postavy v seedu), `:2323-2376` (`ensureCharacterChannel`).

### Per-membership prefs sidebaru (pořadí / sbalení)
- **Co to je:** osobní stav chat sidebaru per hráč — pořadí kanálů/konverzací, sbalené skupiny, pořadí připnutých, poslední aktivní konverzace (cross-device).
- **Jak (ověřeno):** FE `useChatPrefs` čte z `useMyWorlds().membership`, zapisuje **optimisticky do RQ cache** + **debounced (400 ms) PATCH** `…/chat/my-prefs`; unmount flushne pending. Server zapisuje jen do requesterova membershipu (`updateMyChatPrefs`, vyžaduje členství) — `useChatPrefs.ts:17` (`DEBOUNCE_MS = 400`), `chat.service.ts:356-398`.
- **Pole:** `chatGroupOrder`, `chatChannelOrder` (mapa groupId→ids), `chatExpandedGroups`, `chatPinnedOrder`, `chatLastActiveChannelId`.
- **Hranice:** cizí membership měnit nelze (bere se `user.id` z JWT). Default „první kanál" čeká na server seed, aby nepřebil cross-device poslední konverzaci.
- **Stav:** ✅
- **Kód:** FE `chat/api/useChatPrefs.ts`; BE `chat.controller.ts:263-276`, `chat.service.ts:356`.

### PJ persona render (vedení → „PJ")
- **Co to je:** vedení světa (role ≥ PomocnyPJ) vystupuje v chatu (i v hlavičce světa) pod personou místo přihlašovacího jména. Politiku určuje `WorldSettings.pjChatPersona.mode`.
- **Režimy:**
  - `unified` (default) — všichni z vedení jako jedno anonymní „PJ" + 1 sdílený avatar (vlastní jméno persony max 40 znaků, prázdné → „PJ").
  - `individual` — každý člen vedení pod svou rolí („PJ" / „Pomocný PJ") + **vlastním avatarem** (`membership.pjPersonaAvatarUrl`, fallback účet), takže příjemce pozná, kdo píše.
- **Render-time (klíčové):** aplikuje se **při vykreslení** podle role odesílatele → projeví se **zpětně i na historických** zprávách a je živé (`makePjDisplayResolver`, `chat/lib/pjPersona.ts`). Priorita: NPC override (`overrideName`) > PJ persona > membership.
- **Nastavení (FE):** Nastavení světa → tab „PJ v chatu" (`PjChatTab`): přepínač režimu + sdílená persona = **PJ-only** (`PjChatPersonaEditor`, ukládá `PUT /settings`); „Můj obrázek vedení" = **PomocnyPJ+ self-service** (`MyPjAvatarEditor`, `PUT /…/members/me/pj-avatar`).
- **Kdo (BE):** persona v settings → `canAdminWorld` (PJ+); vlastní avatar → `updateMyPjAvatar` vyžaduje membership PomocnyPJ+ (`worlds.service.ts:2281-2310`).
- **Hranice:** když PJ píše „za bytost" (NPC override mód), zůstává tou bytostí (override vyhraje). Nečlen veřejného světa `pjChatPersona` nedostane (nulováno v `toPublicSettings`).
- **Stav:** ✅
- **Kód:** FE `chat/lib/pjPersona.ts`, `tabs/PjChatTab.tsx`, `components/PjChatPersonaEditor.tsx`; BE DTO `update-world-settings.dto.ts:79-101`.

### Portrét postavy jako avatar
- **Co to je:** v chatu i v hlavičce světa se jako avatar člena používá obrázek jeho **přiřazené postavy** ve světě (world-scoped), ne globální účet.
- **Jak:** ikona character konverzace „Postavy" = portrét postavy (read-time enrich, viz výše). V hlavičce světa persona slot bere postavu/vedení/účet přes `resolvePersona` (`WorldLayout.tsx:536-545`). Odeslaná zpráva nese `senderName = membership.characterPath || username` a `senderAvatarUrl = membership.avatarUrl` (`chat.service.ts:1376-1378`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:309-338`, `:1376-1378`; `WorldLayout/resolvePersona.ts`.

### Vazba skupina ↔ chat kanál (znak skupiny)
- **Co to je:** světová družina (`customGroups`) má linkovaný chat kanál (`ChatGroup.linkedWorldGroup`); znak družiny (`WorldSettings.groupImages`) se zrcadlí do ikony tohoto kanálu.
- **Jak (ověřeno):** `getGroupsWithChannels` čte `groupImages` a read-time přepíše `group.imageUrl` emblémem (single source of truth, znak vždy vyhraje nad ručně nastavenou chat ikonou) — `chat.service.ts:304-346`. Členství v linkovaném kanálu se dorovnává podle `member.group` (`createWorldGroupChannel`, `chat.service.ts:2052-2086`).
- **Nastavení znaku:** Nastavení → Členové → Skupiny a barvy (`GroupColorEditor`, ukládá `groupImages`).
- **Stav:** ✅
- **Kód:** `chat.service.ts:304-346`, `:2052-2104`.

### Hod kostkou — manuální picker (6.3)
- **Co to je:** tlačítko 🎲 v composeru konverzace (i v pravém docku taktické mapy) otevře popover „Hod kostkou" — rychlá volba kostky, hod → 3D overlay + zpráva do konverzace / log na mapě.
- **Kde:** FE `chat/dice/components/DicePickerPopover.tsx` (sdílený chat i mapa); roll engine `chat/dice/lib/rollEngine.ts`, payload `dicePayload.ts`, katalog `worldDiceCatalog.ts`.
- **Kdo:** každý člen, který vidí konverzaci, smí házet. Picker nabízí **jen kostky z whitelistu `World.dice`** (nastaví PJ při zakládání/editaci světa); prázdný whitelist → hráč vidí „PJ nedovolil kostky", PJ má CTA do nastavení.
- **Co jde dělat:** klik na dlaždici typu → okamžitý hod (volitelný popis + modifikátor v „Možnosti"); Pool… / Mixed… pro vícekostkové hody; vlastní skin/materiál kostek per-typ (`useDiceSkinMapping`).
- **Typy kostek (roll engine):** `fate` (4dF), `d4/d6/d8/d10/d12/d20`, `d100`, **`d6+`** (nafukovací k6 — exploding, sčítá hozené hodnoty), **`2d6+`** (otevřený 2k6 DrD+ — dvojice 2×6 → +1 a dál, 2×1 → −1 a dál, jinak prostý součet; výsledek i záporný), `pool-dN`, `mixed`. `d6+`/`2d6+` mají vlastní primitivy (`rollExplodingD6`/`rollExploding2d6`), které `rollGenericDice` dispatchne (jinak by `+` spadl na default k20).
- **Hranice / co neumí:** picker zobrazí jen typy z `World.dice` přeložené přes `KEY_ALIASES`+`DICE_CATALOG` (neznámé tiše vyfiltruje). `2d6`/`3d6` = statický součet → mapují se na bázovou `d6` dlaždici (ne samostatné chips); `d6+`/`2d6+` JSOU samostatné chips s vlastní mechanikou. Viditelnost hodů řídí `World.diceVisibility`.
- **Zvláštnosti:** sdílené jádro chat ↔ mapa (DiceBox3D lazy chunk). Hod je závazný výsledek z FE → 3D kostka dopadne na hodnotu (`payloadToNotation`, `@` syntax). Dice log rozepíše kaskádu; pro `2d6+` rozpis = „základ páru ± eskalace" (NE součet tváří — ten by lhal, eskalace je ±1 za pokračovací kostku). `getSkin('d6+'/'2d6+')` → default materiál (fallback, žádná nová skin rodina).
- **Herní integrita (GI, 2026-07-12):** RNG běží na klientu, ale server hod už **neukládá naslepo**. BE `sanitizeDicePayload` (`common/dice/dice-payload.validator.ts`) volaný z chatu i mapy u součtových typů **přepočítá `sum`/`total` z hozených kostek** (falšovaný `total` se zahodí), ověří meze kostek a odmítne nesmysl (`400 DICE_PAYLOAD_INVALID`). Systémové hody (2d6+/GURPS/CoC/pool-úspěchy) validují jen meze. **Nechytá:** opakované házení dokud nepadne „pěkný" výsledek (hobby provoz + moderující PJ) — viz dluh D-DICE-SERVER-RNG.
- **Stav:** ✅
- **Kód:** FE `chat/dice/components/DicePickerPopover.tsx`, `chat/dice/lib/{rollEngine,dicePayload,diceNotation,worldDiceCatalog}.ts`; mapa `tactical-map/components/dice/DiceLogPanel.tsx`, `hooks/useMapDiceRoll.ts`, `utils/rollFromSheet.ts`; **BE** `common/dice/dice-payload.validator.ts` (GI očista).

### Deník v chatu — kontextový rail (16.1)
- **Co to je:** pravý panel chatu je kontextový. **Hráč** v něm má svůj deník postavy; **PJ** má Přítomní + jedno pole hledání (NPC + bestie) + klik na člena → načte jeho deník. Z deníku/statbloku jde **klikací hod schopnosti přímo do aktivní konverzace** (3D overlay → zpráva).
- **Kde:** FE `chat/components/rail/` — `ChatContextRail.tsx` (orchestrátor), `DiaryRollPanel.tsx` (deník PC/NPC = **stejný per-systém combat panel jako taktická mapa**, registr `tactical-map/.../combatPanels.ts` → `MatrixCombatPanel`…; systémy bez panelu fallback `DiaryTab`), `BestieRollPanel.tsx` (statblok bestie z katalogu), `RailEntitySearch.tsx` (hledání NPC+bestie), `useChatDiaryRoll.ts` (most hodu), `dice/lib/rollFromDiary.ts` (roll engine). Tlačítko railu v hlavičce `ChannelView` (PJ ikona Přítomní + presence badge, hráč ikona „Můj deník").
- **Kdo:** hráč vidí/edituje **jen svůj** deník (vlastní postava z `membership.characterPath`); **PJ/PomocnyPJ** (`isManager`) vidí Přítomní, načte deník libovolného člena/NPC i statblok bestie a smí editovat. Čtení deníku cizí postavy gatuje **BE** (`GET …/characters/:slug/diary` → 403 bez práv; PJ/vlastník mají přístup — stejný endpoint jako mapa). Bestie statblok = read-only.
- **Co jde dělat:** hráč: otevřít „Můj deník", hodit schopnost (→ konverzace), editovat deník (uloží se do Character subdoku, delta `customDataPatch`). PJ: klik na člena → jeho deník (hod atribuovaný „PJ"); hledat NPC → jeho deník (hod jako NPC); hledat bestii → její statblok, klik schopnost (hod jako bestie); ⟵ zpět na Přítomní.
- **Atribuce hodu (R1):** hráč za svou postavu = bez override (jeho persona); PJ za hráče = bez override → render-time „PJ"; NPC/bestie = override jméno+avatar (NPC navíc klikací slug). Skin kostek = volba toho, kdo hází (parita s mapou).
- **Hranice / co neumí:** **systémově agnostické — hod jde tam, kde sheet má `onRoll`**. Per-systém pokrytí je dnes **úplné**: `COMBAT_PANELS` má panel pro všech 13 systémů (matrix, pi, dnd5e, jad, coc, drd2, drd16, drdh, drdplus, fae, fate, gurps, shadowrun — `tactical-map/components/token-panel/combatPanels.ts:39-53`), kontrakt `onRoll` pokrývá i success-pool (`pool` + `kind:'pool-d6'`), GURPS 3k6 roll-under (`target`) a CoC percentil (`kind:'d100'` + `target`) — `diary-systems/types.ts:72-100`, `dice/lib/rollFromDiary.ts:84-160`. Bestie = **katalog** (žádná HP perzistence — instance s HP žije na mapě/v rosteru konverzace); editace statbloku jen v Bestiáři. NPC search filtruje `type==='NPC'` (PC jsou v rosteru). Hráč s víc postavami: bere přiřazenou (`characterPath`).
- **Zvláštnosti:** deník PC/NPC v chatu = **týž combat panel jako mapa** (`COMBAT_PANELS`), aby vizuál i chování seděly 1:1 (kompaktní statblok s pruhy penalt + klikací dovednosti, NE plný list). Panel čte/zapisuje deník přímo přes `characterSlug` (sceneId nepoužit, žádný token) → v chatu mu stačí mini-token jen se slugem, edituje inline (auto-save). Plný `DiaryTab` zůstává jen jako fallback pro systém, který v `COMBAT_PANELS` klíč nemá (dnes žádný z 13 podporovaných — reálně jen svět s neznámým `system`) — stejně jako na mapě. Bestie panel reuse `BestieStatblock` + `buildBestieToken` z tactical-map (coupling chat→map; **přímé importy → PIXI zůstal lazy chunk**, WorldChatPage 105 kB). Hod se pošle **až po doběhnutí 3D overlay** (`overlay.trigger` callback, ať se nepřekrývá 3D + 2D snapshot). `DiceRollOverlayProvider` obaluje `WorldChatPage`. Readout overlaye nově ukazuje rozpad `schopnost (mod) hod = výsledek` (i na mapě).
- **Vizuál (parita s taktickou mapou „pro hru"):** railové panely (deník/bestie) mají identity hlavičku = **kolečkový portrét 72px + velké jméno** (sdílený `railShell.module.css`); portrét postavy z `usePersonaDirectory` (slug → imageUrl; `Character` sám imageUrl nedrží), bestie z `bestie.imageUrl`. V deníkovém/bestie módu se **rail rozšíří na 480px** (desktop) / 94vw (mobil) — stejně jako dock panel mapy, aby 2sloupcové karty sheetu seděly. Šířku řídí `ChatContextRail.onWideChange` → `WorldChatRoom` třída `railWide`; presence mód zůstává úzký (300px).
- **Stav:** ✅ (mechanismus hráč/PJ/NPC/bestie i per-systém pokrytí hodů).
- **Kód:** FE `chat/components/rail/ChatContextRail.tsx`, `DiaryRollPanel.tsx`, `BestieRollPanel.tsx`, `RailEntitySearch.tsx`, `useChatDiaryRoll.ts`, `dice/lib/rollFromDiary.ts`; reuse `pages/CharacterDetailPage/components/DiaryTab.tsx`, `tactical-map/components/tokens/BestieStatblock.tsx`, `tactical-map/utils/buildSpawnToken.ts`.

### Combat roster v konverzaci (16.1e)
- **Co to je:** v konverzaci jde vést souboj — záložka **„⚔️ Souboj"** v pravém railu (vedle „Přítomní"/„Můj deník") = vertikální roster bojovníků (PC + NPC + bestie) s iniciativou, koly a HP. **Bestie** = perzistentní instance s editovatelným HP uložená **na konverzaci** (přežije reload); **PC/NPC** = jen reference (HP žije v deníku, single source). Klik na bojovníka → jeho deník/statblok v témže railu.
- **Kde:** FE `chat/components/combat/CombatRosterPanel.tsx` (+ `.module.css`), orchestrace v `chat/components/rail/ChatContextRail.tsx` (záložka `tab='combat'`, lokální stav `openCombatantId`/`addMode`), bok bestie `rail/BestieInstancePanel.tsx` (reuse `BestieStatblock` + autosave vzor `MatrixBestiePanel`), data `chat/api/useChannelCombat.ts`. BE `worlds/:worldId/chat/channels/:id/combatants` (GET/POST + PATCH/DELETE `/:combatantId`), `PATCH …/combat` (jedno DTO, `op: 'start' | 'turn' | 'end'`), `PATCH …/combat-config` (viditelnost) — `chat.controller.ts:185-262`, `dto/combat-op.dto.ts:16-18`.
- **Kdo:** přidávat/editovat/mazat bojovníky + ovládat boj + měnit viditelnost = **PomocnyPJ+** (`canManageChat`, BE-enforced ve všech mutacích). Hráč: záložku „Souboj" vidí (read-only roster), klik „i" otevře svůj deník nebo viditelnou bestii; HP cizích bojovníků dle viditelnosti (R3). GET roster server-filtrovaný: hráč u typu se skrytým HP nedostane staty bestie.
- **Co jde dělat:** PJ: „+ přidat" → vybrat člena z Přítomných (PC), nebo přes search NPC/bestii z katalogu (bestie = snapshot instance přes `buildBestieToken`); editovat HP/staty/schopnosti/poznámky instance bestie (autosave 500 ms); měnit iniciativu inline; **„Začít boj"** → zafixuje pořadí, kolo 1, „na tahu"; **„Další tah"** posune pointer (přetočení → kolo+1); **„Konec"**; v boji ⇄ mimo boj; hodit schopnost bestie do konverzace (atribuce jméno+obrázek instance); odebrat z boje.
- **Viditelnost HP (R3):** per typ `showHpPc/showHpNpc/showHpBestie` na **dvou úrovních** — world default (Nastavení světa → „Souboj v chatu") + per-konverzace override (👁 chipy v hlavičce panelu Souboj). Resolved: per-konverzace ?? world default ?? `true`.
- **Hranice / co neumí:** žádný grid/fog/pohyb (to zůstává na taktické mapě, R4 — oddělené, nesdílí runtime). **PC/NPC HP-tier ring na liště je neutrální** (HP v deníku, rosterem neprochází — barevný by chtěl fetch deníku každé postavy); HP detail postavy až v boku přes „i". BE **neověřuje `systemStats` bestie proti per-system schématu** (vyhnuto couplingu chat→maps; PJ-only zápis validní katalogové bestie). Atribuce hodu za postavu/NPC z rosteru = slug místo jména. Hod schopnosti bestie je **per-systém** (16.2d-chat): `BestieInstancePanel` dispatchne na 12 systémových panelů (`rail/{Matrix,Pi,Dnd,Jad,Coc,Drd2,Drd16,Drdh,DrdPlus,Fate,Gurps,Shadowrun}ChatBestiePanel.tsx`, `BestieInstancePanel.tsx:20-31,189-215`); generický `BestieRollPanel` (4dF) zůstává fallbackem pro systém bez panelu.
- **Zvláštnosti:** combat UI stav (záložka/otevřený bojovník/přidávání) je **lokální v `ChatContextRail`** (ne `WorldChatRoom`) → žádný cross-component drilling. Atomické operace na BE (`$push`/`$set arrayFilters`/`$pull`) = race-safe paralelní editace HP. WS `chat:combat:updated {channelId}` (room `chat:{channelId}`) → klient refetch s access+visibility filtrem. **Revize D2:** původně vodorovná lišta nad konverzací → přesunuto do vertikálního railu (lišta ukrajovala výšku textu).
- **Stav:** ✅ (BE endpointy `chat.controller.ts:185-262` + FE roster/rail; per-systém hod bestie doplněn 16.2d-chat).
- **Kód:** FE `chat/components/combat/CombatRosterPanel.tsx`, `chat/api/useChannelCombat.ts`, `chat/components/rail/{ChatContextRail,BestieInstancePanel}.tsx`, `pages/WorldSettingsPage/tabs/ChatCombatDefaultsTab.tsx`; BE `modules/chat/{chat.controller,chat.service}.ts`, `chat/repositories/chat-channel.repository.ts` (atomic), `chat/dto/{combatant-ops,combat-op}.dto.ts`, `chat/interfaces/chat-channel.interface.ts` (`ChatCombatant`), `worlds/.../world-settings.*` (`chatCombatDefaults`).

### Další funkce chatu (ověřeno v controlleru/service)
- Zprávy: cursor paginace (`GET …/channels/:id/messages`), odeslání, editace, smazání (soft / PJ hard), emoji reakce (`PUT …/reactions/:emoji`).
- **Zobrazit starší zprávy (SC-33, spec-6.1-followup):** při otevření konverzace se načte **posledních 50** (`HISTORY_LIMIT`); nad výpisem je tlačítko **„⬆ Zobrazit starší zprávy"**, klik donačte předchozích 50 přes `?before=<id nejstarší načtené>` a **předsadí** je do ploché messages cache (živý WS/optimistic tok beze změny). Scroll zůstane zakotvený (kotva „vzdálenost ode dna" v `MessageList`). BE vrátí <50 → jsme na začátku historie → tlačítko zmizí. **Kdo:** kterýkoli člen s přístupem ke konverzaci (stejný gate jako initial fetch, BE `hasChannelAccess`). **Šepoty (2026-07-10 fix):** BE filtruje `visibleTo` v Mongo query (`findByChannelId` `visibilityUserId` + `$or`, vzor `findFeed`), NE až v JS po `limit` — jinak hráč (role < PomocnyPJ) dostal <50 viditelných a tlačítko/konec historie se mu spočítal špatně. Teď `limit` = počet viditelných pro všechny role. **Hranice:** manuální tlačítko (žádný auto-load při dojetí nahoru); reset stavu řeší remount (`ChannelView key={channelId}`). **Bonus:** donačtené starší zprávy jsou pak v `itemRefs` → skoky z citace/deep-linku na starší originál začnou fungovat (dřív no-op mimo okno 50). **Stav:** ✅ (BE už dřív hotové, FE dodělané 2026-07-09). **Kód:** FE `chat/api/useWorldChat.ts` (`useLoadOlderMessages`, `prependOlderMessages`), `chat/components/ChannelView.tsx`, `features/chat/components/MessageList.tsx` (tlačítko + scroll-kotva); BE `chat.controller.ts:279-292`, `chat.service.ts:1131-1169`, `chat-message.repository.ts:31-58`.
- **Mentions:** `@username`, `@all`, `@here`, i `@character-slug` (dvoukrokový resolve) — `chat.service.ts:1386-1436`.
- **Vzhled mé zprávy:** per-svět barva + font + velikost (`GET/PATCH …/appearance`, z `WorldMembership`), server-side fill při neposlání (`chat.service.ts:1380-1385`). Barva má rozbalovací **nápovědní paletu** 18 pojmenovaných barev (16.1g, sdílená `NamedColorPalette`, klik = rychlá volba) pod pickerem v paletce vzhledu (`AppearancePopover`).
- **Čtenářský font override (16.1f):** člen si per svět zapne „Číst vše svým písmem" → klient mu vykreslí **všechny** zprávy ve streamu jeho zvoleným čitelným fontem + velikostí místo fontu odesílatele (per-viewer × per-svět; nikomu jinému nemění nic, nic se neposílá). **Kde:** přepínač 👓 v hlavičce konverzace (na mobilu ≤768px skryt — princip konstantního počtu prvků headeru; přepínač zůstává v 🎨 paletce, sekce „Jak čtu ostatní"). **Kdo:** kterýkoli člen pro sebe (self-service, žádné role gating; uložení gatuje členství jako celý `/chat/appearance`). **Jak:** 3 pole na `WorldMembership` (`readerFontOverride: boolean`, `readerFont`/`readerFontSize: string|null`, whitelist sdílen s `chatFont`/`chatFontSize`), override obejde 2 resolvery v `ChannelView` (bez změny `MessageList`). Nabídka = kurátorská podmnožina `READABLE_FONT_KEYS` (6 čitelných z 40). **Hranice:** override NEsahá na barvu zprávy (kontrast guard řeší čitelnost barvy) ani na hod kostkou (vlastní render). Žádný OpenDyslexic font (chce font load — možné rozšíření). **Stav:** ✅. FE `ChannelView.tsx:186-215` (resolvery + 👓), `AppearancePopover.tsx:380-397` (sekce „Jak čtu ostatní"), `chatFonts.ts`; BE `chat.service.ts:2506-2590` (get/update appearance) + `update-appearance.dto.ts`.
- **Skin chatu (16.1d):** vzhled chatu = **motiv světa** (žánr) — propíše se všem automaticky. Hráč si v 🎨 paletce („Vzhled chatu") přebije skin svého chatu na jiný z 12 motivů, jen pro sebe v tomto světě (`WorldMembership.chatSkin`, whitelist `WORLD_THEME_IDS`; `null` = auto dle světa). Aplikace: `data-chat-skin` na `WorldChatRoom .room` + při overridu scoped přepis `--theme-*` z `getTheme(skin).vars` (`useChatSkin`); paleta+fonty bez refaktoru chat CSS (chrome už čte `--theme-*`), atmosféra per žánr v `chat-skins.css`. Default (bez overridu) dědí `:root` → Ikaros = beze změny. **Stav:** ✅ (FE `chat/skins/registry.ts:13-27` = 12 id, `useChatSkin.ts`, `chat-skins.css`; BE `update-appearance.dto.ts:43` + `chat.service.ts:2534,2572`).
- **Přílohy:** `POST …/upload` (max 10 MB, member-only guard přes `getMembershipAppearance`).
- **NPC mód:** `overrideName/overrideAvatarUrl/overridePageSlug` jen pro `canManageChat` (PomocnyPJ+) — `chat.service.ts:1344-1355` (`CHAT_NPC_FORBIDDEN`).
- **Hledání:** `GET …/search` (substring v zprávách světa). **Skok na zprávu (spec-chat-search-jump, 2026-07-14):** klik na výsledek přepne konverzaci **a doscrolluje přímo na zprávu** (zvýraznění reuse `handleJump`). Když zpráva není v načteném okně, `useJumpToMessage` ji **dohledá po dávkách** (`?before=` kurzor, limit 100, pojistka 30 dávek ≈ 3000 zpráv) do ploché messages cache — plovoucí pilulka „Hledám zprávu v historii…", při neúspěchu „Zpráva je příliš hluboko v historii." (zmizí po 6 s). Začátek historie propíše `markReachedStart` → tlačítko „Zobrazit starší" ví, že končí. Čistá smyčka `huntMessageInHistory` s testy. **Kód:** FE `chat/api/useWorldChat.ts`, `ChatSearchModal.tsx` (`onSelectResult(channelId, messageId)`), `WorldChatRoom.tsx` (`jumpTarget` pár), `ChannelView.tsx` (pilulka).
- **Custom emoty:** per-svět + globální (mergeEmoteSets), správa v tabu Emoty světa.
- **Souhrn chatů (feed):** `getFeed` agreguje zprávy napříč všemi mými světy, access-safe; PJ persona se dosazuje **na serveru** (`chat.service.ts:1186-1300`).
- **Idempotence:** `clientNonce` dedupe při retry po WS dropu.

### Real-time (WebSocket)
- **Rooms:** `world:{id}` joinuje **jen** `WorldLayout` přes `useWorldSocket` (jediný vlastník celého světa, drží i reconnect re-join — W-7/W-9). `WorldChatRoom` room nedrží, jen poslouchá structure eventy (`WorldChatRoom.tsx:223-242`).
- **Zprávy:** do `chat:{channelId}` roomu join přes `chat:channel:join` (gatuje access). Eventy: `chat:message`, `chat:message:updated`, `chat:message:deleted`, `chat:presence`, `chat:typing`, `chat:sound:playing/stopped`, `chat:unread` (do `user:{id}`), `chat:feed:bump` (`chat.gateway.ts`).
- **Structure:** `chat:channel:created/updated/deleted`, `chat:group:created/updated/deleted`, `chat:groups:reordered`, `chat:channels:reordered` → FE invalidate groups query.
- **Combat (16.1e):** `chat:combat:updated {channelId}` do `chat:{channelId}` roomu → FE refetch rosteru (`GET …/combatants`, server-filtrovaný dle role+R3). Leak-safe signál (jen channelId).
- **Whisper zprávy** se emitují do `user:{id}` roomů adresátů (ne do channel roomu) — `chat.gateway.ts:273-277`.
- **Push notifikace:** chat notifikace chodí na telefon přes web-push (notifyUsers, kategorie `worldChat`), titulek nese **PJ personu dosazenou serverem** (NPC override > persona > `senderName`, `chat.service.ts:1588-1603`); deep-link `?konverzace={channelId}` vybere konverzaci (adjustment-during-render) a uloží jako poslední aktivní (`WorldChatRoom.tsx:75-101`).
- **Deep-link na zprávu (13.2a):** `?zprava={messageId}` (z notifikačního feedu „Chaty") → po otevření konverzace `MessageList` na zprávu doscrolluje + zvýrazní (reuse `handleJump` skoku z citace). Sdílí `jumpTarget` pár `{channelId, messageId}` se skokem z hledání — zpráva mimo načtené okno se **dohledá v historii** (viz „Hledání" výše; dřív no-op). Param se po použití uklidí z URL.

---

## Novinky světa (`WorldNewsPage`)

### Přehled
- **Co to je:** stránka `/svet/:slug/novinky` — veřejná oznámení světa (aktivní) + archiv (pro správce). Karty `WorldNewsCard` (obrázek 16:9 + štítek + datum + úryvek), stránkování po 10; klik na kartu otevře vystředěné **detail-okno** s plným obsahem a odkazem (× / Escape / klik do pozadí zavře).
- **Kde:** FE `pages/WorldNewsPage/WorldNewsPage.tsx`, editor `WorldNewsEditorModal`. BE modul `modules/world-news` (controller `world-news`, service).
- **Kdo (FE):** route `showcaseOrMember(p(WorldNewsPage))` (`router.tsx:408`) — člen Čtenář+, a navíc **nečlen/anonym read-only, když má svět zapnuté `publicShowcase`** (22.4; tvrdou hranici drží BE). Správa (tvorba/edit/archiv/mazání + tab Archiv) jen `canManage` = `world.elevated` (elevovaný platform Admin+) **nebo** world role **PomocnyPJ+** (R-22 — de-elevovaný Admin tlačítka nevidí; `WorldNewsPage.tsx:41-45`).
- **Stav:** ✅
- **Kód:** FE `WorldNewsPage.tsx`; BE `world-news.controller.ts`, `world-news.service.ts`.

### Kdo publikuje / viditelnost
- **Čtení (`scope=active`):** veřejné, ale JEN pro **public/open** svět (nebo globální novinky bez `worldId`) — `GET /world-news` má `OptionalJwtAuthGuard`, `assertCanReadScope` → `assertCanReadActiveWorldScoped` (`world-news.service.ts:362-382`, `:391-421`). **✅ OPRAVENO 2026-07-05 (SEC-10/FIX-22, RUN-2026-07-05):** world-scoped `scope=active` novinky dřív žádný `accessMode` gate neměly — obsah **privátního** světa (titulek, text, obrázek) unikal komukoli anonymnímu, kdo znal `worldId`. Teď: `private` svět → jen člen nebo elevovaný platform Admin+ (jinak 403 `WORLD_NEWS_FORBIDDEN`); `public`/`open` zůstává čitelné i pro anonyma (katalog světů = záměrně veřejný, mění se jen obsah privátních novinek).
- **Archiv (`scope=archived`/`all`):** vyžaduje přihlášení + write oprávnění (PomocnyPJ+ / Admin).
- **Zápis (create/update/delete/archive/unarchive):** `assertCanWrite` (`world-news.service.ts:423-461`):
  - `worldId === null` (globální novinka) → **jen** platform Admin/Superadmin, **bez** elevace (elevation-exempt, není world-scoped);
  - `worldId !== null` → **elevovaný** Admin/Sa (`worldAdminBypass` — de-elevovaný Admin dostane 403) **nebo** world membership **PomocnyPJ+**.
  - Anti-leak: neexistující svět → 403 (ne 404).
- **`worldId` je immutable** — update s worldId v body → 400 (`WORLD_NEWS_WORLD_ID_IMMUTABLE`). Pro změnu scope smaž a vytvoř novou.
- **`createdBy`** je interní audit field, nikdy se nevrací v API (`toPublic` ho stripuje, `world-news.controller.ts:30-38`).
- **Globální novinky v UI světa:** PJ světa je needituje — FE `canManage && (isGlobalAdmin || news.worldId !== null)` (`WorldNewsPage.tsx:161`).
- **Stav:** ✅
- **Kód:** FE `WorldNewsPage.tsx`; BE `world-news.service.ts:362-461`.

### Pole novinky / co jde nastavit
DTO `create-world-news.dto.ts`: `title` (≤200), `content` (≤10000), `date` (ISO UTC), `type` (`info` | `alert` | `system`), `link` (URL s protokolem) nebo interní `linkPageSlug` (priorita), hero obrázek (`imageUrl` + focal X/Y + zoom 25–400 + fit cover/contain), fantasy datum (`calendarConfigId` + `calendarDate` = FantasyDate). Archivace přes `POST /:id/archive` a `/unarchive` (idempotentní). Limit listu 200, default 50.

### Real-time + push (15.9)
- **Web push při vytvoření novinky světa** (`worldId !== null`) → členům světa mimo Zadatele, kategorie `worldNews` (`notifyMembers`, `world-news.service.ts:163-181` + volání `:152-157`, fire-and-forget, respektuje `notificationPreferences`). Globální novinky (`worldId === null`) push negenerují — ty jdou přes „Novinky Ikarosu" (kap. 04/05). Viz „Nastavení notifikací" v kap. 05.
- BE emituje `world-news.changed` → `worlds.gateway` přemostí na WS `world:news:changed` do `world:{id}` roomu (leak-safe signál, globální novinka se neemituje) — `worlds.gateway.ts:56-62`.
- FE: listener v `useWorldSocket` (na úrovni `WorldLayout`) invaliduje `['world-news', worldId]` → dashboard widget i stránka se obnoví bez čekání na staleTime (`useWorldSocket.ts:56-62`). Lokální mutace navíc invalidují přímo.
- **Stav:** ✅

### Kde se novinky ještě zobrazují
- Úvodní dashboard světa — sloupec Novinky (`WorldDashboard/columns/NewsColumn.tsx`, `WorldNewsCard`), spec 5.2.

### Nahlásit novinku (20.1)
- Karta novinky nese tlačítko „Nahlásit" (`WorldDashboard/components/WorldNewsCard.tsx:207-208`, `ReportButton targetType="world_news"`, `worldId`) → platformová moderační fronta „Zpracovat" (kap. 08). Report protiprávního obsahu je platformní záležitost (ne PJ), viz R-20. Jen přihlášený, vlastní obsah ne. *(Zprávy světového chatu report tlačítko zatím nemají — jen globální chat, kap. 05.)*

### Karta + detail-okno (sjednoceno s globálními novinkami, 2026-06-22)
- `WorldNewsCard` je teď adaptér nad sdílenou `NewsPreviewCard` + `NewsDetailModal` (`src/shared/ui/news/`) — stejná prezentační vrstva jako globální novinky (kap. 04), liší se jen view-model (svět navíc resolvuje interní odkaz `linkPageSlug` přes `usePagesDirectory` a fantasy datum přes `useCalendarConfigs`).
- **Plný text oznámení se čte v detail-okně** — dřív nebyl viditelný nikde (karta ukazovala jen 3řádkový úryvek). Interní/externí odkaz se přesunul z karty do okna.
- Štítek důležitosti = sdílený `NewsTypeChip` (tón `info`/`warning`/`system`, `alert`→`warning`); původní world `TypeChip` je tenká delegace.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. **Názvoslovná inverze FE↔BE je trvalý zdroj záměn.** FE „kanál" = BE `ChatGroup`, FE „konverzace" = BE `ChatChannel`. Dokumentace i UI to musí držet konzistentně; každý nový kód riskuje záměnu (`feedback_chat_naming`).
2. ~~**PJ persona render-time jen na FE** → mimo chat UI (feed, push, hledání) může uniknout reálné jméno vedení.~~ **✅ VYŘEŠENO (D-NEW-INV-SEC „persona-on-server").** Uložené `senderName` sice zůstává jméno postavy/účtu, ale všechny tři cesty mimo render-time FE dosazují personu **na serveru** (NPC override > persona > `senderName`): hledání `chat.service.ts:1103-1120`, feed `:1255-1291`, push titulek `:1588-1603` (`makePjPersonaResolver` / `resolvePjPersona`, `worlds/pj-persona.util`). Zbývá hlídat u případného exportu.
3. **`type: 'system'` novinky** nemá v BE žádné zvláštní oprávnění oproti `info`/`alert` — DTO ho jen povolí (`create-world-news.dto.ts:52-53`) a service ho uloží bez větvení podle role (`world-news.service.ts:132`, `:212`); vizuální rozlišení je čistě na FE kartě. Pokud má „system" znamenat „jen platforma", chybí gate (kdokoli PomocnyPJ+ ji může nastavit). **Otevřené.**
4. **Dvě čtecí cesty settings pro chat:** persona/groupImages čte interní `getSettings` (plný objekt), zatímco REST GET filtruje nečleny. Při přidání citlivého settings pole je nutné aktualizovat `toPublicSettings` (riziko leaku přes REST), jinak chat (interní) funguje, ale REST nečlenovi unikne. Field-drift checklist.
5. ~~**`backfillCharacterChannels` + lazy seed běží při každém otevření chatu.**~~ **✅ NEPLATÍ (ověřeno v kódu).** `getGroupsWithChannels` volá `ensureWorldChat` **jen když svět nemá ani jeden kanál** (`chat.service.ts:276-282`), takže po prvním seedu je čtecí cesta čistá. `backfillCharacterChannels` se z čtecí cesty nevolá **vůbec** — jediné volání je `onApplicationBootstrap` (`:2128`). Perf riziko na čtení tedy neexistuje.
6. ~~**Kolize shortcode globální vs. světový emote — ověřit prioritu.**~~ **✅ VYŘEŠENO.** Priorita je explicitní a otestovaná: globální se vloží první, **per-svět je přepíše**, klíč lowercase (`chat/emotes/lib/mergeEmoteSets.ts:19-27` + `mergeEmoteSets.spec.ts`). Oddělené limity/zdroje zůstávají záměrem.
7. **Deník v chatu táhne coupling chat → tactical-map** (16.1c): `BestieRollPanel` importuje `BestieStatblock` + `buildBestieToken` (+ tranzitivně schema-form) z `tactical-map`. Funkčně OK a PIXI se nepřitáhl (přímé importy → DiceBox3D zůstal lazy), ale statblok/schema primitiva by patřila do `shared/`. Kandidát na refactor v 16.2a; past: kdyby někdo přidal do importního grafu z mapy něco s PIXI, chat bundle nabobtná.
8. ~~**Per-systém pokrytí hodů v chatu — zbývá CoC (d100 roll-under).**~~ **✅ VYŘEŠENO (uzavřeno).** `COMBAT_PANELS` pokrývá všech 13 systémů (`combatPanels.ts:39-53`) a kontrakt `onRoll` má vedle `pool` (`kind:'pool-d6'` → `rollPoolHits`, úspěchy 5–6 + glitch) i **`target`** pro roll-under: GURPS `kind:'3d6'` → `rollTarget` a **CoC `kind:'d100'` → `rollPercentile`** (`diary-systems/types.ts:72-100`, `dice/lib/rollFromDiary.ts:87-125`). Bez otevřeného zbytku.
9. **Combat roster (16.1e) — MVP ústupy:** (a) **PC/NPC HP-tier ring** v rosteru je neutrální (HP žije v deníku, rosterem neprochází → barevný by chtěl per-postava fetch deníku); bestie ring je z instance. (b) BE **neověřuje `systemStats` bestie proti per-system schématu** (vyhnuto couplingu chat→maps `SystemStatsValidatorService`; PJ-only zápis snapshotu validní katalogové bestie) — kandidát doplnit, až bude validátor sdílený. (c) Atribuce hodu za postavu/NPC z rosteru = **slug místo jména** (roster nese jen `characterSlug`). (d) ~~Hod schopnosti bestie pevně `kind:'fate'`.~~ **✅ VYŘEŠENO (16.2d-chat):** `BestieInstancePanel` dispatchne na 12 per-systémových chat panelů (`rail/*ChatBestiePanel.tsx`, `BestieInstancePanel.tsx:20-31,189-215`); generický 4dF panel je už jen fallback.
10. **Combat roster + per-systém bestie panely prohlubují coupling chat → tactical-map** (16.1e/16.2d-chat, navazuje na #7) — a od 16.2d-chat je **výrazně širší** než při zápisu #7: `BestieInstancePanel`/`ChatContextRail`/`BestieRollPanel` importují `buildBestieToken`, `BestieStatblock`, `hpTier`, `systemEntitySchemaRegistry`, `InitiativeInput`, a navíc **každý z 12 `rail/*ChatBestiePanel.tsx`** tahá z `tactical-map` per-systém `*BestieCombatActions`, `*BestiePanel.module.css`, `EntitySchemaForm` a `schemas/*` (např. `DndChatBestiePanel.tsx:17-20`, `Drd16ChatBestiePanel.tsx:21-22`). PIXI zůstává lazy (přímé importy, žádný barrel). Refactor do `shared/` je tím pádem větší kus práce než u #7 — a past je stejná: jediný import z mapy s PIXI nafoukne chat bundle.
