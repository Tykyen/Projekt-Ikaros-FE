# 06 — Světy & univerzum (WorldsGateway + UniverseGateway)

Dva odchozí-only gateway. WorldsGateway míchá **broadcast do `world:{id}`** (updated/deleted/membership) a **per-user do `user:{id}`** (access requesty). UniverseGateway je čistě leak-safe signál. Hlavní osa: **room targeting** — kdo je v `world:{id}` roomu a tedy reálně dostane membership/update eventy.

**BE:** `modules/worlds/worlds.gateway.ts`, `modules/universe/universe.gateway.ts`
**FE:** `features/world/hooks/useWorldAccessSocket.ts`, `features/world/universe/hooks/useUniverseSocket.ts`, world dashboard/members/settings konzumenti

---

## A. `world:updated` / `world:deleted` — kdo poslouchá? 🔴

> **Klíčová mezera k prověření:** eventy jdou do `world:{worldId}`. Do toho roomu FE joinne přes `room:join world:{id}` — ale to dělá hlavně **WorldChatRoom**, **useUniverseSocket**, **useMapWeather**. Uživatel na **World dashboardu / Members / Settings** (mimo chat a mapu) **nemusí být v roomu** → `world:updated` mu nedorazí a vidí stale data.

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WRLD-01 | Najít **všechny** FE listenery na `world:updated`. Existuje vůbec? Pokud ano, kde, a joinuje ta komponenta `world:{id}` room? Pokud listener není → `world:updated` je emitován do prázdna (nikdo nekonzumuje) `[auto]` | `EX` `RM` | M1 | 🐛 W-9 |
| WRLD-02 | World dashboard / Settings stránka: drží `room:join world:{id}`? Pokud ne, změna světa od jiného PJ se neprojeví bez manuálního refreshe. Doložit (kandidát na gap) `[auto]` | `RM` | M1 | 🐛 W-9 |
| WRLD-03 | `world:deleted { worldId }` — FE listener? Pokud je svět smazán zatímco v něm jsem, mělo by mě to vykopnout / zobrazit hlášku. Ověřit, zda se to děje, nebo zůstanu na mrtvé stránce `[auto]` | `EX` `RM` | M1 | 🐛 W-9 |
| WRLD-04 | `world:updated` payload = celý `World`. Parita s FE `World` typem (po N-2/N-11 změnách). Ověřit, že emit nese pole, která dashboard renderuje `[auto]` | `PL` | M2 | ⏭️ |

> **Výsledek A — NÁLEZ W-9:** Grep celého FE na `world:updated`/`world:deleted`/`world:membership:changed`/`world:membership:removed` = **0 výskytů**. FE tyto 4 broadcast eventy **vůbec neposlouchá** → WorldsGateway je emituje do prázdna. Dashboard/Settings/Members nejsou real-time, `world:deleted` nevykopne. WRLD-04 (payload parita) je bezpředmětné, dokud event nikdo nekonzumuje. **Pozn.:** N-15 fix se opřel o „world:updated pokryje refetch" — neplatné.

---

## B. Membership eventy

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WRLD-05 | `world:membership:changed` payload = `WorldMembership`. **N-15:** dříve se po `transferOwnership` emitoval **bez** membership pole → `undefined` klientům. Opraveno odebráním z transferu (`world:updated` pokryje refetch). Ověřit, že **žádný jiný** emit `membership.changed` neposílá prázdný/neúplný payload `[auto]` | `PL` | M2 | ⏭️ W-9 |
| WRLD-06 | `world:membership:removed` payload = `string` (membershipId), ne objekt. Ověřit, že FE listener čte string, ne `.id` z objektu (typový drift) `[auto]` | `PL` | M2 | ⏭️ W-9 |
| WRLD-07 | Kdo poslouchá membership eventy? Members stránka by se měla live aktualizovat (nový člen, změna role). Ověřit listener + room join (`world:{id}`) na Members stránce `[auto]` | `EX` `RM` | M1 | 🐛 W-9 |
| WRLD-08 | **Leak:** `world:membership:changed` jde do `world:{id}` **všem** v roomu. Obsahuje membership citlivá data (poznámky PJ, interní role)? Ověřit, že hráč nevidí přes WS víc, než mu REST dovolí `[auto]` | `LK` | M4 | ⏭️ |
| WRLD-09 | Membership removed → chat sync: `world.membership.removed` interně spustí i `syncLinkedChannelMembers` (odebrání ze `allowedMemberIds`). Ověřit, že WS `world:membership:removed` a chat side-effect nejsou ve špatném pořadí (N-20 souvislost) `[auto]` | `LC` | M3 | ✅L1 |

> **Výsledek B:** Vše pod W-9 — membership eventy nemají FE konzumenta (WRLD-07 🐛). WRLD-05/06/08 (payload parita, leak) jsou bezpředmětné, dokud nikdo neposlouchá → po opravě W-9 znovu prověřit. WRLD-09 (chat side-effect pořadí) je interní BE event flow, nezávislý na WS doručení → OK.

