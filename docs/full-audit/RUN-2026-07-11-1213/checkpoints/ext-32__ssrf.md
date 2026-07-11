# ext-32 — SSRF / egress security · dosažená L3 (statika)

## Verdikt: seed 🔴 VYVRÁCENO na HEAD (díra už zavřená)
- `world-export/media-url.guard.ts:22-32` — striktní https + host `res.cloudinary.com`/`*.cloudinary.com`; substring `includes('cloudinary')` pryč.
- `world-export.service.ts:242-263` — `AbortSignal.timeout(10s)` + `redirect:'error'` + Content-Length/byteLength cap 25 MB.
- Regresní test existuje: `world-export/world-export.ssrf.spec.ts` (PT-32).
- Inventura egress: world-export = JEDINÉ místo s user-ovlivněnou URL; ostatní jdou na config/hardcoded hosty.

## Zbývající drobnosti (⭐/○ robustnost, ne P0)
- `platform-chat/platform-documents.service.ts:63` — `fetch(doc.url)` bez timeout/size cap. URL není user-free-text (jen z Cloudinary uploadu), ale defense-in-depth. FIX: `AbortSignal.timeout` + content-length check.
- `search/model-path-resolver.ts:41-55` — `http.get`+`pipe` bez timeout/size (boot-time, env URL). ○ nízká.
- Sdílený `assertPublicUrl` util NEEXISTUJE — dnes netřeba (jen 1 místo), ale vytvořit až přibude link-unfurl/avatar-by-URL/import-z-URL.

## Fix status: robustnost gapy = FIXNU (BE, bezpečné). Hlavní SSRF = bez zásahu.
