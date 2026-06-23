# Spec 16.1 — Deník v chatu (hod za postavu / NPC / bestii ze světového chatu)

**Status:** ✅ Mechanismus hotový 2026-06-23 — 16.1a (rámec rail + hod) · 16.1b (NPC) · 16.1c (bestie) implementováno (build zelený, chat 109 testů). **16.1d (per-systém hody + grafika) přesunuto ZA 16.2** — splývá s 16.2a „Pilíř DENÍK" (manuální per-systém průchod s pravidly autora). Chat je systémově agnostický → jede pro každý systém, co má `onRoll` (matrix referenční). Čeká živý smoke.
**Rozsah:** FE primárně (reuse existujících sheetů + dice pipeline); BE jen pokud chybí čtecí endpoint deníku NPC/bestie pro chat — ověřit při plánu.
**Repo:** `Projekt-ikaros-FE`, commit na `main` (žádná feature větev — viz feedback)
**Velikost:** odhad rámec ~8–12 souborů; rozválcování systémů iterativně dál
**Autor:** PJ + Claude
**Datum:** 2026-06-23
**Souvisí:** roadmap2.md Fáze 16 / 16.1 · per-systém checklist (roadmap2.md:354–412) · chat 6.2/6.3/6.7/6.8 · taktická mapa 10.2 (TokenSystemSheet, BestiePanelView)

---

## 1. Cíl

Hráč i PJ můžou **přímo ze světového chatu otevřít deník postavy a házet schopnosti** — hod se pošle jako zpráva do aktivní konverzace (3D overlay + readout, jako dnešní kostky). Pravý rail chatu se stane **kontextový**: hráč v něm má svůj deník, PJ má „Přítomní" + možnost kliknutím načíst deník libovolného hráče, a přes hledání i deník **NPC** nebo statblok **bestie** z katalogu. Cíl = vyprávěcí hraní „za postavu" s mechanikami přímo v chatu, bez skákání na list postavy.

---

## 2. Kontext / motivace

Roadmap (rozhodnutí 2026-06-15c): žádný nový typ chatu — dlouhé/oddělené příběhy se hrají ve světovém chatu. Per-systém checklist (roadmap2.md:356) má u **všech 13 systémů „Chat (hod za postavu z deníku) ☐ nepostaveno"**. Dnes chat umí jen „holou" kostku (composer dice picker), nenavázanou na deník postavy — hráč musí pro hod se svými modifikátory odejít na list nebo na mapu. To rozbíjí tok vyprávěcího hraní. 16.1 tuhle mezeru zavírá a je zároveň posledním ze tří míst (reálný list ✅ / mapa ✅ částečně / **chat ☐**), kde deník žije.

---

## 3. Audit současného stavu

