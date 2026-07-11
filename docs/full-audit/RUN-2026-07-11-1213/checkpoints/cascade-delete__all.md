# Cascade-delete audit — checkpoint RUN-2026-07-11-1213 (READ-ONLY)

> Styl: cascade-delete (registr `docs/cascade-delete-audit.md`, prefix `CD-`). Plán přečten
> (README + 00-cross-cutting + tools/orphan-scan). Původní audit UZAVŘEN 2026-06-13 (CD-01..09
> opraveno/by-design) + RUN 2026-06-20 (CD-RUN-1..6 + FIX-25..29). Tento běh = re-audit VŠECH
> mazacích cest (svět · postava · uživatel · kanál · stránka · bestie · rostlina) do L1-L3.
>
> **Vstupní kontext (zadání):** +db proof našel 1 orphan (`character.worldId` → neexistující svět)
> + bug-05 blob-leak (chat TTL); CD-PLANT-1 (plant update blob leak) potvrzen.
>
> **Klasifikace:** 🆕 nový (od uzávěrky) · ♻️ recidiva/reziduum známého · 🔓 regrese dřívější opravy.

---

## Verdikt

Jádro cascade (svět/stránka/postava/uživatel) je od uzávěrky **výrazně zpevněné a bez regrese** —
CD-01..09 + CD-RUN + FIX-25..29 drží. **Nové leaky jsou soustředěné do 3 mladších/opomenutých
povrchů: chat-přílohy zpráv, nábory (19.3) a herbář-rostliny (21.5a).** Nejzávažnější je únik
**všech příloh chatu světa** při hard-delete světa (blob-nesoucí `chatmessages.attachments` nikdo
neposbírá).

**# 🆕 = 5** (z toho 1× 🔴, 1× ⭐ střední-vyšší) · **♻️ = 1** · **🔓 = 0**

---

## 🆕 NÁLEZY

### CD-NEW-1 🔴 `EX` — přílohy chatových zpráv leakují při hard-delete světa

