# Spec 13.3 + 10.2k — Zvuky: databáze, ambient na mapě, broadcast do chatu

> **Stav:** Návrh k odsouhlasení
> **Kroky:** 13.3 (Zvuková databáze) + 10.2k (Ambient na mapě) + rozšíření (PJ posílá zvuk na poslech do chatu)
> **Datum:** 2026-05-31

---

## 1. Cíl

Tři propojené vrstvy nad **jedním sdíleným přehrávacím jádrem**:

1. **Databáze (13.3)** — stránka `/svet/:worldSlug/zvuky`: knihovna zvuků světa (grid karet, filtry, CRUD, import globálních, nominace). Nahrazuje stub `SoundsPage`.
2. **Ambient na mapě (10.2k)** — PJ nastaví playlist scény (`activeSoundIds`), všem na scéně hraje synchronně na pozadí.
3. **Broadcast do chatu** — PJ „pustí zvuk všem" v konverzaci (Discord-styl), banner „🎵 Právě hraje".

**Klíčová myšlenka:** hodnotu nedělá databáze, ale **broadcast** (synchronní přehrávání všem). Databáze je jen *zdroj*. Jádro architektury = přehrávací + broadcast vrstva; DB/mapa/chat jsou konzumenti.

⚠️ **Limit:** YT iframe per-klient = „všem hraje stejný track", ne sample-přesná synchronizace pozice. Pro ambient/hudbu dostatečné.

---

## 2. Ověřený výchozí stav

### Backend — HOTOVO (bez změn)
- Modul `sounds`: schema `Sound` (20+ metadat), world+globální, CRUD, import, nominační workflow.
  - `world-sounds.controller.ts`: `GET/POST/PUT/DELETE /worlds/:worldId/sounds`, `POST .../import/:globalId`, `POST .../:id/nominate` (write gated `>=PomocnyPJ`/Admin+).
  - `sounds.controller.ts`: `GET /sounds`, `GET /sounds/pending`, `POST/PUT/DELETE`, `:id/approve`, `:id/reject` (Admin+).
- Mapa: **DVĚ** ops, obě PJ-only, atomic `$set activeSoundIds`, broadcast `map:operation`:
  - **`sound.playlist { soundIds }`** — runtime ambient (má applyAtomic, `map-operations.service.ts:874`).
  - `scene.sounds.set { activeSoundIds }` — replace (library load, 10.2c-edit-2).
  - `MapScene.activeSoundIds: [String] default []` (`map-scene.schema.ts:53`). → pro ambient runtime použijeme `sound.playlist`.

### Backend — chat broadcast = čistě ephemeral WS, BEZ migrace
- Chat zpráva **nemá `type` enum** — má vzor `isDiceRoll`/`dicePayload` (+ `attachments`, `visibleTo`, `reactions`). „Now playing" zvuk **nepotřebuje persistovat** → **žádná změna schématu**.
- Chat gateway **ZNÁ world role**: `chatService.resolveChannelPresenceRole(...)` → `membership.role` (vzor z presence/typing). PJ-gate jde **přímo v gateway**, žádný REST endpoint.
- Ephemeral vzor existuje: `typing:start/stop` → emit `chat:typing` do room `chat:${channelId}` (timeout, nepersistuje). „Now playing" = 1:1 kopie tohoto vzoru.

### Frontend — stav
- `SoundsPage` = stub; route `zvuky`. Žádná sounds API/hooky. Žádný audio/YT přehrávač.
- Mapa: `MapScene.activeSoundIds` ve FE types + patcher `scene.sounds.set` (z 10.2c-edit-2). Žádné UI/přehrávač.
- FE types mají i `sound.playlist` — **BE ho podporuje** (má applyAtomic), takže není orphan. V plánu ověřit, že FE patcher `applyOperationToScene` řeší `sound.playlist` (pokud ne, doplnit).
- Vzor feature: `features/world/bestiar/`.

