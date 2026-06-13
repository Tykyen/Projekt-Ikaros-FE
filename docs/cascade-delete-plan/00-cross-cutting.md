# 00 — Cross-cutting: delete architektura, dependency graph, orphan-scan

Globální vrstva pod všemi entitami: tři nejednotné vzory mazání, blob lifecycle, atomicita, a dvě
mechanické metody (M-GRAPH dependency graph + M-SCAN orphan-scan), které chytají celé třídy najednou.
Tahle oblast drží **master matici** — ostatní oblasti z ní řežou svou entitu.

**BE:** [`world-hard-delete.service.ts`](../../../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts), [`upload.service.ts`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts), crony, `@OnEvent` listenery

---

## A. Master matice mazání (P1) — co se děje při delete každé entity

> Zmapováno Explore sweepem 2026-06-13. Status sloupec se plní v oblastech 01–06.

| Entita | Soft/Hard | Recovery | Cascade mechanika | Blob cleanup | Hlavní riziko |
|---|---|---|---|---|---|
| **Svět** | soft → hard cron 30d | ✅ Admin restore | centrální `WorldHardDeleteService` (~40 kolekcí) + `world.deleted` event→chat | ❌ `world.imageUrl` neuklizen | `EX` blob · `TX` best-effort · `DR` currentSceneId |
| **Stránka** | **hard přímo** | ❌ žádná | `findByIdAndDelete`, **žádný event** | ❌ `imageUrl`+`galleryImages[]` | `EX` blob · `DR` backlinks · `OR` favorites |
| **Postava** | hard + event | ❌ žádná | `character.deleted` → **3 `@OnEvent`** (accounts/subdocs/membership) | ❌ `membership.avatarUrl` | `EX` blob · `CC` fragilní 3 listenery |
| **Mapa/scéna** | **hard přímo** | ❌ žádná | inline subdokumenty (tokens/fog/effects/dice), **žádný event** | ⚠️ token obrázky? | `DR` **currentSceneId** · token bloby |
| **Obrázek** | bezstavový (URL) | — | cleanup jen `@OnEvent` (message.deleted, user.hardDeleted) | event-driven, **žádné ref-counting** | `EX` leak · `OC` over-cascade |
| **Uživatel** | soft → hard cron 30d | ✅ reaktivace v okně | anonymizace (`$set`/`$unset` PII) + `user.deletion.hardDeleted`→owner safeguard+blob+audit | ✅ avatar+character blob | `GD` PII jinde · mrtvý owner po restore |

> **Výsledek A:** _(doplnit při sweepu — potvrdit každý řádek čtením; 🔴 leaky povýšit na CD-xx)_

---

## B. Dependency graph (M-GRAPH) — kdo referencuje koho

> Sestavit z BE schémat: pro každou entitu (a) **child kolekce** keyed na její ID (orphan kandidát při
> chybějící cascade), (b) **cizí odkazy** držící její ID (dangling kandidát). Vyplní se M-GRAPH skenem.

| Entita (parent) | Child kolekce (keyed na ID) → `OR` | Cizí odkazy (drží ID) → `DR` |
|---|---|---|
| **svět** `worldId` | pages, characters, chat*, maps*, calendars, news, events, weather*, settings, memberships, … (~40) | — (kořen) |
| **stránka** `pageId`/`slug` | — (leaf) | `page.content` odkazy, backlinks, `User.favoritePageSlugs`, AKJ tabs |
| **postava** `characterId`/`slug` | character_diaries, _calendars, _finances, _inventories, _notes, _accounts | `membership.characterPath`, token na mapě, `page` characterRef, chat persona, odkazy v obsahu |
| **scéna** `sceneId` | (inline subdoc: tokens/fog/effects/dice) | **`membership.currentSceneId`**, knihovna snapshot? |
| **obrázek** (URL) | — | `page.imageUrl`/`galleryImages`, `membership.avatarUrl`, `world.imageUrl`, emote, gallery, `user.*ImageUrl` |
| **uživatel** `userId` | memberships (jeho), access requests, gm notes, favorites | `world.ownerId`, `chatmessage.authorId`, `mail.*Id`, friendship, audit log, `character` owner |

> **Výsledek B:** _(doplnit — M-GRAPH sken potvrdí hrany; každá hrana bez cascade kroku = OR/DR nález)_

---

