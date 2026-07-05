# Spec 17.6 — Hlas & video: Voice krčma (Jitsi adaptér)

**Stav:** návrh k implementaci (autonomní práce 2026-07-05, uživatel předal mandát)
**Váže:** roadmap2 §17.6 · memory `project_voice_17_6` · návrh vzhledu `mock-17.6-voice.html` + `scratchpad/krcma-var-{a,b,c}.html`

---

## 1. Cíl

Nová **globální hlasová místnost „Voice krčma"** v sidebaru CHAT (mezi Putykou a Campy). Účel: **pokec na mikrofonu** (voice-first) pro celou komunitu. Text běží vedle jako doplněk. Hlas/video pohání **Jitsi** (`meet.jit.si`, zdarma) přes **provider adaptér**, aby šel později vyměnit za LiveKit bez přepisu UI.

**Rozšíření nad původní roadmapu** (ta chtěla „jen Jitsi odkaz"). Odsouhlaseno uživatelem.

## 2. Klíčová rozhodnutí (uzavřená)

| Téma | Rozhodnutí |
|---|---|
| Engine | Jitsi `meet.jit.si` přes `provider` adaptér → LiveKit později (výměna modulu) |
| Umístění | Globální místnost `voice-krcma`, žije v `IkarosLayout` (mimo svět) |
| Přístup | **Jen registrovaní** (host ji nevidí ani do ní nevejde — `anonHidden` + BE guest gate) |
| Layout | **Voice-first** (velké dlaždice mikrofonů uprostřed), text pokec vedle |
| Kamera | Volitelná (účel je hlas) |
| Skin | **Vlastní identita ve tvaru+ornamentu** („Řezbářská krčma"), **barvy z `--theme-*` tokenů** → ladí s platformovým skinem uživatele |
| Pop-out | Volba: default panel uvnitř + „vytáhnout" → nová karta / Document PiP / `window.open` na 2. monitor; okna přes `BroadcastChannel` |
| Počet | Jedna krčma (rozšiřitelné) |
| Putyka/Camp | Beze změny |

## 3. Architektura

### 3.1 Rozdělení odpovědnosti
- **Jitsi** (meet.jit.si iframe): veškeré audio/video/WebRTC/signaling/TURN — běží **uvnitř** iframe pod CSP Jitsi. Náš BE **nedělá žádný WebRTC signaling**.
- **Náš BE**: (a) textový pokec (existující mechanika místností), (b) lehká **voice presence** „kdo je v hovoru + mute/cam" (jen metadata, ne media).
- **Náš FE**: voice-first UI (náš rám + ovladače přes Jitsi API), text pokec, voice presence roster, perzistentní voice-bar, pop-out.
- **Jitsi room name**: deterministicky z místnosti — `ikaros-voice-krcma` (všichni ve stejné krčmě = stejný Jitsi room).

### 3.2 BE (`Projekt-ikaros/backend`)
Modul `src/modules/global-chat` — místnosti řízené jediným zdrojem pravdy.

1. **`global-chat.service.ts:42`** — `RoomKey` union: přidat `'voice-krcma'`.
2. **`:48` `ROOM_DEFS`** — přidat `{ key: 'voice-krcma', name: 'Voice krčma' }` → auto-seed kanálu v `onModuleInit` (žádná DB migrace, `type` je volný String), REST i WS projdou samy.
3. **`resolveSenderIdentity` (:169-202)** — přidat `voice-krcma` do **hospoda-větve** (vystupuje **účtem** username+avatar, ne postavou — je to globální pokec).
4. **`presence-messages.ts:14`** — nová větev pro `voice-krcma` (krčmářský/hlasový tón hlášek).
5. **NEpřidávat** do `CAMP_ROOM_KEYS`/`CAMP_DEFAULT_GENRE`/`CampRoomKey` (není Camp → žádná rotace/save-load; `assertCampRoom` vrátí 400 správně).
6. **Gate**: host→403 **automaticky** (`global-chat.gateway.ts:306` guest gate + controller `assertGuestScope:87` pouští hosta jen do hospoda). Žádná změna.
7. **WS voice presence** (`global-chat.gateway.ts`):
   - `private voicePresence = new Map<RoomKey, Map<userId, {username, avatarUrl?, muted, cam}>>()`.
   - `@SubscribeMessage('voice:join')` `{room}` — `userId = client.data.userId; if(!userId) return;` + guest guard (host jen hospoda, ale voice-krcma stejně host nevejde) → zapsat, broadcast `chat:voice:presence {room, roster}` do `chat:{channelId}`.
   - `voice:leave` `{room}` — odebrat, broadcast roster.
   - `voice:state` `{room, muted, cam}` — ověřit userId, uprav flag, broadcast `chat:voice:state {room, userId, muted, cam}` (delta).
   - `handleDisconnect (:154)` — odebrat z voicePresence + broadcast; **dedup multi-tab** (odebrat až když padne poslední socket userId).
   - **Anti-spoof**: identita VŽDY z `client.data.userId`, nikdy payload.
   - **Ephemeral**: neukládat do historie (`saveSystemMessage`).
8. **Testy** `global-chat.gateway.spec.ts:~210` — přidat `'voice-krcma':0` do `getRoomCounts` `toEqual` map (jinak spec spadne).
9. **`docs/websocket-api.md` sekce 3** — doplnit kontrakt: příchozí `voice:join/leave/state`, odchozí `chat:voice:presence/state` (skill `socket-contract`).

### 3.3 FE (`Projekt-ikaros-FE`)
1. **`src/features/chat/lib/types.ts`** — `RoomKey`: přidat `'voice-krcma'` (zrcadlo BE).
2. **`src/app/layout/IkarosLayout/IkarosLayout.tsx:123` `CHAT_ROOMS`** — přidat `{ key: 'voice', roomKey: 'voice-krcma', label: 'Voice krčma', to: '/chat/voice', anonHidden: true }` (mezi hospoda a camp1).
3. **`src/app/router.tsx`** — route `chat/voice` → `VoiceKrcmaPage`.
4. **`src/features/chat/pages/VoiceKrcmaPage.tsx`** + **`src/features/chat/components/VoiceKrcma/`** — voice-first komponenta:
   - Layout: mini roster (kdo na mikrofonu) uprostřed velké dlaždice, ovládací lišta, text pokec panel vedle (reuse `MessageList`/`ChatInput` mechaniky z `ChatRoom`).
   - **Skin: „Řezbářská krčma"** identita (tvar/ornament stálé), barvy PŘES `--theme-*` (viz §3.5).
5. **Jitsi provider adaptér** `src/features/voice/`:
   - `provider/types.ts` — interface `VoiceProvider` (join/leave/toggleMic/toggleCam/toggleScreen/on(participant,speaking,state)/dispose).
   - `provider/jitsi/loadJitsiApi.ts` — lazy loader `external_api.js` (vzor `youtubeApi.ts`).
   - `provider/jitsi/JitsiProvider.ts` — `new JitsiMeetExternalAPI('meet.jit.si', {parentNode, roomName:'ikaros-voice-krcma', ...})`, ovládání přes `executeCommand`, eventy `participantJoined`/`dominantSpeakerChanged`/`audioMuteStatusChanged`, `dispose()`.
   - `useVoice.ts` — React hook obalující provider (vzor `useYoutubePlayer.ts`).
6. **`useVoicePresence(room)`** `src/features/chat/api/` — emit `voice:join/leave/state`, listen `chat:voice:presence/state` (vzor `useRoomPresenceCounts`); reconnect re-emit `voice:join` v `useSocketReconnect`.
7. **Perzistentní voice-bar** — jotai atom `voiceSessionAtom`, komponenta mount v `IkarosLayout` **mimo `<Outlet/>`** (přežije navigaci); ukazuje „jsi v krčmě" + mini ovladače.
8. **Pop-out** `src/features/voice/popout/`:
   - `window.open('/chat/voice?popout=1', 'ikaros-voice', ...)` — samostatné okno.
   - Document PiP (`documentPictureInPicture.requestWindow()`) — plovoucí nad vším (Chrome).
   - `BroadcastChannel('ikaros-voice')` — sync stavu okno↔appka; zavření okna = leave.
   - U Jitsi: „otevřít rovnou v okně" (připojí od začátku) preferováno před přenášením iframe (reload).

### 3.4 CSP (`Projekt-ikaros-FE/default.conf.template:113`)
Přidat `https://meet.jit.si` do:
- `script-src` (external_api.js)
- `frame-src` (Jitsi iframe)
- `connect-src` — bare `meet.jit.si` (kryje https+wss; postMessage není connect-src, ale obranně)
- `'unsafe-eval'` už je (YT) — nepřidávat.
- BE `main.ts` helmet **beze změny** (týká se jen /api).
- Rollout: nejdřív report-only (GitHub var `CSP_HEADER_NAME`), pak enforce (runbook 14.3).
- Doplnit řádek do `docs/arch/phase-14/spec-14.3.md` §5.2.

### 3.5 Skin — „Řezbářská krčma" na reálných tokenech
Identita (tesané dřevo, kované okování, vyřezávaný vlys) = **tvar/ornament, stálý**. Barvy **výhradně** z `--theme-*` (viz token kontrakt níže) → krčma se přebarví s platformovým skinem uživatele (Měsíc/Zlatý standard/Sci-fi/Bílá/…), včetně světlého `bila`.
- Povrchy: `--theme-surface`, `--theme-surface-strong`, `--theme-surface-soft`
- Okraje: `--theme-border`, `--theme-border-soft`
- Text: `--theme-text`, `--theme-text-muted`, `--theme-heading`
- Akcent (mluví/aktivní): `--theme-accent`, `--theme-accent-bright` + glow `--theme-glow-gold`
- Živé/online: `--success` / `--presence-online`; mute/off: `--danger`
- Overlaye: `rgb(var(--white-rgb)/α)` / `rgb(var(--black-rgb)/α)` — **nikdy** hardcoded barva (lint).
- Dřevo/kov = gradienty z `--theme-surface*` + `--theme-border`, ne fixní hnědá.

## 4. Rozsah V1
✅ Voice krčma místnost (registrovaní) · voice-first UI (Řezbářská, skin-aware) · Jitsi hlas+video+screen-share · mute/cam/screen/leave ovladače · voice presence roster (kdo mluví/muted) · text pokec · perzistentní voice-bar · pop-out (karta + Document PiP + window.open) · CSP.

## 5. Mimo scope V1 (dluh / později)
- Voice ve světovém chatu a na taktické mapě (stejné jádro, jiný mount — po odsouhlasení krčmy).
- LiveKit adaptér (provider připraven).
- Self-host Jitsi.
- Per-user volume, push-to-talk, deafen.
- Záložní vizuály (Alembik / Salon) — přepnutí = ornament-modul + tokeny.

## 6. Rizika / pasti
- ⚠️ **CSP enforce je LIVE** — bez úpravy templatu Jitsi iframe/skript zablokován. Report-only nejdřív.
- ⚠️ **Anti-spoof** — voice presence identita jen z `client.data.userId`.
- ⚠️ **Reconnect** — re-emit `voice:join` jinak „duch v hovoru".
- ⚠️ **BE restart povinný** — nová RoomKey se bez restartu neprojeví (auto-seed běží v `onModuleInit`).
- ⚠️ **Testy** `global-chat.gateway.spec.ts` — přidat voice-krcma do map.
- ⚠️ **Kontrakt drift** — doplnit voice eventy do `websocket-api.md`.
- ⚠️ **FE/BE zrcadlo** — `RoomKey` na obou stranách; BE zdroj pravdy.
- ⚠️ **Nemíchat BE+FE** v jedné dávce (jiná repa).

## 7. Ověření
- BE: `tsc` typecheck + jest (global-chat.gateway.spec) — `--runInBand`/`--maxWorkers=2` (flaky).
- FE: `npm run build` (tsc -b + vite) + vitest + `mobil-desktop`.
- **Nelze headless**: skutečný hlas/video (mikrofon/kamera) — ověří uživatel na reálném zařízení.

## 8. Co zbývá uživateli
1. Projít vizuál (Řezbářská vs Alembik/Salon).
2. **BE restart / redeploy** (nová místnost + voice presence).
3. **CSP redeploy** (report-only → enforce).
4. **Živý test hlasu/videa** na telefonu + PC (mikrofon/kamera).
5. Rozhodnout LiveKit upgrade (později).