### 3.1 Chat — co je
- **Pravý panel „Přítomní"** [ChannelMemberPanel.tsx](../../../src/features/world/chat/components/ChannelMemberPanel.tsx) — roster dle world role, online tečka, „naposledy". Renderuje se **jen PJ/PomocnyPJ** (gating ve [WorldChatRoom.tsx:315](../../../src/features/world/chat/components/WorldChatRoom.tsx#L315)). Hráč rail nemá žádný.
- **Kostky v chatu fungují** — [ChannelComposer.tsx:537 `sendDiceRoll`](../../../src/features/world/chat/components/ChannelComposer.tsx#L537): `DicePickerPopover` → `dicePayload` → 3D overlay → zpráva. Skin zafixovaný na zprávě (`ChatMessage.diceSkin`).
- **NPC maska** [NpcOverridePanel.tsx](../../../src/features/world/chat/components/NpcOverridePanel.tsx) — PJ-only 🎭, hledá postavu přes `usePersonaDirectory` + `PersonaAutocomplete`, nastaví `overrideName` / `overrideAvatarUrl` / `overridePageSlug`. **Tento search recyklujeme.**
- **Odeslání zprávy** [useWorldChat.ts `useSendMessage`](../../../src/features/world/chat/api/useWorldChat.ts) + `useOptimisticSend` — payload má `overrideName/overrideAvatarUrl/overridePageSlug`, `dicePayload`, `diceSkin`.
- **Persona render-time:** PJ (role ≥ PomocnyPJ) se v chatu zobrazuje jako „PJ" (`makePjDisplayResolver`, worldSettings.pjChatPersona) — zpráva poslaná PJ bez override se vykreslí jako „PJ".

### 3.2 Deník postavy — co je (reuse target)
- **Registry** [diary-systems/registry.ts `getDiaryPreset`](../../../src/features/world/pages/CharacterDetailPage/diary-systems/registry.ts) — `world.system → DiarySystemPreset.SystemSheet`, fallback `generic`. 13 systémů.
- **Sheet props** [types.ts `SystemSheetProps`](../../../src/features/world/pages/CharacterDetailPage/diary-systems/types.ts#L40) — `{ diary, mode: 'view'|'edit', worldId, worldSlug, characterSlug, onChange?, onRoll? }`. **`onRoll?({ label, modifier?, kind? })` už existuje** — sheety kreslí klikací hody jen když ho dostanou (mapa dává, reálný list ne). To je háček, na který chat napojí svou roll pipeline.
- **Roll utilita** [rollFromSheet.ts `performSheetRoll`](../../../src/features/world/tactical-map/utils/rollFromSheet.ts) — z `{label, modifier, kind}` vyrobí `{ total, dicePayload }`. Sdílená s mapou.
- **Per-systém pokrytí onRoll:** část sheetů má klikací hody (`SheetInitiativeButton`, FateLikeSheet skill rolly), část jen iniciativu, část nic — viz roadmap2.md:359–410. Rozsah dotažení = 16.1d.

### 3.3 Bestie — co je (reuse target)
- **Statblok** [BestieStatblock](../../../src/features/world/tactical-map/components/token-panel/tokens/BestieStatblock.tsx) — render ZDRAVÍ/BOJ/SCHOPNOSTI + klikací kostka u každé schopnosti (viz screenshot „Duch"). Jádro znovupoužitelné.
- **Mapový wrapper** [BestiePanelView.tsx](../../../src/features/world/tactical-map/components/token-panel/BestiePanelView.tsx) — **navázaný na token** (staty z `token.systemStats`, ukládá `useTokenUpdate`, hody přes `onMapRoll`). **V chatu nepoužitelný 1:1** — token neexistuje.
- **Dice skin** [useDiceSkinMapping.ts:28](../../../src/features/world/chat/dice/api/useDiceSkinMapping.ts#L28) — per-membership, per-typ-kostky. **Žádné pole `diceSkin` na bestii/tokenu** (grep prázdný) → bestie nemá signature kostky, hod vezme skin toho, kdo hází.

---

## 4. Návrh řešení

### 4.0 Klíčová rozhodnutí
| # | Rozhodnutí | Důvod |
|---|-----------|-------|
| R1 | **Atribuce hodu:** hráč→jeho postava · PJ za hráče→jako **PJ** · PJ za NPC/bestii→jako to NPC/bestie (override) | volba PJ (transparentnost: PJ se neschovává za hráče); mapuje se 1:1 na stávající override + persona resolver |
| R2 | **Bestie zdroj = bestiář (katalog)**, ne mapový token; staty read-only, **schopnosti klikací do chatu** | „bestie, které jsou"; HP instance žije na mapě, v chatu není kam ukládat |
| R3 | **Dice skin = parita s mapou** (skin toho, kdo hází, dle typu) | nulový náklad; signature kostky bestie = samostatný úkol (B), dotkl by se i mapy |
| R4 | **Reuse, ne kopie:** chat plní `SystemSheet`/`BestieStatblock` přes `onRoll` → `sendDiceRoll`; žádný nový per-systém sheet | jediný zdroj pravdy deníku (list/mapa/chat) |
| R5 | **Editace deníku v chatu = stejný Character subdok** (delta `customDataPatch`) | single source; vzor z mapy |

### 4.1 Kontextový rail — režimy
Pravý rail (`s.membersSlot`) dostane stavový stroj místo statického panelu:

```
ChatContextRail (worldId, channel, role, presence, currentUser)
├─ mód 'presence'  (PJ default)  → ChannelMemberPanel (jako dnes)
│     + hlavička: search NPC/bestie (recyklovaný PersonaAutocomplete + bestiář)
│     + klik na člena rosteru        → přepne na 'diary' (jeho postava)
│     + výběr NPC ze searche         → 'diary' (NPC postava)
│     + výběr bestie ze searche      → 'bestie' (statblok z katalogu)
├─ mód 'diary' (postava: PC/NPC) → DiaryRollPanel (rozevírací deník)
│     + tlačítko ⟵ zpět na 'presence' (jen PJ)
└─ mód 'bestie' (katalog)        → BestieRollPanel (statblok, roll-only)
      + tlačítko ⟵ zpět na 'presence' (jen PJ)
```

- **Hráč** (`!isManager`): rail = rovnou `DiaryRollPanel` jeho postavy (žádné Přítomní, žádný search, žádné zpět). Pokud vlastní víc postav ve světě → drobný selektor postavy v hlavičce panelu (default = přiřazená `membership.characterPath`).
- **Hlavička chatu** [ChannelView.tsx:475](../../../src/features/world/chat/components/ChannelView.tsx#L475): tlačítko railu (dnes 👥 PJ-only) zpřístupnit **i hráči** — pro hráče ikona „deník", popisek „Můj deník".

### 4.2 `DiaryRollPanel` (PC/NPC)
- Vstup: `characterSlug` + `worldId`. Načte `CharacterDiary` (reuse existující fetch z `DiaryTab` / `useCharacter`).
- Render: `getDiaryPreset(world.system).SystemSheet` s props `{ diary, mode, onChange, onRoll }`.
- **`onRoll`** = adaptér: `performSheetRoll(req)` → `dicePayload` → `sendDiceRoll`-ekvivalent do **aktivní konverzace** (`activeChannelId`), s atribucí dle R1.
  - hráč na své postavě → bez override (jeho persona)
  - PJ na cizí postavě → bez override (render = „PJ")
  - PJ na NPC → `overrideName/avatar/slug` = to NPC
- **`mode`/`onChange`** = editace deníku: hráč edit na své; PJ edit na komkoli; jinak `view`. Zápis `customDataPatch` (delta) přes stejnou mutaci jako list/mapa.
- **canEdit/canRoll gating** = zrcadlo mapy: `isManager || ownsCharacter(slug)`.

### 4.3 `BestieRollPanel` (katalog)
- Vstup: `bestieId` (z bestiáře). Načte katalogovou bestii (world+system scope).
- Render: `BestieStatblock` plněný z katalogu (ne tokenu), **staty read-only**, schopnosti s kostkou.
- **`onRoll`** schopnosti → `performSheetRoll` → `dicePayload` → chat, override = jméno+obrázek bestie (R1).
- Bez save (žádný token / žádná HP perzistence v chatu).

### 4.4 Roll → chat (sdílený most)
Extrahovat z `ChannelComposer.sendDiceRoll` znovupoužitelný „post dice to channel" (content + dicePayload + diceSkin + overlay trigger + volitelný override), aby ho volaly i rail panely. Composer ho dál používá pro holou kostku; rail pro hody z deníku/statbloku. Jeden tok, jedna dedup/overlay logika.

### 4.6 Čitelnost readoutu hodu (sdíleno s mapou)
**Nesrovnalost nalezena při planningu:** fullscreen overlay hodu [DiceRollOverlay.tsx:194-211](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx#L194) kolabuje rovnici na `label (modifier) = total` a **schovává součet kostek** (`payload.sum`). Zpráva v chatu [DiceMessage.tsx:99-103](../../../src/features/world/chat/dice/components/DiceMessage.tsx#L99) i textový fallback [formatMessage.ts:27](../../../src/features/world/chat/dice/lib/formatMessage.ts#L27) breakdown mají — outlier je jen overlay.

- **Fix:** do overlay rovnice doplnit operand `payload.sum` (znaménkově), ať čte `Ledový dotek (+4) −1 = +3` (schopnost +4 · hod kostek −1 · výsledek +3). Renderovat jen když `modifier !== 0` (u holého hodu `sum === total` → breakdown je šum).
- **Dosah:** sdílená komponenta → opraví overlay v **mapě i chatu** najednou. Data už v payloadu (`sum`/`modifier`/`total`), čistě JSX.
- **Zařazení:** součást 16.1a (čitelný hod = jádro „hodu za postavu"); zlepší mapu okamžitě.

### 4.5 Sekvence (delegováno na Claude)
1. **16.1a** ✅ — `ChatContextRail` + `DiaryRollPanel` + roll-most + **1 referenční systém (matrix)**; hráč-self i PJ-load-člena.
2. **16.1b** ✅ — search NPC v railu → NPC deník (sjednoceno v 16.1c do jednoho pole).
3. **16.1c** ✅ — jedno pole hledání (NPC + bestie) `RailEntitySearch` + `BestieRollPanel`.
4. **16.1d** ⏭️ **PŘESUNUTO ZA 16.2** (rozhodnutí 2026-06-23) — per-systém doplnit/ověřit `onRoll` klikatelnost + grafika railu. Splývá s **16.2a** (manuální per-systém průchod). Důvod: mechanika hodu je per-systém specifická (pool/roll-under nejdou přes `onRoll({modifier,kind})`; pravidla zná autor) a graficky se stejně dělá v 16.2a. Audit stavu (2026-06-23): hotové matrix/drd2/fate/pi; jen iniciativa coc/drd16/drdplus/drdh/gurps/dnd5e; nic shadowrun/jad.

---

## 5. Out of scope

- **Nový typ chatu / async play-by-post** — rozhodnuto 2026-06-15c, nestaví se.
- **Signature dice skin bestie** (volba B) — samostatný úkol, dotkl by se i mapy.
- **HP/staty perzistence bestie v chatu** — instance s HP žije na mapě (token), chat je roll-only.
- **Bestie-instance z běžící mapy s aktuálním HP** — chat bere katalog, ne živé tokeny (případná nadstavba).
- **Combat tracker / iniciativa v chatu** — chat není bojové plátno; iniciativa zůstává na mapě.
- **Grafický redesign jednotlivých sheetů** nad rámec napojení do railu (řeší per-systém checklist).

---

## 6. Acceptance kritéria

1. ✅ Hráč ve světovém chatu otevře rail „Můj deník" a vidí svůj deník dle `world.system`.
2. ✅ Hráč klikne na schopnost → hod se pošle jako zpráva do aktivní konverzace (3D overlay + readout), atribuovaný jeho postavě.
3. ✅ Hráč s víc postavami má v panelu selektor; default = přiřazená postava.
4. ✅ Editace deníku v chatu (hráč na své) se uloží do stejného Character subdoku (vidět i na listu/mapě).
5. ✅ PJ má rail „Přítomní" jako dnes; klik na člena načte jeho deník do railu, tlačítko ⟵ zpět.
6. ✅ PJ hod z deníku hráče → zpráva atribuovaná **PJ** (ne hráči).
7. ✅ PJ přes search najde NPC (jako u masky) → jeho deník v railu; hod atribuovaný NPC (jméno+avatar).
8. ✅ PJ přes search najde bestii z bestiáře → statblok; hod schopnosti atribuovaný bestii; staty read-only.
9. ✅ Referenční systém (matrix) projde celým tokem (hráč i PJ, postava + NPC + bestie).
10. ✅ Rail funguje na mobilu i desktopu (overlay/scrim vzor jako stávající `membersSlot`).
11. ✅ Readout overlaye hodu ukazuje součet kostek i velikost schopnosti odděleně (`schopnost (mod) hod = total`), pokud modifier ≠ 0 — v mapě i chatu (4.6).
12. ✅ `npm run build` (tsc -b) prochází; nové komponenty mají vitest pokrytí (roll adaptér + gating + rail mód switch + overlay readout breakdown).

---

## 7. Test plán

- **Automated (vitest):** roll adaptér (sheet `onRoll` → správný `dicePayload` + override dle R1) · rail mód switch (presence↔diary↔bestie, zpět) · gating (hráč nevidí cizí deník, PJ ano) · selektor víc postav · bestie staty read-only (žádný save).
- **Smoke (ruční, reálný chat):**
  - Hráč: otevřít deník, hodit schopnost, ověřit zprávu + overlay + atribuci; editovat pole → ověřit na listu.
  - PJ: Přítomní → klik člen → hod (atribuce PJ); search NPC → hod (atribuce NPC); search bestie → hod schopnosti (atribuce bestie).
  - Mobil: rail jako overlay, zhasnutí scrimem.
- **`mobil-desktop`** skill po grafické části. **`funkce` + `napoveda`** po dokončení (změna funkčnosti chatu).

---

## 8. Riziko & rollback

| Riziko | Dopad | Mitigace |
|--------|-------|----------|
| Deník/diary fetch pro cizí postavu (PJ načítá hráče) nemá čtecí endpoint | PJ nenačte | Ověřit v plánu; reuse `useCharacter`/diára z `DiaryTab`; případně rozšířit BE GET (leak-safe, PJ gate) |
| `BestieStatblock` je svázaný s tokenem víc, než audit ukázal | bestie větev se zdrží | 16.1c je samostatný sub-krok; rámec (16.1a/b) nezávisí na bestii |
| Editace deníku v chatu × současně otevřený list = race | přepsání | delta `customDataPatch` (ne full replace) — vzor z mapy/D-040 |
| Per-systém `onRoll` díry (sheety bez klikacích hodů) | nekonzistentní zážitek | 16.1d iterace; rámec funguje i s iniciativou-only sheetem |
| Rail přebije úzký mobil | UX | reuse stávajícího `membersSlot` overlay/scrim chování |

**Rollback:** rail je aditivní (nové komponenty + gating); vypnutí = vrátit hlavičkové tlačítko na PJ-only a rail na `ChannelMemberPanel`. Žádná destruktivní migrace.

---

## 9. Otázky k autorovi

Žádné otevřené — autor rozhodl, volby zafixovány:
- **Atribuce:** PJ za hráče → jako PJ; NPC/bestie → jako loutka (R1).
- **Bestie:** propojit s bestiářem (katalog), házet za NPC i bestii; staty read-only, schopnosti klikací (R2).
- **Dice skin:** parita s mapou, signature kostky bestie out of scope (R3).
- **Pořadí:** delegováno — 16.1a→d (4.5).

---

**Po schválení specu napíšu implementační plán** (přesné komponenty / file diff / hooky) — začínaje 16.1a (rámec + matrix).
