# Spec 13.2c-push-delivery — Doručovací politika push notifikací (oprava duplicit + starých)

Dodatek k [spec-13.2.md](spec-13.2.md) §13.2c (PWA push). Spec 13.2c zavedla push
**transport** (SW, VAPID, subscribe). Tenhle dodatek řeší **doručovací politiku** —
nebyla specifikovaná a v provozu se projevila chybně.

## Problém (z provozu)

Hráčce přišla push notifikace na chatovou zprávu **několikrát** a **několik dní
starou**. Dvě nezávislé příčiny:

1. **Stará zpráva** — `webpush.sendNotification` se volal **bez `TTL`**. Default
   knihovny web-push je **28 dní** → když je telefon offline, push provider
   (FCM/Mozilla/Apple) notifikaci drží ve frontě a doručí ji najednou po
   probuzení, i dny starou. Pro „máš novou zprávu" je 28denní fronta nesmysl.
2. **Několikrát** — `notify()` posílá na **každý** subscription záznam uživatele.
   Když prohlížeč/OS **zrotuje** push endpoint, `upsertByEndpoint` (klíč =
   `endpoint`) založí **nový** záznam a starý zůstane (maže se jen na HTTP
   404/410). Dokud starý ještě chvíli „žije", doručí se na starý i nový → jedno
   zařízení dostane notifikaci víckrát. Kořen: `public/sw.js` neměl
   `pushsubscriptionchange` handler (úklid rotace) a notifikace neměla `tag`
   (slučování).

## Řešení (A + B + C)

### A — TTL + server-side collapse (BE)

- `PushPayload` rozšířen o transport-only `ttl?` (sekundy) a `topic?` (RFC 8030
  Push Message Topic) + klientský `tag?`.
- `sendToSubscriptions`: předává `TTL` (default **4 h**, konstanta
  `DEFAULT_TTL_SECONDS`) a `topic` (jen validní `^[A-Za-z0-9\-_]{1,32}$`, jinak
  vynechán) do `webpush.sendNotification`. `ttl`/`topic` se **nestrkají** do
  payloadu klientovi (jen `tag` ano).
- `topic` = **server-side collapse**: nová notifikace se stejným topicem
  **nahradí** předchozí nedoručenou ve frontě providera → offline zařízení po
  probuzení nedostane hromadu starých, jen poslední.
- Chat ([chat.service.ts](../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts)):
  push dostane `tag = topic = chat-{channelId}` → notifikace z jedné konverzace
  se slučují (na zařízení i ve frontě providera).

### B — úklid rotovaných odběrů (FE + BE)

- `public/sw.js` má nový `pushsubscriptionchange` handler → **re-subscribe**
  (obnoví lokální odběr, aby push dál chodil). VAPID klíč fetchne z veřejného
  endpointu; BE origin dostává query parametrem (`main.tsx` registruje
  `/sw.js?api=…`, protože SW je mimo bundler a nemá `import.meta.env`).
- ⚠️ SW se **nemůže** sám autentizovat na `POST /push/subscribe` — `JwtStrategy`
  bere token **jen z `Authorization: Bearer`** (access token je v JS paměti, ne
  v cookie) a rotace běží typicky bez otevřené appky. Proto nahlášení nového
  endpointu na BE řeší **FE** `usePush` autentizovaně: na mountu porovná aktuální
  endpoint s posledním známým (`localStorage['push:endpoint']`); při změně pošle
  `POST /push/subscribe` s `oldEndpoint` → BE starý smaže. Mrtvý starý endpoint
  mezitím stejně dostane 410 → auto-cleanup.
- `SubscribeDto` + `PushService.subscribe` přijímají volitelný `oldEndpoint`
  (smaže se před upsertem nového, jen když se liší).

### C — tag (FE)

- `sw.js` push handler: když payload nese `tag`, nastaví `options.tag` +
  `renotify: true` (sloučí bublinu, ale znovu upozorní zvukem/vibrací).

## Rozsah / dopady

- **BE** (Projekt-ikaros): `push.service.ts` (PushPayload, TTL/topic, oldEndpoint
  cleanup), `dto/subscribe.dto.ts` (`oldEndpoint?`), `chat.service.ts` (tag/topic),
  `push.service.spec.ts` (+5 testů). **Po nasazení restart BE.**
- **FE** (Projekt-ikaros-FE): `public/sw.js` (tag/renotify + pushsubscriptionchange),
  `app/main.tsx` (SW registrace s `?api=`), `features/notifications/api/usePush.ts`
  (endpoint sync přes localStorage). **Uživatel musí znovu navštívit appku**, aby
  se nahrál nový SW (`skipWaiting` ho aktivuje hned).
- Žádná změna WS kontraktu. DB schéma beze změny (oldEndpoint je jen request pole).

## Hranice (vědomě)

- **Víc fyzických zařízení** (telefon + PC) dostane notifikaci každé — to je
  správně, ne duplicita. Dedup řeší jen mrtvé endpointy **téhož** zařízení.
- **Reálné doručení** se ověří jen na HTTPS/serveru (jako celé 13.2c). Lokálně
  ověřeno: BE jest (15/15 push, chat push test), FE build (tsc -b).
- TTL 4 h je globální default i pro news/události/event-reminder. Pokud by někdy
  bylo potřeba delší (kampaňová pozvánka?), `PushPayload.ttl` to přebije.

## Testy

- BE: `subscribe` smaže `oldEndpoint` při rotaci / nemaže když shodný; TTL default
  4 h se předá; validní `topic` projde, nevalidní se vynechá; transport-only pole
  nejdou klientovi, `tag` ano. (`push.service.spec.ts` 15/15.)
- FE: build (tsc -b) zelený; `usePush` mount sync ověřitelný až s reálným push.

## Stav

- [x] Schváleno (uživatel: „všechny 3" = A+B+C, 2026-06-19)
- [x] Implementováno (2026-06-19) — BE TTL/topic/tag + oldEndpoint cleanup (+5 testů),
  FE sw.js pushsubscriptionchange + tag/renotify, usePush endpoint sync. ⚠️ Restart BE.
