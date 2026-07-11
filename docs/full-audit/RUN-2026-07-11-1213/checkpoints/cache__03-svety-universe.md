# Checkpoint — cache / 03 Světy & universe

**RUN:** 2026-07-11-1213 · **Styl:** cache-invalidation (TanStack Query) · **Registr:** `docs/cache-audit.md` (prefix `C-`)
**Osy:** `KM` `SC` `FO` `WS` + P1 (konzumentská inventura) / P4 (WS↔REST parita) / P5 (DEL/orphan).
**Read-only.** Dosažená L: **L2–L3** (statický key-match ověřen element-po-elementu + cross-feature konzumenti dohledáni do zdrojové query). Cíl L2+ splněn.

## Verdikt
**Bez nových nálezů (🆕 0).** Všechny 4 známé nálezy oblasti (C-01…C-04) jsou v aktuálním HEAD **opravené a přítomné** — žádný 🔓 regres. Nové mutace přibylé po sweepu 2026-06-05 invalidují korektně; cross-feature konzumenti pokryti.

## Stav známých nálezů (♻️ = přetrvává, ✅fix = oprava v kódu)
| ID | Stav v HEAD | Kde | Důkaz |
|---|---|---|---|
| **C-01** 🟠 (join/approve netrefí detail) | ✅fix | `useWorldJoin.ts:15-17` `invalidate(['worlds'])`; `useWorldAccessSocket.ts:56-57` `['worlds']` | broad prefix trefí i detail `['worlds','id'|'slug',key]` |
| **C-02** 🟠 (approve bez members REST fallbacku) | ✅fix | `useWorldJoin.ts:68-70` approve `onSuccess` → `['worlds',worldId,'members']` | REST fallback nezávislý na WS |
| **C-03** 🟠 (`useUpdateMember` bez `my`) | ✅fix | `useUpdateMember.ts:37-38` → `['worlds','my']`; navíc WS parita `useWorldSocket.ts:63-65` (S-06) | vlastní role obnoví WorldContext |
| **C-04** 🟠 (world news bez WS push) | ✅fix | `useWorldSocket.ts:49-55` listener `world:news:changed` → `['world-news',worldId]` | BE emit + FE listener doplněn |
| **K-C1** ⚖️ by-design (`['worlds']` prefixuje vše) | ♻️ drží | `useWorldSocket.ts:45-47` | nejkratší společný prefix všech world dotazů |
| **D-03-6** 🟡 (`useUniverse` setQueryData bez onSettled) | ♻️ latent | `useUniverse.ts:35,48-50` | PUT/PATCH vrací plnou mapu → žádná lež k rollbacku; VERIFY nezměněn |
| **D-03-7** 🟡 (detail klíč `[1]='id'/'slug'` drift-trap) | ♻️ latent | `useWorlds.ts:28` | preventivní; kořen C-01, beze změny |

## Nové mutace oblasti (nebyly v matici sweepu 2026-06-05) — statický verdikt
Vše prošlo key-matchem, **žádný eskalovaný nález**:
- `useDeleteWorld` / `useRestoreWorld` (`useWorldLifecycle.ts:17-19,53-55`) → `invalidate(['worlds'])` broad. Pokrývá `my`/`public`/`deleted`(`['worlds','deleted']` prefix)/detail. ✅ Restore obnoví recovery panel i seznamy.
- `useElevateWorld` / `useDeElevateWorld` (`useWorldElevation.ts:18,27`) → `invalidateQueries()` (celá cache). Over-invalidation, ale **dokumentované & záměrné** (elevace mění práva napříč moduly; vzácná akce). ⚖️ by-design, ne nález.
- `useUpdateMyPjAvatar` (`useUpdateMyPjAvatar.ts:19`) → `['worlds']` broad. Cross-feature: PJ avatar v chatu jde přes `useChannelMembers` → `useWorldMembers` (`['worlds',worldId,'members']`, `ChannelView.tsx:232` `member.avatarUrl`) → **pokryto** broad prefixem. ✅
- `useUpdateAkjTypes` (`useUpdateAkjTypes.ts:17-18`) → jen `['worlds',worldId,'settings']`. Cross-feature: AKJ archive title `useAkjArchiveTitle.ts:30,46` čte `akjTypes` ze `useWorldSettings` (tatáž settings query) → **pokryto**. ✅

## Latentní / PROOF-REQUEST (neeskalováno na C-RUN)
- **D-03-RUN-1 `DEL`/`SC` 🟡 (latent)** — `useDeleteWorld` (`useWorldLifecycle.ts:12-22`) volá `invalidate(['worlds'])` (ne `removeQueries` na detail) a call-site `DeleteWorldTab.tsx:57-59` hned `navigate('/')`. Broad invalidace nakrátko refetchne AKTIVNÍ detail smazaného světa (`['worlds','slug',key]`) → soft-delete → 404/403. **Dopad:** navigace unmountuje WorldLayout ~okamžitě → refetch pravděpodobně abortován, potenciální krátký 404-flash. **Nízká viditelnost.** **Návrh:** `removeQueries(['worlds','slug'|'id',key])` místo spoléhat na abort. **PROOF-REQUEST (M4 runtime):** smazat svět ze settings, sledovat, zda problikne error UI před redirectem. **L1.**
- **D-03-RUN-2 `SC` 🟡 (info)** — elevace `invalidateQueries()` bez argu = nukleární (i cizí světy / celá platforma cache). By-design/dokumentované, jen zaznamenáno pro budoucí perf-audit (parita s over-invalidation charakterem `['worlds']`). **L1.**

## Pokrytí
Statická inventura celého world/universe mutačního povrchu (L2–L3): 4 query hooky (`useWorlds`, `useWorldSettings`, `useWorldMembers`, `useMyAccessRequests`) + `useWorldStatus` (derived) + `useWorldNews` (5 mutací, vše `['world-news',worldId]` ✅) + `useUniverse`/socket (✅ reconnect refetch `useUniverseSocket.ts:47-57`) + 13 world mutací (create/update/settings/akjTypes/transfer/theme/pjAvatar/member×3/join×5/lifecycle×2/elevation×2). WS vrstva: `useWorldSocket` (updated/news/membership/deleted) + `useWorldAccessSocket` (access-* + reconnect S-RUN-01) — P4 parita OK, membership WS invaliduje `members`+`my`.
**Census (M-CEN): čistý** — žádná mutace v oblasti bez cache efektu.

## Ne-pokryto / hranice
- `useWorldChat.ts` = namespace `world-chat` → oblast 06 (chat), mimo záběr.
- Runtime L4 (M4) neproveden (read-only statický průchod) — viz PROOF-REQUEST D-03-RUN-1.
