# upload-media / 07-infra-fallback — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno (HEAD):
- `backend/src/modules/upload/upload.service.ts` — celý soubor (720 řádků)
- `backend/src/modules/upload/upload.controller.ts` — celý soubor
- `backend/src/main.ts` — ServeStatic config, helmet, CORS
- `backend/src/common/throttler/throttler.config.ts`
- `backend/src/common/config/origins.ts`
- `backend/src/common/config/env.validation.ts` (BACKEND_BASE_URL výskyty)
- `backend/src/modules/upload/upload.service.spec.ts` — UM-06/07/08/09/14 testy
- `backend/src/modules/global-chat/clean-messages.job.ts`
- `backend/src/modules/maps/operations/map-operations.service.ts` (scene.image op)
- Grep-ové průchody přes celý BE src pro: `saveImageToDisk`, `local:`, `deleteAttachments`, `assertAttachmentsOrigin`, `assertMagicBytes`, `BACKEND_BASE_URL`, `ThrottlerGuard`

Scope oblasti 07: disk fallback (`saveImageToDisk` / `/static/` serving), Cloudinary config detekce, path traversal, MIME/magic-byte validace, limit drift FE↔BE, EXIF strip, dekompresní bomba, rate-limit, GDrive bloby.

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená | Poznámka |
|---|---|---|---|
| FB (disk fallback) | L3 | **L3** | kód čten v plné hloubce |
| TV (magic bytes) | L3 | **L3** | signatures + assertMagicBytes + testy |
| EX (EXIF strip) | L3 | **L3** | strip_profile v uploadImageToFolder ověřen |
| SZ (limity/dekomprese) | L3 | **L3** | c_limit 4000px + FE↔BE páry ověřeny |
| RL (rate-limit) | L3 | **L3** | @Throttle 20/min na všech upload routách |
| OR (GDrive orphan) | L3 | **L3** | extractCloudinaryPublicId→null, by-design |
| IJ (path traversal) | L3 | **L3** | folder=literál, deleteLocalImageByUrl traversal guard |
| L5/M-PROBE | L5 | ❌ | runnable probe — PROOF-REQUEST |

## Nálezy

### Nové nálezy (HEAD)

**UM-RUN-01** — `deleteAttachments` nemaže disk-fallback bloby · 🟠 · [OR/FB]
- Kde: `upload.service.ts:623-637`
- Popis: `deleteAttachments(attachments)` volá `cloudinary.uploader.destroy(att.publicId, ...)` syrově — bez větve pro `local:` prefix. Pokud chat příloha vznikla v disk-fallback módu (`publicId = 'local:...'`), `destroy` ji pošle na Cloudinary (404), lokální soubor zůstane navždy. Postiženo: `handleMessageDeleted` + `handleGlobalMessageDeleted` + `CleanMessagesJob`.
- Dopad: disk-fallback přílohy smazaných/prune-ovaných zpráv trvale leakují v `uploads/`. V prod při Cloudinary outage (= kdy fallback aktivní) se díra nafukuje bez horní meze.
- Návrh: v `deleteAttachments` přidat větev `if (att.publicId.startsWith('local:')) { await this.deleteLocalImageByUrl(att.url); continue; }` analogicky jako v `deleteImageByUrl`.
- L3 · 🆕

**UM-RUN-02** — `assertAttachmentsOrigin` — disk fallback nekontroluje URL · 🟡 · [FB/IJ]
- Kde: `upload.service.ts:184-185`
- Popis: `fromDisk = att.publicId.startsWith('local:')` — platí pro cokoliv s tímto prefixem, ale `att.url` se pro disk-větev nekontroluje vůbec (žádný `BACKEND_BASE_URL` kontrola). Klient může sestavit `publicId: 'local:foo'` + `url: 'https://evil.com/tracking.gif'` — projde origin guardem.
- Dopad: podstrčení cizí URL do chatu přes falešný `local:` publicId. Závažnost snížena tím, že zpráva bude renderovat URL z `att.url` — tracking/phishing obrázek. Nízká pravděpodobnost (klient musí vědět o disk-fallbacku), ale guard pak nedává záruky.
- Návrh: pro `fromDisk` větev ověřit i `att.url.startsWith(backendBase + '/static/')` kde `backendBase = this.configService.get('BACKEND_BASE_URL') ?? 'http://localhost:3000'`.
- L3 · 🆕

### Potvrzené + opravené (♻️ z původního sweepu 2026-06-14, ověřeno HEAD)

**UM-06** ✅ — disk fallback `local:` → `deleteLocalImageByUrl` s traversal guardem funkční · `upload.service.ts:583-600` · L3 · ♻️

**UM-07** ✅ — `assertMagicBytes` na všech 5 upload cestách (uploadFile/uploadGlobalChatFile/uploadWorldChatFile/uploadImageToFolder/uploadUserImage) · L3 · ♻️

**UM-09** ✅ — `flags: 'strip_profile'` v `uploadImageToFolder` (content/galerie/platform) · `upload.service.ts:398-399` · L3 · ♻️

**UM-12** ✅ — limity FE↔BE shodné, drift vyvrácen; zbývá jen fragmentace (🟡 dluh) · L3 · ♻️

**UM-14** ✅ — `LIMIT_DIMENSION_TRANSFORM` (c_limit 4000×4000) v `uploadImageToFolder` · `upload.service.ts:105-109, 396-398` · L3 · ♻️

**UM-10** ✅ (částečně) — `@Throttle({ default: { ttl: 60_000, limit: 20 } })` na všech 3 upload routách · `upload.controller.ts:44, 94, 137` · L3 · ♻️

**UM-16** ⚖️ — GDrive bloby → `extractCloudinaryPublicId`→null, `deleteImageByUrl` je ignoruje, by-design · L3 · ♻️

### Pozitiva (ověřeno HEAD)

- `/static/` nemá auth guard — záměrně (veřejný fallback pro Cloudinary outage), CORS locked na `getPrimaryOrigin()` (ne wildcard)
- `saveImageToDisk`: `folder` = vždy hardcoded literál ('gallery'/'platform'/'content') — žádná user-controlled část v path; extension z `file.mimetype.split('/')[1]` (whitelist MIME before this point) + `replace('+xml', '')` = čistá extension
- `deleteLocalImageByUrl` traversal guard: `path.resolve(root, path.normalize(rel))` + `startsWith(root + path.sep)` — testováno unit testem (`../../../etc/passwd` → nemazáno)
- `CLOUDINARY_URL` missing: logger.error + early return, žádný crash; fallback na disk aktivní automaticky
- Throttler: globální `APP_GUARD ThrottlerGuard` (100/min/IP) + per-route `@Throttle(20/min)` na upload endpointech; in-memory default, opt-in Redis
- `BACKEND_BASE_URL` chybí: warning v `env.validation.ts`, fallback `localhost:3000` jen v dev scénáři

## PROOF-REQUEST

**PR-07-01** — M-PROBE: nahraj chat přílohu přes FE v disk-fallback módu (vypni Cloudinary / nastav špatné creds), pak smaž zprávu → ověř, že lokální soubor v `uploads/` zůstane (UM-RUN-01 live). Vyžaduje BE restart s `CLOUDINARY_URL=` prázdná.

**PR-07-02** — M-PROBE: pošli ručně `POST /api/svet/:slug/chat/send` s `attachments: [{publicId: 'local:evil', url: 'https://tracking.example.com/px.gif', type: 'image'}]` → ověř, zda projde `assertAttachmentsOrigin` (UM-RUN-02 live). Vyžaduje platný JWT světového člena.
