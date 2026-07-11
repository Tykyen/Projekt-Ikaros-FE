# Checkpoint — cache / 00-cross-cutting (RUN-2026-07-11-1213)

> READ-ONLY re-audit oblasti [`docs/cache-plan/00-cross-cutting.md`](../../../cache-plan/00-cross-cutting.md)
> proti HEAD (main, 8fa5a1aa). Registr [`docs/cache-audit.md`](../../../cache-audit.md), prefix `C-`.
> Osy: `KM` `CB` `SC` `WS` `LC` · perspektivy P2/P6/P7.
> Fokus zadání: TanStack invalidace vzory · WS refetch/reconnect · staleTime · queryKey konvence ·
> **cross-user cache leak (`qc.clear` na logout/identitu)**.
> Klasifikace: 🆕 nový · ♻️ recidiva známého · 🔓 regrese dříve opraveného.

## Verifikace stavu dřívějších nálezů (proti HEAD)

| Nález | Původní stav | HEAD 2026-07-11 | Verdikt |
|---|---|---|---|
| **C-56 / C-05** ChatRoom reconnect re-join | 🟠 nález | `ChatRoom.tsx:283` `useSocketReconnect(() => { …room:join chat:${channelId}… + invalidate keys.messages })` | ✅ opraveno, drží |
| **C-57** theme cross-device „local wins" | 🟡 ⚖️ by-design | `useThemeSync.ts:43-53` local-wins zachován (záměr, race-protekce); C-28 cache write `:76-78` přítomen | ✅ by-design, drží |
| **C-58** `usePinnedChannels` bez `setQueryData` | 🟡 nález | `usePinnedChannels.ts:45-47` `qc.setQueryData<User>(['users','me'], …)` doplněn | ✅ opraveno, drží |
| **C-29** cross-user cache leak (qc.clear) | 🟠 (bezp.) | `useAuth.ts:49,78,105,142` — login/loginTotp/register/logout **všechny** `qc.clear()` | ✅ opraveno, drží |
| **K-C4 / K-C6 / K-C10** | ⚖️ vyvráceno | HEAD beze změny: router jen `requireAuth`; hydration bridge trvale mountnut; 0 first-segment-dynamic klíčů | ✅ verdikty drží |

## Cross-cutting sweep proti HEAD

### queryClient config (`main.tsx:26-33`)
- `staleTime: 30_000`, `retry: 1`, žádný `gcTime`/`refetchOnMount`/`refetchOnWindowFocus` override → semantika beze změny od 2026-06-05. Invalidace explicitní. **Bez nálezu.**

### queryKey konvence (K-C10)
- Grep first-segment-dynamic (`queryKey: [worldId`, `queryKey: [\``, `queryKey: [id`): **0 výskytů** na HEAD. Všechny klíče drží namespace string na `[0]`. Verdikt K-C10 **stále platí**. **Bez nálezu.**

### WS reconnect pokrytí (osa `WS`/`LC`) — plný census room-joining hooků na HEAD
| Hook / komponenta | join | re-join po reconnectu | soubor:řádek |
|---|---|---|---|
| `useWorldSocket` | `world:{id}` | ✅ | useWorldSocket.ts:34,41 |
| `ChatRoom` (Hospoda/Camp) | `chat:{channelId}` | ✅ **(C-05 opraveno)** | ChatRoom.tsx:283 |
| `ChannelView` (world chat) | `chat:{channelId}` | ✅ | ChannelView.tsx:273,298 |
| `useActiveScenes` | `map:join-world` | ✅ | useActiveScenes.ts:57,77 |
| `useMapSocket` | `map:join {sceneId}` | ✅ inline `connect` handler | useMapSocket.ts:87-97 |
| `useVoicePresence` | `voice:join {room}` | ✅ `useSocketReconnect` | useVoicePresence.ts:59-61 |
| **`useAdminChat`** (20.5, NOVÝ od sweepu) | `platform-chat:join {channelId}` | ✅ `useSocketReconnect` + invalidate messages (FIX-4, vzor C-05) | useAdminChat.ts:206-210 |

→ **WS reconnect pokrytí kompletní.** Nový admin-chat (20.5) se poučil z C-05. Žádná C-56-třídní mezera na HEAD.

### Cross-user cache leak — census VŠECH identity-set cest (osa P7 / C-29)
Enumerace produkčních cest, které nasazují/mění identitu (`set(accessTokenAtom|currentUserAtom, …)`):

| Cesta | Identita | `qc.clear()`? | Poznámka |
|---|---|---|---|
| `useLogin` | SET | ✅ `useAuth.ts:49` | C-29 |
| `useLoginTotp` | SET | ✅ `useAuth.ts:78` | C-29 |
| `useRegister` | SET | ✅ `useAuth.ts:105` | C-29 |
| `useLogout` | NULL | ✅ `useAuth.ts:142` | C-29 |
| **`useReactivateDeletion`** | **SET (fresh)** | **❌ chybí** | `useDeleteAccount.ts:108-114` → **C-59** |
| **`useRequestSelfDeletion`** (finalize) | **NULL (auto-logout)** | **❌ chybí** | `useDeleteAccount.ts:76-80` → **C-60** |
| `client.ts:106` refresh rotate | same user | n/a | token rotace, ne switch — správně |
| `useProfile.ts` / `useNotificationPreferences.ts` / `usePinnedChannels.ts` | same user (server data) | n/a | správně |

