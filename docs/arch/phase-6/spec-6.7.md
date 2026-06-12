# Spec 6.7 — Chat: soukromé konverzace postav + osobní řazení a sbalení sidebaru

**Status:** ✅ Implementováno (2026-06-05) — BE 240 testů + FE build/vitest zelené, viz `plan-6.7.md`
**Rozsah:** BE (auto-konverzace postavy, PJ+ access fix, per-membership chat prefs) + FE (sidebar řadí/sbaluje dle osobních prefs)
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE`
**Souvisí:** [spec-6.1.md](spec-6.1.md) (§4 seed kanálů „Globální"/„Postavy", §4 PJ+ vidí 1:1), [spec-6.5.md](spec-6.5.md) (drag-drop reorder — dnes globální PJ-only)

---

## Pojmy

- **Kanál** (UI) = `ChatGroup` (BE) — sbalovací kontejner v sidebaru.
- **Konverzace** (UI) = `ChatChannel` (BE) — chatovací místnost uvnitř kanálu.
- **Vedení** = role `PomocnyPJ`+ (4–5) ve světě, příp. platform `Admin`+ (`canManageChat`).
- **Osobní prefs** = nastavení sidebaru per hráč (pořadí + co je sbalené), uložené na `WorldMembership`.

---

## Cíl (3 nezávislé featury)

1. **6.7a — Soukromá konverzace postavy.** Kanál „Postavy" přestane mít sdílenou veřejnou konverzaci „hráči". Místo toho při **přidělení postavy hráči** vznikne automaticky **soukromá konverzace** té postavy — vidí ji jen hráč + vedení světa. Důvod: postavy jsou soukromé, sdílená veřejná místnost tam nepatří.
2. **6.7b — Osobní řazení sidebaru.** Každý hráč (ne jen PJ) si přetažením seřadí pořadí kanálů i konverzací **jen pro sebe**. Uloženo per-membership na BE (přežije i jiné zařízení).
3. **6.7c — Persistované sbalení kanálů.** Kanály v sidebaru jsou **defaultně sbalené** kromě toho s aktivní konverzací. Stav otevřeno/zavřeno se hráči pamatuje (per-membership na BE).

---

## 6.7a — Soukromá konverzace postavy

### Chování
- **Seed (nové světy):** kanál „Postavy" se založí **prázdný** (bez konverzace „hráči"). Kanál „Globální" / konverzace „globální" beze změny.
- **Trigger auto-create (implementováno — 4 eventy, sdílí `ensureCharacterChannel`):**
  - `character.created` / `character.updated` / `character.converted` (z `characters.service`) — nesou `name` → vytvoří/přejmenuje konverzaci jménem postavy; filtr `!isNpc && userId` (resp. `!toNpc`).
  - `world.character.assigned` (ruční přiřazení existující postavy v nastavení členů) — nenese jméno → fallback na **username** hráče.
  - Důvod 4 triggerů: `world.character.assigned` má vlastního konzumenta (pošta „Přiřazena postava") a nesmí se emitovat odjinud; `character.*` zase nepokryje ruční přiřazení existující postavy. Společně pokrývají všechny toky.
- **Co vznikne:** v kanálu „Postavy" nová `ChatChannel`:
  - `name` = jméno aktuální postavy hráče (z `characterPath` → directory entry name; fallback username),
  - `accessMode: 'members'`, `allowedMemberIds: [userId hráče]`,
  - `linkedMemberUserId: <userId hráče>` (nové pole — **vazba na hráče**, idempotence),
  - `type: 'character'` (odliší od ručních 1:1).
- **Vazba = HRÁČ, ne postava.** Konverzace je stálá soukromá linka hráč ↔ vedení; jméno jen odráží aktuální postavu. Jeden hráč = max jedna taková konverzace.
- **Idempotence + handler:** event najde konverzaci podle `linkedMemberUserId` v kanálu „Postavy":
  - neexistuje → **vytvoř** (members = `[userId hráče]`, name = jméno postavy),
  - existuje → **přejmenuj** na novou postavu (members beze změny).
- **Přehození postavy (řešení edge-case):**
  - *Scénář 1 — hráč mění postavu (X→Y):* konverzace se jen **přejmenuje** X→Y. Historie i členové zůstávají, žádná nová ani osiřelá.
  - *Scénář 2 — postava přejde k jinému hráči (X od A k B):* každý hráč má vlastní konverzaci vázanou na sebe → A si svou nechá (přejmenuje se na jeho další postavu / „bez postavy"), B dostane nebo přejmenuje svou na X. Nikdo nepřijde o historii s PJ.
- **Odřazení postavy** (`clearCharacter`): konverzace **zůstává** (historie); ponechá poslední jméno. Member se neodebírá. (Přejmenování na „bez postavy" při odřazení = mimo rozsah, `clearCharacter` dnes event neemituje.)

### PJ+ access fix (nutné jádro)
Dnešní [hasChannelAccess](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L99) pro `members` vrací jen `allowedMemberIds.includes(userId)` — **bez PJ bypassu**, ačkoli spec 6.1 §4 i [getGroupsWithChannels](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L182) říkají „PJ+ vidí všechny 1:1". Auto-konverzace má `allowedMemberIds = [hráč]` (bez PJ), takže bez fixu by PJ konverzaci **viděl v sidebaru, ale dostal 403** při čtení/psaní.

→ **Fix:** `hasChannelAccess` u `members` vrátí `true` i pro `canManageChat` (PJ+/Admin). Sjednotí se s deklarovaným záměrem a odstraní latentní past pro **všechny** `members` konverzace (i ruční 1:1). Vedení tak vidí i píše do každé soukromé konverzace bez nutnosti být v `allowedMemberIds`.

### Migrace existujících světů
Konverzace „hráči" v kanálu „Postavy" už ve starých světech existuje. Lazy v `ensureWorldChat`:
- **smazat (soft-delete)** konverzaci `name='hráči'` v kanálu „Postavy" **pouze pokud nemá žádné zprávy** (prázdná) — typický stav (Jeskyně). Světy s reálnou historií zprávu **zachovají** (PJ ji smaže ručně přes UI, nepřijdeme o data tiše).

---

## 6.7b — Osobní řazení sidebaru

### Datový model — `WorldMembership` rozšíření
```
chatGroupOrder?: string[]                 // groupId v osobním pořadí
chatChannelOrder?: Record<string, string[]> // groupId → channelId[] v osobním pořadí
```
Prázdné/chybějící = fallback na globální `order` z `ChatGroup`/`ChatChannel` (dnešní chování). Neznámá / nová ID (kanál vznikl po posledním reorderu) se zařadí na konec dle globálního `order`.

### Endpoint
`PATCH /worlds/:worldId/chat/my-prefs` — ukládá na **requesterův** membership. Tělo (vše volitelné, partial):
```
{ groupOrder?: string[], channelOrder?: Record<string,string[]>, expandedGroups?: string[] }
```
Guard: `JwtAuthGuard` + member světa (libovolná role ≥ Hráč). Žádný PJ gate — je to osobní.

### FE
- Drag-drop v `ChannelSidebar` přestane být gated na `canManage` — řadí **každý**.
- Ukládá přes nový hook `useUpdateChatPrefs` (optimistic + debounce ~400 ms) místo `useReorderGroups/Channels` (globální PJ endpointy — zůstanou nepoužité, příp. smazat).
- Sidebar aplikuje osobní pořadí (merge: známá ID dle prefs, ostatní na konec dle globálního order).
- **Drag handle viditelnost (6.7b dotažení):** handle je **trvale viditelný** — lucide `GripVertical` (⋮⋮) v accent barvě kanálu (`--g-color` / `--ch-accent`), opacity 0.5 v klidu → 1 + synthwave glow na hover; mobil 0.6 / 44px terč. Nahrazuje původní `opacity:0` hover-only z 6.5 (hráč handle neobjevil). Render **bez `canManage`** i pro ne-PJ. Pozn.: starý selektor `:global(.header):hover .handle` nikdy nefungoval — `.header` je hashovaná CSS-module třída, `:global` ji nematchne.

> ⚠️ **Změna oproti 6.5:** drag-drop už nemění globální pořadí pro všechny. PJ řadí jen sobě. Globální `order` (z 6.5) zůstává jako výchozí pro nové členy. Pokud chceš zachovat i „PJ nastaví výchozí pořadí všem" → samostatná položka, viz Otevřené otázky.

---

## 6.7c — Persistované sbalení kanálů

### Datový model — `WorldMembership`
```
chatExpandedGroups?: string[]   // groupId, které jsou ROZBALENÉ (default: vše sbalené)
```

### Chování
- **Default:** kanál sbalený. Stav otevřeno/zavřeno řídí čistě `chatExpandedGroups` — **žádný auto-override aktivní konverzací** (revize 2026-06-12, viz níže).
- **Sbalený kanál s aktivní konverzací** zobrazí **jen tu jednu aktivní konverzaci** (ostatní skryté, bez reorderu) — replikace starého Matrixu: hráč vidí, kde právě je, i po sbalení. Rozbalený = všechny konverzace (s drag&drop reorderem).
- **Toggle** rozbalí/sbalí → zapíše do `chatExpandedGroups` přes stejný `my-prefs` endpoint (optimistic + debounce).
- Přežije refresh i jiné zařízení.

### FE
- `ChannelSidebar` nahradí `useState<Record<string,boolean>>({})` za stav inicializovaný z `membership.chatExpandedGroups`.
- Init: `collapsed = !expandedGroups.includes(group.id)` (bez override).
- `ChannelGroup` ve sbaleném stavu renderuje jen konverzaci s `id === activeChannelId` (přes `ChannelItem` bez drag handle); rozbaleno = `renderChannelList` (sortable).

> **Revize 2026-06-12 (FE-only):** zrušen původní override „kanál s aktivní konverzací vždy rozbalený" — bránil sbalení kanálu, ve kterém máš otevřenou konverzaci. Nahrazeno chováním starého Matrixu: sbalený kanál ukáže jen aktivní konverzaci. BE pole `chatExpandedGroups` beze změny.

---

## Dotčené soubory (odhad)

**BE (`Projekt-ikaros`):**
- `chat/schemas/chat-channel.schema.ts` — `linkedMemberUserId`, `type:'character'`.
- `chat/repositories/chat-channel.repository.ts` — mapper whitelist (nové pole; [[project_be_field_checklist]]).
- `chat/chat.service.ts` — `hasChannelAccess` PJ fix; `seedDefaultGroups` (prázdná Postavy); `@OnEvent('world.character.assigned')` handler; `ensureWorldChat` migrace prázdné „hráči".
- `worlds/schemas/world-membership.schema.ts` + repo mapper — `chatGroupOrder`, `chatChannelOrder`, `chatExpandedGroups`.
- `chat/chat.controller.ts` + service — `PATCH .../chat/my-prefs`.
- specs: jest na chat.service + membership.

**FE (`Projekt-ikaros-FE`):**
- `world/chat/lib/types.ts` — pole na membership/types.
- `world/chat/api/useChatPrefs.ts` (nový hook) — load + `useUpdateChatPrefs`.
- `world/chat/components/ChannelSidebar.tsx` — osobní řazení (un-gate drag), collapse z prefs.
- `world/chat/components/WorldChatRoom.tsx` — předání prefs, aktivní-kanál override.
- `shared/types` — `WorldMembership` rozšíření.

---

## Rozhodnutí (moje volby — k potvrzení/změně)

| # | Rozhodnutí | Volba |
|---|---|---|
| R1 | Kdo vidí soukromou konverzaci postavy | hráč + **celé vedení** (PomocnyPJ+) přes `canManageChat` bypass |
| R2 | Vazba konverzace | na **hráče** (`linkedMemberUserId`), ne na postavu; název = aktuální postava |
| R3 | Trigger | event `world.character.assigned` (přiřazení postavy jiným PJ) → vytvoř/přejmenuj |
| R4 | Stará „hráči" konverzace v Postavy | soft-delete jen když je **prázdná**; s historií zachovat |
| R5 | Reorder | **vše osobní** per-membership; PJ ztrácí globální reorder ✅ (Q2 — vyhovuje) |
| R6 | Collapse persistence | na BE přes `my-prefs`, optimistic + debounce |

## Vyřešené otázky

- **Q1 ✅** Auto-konverzace se spouští při přiřazení postavy PJ (event `world.character.assigned`). Vazba na hráče řeší přehození postavy přejmenováním (viz 6.7a, scénáře 1+2). Druhý trigger netřeba.
- **Q2 ✅** Reorder čistě osobní — PJ si nastaví pořadí pro sebe, globální řazení pro všechny se ruší. Uživatel potvrdil, že vyhovuje.

---

## Workflow

Brainstorming (proběhl v chatu) → **tato spec → ⏸ čeká schválení** → implementační plán (`plan-6.7.md`) → potvrzení → kód. Po implementaci: `napoveda` (mění se chování chatu pro hráče i PJ), zaškrtnout roadmapu, `mobil-desktop` na sidebar.