---

## C. Access requesty — per-user `user:{id}`

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WRLD-10 | `world:access-requested` → `user:{ownerId}` (PJ vlastník dostane žádost). Payload `{ accessRequestId, worldId, worldName, worldSlug, ownerId, requesterId }`. Parita s FE `useWorldAccessSocket:48` `[auto]` | `PL` `RM` | M2 | ✅L1 |
| WRLD-11 | `world:access-approved` / `rejected` → `user:{requesterId}` (žadatel). FE `:53/:60` → toast + invalidace. Ověřit směrování (approved jde žadateli, ne vlastníkovi) `[auto]` | `RM` | M3 | ✅L1 |
| WRLD-12 | `world:access-cancelled` → `user:{ownerId}` (žadatel zrušil → PJ aktualizuje seznam). Ověřit, že cancel jde vlastníkovi, ne žadateli `[auto]` | `RM` | M3 | ✅L1 |
| WRLD-13 | Payload parita napříč 4 access eventy: `rejected` nemá `worldSlug` (inventura: `{ accessRequestId, worldId, worldName, requesterId }`), `approved` ho má. Ověřit, že FE nečte `worldSlug` u rejected (jinak undefined v odkazu) `[auto]` | `PL` | M2 | ⚠️ |
| WRLD-14 | `useWorldAccessSocket` mountuje se v IkarosLayout (globálně) → access toasty fungují i mimo daný svět. Ověřit, že nezávisí na `world:{id}` room joinu (jde do `user:{id}`) `[auto]` | `RM` | M1 | ✅L1 |

> **Výsledek C (kontrast s W-9):** Access eventy **mají** konzumenta — `useWorldAccessSocket` (IkarosLayout, globálně) poslouchá všechny 4, jdou do `user:{id}` (nezávislé na `world:{id}` roomu) → fungují všude. Směrování ověřeno (requested→owner, approved/rejected→requester, cancelled→owner). WRLD-13 (`worldSlug` u rejected) `⚠️` k doložení čtením FE handleru.

---

## D. Univerzum — leak-safe signál

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| WRLD-15 | `universe:updated` je **signál `{ worldId }` bez dat** (leak fix — skryté uzly se nesmí poslat plošně). FE `useUniverseSocket:68` na něj **refetchne** filtrovaný `GET /universe`. Ověřit, že emit NEnese mapu (žádný node payload) `[auto]` | `LK` `PL` | M2 | ✅L2 |
| WRLD-16 | `useUniverseSocket` joinuje `world:{id}` + **re-join po reconnectu** (`:43/:45/:47`). Ověřit, že po výpadku sítě universe mapa zůstane živá (na rozdíl od world chatu, CONN-17) `[auto]` | `LC` `RM` | M3 | ✅L2 |
| WRLD-17 | Edit mód suspend: během editace univerza by `universe:updated` neměl přepsat rozdělanou práci. Ověřit, že FE refetch je potlačen v edit módu `[auto]` | `LC` | M1 | ⚠️ |
| WRLD-18 | `universe:updated` jde do `world:{id}` — **N-8 souvislost:** klient joinl room bez membership checku. Protože payload je jen `{ worldId }` a data se tahají filtrovaným REST, leak nehrozí (i join bez membershipu dostane jen signál). Potvrdit tuto leak-safe vlastnost jako záměr `[auto]` | `LK` | M1 | ✅L1 |

> **Výsledek D:** Univerzum **vzorné** — `universe:updated` leak-safe signál `{ worldId }`, FE refetchne filtrovaný REST, `useUniverseSocket` má reconnect re-join ([:44-47](../../src/features/world/universe/hooks/useUniverseSocket.ts#L44)). Protiklad k W-9: universe poslouchá i re-joinuje správně, world dashboard ne. WRLD-17 (edit suspend) `⚠️` k doložení.

---

## Test coverage gaps

- `worlds.gateway.spec.ts` (4 testy) pokrývá `world:updated` + 3 access eventy — **chybí** test membership eventů (WRLD-05/06) a payload parity access `rejected` bez `worldSlug` (WRLD-13).
- **universe.gateway.ts nemá test** — leak-safe signál (WRLD-15) netestován. Gap-fill M7: ověřit, že emit nese jen `{ worldId }`.
- FE: žádný test `useWorldAccessSocket` ani `useUniverseSocket` (room re-join, edit suspend).

## Známá rizika (předběžná)

- **WRLD-01/02 (world:updated bez posluchače/roomu):** silné podezření, že `world:updated`/membership eventy nemají konzistentního konzumenta mimo chat/mapu. Buď je listener jinde (najít), nebo dashboard/members nejsou live → stale data po změně od jiného PJ. Systematická mezera „event jde do roomu, ve kterém příjemce není".
- **WRLD-08 (membership leak):** membership objekt do `world:{id}` všem — ověřit, že nenese PJ-only pole.
