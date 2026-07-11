# Checkpoint — upload-media / 02-chat-prilohy

**Oblast:** `docs/upload-media-plan/02-chat-prilohy.md` (world + global + platform chat, cron cleanup, message ACL)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (guard/origin/cron/TTL ověřeny čtením service+schema+job). TTL leak ověřen ručně (schema:82 + clean-messages.job).
**Cílová L:** L3.

Přečteno: `chat.controller.ts:428-463`, `global-chat.controller.ts:161-199`, `platform-chat.controller.ts:106-126`, `upload.controller.ts:42-86`, `chat.service.ts` (`findChannelForUpload:2246`, `hasChannelAccess:143`, `sendMessage` origin:1386), `scheduled-messages.controller.ts:68`, `platform-chat.service.ts:255`, `global-chat.service.ts` (validateAttachments:411/489, expiresAt:438/512/543), `chat-message.schema.ts:82` (TTL index), `clean-messages.job.ts` (celý).

---

## Stav dřívějších oprav (regrese-check — DRŽÍ)

- **UM-08** ✅ origin validace kompletní ve VŠECH ukládacích cestách: world `sendMessage` `assertAttachmentsOrigin(dto.attachments,['world-chat/','chat/'])` (chat.service:1386), scheduled create (scheduled-messages.controller:68), platform `sendMessage` (`['platform-chat/']`, platform-chat.service:255), global send+whisper `validateAttachments` (doména + `global-chat/` prefix + počet, global-chat.service:411/489).
- **UM-13** ✅ chat gate: world upload member gate (`getMembershipAppearance`, chat.controller:461); `findChannelForUpload:2246` → `hasChannelAccess:143` (allowedMemberIds / PJ+ bypass / membership), **cross-world channelId → 403** (channel.worldId vázán na membership).
- Ruční delete úklid: `chat.message.deleted`/`chat.global.message.deleted`/`platform-chat.message.deleted` → `deleteAttachments` (upload:760-788). ✅

---

## Nové nálezy (🆕)

### UM-RUN-02-01 — Mongo TTL (1h) předbíhá `CleanMessagesJob` (2h) → přílohy globálního chatu NIKDY neuklizeny (osa DL/OR, 🟠) ⭐
- **Kde:** `chat-message.schema.ts:82` `index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`; global zpráva `expiresAt = now + 1h` (global-chat.service:438/512/543, `MESSAGE_TTL_MS=HOUR_MS`). `clean-messages.job.ts:20` `@Cron(EVERY_2_HOURS)`, `olderThan = now - 2h`, teprve ten sesbírá `attachments` → `deleteAttachments`.
- **Důkaz:** Mongo TTL monitor smaže dokument v ~1h **přímo na úrovni DB** — žádné Mongoose middleware ani app event. Cron při 2h už dokument nenajde (`pruneChannel` vrátí prázdno) → `deleteAttachments` se pro expirovanou zprávu nikdy nezavolá. **Cesta úklidu příloh v cronu je fakticky mrtvá.**
- **Dopad:** 🟠 — každá obrázková/dokumentová příloha globálního chatu (Camp/Hospoda) osiří na Cloudinary navždy. Ruční Admin delete čistí správně (`chat.global.message.deleted`); leak je jen automatická TTL expirace = běžný provozní stav (většina zpráv). World chat `expiresAt` nenastavuje → není TTL leak (přílohy přes `chat.message.deleted`).
- **Návrh:** buď aplikační cron místo Mongo TTL (s emitem `chat.global.message.deleted`/`deleteAttachments` před smazáním), nebo pre-expiry sweep příloh (cron kratší než TTL).
- **L:** L3 (schema + job + service přečteny; timing ověřen). Klasifikace: 🆕. **Cross-ref: cascade-delete CD-NEW-2 / bug-05** (týž kořen, potvrzeno nezávisle z upload perspektivy).