---

## NÁLEZY

### 🆕 🟠 C-59 · `P7`/`WS` · `useReactivateDeletion` nasazuje čerstvou identitu bez `qc.clear()` (parita s C-29 porušena)
- **Místo:** [`useDeleteAccount.ts:108-114`](../../../../src/features/profile/api/useDeleteAccount.ts#L108)
  ```ts
  onSuccess: (response) => {
    const store = getDefaultStore();
    store.set(accessTokenAtom, response.accessToken);
    store.set(refreshTokenAtom, response.refreshToken);
    store.set(currentUserAtom, response.user);   // ← nová identita
    store.set(loginModalOpenAtom, false);
    qc.invalidateQueries({ queryKey: ['users', 'me'] });  // jen /me, NE qc.clear()
    ...
  }
  ```
- **Rozpor:** reaktivace soft-smazaného účtu (`POST /auth/reactivate-deletion` z `ReactivateAccountModal`, spuštěno z login flow při `deletion_pending`) je **4. cesta nasazující identitu do stejného tabu** — sourozenci `useLogin`/`useLoginTotp`/`useRegister` volají `qc.clear()` **před** `store.set(...)` právě proto, aby se neobjevila cache předchozího stavu (C-29). Tato cesta clear **vynechává** — jen invaliduje `['users','me']`. Veškerá ostatní cache (guest/anon Hospoda data, nebo reziduum z cesty, která clear neudělala — viz C-60) přežije do reaktivované session.
- **Trigger:** login s creds účtu ve stavu `deletion_pending` → `ReactivateAccountModal` → reaktivace, když v tabu byla libovolná RQ cache (guest browsing, nebo předchozí self-delete auto-logout C-60). **Viditelnost:** tichá — cizí/starý cache záznam se zobrazí do staleTime/refetch. **Workaround:** F5. **Závažnost:** 🟠 (třída C-29 = cross-user leak; užší dosah — reaktivace startuje z odhlášeného stavu, dominantní reziduum je guest/veřejná data + interakce s C-60).
- **Návrh:** přidat `qc.clear()` před `store.set(accessTokenAtom, …)` (přesně jako `useAuth.ts:49`). Tím se sjednotí všech 5 identity-cest. Po `qc.clear()` je `invalidateQueries(['users','me'])` redundantní (hydration bridge refetchne z čisté cache) — lze ponechat i odstranit.

### 🆕 🟡 C-60 · `P7` · `useRequestSelfDeletion` (finalize) auto-logout bez `qc.clear()` (parita s `useLogout` porušena)
- **Místo:** [`useDeleteAccount.ts:73-84`](../../../../src/features/profile/api/useDeleteAccount.ts#L73) — po finálním `deletion-request` (dryRun=false) BE revokoval refresh tokeny; FE dělá auto-logout:
  ```ts
  qc.invalidateQueries({ queryKey: ['users', 'me'] });
  store.set(accessTokenAtom, null);
  store.set(refreshTokenAtom, null);
  store.set(currentUserAtom, null);   // odhlášení, ale žádný qc.clear()
  ```
- **Rozpor:** je to **logout-ekvivalentní** přechod (session se vyklízí), ale na rozdíl od `useLogout` (`useAuth.ts:142` `qc.clear()` + `clearAllComposerSticky/DraftAttachments`) **nečistí RQ cache** ani per-zařízení localStorage hygienu. Osobní data právě smazaného uživatele (pošta, postavy, profil) zůstanou v paměťové cache tabu. `enabled: !!accessToken` dotazy se sice po nulování tokenu nerefetchnou, ale `getQueryData` je stále vrací → komponenty čtoucí cache bez re-fetch je můžou zobrazit na „odhlášené" obrazovce.
- **Trigger:** dokončení self-delete → auto-logout → client-side navigace bez F5. **Viditelnost:** tichá; ohraničená — příští `useLogin` v témž tabu udělá `qc.clear()`. **Workaround:** F5 / příští login. **Závažnost:** 🟡 (ohraničené příštím loginem; hlavní hodnota = parita/defense-in-depth + živí C-59, když se reaktivuje tentýž tab).
- **Návrh:** za nulování atomů přidat `qc.clear()` (+ volitelně `clearAllComposerSticky()` / `clearAllDraftAttachments()` / `clearLastRoute()` jako `useLogout`), aby self-delete auto-logout měl stejnou hygienu jako běžný logout (C-29).

---

## Shrnutí
- **Dřívější 00-nálezy (C-56/C-57/C-58) + cross-cutting C-29 na HEAD vyřešené/by-design — bez recidiv, bez regresí.**
- **WS reconnect pokrytí kompletní** (7/7 room-joining hooků re-join; nový admin-chat 20.5 správně).
- **queryKey konvence drží** (K-C10 stále 0 výskytů first-segment-dynamic).
- **2 nové nálezy (🆕):** C-29 měl 4 identity-cesty (login×3 + logout), ale **deletion-flow má 2 další identity-přechody, které clear vynechávají** — `useReactivateDeletion` (🟠 C-59, identity SET) a `useRequestSelfDeletion` finalize (🟡 C-60, auto-logout). Doporučení: sjednotit `qc.clear()` napříč všemi 6 cestami.
- Úroveň jistoty: **L2** (statické čtení + key/census párování; runtime L4 neprovedeno — READ-ONLY).
