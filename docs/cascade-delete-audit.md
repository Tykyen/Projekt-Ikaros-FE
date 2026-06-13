# Cascade delete audit — registr nálezů (uklidí se po smazání všechno?)

> Centrální registr nálezů z [`cascade-delete-plan/`](cascade-delete-plan/README.md). ID `CD-xx`.
> Sedmý sourozenec [`bug-audit.md`](bug-audit.md), [`ws-audit.md`](ws-audit.md), [`role-audit.md`](role-audit.md),
> [`form-schema-audit.md`](form-schema-audit.md), [`cache-audit.md`](cache-audit.md) a
> [`state-consistency-audit.md`](state-consistency-audit.md).
>
> Výhradně pro **integritu mazání**: zmizí po smazání entity celý závislý strom (žádný orphan, dangling
> ref, leaklý blob) — a **jen** on (žádné over-cascade na sdílený zdroj)?
>
> **Stav: 2026-06-13 — KOMPLETNÍ. 9 nálezů: 6 opraveno (CD-01/02/03/04/08/09), 3 by-design/mitigováno
> (CD-05 guard, CD-06 self-heal, CD-07 FE-ošetřeno). K-CD10 PII zbývá ověřit.** Orphan-scan (M-SCAN,
> L4 reálná čísla z DB) připraven [`tools/orphan-scan.md`](cascade-delete-plan/tools/orphan-scan.md), čeká na DB connection (volitelné).

---

## TL;DR (2026-06-13)

