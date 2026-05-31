# Plán 13.3 + 10.2k — Zvuky (databáze, mapa ambient, chat broadcast)

> Spec: [spec-13.3.md](spec-13.3.md). Stav: návrh k odsouhlasení.
> Stavěno v 5 sub-krocích, každý samostatně testovatelný a commitovatelný.

## Sub-krok A — Sdílené přehrávací jádro + typy (FE)

Nová feature `src/features/world/sounds/`.

1. `types.ts` — `Sound` interface + všechny enumy 1:1 dle BE `sound.schema.ts` (mediaType, primaryFunction, environment, emotionalTone, intensity, duration, loop, onset/outroProfile, factionStyle, techLevel, magicLevel, combatEnergy, tags, notes, status, worldId, proposedBy/proposedByWorldId, rejectReason, createdBy, timestamps).
2. `lib/soundEnums.ts` — čes. labely + pořadí pro každý enum (selecty, badge).
3. `player/youtubeId.ts` — `extractYoutubeId(url): string | null` (+ unit testy).
4. `player/youtubeApi.ts` — lazy singleton loader YT IFrame API (`window.YT` ready promise).
5. `player/useYoutubePlayer.ts` — hook: skrytý 1×1 div, `play(videoIds[], {loop})`, `stop()`, `setVolume(0-100)`; cleanup na unmount. Vrací `{ isPlaying, currentTitle? }`.
6. `player/soundActivation.ts` — jotai `soundActivatedAtom` (per tab) + `useSoundActivation()` (gate stav, `activate()` na user gesto). LS persist `ikr-sound-volume`, `ikr-sound-muted`.
7. `player/SoundActivateButton.tsx` + css — „🔊 Aktivovat zvuk" (sdílené mapou i chatem).

**Test:** youtubeId extrakce (různé URL formáty), soundActivation gate logika.

## Sub-krok B — Databáze (13.3, FE, BE-ready)

1. `api/soundsApi.ts` — `listWorldSounds(worldId)`, `listGlobalSounds()`, `createWorldSound`, `updateWorldSound`, `deleteWorldSound`, `importGlobalSound(worldId, globalId)`, `nominateSound(worldId, id)`; admin: `listPending`, `approveSound`, `rejectSound`.
2. `hooks/useSounds.ts`, `useGlobalSounds.ts`, `useSoundPending.ts`, `useSoundMutations.ts` (TanStack Query, invalidace klíčů).
3. `components/SoundCard.tsx` + css — proužek dle mediaType, název, badge řádek, intensity tečky, ▶ Náhled (cyan glow při hraní), akce dle role.
4. `components/SoundFiltersBar.tsx` + css — search vždy, „Filtry" toggle rozbalí selecty (7 dimenzí). Filtrace client-side nad listem.
5. `components/SoundFormModal.tsx` + css — create/edit, react-hook-form + zod, všechna pole.
6. `components/SoundPreviewBar.tsx` — „Právě hraje" sticky bar + ekvalizér anim (uses jádro A).
7. `components/NominationPanel.tsx` — admin sekce approve/reject (gate Admin+).
8. `SoundsPage.tsx` + css — skládá vše, taby Svět/Globální, layout dle BestiarPage.
9. `index.ts` export; **router.tsx** — nahradit stub `SoundsPage`.
10. Token `--sound-accent` do `_shared/map-tokens.css` (nebo nový `_shared/sound-tokens.css`) + per-skin override pokud třeba.

**Test:** SoundCard render dle role, filtrace, useSounds hook (mock api). **frontend-design** dle §10 spec. **mobil-desktop** audit stránky.

## Sub-krok C — Ambient na mapě (10.2k, FE, BE-ready)

1. Ověřit/doplnit FE patcher `applyOperationToScene` pro `sound.playlist` (BE handler existuje, `map-operations.service.ts:874`).
2. `tactical-map/components/sound/AmbientSoundPanel.tsx` + css — PJ panel (styl DiceLogPanel): multiselect z `useSounds`, pořadí, Play/Stop, volume; emit `sound.playlist { soundIds }` (optimistic přes existující ops mutaci).
3. `tactical-map/components/sound/SceneSoundPlayer.tsx` — mount jádra A, hraje `scene.activeSoundIds`; hráč gate `SoundActivateButton` + mute/volume; reaguje na scene state (patcher).
4. Integrace do `TacticalMapView` + zapojení panelu do PJ docku (vedle Efekty/Mlha/Kostka).

**Test:** patcher sound.playlist, AmbientSoundPanel emit, SceneSoundPlayer gate. **mobil-desktop** audit panelu.

## Sub-krok D — Chat broadcast (BE + FE)

**BE** (`backend/src/modules/chat/chat.gateway.ts`) — kopie typing vzoru:
1. `@SubscribeMessage('sound:play')` `{ channelId, soundId?, youtubeUrl?, name, loop }` → `resolveChannelPresenceRole` ≥ PomocnyPJ (Admin+ bypass), jinak ignore → `server.to('chat:'+channelId).emit('chat:sound:playing', payload)`.
2. `@SubscribeMessage('sound:stop')` `{ channelId }` → emit `chat:sound:stopped`.
3. BE testy: PJ projde, hráč ignorován, broadcast do správného roomu.

**FE** (`features/world/chat/` + `features/chat/`):
4. `ChannelInput` — 🎵 tlačítko (jen PJ): popover výběr ze `useSounds` nebo vložení YT URL → emit `sound:play`.
5. `chat/components/SoundNowPlayingBanner.tsx` + css — listener `chat:sound:playing/stopped`, banner + jádro A (gate u hráčů), Stop (PJ → `sound:stop`).
6. Socket wiring v chat socket vrstvě (listenery).

**Test:** banner render, PJ-only tlačítko, emit payload. **mobil-desktop** audit.

## Sub-krok E — Závěr

1. `mobil-desktop` finální audit všech 3 surfaces.
2. `napoveda` — aktualizace `/ikaros/napoveda` (stránka Zvuky, PJ broadcast, mapa ambient).
3. Roadmapa: 13.3 a 10.2k → `[x]` s poznámkou.

## Pořadí & závislosti
A → B (DB) → C (mapa) → D (chat) → E. A je prerekvizita všech. B/C/D nezávislé po A; stavím v pořadí dle spec §8.5.

## Pozn. k testům (memory)
FE bez precommit hooku → ověřuju ručně (`pnpm test`, `pnpm tsc`). Vitest bez globals (explicit importy), `fireEvent` ne user-event. BE před commitem `prettier --write` + testy.