## C. Blob lifecycle (P2) — Cloudinary cleanup matice

| Blob pole | Entita | Maže se při delete? | Kde / proč ne |
|---|---|---|---|
| `world.imageUrl` | svět | ❌ | hard-delete nevolá `deleteImage` → K-CD3 |
| `page.imageUrl` | stránka | ❌ | přímý delete bez eventu → K-CD1 |
| `page.galleryImages[]` | stránka | ❌ | netrackováno → K-CD1 |
| `membership.avatarUrl` | postava/membership | ❌ | character.deleted neřeší blob → K-CD2 |
| `custom_emotes` image | emote/svět | ⚠️ | ověřit (world cascade maže doc, blob?) |
| gallery image | ikaros galerie | ⚠️ | ověřit |
| `user.avatarUrl`/`characterAvatarUrl` | uživatel | ✅ | `user.deletion.hardDeleted` → `deleteUserImage` |
| chat attachments | chat zpráva | ✅ | `chat.message.deleted` → `deleteAttachments` |

> **Výsledek C:** _(doplnit — ✅ jen 2 cesty mají blob cleanup; zbytek leak. + over-cascade: žádné ref-counting → K-CD5)_

---

## D. Atomicita & event-fragilita (P4) — `TX`/`CC`

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| XC-01 | `WorldHardDeleteService` — ~40 kolekcí přes `safeDelete` (best-effort, selhání nestaví zbytek). Ověřit: selže-li kolekce #K, je opakování cronu **idempotentní** (doběhne zbytek), nebo orphan z #1..K-1 navždy? `[auto]` | `TX` | M1 | ⬜ K-CD6 |
| XC-02 | Character delete = `emitAsync('character.deleted')` → 3 `@OnEvent` (accounts/subdocs/membership). Selže-li jeden listener, ostatní doběhnou? je re-run idempotentní? → částečný orphan `[auto]` | `CC` | M1 | ⬜ K-CD9 |
| XC-03 | Žádný delete (kromě world/user) není v **session/transakci** → sekvence removeů může nechat mezistav. Ověřit, zda kritické cascade (postava: subdoc+account+membership) potřebují atomicitu `[auto]` | `TX` | M1 | ⬜ |
| XC-04 | Crony (`world-cleanup` 03:30, `account-cleanup` 03:00) — idempotence při pádu v půlce dávky; re-entrance (dva běhy naráz) `[auto]` | `TX` | M1 | ⬜ |

> **Výsledek D:** _(doplnit)_

---

## E. Orphan-scan (M-SCAN, P3) — tvrdý důkaz na dev DB

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| XC-05 | Pro každou child kolekci: dotaz „parent ID neexistuje v parent kolekci" → reálný orphan count (pages/characters bez světa, subdocs bez postavy) `[auto]` | `OR` | M-SCAN | ⬜ |
| XC-06 | Pro každý ref: `membership.currentSceneId` → scéna existuje? `membership.characterPath` → postava existuje? `world.ownerId` → user existuje? `favoritePageSlugs` → stránka existuje? `[auto]` | `DR` | M-SCAN | ⬜ |
| XC-07 | Blob: Cloudinary list `ikaros/**` vs DB URL refs → orphaned bloby (reálný leak count + náklad) `[auto]` | `EX` | M-BLOB | ⬜ |

> **Výsledek E:** _(doplnit — M-SCAN/M-BLOB dají reálná čísla; orphan/dangling/blob count = důkaz L4)_

---

## Známá rizika (předběžná)

- **Nejednotnost vzorů je kořen:** svět má centrální cascade + recovery, ale stránka/scéna mažou
  napřímo bez eventu → nemají kam zavěsit blob cleanup ani dangling cleanup. Jednotná oprava = každý
  delete emituje `*.deleted` s blob seznamem → centrální `@OnEvent` cleanup (řeší K-CD1/2/3 najednou).
- **Blob leak je nejjistější třída** (4 pole bez cleanup) — `EX` osa, oblast 05 matice.
- **`membership.currentSceneId` dangling** (K-CD4) — funkční dopad: hráč na mrtvé scéně, broken resolve.
- **Best-effort cascade** (world ~40 kolekcí, character 3 listenery) — `TX`/`CC` fragilita; potřebuje
  idempotentní re-run, ne atomicitu (Mongo cross-collection transakce drahé).