### Reference (Matrix)
- `SoundDatabase.tsx` (grid + 3 filtry + Now Playing), `MapSoundLibraryModal.tsx`/`MapPage.tsx` (playlist scény, broadcast, hráč „🔊 Aktivovat zvuk", volume, YT IFrame API s `playlist=`). Chat integrace zvuků v referenci NEEXISTUJE.

---

## 3. Architektura

### 3.1 Sdílené jádro `features/world/sounds/player/`
- **`youtubeId.ts`** — extrakce video ID z URL.
- **`useYoutubePlayer`** — skrytý 1×1 YT IFrame player; `playlist` (řetěz ID), `loop`, `volume`, `play/stop`; lazy-load YT API jednou.
- **Autoplay gate** — prohlížeč blokuje autoplay bez gesta. Jotai `soundActivatedAtom` (per tab). Když je zvuk aktivní a `!activated`, surface ukáže **„🔊 Aktivovat zvuk"** (první klik = gesto). Per-user mute+volume v LS.

### 3.2 Model `sounds/types.ts`
Zrcadlí BE `Sound` 1:1 vč. enumů (mediaType, primaryFunction, environment, emotionalTone, intensity 1–5, duration, loop, onset/outroProfile, factionStyle, techLevel, magicLevel, combatEnergy, tags, notes, status, proposedBy*, rejectReason). Čes. labely v `lib/soundEnums.ts`.

### 3.3 Surfaces

| Surface | „co hraje" | Přenos | Slyší |
|---|---|---|---|
| Náhled v DB | lokální | žádný | jen já |
| Mapa | `Map.activeSoundIds` (persist) | `scene.sounds.set` → `map:operation` | všichni na scéně |
| Chat | ephemeral „now playing" | REST `POST .../sound` → WS `chat:sound:playing` | účastníci kanálu |

---

## 4. Sub-krok 13.3 — Databáze (FE, BE-ready)

Feature `src/features/world/sounds/` (vzor bestiar):
- **`api/soundsApi.ts`** — `listWorldSounds`, `listGlobalSounds`, `create/update/deleteWorldSound`, `importGlobalSound`, `nominateSound`; admin `listPending`, `approve`, `reject`.
- **`hooks/`** — `useSounds` (TanStack list per svět), `useGlobalSounds`, `useSoundMutations`.
- **`SoundsPage.tsx`** — header 🎵 + „+ Přidat zvuk" (PJ+); filtry (mediaType/environment/emotionalTone/intensity/factionStyle/techLevel/magicLevel + fulltext); grid `SoundCard`; „Právě hraje" náhled bar; empty state; tab **Svět** + tab **Globální** (import).
- **`SoundCard.tsx`** — metadata badge, ▶ Náhled, ✎/✕ (PJ), Nominovat, Importovat.
- **`SoundFormModal.tsx`** — `name`+`youtubeUrl`+metadata selecty, zod validace.
- **Admin sekce** approve/reject (gate Admin+); plné admin-hub → fáze 12.
- Route: nahradit stub v `router.tsx`.
- **frontend-design audit** před impl. plánem.

## 5. Sub-krok 10.2k — Ambient na mapě (FE, BE-ready)
- **`AmbientSoundPanel`** v PJ liště: výběr z `useSounds` (multiselect→pořadí), Play/Stop, volume; emit **`sound.playlist { soundIds }`** (optimistic, PJ-only).
- **`SceneSoundPlayer`** v `TacticalMapView`: sdílené jádro hraje `scene.activeSoundIds` všem na scéně; hráč gate „🔊 Aktivovat" + mute/volume; reaguje na patcher.
- V plánu: ověřit FE patcher pro `sound.playlist` (doplnit, chybí-li).
- `mobil-desktop` audit.

## 6. Sub-krok Chat — PJ broadcast (BE + FE), bez migrace

**BE** — kopie ephemeral typing vzoru v `chat.gateway.ts`:
- `@SubscribeMessage('sound:play')` `{ channelId, soundId|youtubeUrl, name, loop }` → ověř roli přes `resolveChannelPresenceRole` (`>=PomocnyPJ`, Admin+ bypass; jinak ignoruj) → emit `chat:sound:playing` do room `chat:${channelId}`.
- `@SubscribeMessage('sound:stop')` → emit `chat:sound:stopped`.
- Žádná změna schématu, žádný REST, žádná persistence.

**FE:**
- V `ChannelInput` tlačítko **🎵** (jen PJ): výběr ze `useSounds` nebo vložení YT URL → emit `sound:play`.
- Listener `chat:sound:playing` → banner „🎵 Právě hraje: <název>" + sdílené jádro (gate u hráčů) + Stop (PJ → `sound:stop`).

## 7. Sub-krok závěr
- `mobil-desktop` audit všech surfaces. `napoveda` (nová stránka Zvuky + PJ broadcast + mapa ambient).

---

## 8. Rozhodnutí k odsouhlasení

1. **Chat model** — **ephemeral „now playing"** (Discord-styl, bez persistence). Žádná zpráva v historii v MVP.
2. **PJ-gate chat** — broadcast jen `>=PomocnyPJ` (Admin+ bypass).
3. **Late-joiner sync** — neukládat běžící zvuk; kdo přijde později, chytne až další. Ne v MVP.
4. **Admin approve/reject UI** — minimální gate teď, plné v admin-hubu (fáze 12).
5. **Pořadí stavby:** 13.3 (DB+jádro) → 10.2k (mapa) → chat → audity.

## 9. Dopady BE

| # | Změna | Soubor | Rozsah |
|---|-------|--------|--------|
| — | Mapa ambient (`sound.playlist`) | — | žádná (BE-ready) |
| 1 | Ephemeral `sound:play/stop` → `chat:sound:playing/stopped` + PJ-gate | `chat.gateway.ts` | malý (kopie typing) |
| — | Persistence/REST/migrace | — | žádná |

## 10. Design (frontend-design audit, 2026-05-31)

**Ověřená identita (z bestiar + map panelů):** stránka = `.page` flex column, `max-width 1100px`, `padding 20px`. Karta = **řádkový seznam** (`grid 64px/1fr/auto`, `gap 12px`), bg `rgba(10,8,32,0.4)`, border `1px rgba(120,100,255,0.15)`, `radius 8px`. Taby = spodní border, aktivní `rgba(120,100,255,0.7)`. Search input `rgba(20,14,50,0.6)`. Žádné `--color-*` tokeny — projekt jede **literal fialová rgba**. Mapové panely (DiceLogPanel/EffectsPalette): solid `--map-toolbar-bg-solid #0a0814`, `radius 12px`, `font-mono`, border přes `--accent`, uppercase title `letter-spacing 1.5px`. Obsazené map accenty: fog `#9fb4d4`, weather `#7fb8e6`, ping fialová, spotlight `#ff3b3b`, status zelená/zlatá/červená.

**Zvukový accent:** `--sound-accent: #22d3ee` (cyan, mapou nevyužitý) — proužek karty, ▶ glow, ekvalizér. „Právě hraje" puls cyan. Bez nových fontů, splývá s identitou.

**Stránka Zvuky:** layout 1:1 BestiarPage (header + „+ Přidat zvuk" PJ, taby **Svět** / **Globální**, search, řádkový seznam karet). Karta zvuku (řádek): levý barevný proužek dle `mediaType` (místo avataru), název + řádek badge (mediaType/environment/emotionalTone jako fialové chipy à la `.chip`), intensity 5 teček, vpravo akce ▶ Náhled (cyan glow při hraní) / ✎ / ✕ / Nominovat / Importovat dle role. Filtr bar = **sbalitelný** „Filtry ▾" (default jen search, rozbalí 7 selectů) — aby nezahltil. „Právě hraje" sticky bar nahoře s ekvalizér animací (cyan, respekt `prefers-reduced-motion`).

**Ambient panel mapy:** styl `DiceLogPanel` (solid panel, cyan accent, font-mono, sbalitelný chevron), seznam vybraných zvuků s pořadím, Play/Stop, volume slider. Hráč: kompaktní „🔊 Aktivovat zvuk" + mute/volume.

**Chat banner:** úzký pruh nad `ChannelInput`, cyan levý border + ekvalizér ikona, „🎵 Právě hraje: <název>", Stop (PJ). 🎵 tlačítko v `ChannelInput` vedle odeslání (jen PJ).

**Mobil:** karty řádkové (jako bestiar `<600px`: proužek+1fr, akce do řádku pod); filtr bar vždy sbalený; map panel `bottom/left/right:12px` full-width; chat banner full-width.

## 11. Mimo rozsah
Sample-přesná synchronizace; upload vlastních audio (jen YT); per-scéna více playlistů/crossfade; plné admin-hub approve/reject.