- **Kde:** [`world-hard-delete.service.ts:80-95`](../../../../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts#L80) `BLOB_COLLECTIONS` sbírá `chatchannels.imageUrl` + `chatgroups.imageUrl`, ale **NE** `chatmessages.attachments[]`. Řádek [:189](../../../../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts#L189) `deleteMany('chatmessages', {worldId})` smaže dokumenty, ale přílohy (Cloudinary `publicId`) se nikam neemitnou.
- **Úryvek:**
  ```ts
  const BLOB_COLLECTIONS: Record<string, string[]> = {
    custom_emotes: ['imageUrl'], mapScenes: ['imageUrl'], chatgroups: ['imageUrl'],
    bestiae: ['imageUrl'], worldMapEntries: ['imageUrl'],
    worldmemberships: ['avatarUrl', 'pjPersonaAvatarUrl'],
    pages: ['imageUrl'], chatchannels: ['imageUrl'], campaignSubjects: ['avatarUrl'],
    game_events: ['imageUrl'], timeline_events: ['imageUrl'], worldnews: ['imageUrl'],
    // chatmessages.attachments CHYBÍ ↑
  };
  ```
- **Co zůstane:** VŠECHNY obrázkové přílohy chatu světa na Cloudinary — navždy. U aktivního světa
  jde o největší jednotlivý objem blobů (roky chatu × přílohy).
- **Vratné?** Ne (URL pryč z DB → jen plošný Cloudinary sken).
- **Poznámka k impl.:** `attachments` je pole objektů (`{ publicId, url, ... }`), ne string field →
  potřebuje variantu jako `collectGalleryBlobs` (extrakce `.url`/`.publicId`), a `deleteAttachments`
  bere `ChatAttachment[]`. Vzor už existuje (per-zpráva `chat.message.deleted` → `deleteAttachments`).

### CD-NEW-2 🟠 `EX` — přílohy zpráv leakují při smazání kanálu/skupiny + TTL purge (= bug-05)

- **Kanál/skupina delete:** [`chat.service.ts:460`](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L460) (deleteGroup) a [`:626`](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L626) (deleteChannel) volají `messageRepo.softDeleteByChannelId()` — zprávy se jen **soft-smažou** (`isDeleted=true`), **žádný per-zpráva `chat.message.deleted`** → přílohy se nikdy neuklidí. Ikona kanálu/skupiny se čistí (`media.orphaned`, FIX-27/28), přílohy zpráv NE.
- **TTL purge (bug-05):** [`chat-message.schema.ts:82`](../../../../Projekt-ikaros/backend/src/modules/chat/schemas/chat-message.schema.ts#L82) `ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`. Efemérní zprávy (Camp/Hospoda/expiresAt) maže **Mongo TTL monitor**, který **nevystřelí žádný app event** → přílohy leaknou. Potvrzuje bug-05 blob-leak (chat TTL) na úrovni schématu.
- **Co zůstane:** přílohy soft-smazaných / TTL-vypršelých zpráv. Manifest: kombinace s CD-NEW-1
  (soft-smazané při delete kanálu později smete world hard-delete `deleteMany` → přílohy leaknou tam).
- **Návrh:** soft-delete kanálu → posbírat přílohy zpráv → `media.orphaned`. TTL: buď aplikační
  cron (místo Mongo TTL) s emitem, nebo pre-expiry sweep příloh.

### CD-NEW-3 🟡 `EX` — edit zprávy: odebrané přílohy neuklizeny

- **Kde:** [`chat.service.ts:1631-1636`](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L1631) `editMessage` — `attachmentsToRemove` jen odfiltruje přílohy z pole, [:1670](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L1670) emituje pouze `chat.message.updated` (bez blob cleanup).
- **Úryvek:**
  ```ts
  if (dto.attachmentsToRemove?.length) {
    const removeSet = new Set(dto.attachmentsToRemove);
    nextAttachments = nextAttachments.filter((a) => !removeSet.has(a.publicId));
  }
  // ...nikde media.orphaned / deleteAttachments pro odebrané
  ```
- **Co zůstane:** blob odebrané přílohy na Cloudinary. **Vratné?** Ne. **Návrh:** diff odebraných →
  `media.orphaned`. (Analogie k `update`/`updateCommunityLore` u bestiae, které blob swap řeší.)

### CD-NEW-4 🟠 `CC`/`DR`/`EX` — nábory (19.3) mimo world cascade + bez blob cleanup

- **Kde 1 (completeness):** [`world-hard-delete.service.ts:12-72`](../../../../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts#L12) `WORLD_SCOPED_COLLECTIONS` **neobsahuje `nabory`**, přestože [`nabor.schema.ts:11`](../../../../Projekt-ikaros/backend/src/modules/nabory/schemas/nabor.schema.ts#L11) má `worldId?` (+ `worldSlug`/`worldName`). → po hard-delete světa zůstanou nábory vázané na svět jako orphan / dangling ref na neexistující svět.
- **Kde 2 (blob):** [`nabory.service.ts:158-162`](../../../../Projekt-ikaros/backend/src/modules/nabory/nabory.service.ts#L158) `delete` = jen `repo.delete(id)` — `imageUrl` blob ([schema:16](../../../../Projekt-ikaros/backend/src/modules/nabory/schemas/nabor.schema.ts#L16)) se NEuklízí ani při běžném smazání náboru.
- **Kde 3 (účet):** nabory nemá `@OnEvent('user.deletion.hardDeleted')` → nábory + jejich bloby autora přežijí hard-delete jeho účtu (EX + GD reziduum).
- **Co zůstane:** dangling `worldId`/`worldName` po světě + osiřelé `imageUrl` bloby. **Vratné?**
  orphan skriptem ano, blob ne. **Návrh:** `nabory` do `WORLD_SCOPED_COLLECTIONS` + `imageUrl` do
  `BLOB_COLLECTIONS`; `delete` emit `media.orphaned`; přidat account-hardDelete listener.

### CD-NEW-5 🟠 `EX` — herbář rostlina: blob leak při update i delete (= CD-PLANT-1)

- **Kde:** [`plants.service.ts:120-135`](../../../../Projekt-ikaros/backend/src/modules/plants/plants.service.ts#L120) `remove` = `repo.delete(id)` bez blob cleanup; [`:86-104`](../../../../Projekt-ikaros/backend/src/modules/plants/plants.service.ts#L86) `update` přepíše `imageUrl` bez úklidu starého. **Kód to sám přiznává** (:131-133):
  ```ts
  // Pozn.: úklid osiřelého `imageUrl` blobu (Cloudinary) tu ZATÍM neřešíme —
  // herbář nemá napojení na `media.orphaned` (bestiae ho má přes EventEmitter).
  // Viz report / potenciální dluh: hard-delete rostliny s obrázkem = orphan blob.
  ```
- **Co zůstane:** `imageUrl` rostliny na Cloudinary při KAŽDÉ výměně obrázku i smazání. Herbář nemá
  soft-delete → nevratné hned. Navíc žádný `user.deletion.hardDeleted` listener (autorovy rostliny
  + bloby přežijí smazání účtu).
- **Návrh:** vzor bestiae — `update` diff blobu → `media.orphaned`; `remove` → `media.orphaned`;
  account-hardDelete listener (`findImageUrlsByOwner` + `deleteAllByOwner`, jako `bestiae.service:719`).
- **Potvrzuje** vstupní CD-PLANT-1 (update variant) + rozšiřuje na delete + account.

---

## ♻️ RECIDIVA / REZIDUUM

### CD-06/09-residue ♻️ `OR` — 1× orphan `character.worldId` → neexistující svět (db proof)

- +db proof (M-SCAN) našel 1 postavu s `worldId` mimo `worlds`. Odpovídá známému OR riziku
  CD-06 (world hard-delete best-effort `safeDelete` — jedna selhaná kolekce nezastaví zbytek, ale
  nechá reziduum) / CD-09 (character cascade). RC-D2 guard dnes brání phantom-create v soft-smazaném
  světě, ale historické reziduum přetrvává. **Dopad:** osiřelá postava (list per-world ji neukáže,
  neškodí live), leak dat. **Vratné?** ano — M-SCAN cleanup (`tools/orphan-scan.md`), dnes read-only.
- **Návrh:** povýšit orphan-scan z read-only na volitelný cleanup mód (set `worldId`=null / delete
  osiřelých), nebo idempotentní re-run world cascade nad reziduem.

---

## ✅ OVĚŘENO OK (bez regrese od uzávěrky)

| Cesta | Stav | Důkaz |
|---|---|---|
| **Svět hard-delete** | ✅ zpevněno | `BLOB_COLLECTIONS` (emotes/scény/skupiny/bestie/atlas/avatary/pages/kanály/campaignSubjects/game_events/timeline/news), `channelreadstatus` (CHANNEL_KEYED, FIX-2), `world.image.removed`, restore-race guard RC-D7 (`:145` `if(!world.deletedAt) return`). Char-subdoc + channel-subdoc keyed cleanup. |
| **Stránka delete** | ✅ CD-01/08 | `pages.service.ts:629-636` emit `page.deleted{imageUrl,galleryUrls}` → upload `handlePageDeleted` (blob) + users `onPageDeleted` (`pullFavoritePageSlug`). |
| **Postava delete** | ✅ CD-02/09 | `character.deleted` → `onCharacterDeleted` sbírá `avatarUrl`+ `pjPersonaAvatarUrl`? (avatarUrl) → `character.avatars.removed`; cascade `try/catch` best-effort (`characters.service.ts:455`). |
| **Bestie** | ✅ FIX-4/29 | `update`/`updateCommunityLore` blob swap → `media.orphaned`; `handleAccountHardDeleted` (user-scope bestie blob + `deleteAllByOwner`). `softDelete` záměrně BEZ blob cleanup (vratné). |
| **Uživatel (GDPR)** | ✅ K-CD10 | `anonymizeForHardDelete` `$unset` PII (bio/lastLoginAt/city/emailVerifiedAt/avatarUrl/characterAvatarUrl/profileImageUrl) + placeholder email; bloby přes upload listener; world owner safeguard (soft-delete světů). |

### ⚖️ Přijaté / latentní (ne nová regrese)

- **Bestie soft-delete nikdy hard-deleted:** `bestiae.service.softDelete` je vratné, ale žádný cron
  nevolá `repo.hardDelete` → soft-smazané bestie (+ jejich bloby) leží indefinitně. Stejný vzor jako
  CD-RUN-4b (ikaros-events). Vědomé (viz komentář `:233-238`), ale roste. Dluh, ne bug.
- **Komunitní bestie/rostlina autora smazaného účtu:** `handleAccountHardDeleted` mažou jen
  `ownerUserId` (user-scope), ne `authorId` (community/draft). Community obsah = tombstone by-design
  (jako fórum), ale `authorId` zůstává dangling po anonymizaci — GD drobnost, konzistentní s K-CD10.

---

## Doporučení (bez implementace — čeká souhlas)

1. **CD-NEW-1 (🔴):** přidat sběr `chatmessages.attachments` do world hard-delete (varianta
   `collectGalleryBlobs` / `deleteAttachments`). Nejvyšší priorita — objem.
2. **CD-NEW-4 (⭐):** `nabory` → `WORLD_SCOPED_COLLECTIONS` + `BLOB_COLLECTIONS`; blob cleanup v
   `delete`; account listener. Řeší orphan + dangling + blob najednou.
3. **CD-NEW-5:** herbář na `media.orphaned` vzor bestiae (update+remove+account).
4. **CD-NEW-2/3:** chat přílohy — soft-delete kanálu, TTL purge a edit-remove doplnit blob emit.
5. **M-GRAPH re-sweep:** `nabory` byl v listu opomenut → projít VŠECHNY `worldId`-nesoucí kolekce
   proti `WORLD_SCOPED_COLLECTIONS` (potenciál dalších opomenutých mladších modulů).
6. **Orphan-scan cleanup mód** pro reziduum `character.worldId` (CD-06/09).