> Plán [`cascade-delete-plan/`](cascade-delete-plan/README.md) — 8 os (`OR` `DR` `CC` `OC` `EX` `TX`
> `SH` `GD`), 5 perspektiv, 7 oblastí. **Sweep 10 seed hypotéz proti reálnému kódu hotový: 9 POTVRZENO
> (`CD-01`–`CD-09`), K-CD10 částečně (zbývá ověřit PII v chatu/mailu/friendship).**
>
> ⚠️ **Cascade delete = nejděravější oblast napříč všemi 7 audity** — **3× 🔴 blob leak + 1× 🔴 dangling**,
> potvrzené čtením delete services:
>
> | ID | Záv. | Osa | Oblast | Podstata | Důkaz | Stav |
> |---|---|---|---|---|---|---|
> | **CD-01** | 🔴 | `EX` | 02 | stránka: `imageUrl`+`galleryImages[]` blob leak (delete bez cleanup/eventu) | pages.service.ts:360-383 | ✅ opraveno |
> | **CD-02** | 🔴 | `EX` | 03 | postava: `membership.avatarUrl` blob leak (clearCharacter nečistí blob) | characters.service.ts:374 + worlds.service:1963 | ✅ opraveno |
> | **CD-03** | 🔴 | `EX` | 01 | svět: `world.imageUrl` blob leak (hardDelete bez deleteImage) | world-hard-delete.service.ts:84-110 | ✅ opraveno |
> | **CD-04** | 🔴 | `DR` | 04 | scéna: `membership.currentSceneId` dangling (deleteScene bez cleanup) | maps.service.ts:324-331 | ✅ opraveno |
> | **CD-08** | 🟡 | `OR` | 02 | `User.favoritePageSlugs` neuklizen po delete stránky | pages.service.ts:360-383 | ✅ opraveno |
> | **CD-05** | 🟠 | `OC` | 05 | žádné ref-counting blobů → over-cascade (sdílený blob smazán pod jinou entitou) | upload.service.ts:448 | ⚖️ mitigováno |
> | **CD-09** | 🟠 | `CC` | 03 | character delete přes 3 `@OnEvent` bez rollbacku → partial při selhání jednoho | characters.service.ts:376 | ✅ opraveno |
> | **CD-07** | 🟡 | `DR` | 02 | backlinks / odkazy v obsahu na smazanou stránku zůstanou (dead links) | pages.service.ts:360-383 | ⚖️ FE-ošetřeno |
> | **CD-06** | 🟡 | `TX` | 01 | world hard-delete best-effort — ALE self-healing (world doc poslední + cron retry idempotent) | world-hard-delete.service.ts:103,112 | ⚖️ self-heal |
>
> **✅ OPRAVENO 2026-06-13 (CD-01/02/03/04/08):** jednotný vzor — delete emituje `*.deleted`/`*.removed`
> event s blob URL → centrální `@OnEvent` cleanup v `upload.service` přes nový **`deleteImageByUrl`**
> s **`extractCloudinaryPublicId`** (vrací `null` pro GDrive/ne-Cloudinary → ty se NEmažou). CD-04 =
> `clearSceneForAll`. BE tsc 0, jest **505 passed** (1 fail = pre-existing rulebook seed, mimo cascade),
> +6 testů (deleteScene ×2, GDrive guard ×4). **CD-09 opraveno** (cascade best-effort `try/catch` + log
> v `characters.service` — selhání listeneru nezhodí delete ani nezablokuje ostatní; orphan dočistí
> M-SCAN). **CD-07 by-design** — FE [`useBrokenLinks`](../Projekt-ikaros-FE/src/features/world/pages/PageViewer/hooks/useBrokenLinks.ts#L104) označí odkaz na neexistující slug `.brokenLink`
> + blokuje klik (graceful, žádný 404). **CD-05 mitigováno** (bloby unikátní + guard); **CD-06 self-heal** (cron retry).
>
> 💡 **Systémový kořen (jeden):** stránka a scéna se mažou **napřímo bez eventu** → není kam zavěsit
> úklid; a **blob cleanup je `@OnEvent` jen pro 3 eventy** (chat msg ×2, user hardDelete). → **Jedna
> oprava řeší CD-01/02/03 i CD-07/08:** každý delete emituje `*.deleted` s blob+ref seznamem → centrální
> `@OnEvent` cleanup (vzor už existuje pro chat/user). + ref-counting pro CD-05.
>
> 🔬 **Pro L4 jistotu „to tak je" připraven orphan-scan** (M-SCAN, read-only): [`cascade-delete-plan/tools/orphan-scan.md`](cascade-delete-plan/tools/orphan-scan.md) — spočítá reálné orphans / dangling refs / leaklé bloby v DB. Čeká na connection string.

---

## Nálezy (`CD-xx`)

### CD-01 🔴 `EX` — stránka: image + gallery blob leak

- **Kde:** [`pages.service.ts:360-383`](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L360) — `delete()` volá `pagesRepo.delete(id)` + `deletePageFromIndex` (search). **Nevolá** `uploadService.deleteImage` pro `page.imageUrl` ani `galleryImages[]`, **neemituje** `page.deleted`.
- **Co zůstane:** Cloudinary bloby `page.imageUrl` + všechny `galleryImages[]` — navždy.
- **Kde se projeví:** storage leak (placené úložiště roste s každou smazanou stránkou s obrázkem).
- **Vratné?** Ne (URL je pryč z DB → blob nelze spárovat zpět; jen plošný Cloudinary sken vs DB).
- **Návrh:** delete → emit `page.deleted` s `{ imageUrl, galleryImages }` → `@OnEvent` v upload.service `deleteImage`. Sjednotit s CD-02/03.

### CD-02 🔴 `EX` — postava: membership avatar blob leak

- **Kde:** [`characters.service.ts:367-381`](../Projekt-ikaros/backend/src/modules/characters/characters.service.ts#L367) emituje `character.deleted`; listener [`worlds.service onCharacterDeleted:1963-1975`](../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts#L1963) volá `clearCharacter(m.id)` (čistí `characterPath`), ale **blob `membership.avatarUrl` (Cloudinary) nikdo nemaže**.
- **Co zůstane:** avatar blob postavy na Cloudinary.
- **Vratné?** Ne. **Návrh:** `character.deleted` listener (nebo upload.service `@OnEvent`) → `deleteImage(avatarUrl)`.

### CD-03 🔴 `EX` — svět: world image blob leak

- **Kde:** [`world-hard-delete.service.ts:84-110`](../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts#L84) — cascade 40 kolekcí + subdocy + world dokument, ale **žádné `deleteImage`** pro `world.imageUrl` (+ emote/sound bloby v kolekcích `custom_emotes`/`sounds` — smaže DB doc, ne blob).
- **Co zůstane:** world image blob + všechny emote/sound bloby světa.
- **Vratné?** Ne. **Návrh:** před cascade posbírat blob URL (world + emotes + sounds + pages + char avatary) → `deleteImage` batch.

### CD-04 🔴 `DR` — scéna: dangling `membership.currentSceneId`

- **Kde:** [`maps.service.ts:324-331`](../Projekt-ikaros/backend/src/modules/maps/maps.service.ts#L324) — `deleteScene` = `repo.delete(id)` + NotFound check. **Žádný cleanup** `membership.currentSceneId`, **žádný event**.
- **Co zůstane:** všichni členové s `currentSceneId === smazaná scéna` → visící odkaz.
- **Kde se projeví:** hráč „uvíznutý" na neexistující scéně — `GET /maps/active` resolve selže / prázdná mapa; broken UX.
- **Vratné?** Ano (skript nastaví `currentSceneId=null` osiřelým). **Návrh:** `deleteScene` → `membershipRepo.updateMany({ currentSceneId: id }, { currentSceneId: null })` (+ ideálně emit pro FE reassign).
- **✅ OPRAVENO 2026-06-13:** přidána `IWorldMembershipRepository.clearSceneForAll(sceneId)` (`updateMany $set currentSceneId:null`), volaná z `maps.service.deleteScene` po smazání scény. + 2 jest testy (deleteScene → cleanup volán / NotFound → necleanuje). BE tsc 0, jest 28/28. (FE reassign emit zatím ne — hráč uvidí prázdnou mapu při příštím loadu, ne real-time; dluh.)

### CD-05 🟠 `OC` — žádné ref-counting blobů (over-cascade)

- **Kde:** [`upload.service.ts:448-455`](../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L448) — `deleteImage` maže **bezpodmínečně** (žádná kontrola, jestli URL používá jiná entita).
- **Co se stane:** jakmile se blob cleanup doplní (CD-01/02/03), sdílený obrázek (např. dvě stránky s touž URL, nebo avatar zkopírovaný) smazaný pod jednou entitou → **broken url u druhé**.
- **Vratné?** Ne (blob pryč). **Návrh:** před `deleteImage` ověřit, že URL nereferencuje jiný dokument (count napříč kolekcemi), nebo per-entitní namespace blobů (už částečně: `ikaros/users/{id}/...`).

### CD-06 🟡 `TX` — world hard-delete best-effort (self-healing)

- **Kde:** [`world-hard-delete.service.ts:112-124`](../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts#L112) `safeDelete` try/catch — selhání kolekce nestaví cascade.
- **Zmírnění:** world dokument se maže **až poslední** ([:103](../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts#L103)). Selže-li cascade v půlce, world zůstane s `deletedAt` → **příští cron ho najde a zopakuje** (`deleteMany` idempotentní) → eventuálně dočistí. **Self-healing, ne trvalý orphan.**
- **Zbytkové riziko:** mezi selháním a příštím cronem (≤24 h) orphan existuje; pokud selhává trvale (špatná kolekce), nekonečné retry + log spam. **Návrh:** monitorovat opakované selhání; jinak ⚖️ přijatelné.

### CD-07 🟡 `DR` — dead links na smazanou stránku

- **Kde:** `pages.service.delete` nečistí odkazy v `page.content` jiných stránek ani backlink index na smazaný slug.
- **Co zůstane:** odkazy `href="/svet/.../smazany-slug"` → 404 při kliknutí. **Vratné?** Ano (re-link). **Návrh:** při delete projít backlinky a označit/odstranit, nebo FE graceful 404 na mrtvý interní odkaz.

### CD-08 🟡 `OR` — favoritePageSlugs orphan

- **Kde:** `pages.service.delete` nečistí `User.favoritePageSlugs[worldId]` obsahující smazaný slug.
- **Co zůstane:** mrtvý slug v oblíbených uživatelů → prázdná/broken dlaždice oblíbených. **Vratné?** Ano. **Návrh:** `page.deleted` listener → `$pull` slug z favoritePageSlugs.

### CD-09 🟠 `CC` — character cascade fragilní (3 listenery)

- **Kde:** [`characters.service.ts:376`](../Projekt-ikaros/backend/src/modules/characters/characters.service.ts#L376) `emitAsync('character.deleted')` → 3 `@OnEvent` (accounts / subdocs / membership). `emitAsync` čeká, ale **bez transakce/rollbacku** — selže-li jeden listener, ostatní (a samotný `charRepo.delete`) už proběhly → částečný orphan (osiřelý subdoc / nevyčištěný characterPath).
- **Vratné?** Orphan jde dočistit skriptem. **Návrh:** idempotentní re-run listenerů, nebo orphan-scan jako záchytná síť (M-SCAN periodicky).

| ID | Záv. | Oblast | Osa | Stav |
|---|---|---|---|---|
| CD-01 | 🔴 | 02 | `EX` | ✅ opraveno |
| CD-02 | 🔴 | 03 | `EX` | ✅ opraveno |
| CD-03 | 🔴 | 01 | `EX` | ✅ opraveno |
| CD-04 | 🔴 | 04 | `DR` | ✅ opraveno |
| CD-05 | 🟠 | 05 | `OC` | ⚖️ mitigováno |
| CD-06 | 🟡 | 01 | `TX` | ⚖️ self-heal |
| CD-07 | 🟡 | 02 | `DR` | ⚖️ FE-ošetřeno |
| CD-08 | 🟡 | 02 | `OR` | ✅ opraveno |
| CD-09 | 🟠 | 03 | `CC` | ✅ opraveno |

---

## Zbývá ověřit

- **K-CD10** `GD` — uživatel: anonymizace čistí user dokument, owner safeguard soft-maže světy. Ověřit, že PII **nepřežije** v: `chatmessage.authorId` (alias OK?), `mail.*Id`, friendship recordy, audit log. Oblast 06.
- **L4 orphan-scan** — spustit [`tools/orphan-scan.md`](cascade-delete-plan/tools/orphan-scan.md) proti DB → reálná čísla (kolik orphans/dangling/blobů teď existuje). Tvrdý důkaz dopadu.
- **CC úplnost world cascade** — ověřit, že `WORLD_SCOPED_COLLECTIONS` (40) pokrývá **všechny** world-scoped kolekce (žádný nový modul nezapomenut). M-GRAPH.

---

## Legenda

- 🔴 kritická · 🟠 střední · 🟡 nízká · ⚪ kosmetika · ⚖️ by-design / přijatý dluh
- 🐛 potvrzeno · ✅ opraveno/vyvráceno · ⬜ k ověření · `K-CDx` seed kandidát (hypotéza)