### UM-RUN-02-02 — Chat upload endpointy bez per-route `@Throttle` (osa RL/TV, 🟠)
- **Kde:** world `chat.controller.ts:428`, global `global-chat.controller.ts:161`, platform `platform-chat.controller.ts:106` — **žádný `@Throttle`** (jen globální 100/min/IP). Kontrast: generický `/upload` má `@Throttle 20/min` (UM-10).
- **Důkaz:** až ~100×10 MB/min/IP storage-spam přes chat upload. ext-34 anti-abuse tuto díru označil k opravě („upload throttle na chat:428"), FIXES-APPLIED (RUN) ji ale nepotvrzuje jako aplikovanou.
- **Dopad:** 🟠 (storage/DoS) — ale ploška je gate-ovaná (world = member; global = non-guest member; platform = Admin+), spam vázaný na účet, ne anonym. Konzistentní s vědomým UM-10 scopingem (throttle jen `/upload*`); severity mezi 🟡 (07 checkpoint) a 🟠 (ext-34). Vážím 🟠 kvůli objemu × chybějící byte kvótě (UM-RUN-00-02).
- **Návrh:** `@Throttle 20/min` na 3 chat upload routy (parita s `/upload*`).
- **L:** L3. Klasifikace: 🆕 (rozšíření UM-10 na chat plochu; cross-ref ext-34).

### UM-RUN-02-03 — 10 MB world-chat limit obejitelný na 50 MB přes `POST /upload` (osa SZ/CT, 🟡)
- **Kde:** dedikovaný world-chat upload `chat.controller.ts:432` = `ATTACHMENT_MAX_BYTES` (10 MB), ale generický `upload.controller.ts:63` = 50 MB, folder `chat/<worldId>/<channelId>`. World `sendMessage` origin check pouští prefix `chat/` (UM-08 `['world-chat/','chat/']`) → 50MB příloha nahraná přes `/upload` projde do world zprávy.
- **Dopad:** 🟡 — advertovaný 10 MB strop nekonzistentní; reálný strop 50 MB. FE chat s `channelId` navíc `/upload` (50 MB) přímo používá.
- **Návrh:** sjednotit limit, nebo origin check omezit na `world-chat/` prefix pro world zprávy.
- **L:** L3. Klasifikace: 🆕.

### UM-RUN-02-04 — World chat `assertAttachmentsOrigin` bez počtu-příloh capu (osa SZ/TV, 🟡)
- **Kde:** `assertAttachmentsOrigin` (upload.service:173) validuje jen doménu/prefix/type, **ne počet**. Global má cap (max 10 img/4 doc, `validateAttachments`), world/platform ne.
- **Dopad:** 🟡 — neomezený počet příloh na jednu world zprávu (velikost payloadu / render zátěž).
- **Návrh:** přidat count cap do `assertAttachmentsOrigin` (parametr max).
- **L:** L3. Klasifikace: 🆕.

---

## Drobnost / dluh (bez elevace)

- **Orphan-on-abandon (🟡 DL):** upload jde na Cloudinary PŘED `sendMessage`; nevyužitá/odmítnutá (TOCTOU access) příloha zůstane bez reconciliace. Týká se všech chat uploadů. Nízký dopad (URL veřejná dle UM-02, ale objem roste).
- **Origin check není world-vázaný (🟡 OR):** publicId `chat/<A>/...` prefix-only projde i v sendMessage světa B. Nízké kvůli UM-02 (URL stejně veřejná).
- **Filename raw (🟡 PV):** `file.originalname` ukládáno nesanitizovaně do `attachments[].filename` (upload.service:242/296/415); jen `uploadPlatformDocument:361` řeší latin1→utf8 (encoding, ne escaping). BE nepokládá pojistku; stored-XSS závisí na FE renderu — FE `MessageAttachments.tsx` renderuje jako React text node (escapováno) → dnes bezpečné, ale BE bez obrany.

## Prošlé / ověřené OK

- **UM-02 🟠 potvrzeno:** `ChatAttachment.url = secure_url` (veřejná Cloudinary URL); žádný signed URL/proxy → příloha whisperu/privátní zprávy (`visibleTo`) čitelná kýmkoli s URL bez ohledu na ACL. Beze změny (akceptováno registrem).
- **Guest block:** global upload `GUEST_NO_UPLOAD` (global-chat.controller:186). Platform upload Roles(Admin+) + `assertAccess`.
