# ext-34 — Anti-abuse: kvóty & fan-out · dosažená L3

## 🔴 POTVRZENO (4×) — chybí kumulativní cap / dedup / role-gate
| Entita | create | cap? | násobič | fix |
|---|---|---|---|---|
| Characters | `characters.service.ts:285` | NE | ×6/×4 subdoc | countByWorld → MAX 5000 + `@Throttle 30/min` ctrl:133 + `@MaxLength(64)` slug |
| Pages | `pages.service.ts:287` | NE | ×7 (chain character) | countByWorld → MAX 5000 |
| Uploads | `upload.controller.ts:42/93/136` + `chat.controller.ts:428` | NE (bez byte kvóty) | neomezené bajty | per-user rolling byte kvóta (non-supporter 200MB/den, supporter 2GB); `@Throttle 20/min` i na chat:428 |
| Reports | `moderation.service.ts:114` | NE dedup | ×2 + email | partial unique index {reporterId,targetType,targetId, status:pending} + Conflict; `@Throttle 10/min` ctrl:37 |
| `@all`/`@here` | `chat.service.ts:1318,1343` | bez role-gate | ×N push | podmínit `broadcastMentions` rolí PomocnyPJ+ (canManageChat); jinak zůstane text |

- Worlds MAJÍ cap (3/30) — jediná capnutá entita. Globální throttle jen 100/min/IP; characters/pages/moderation/chat sendMessage jedou jen na tom.
- Kaskáda characters: create → character.created → subdocs (calendar+finance+inventory+diary+notes) = 1+5 dok; 100/min = ~36k dok/h/účet.

## Testy: characters.service.spec (cap), pages.service.spec, upload spec (kvóta bez Cloudinary), moderation.service.spec (dedup), chat.service.spec :2497 (mention role-gate).

## Fix status: FIXNU (BE) — kvóty characters/pages, mention role-gate, report dedup, upload throttle na chat:428. Upload byte-kvóta = střední (nové počítadlo) → zvážím / možná dluh.
