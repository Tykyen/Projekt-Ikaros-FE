---
name: monitoring
description: Třetí noha jistoty vedle plny-audit a pentest — zatímco ty jsou PŘEDLETOVÉ brány (snímek v čase před nasazením), monitoring hlídá BĚŽÍCÍ produkci a REAGUJE, když se něco pokazí nebo tě někdo napadá naostro. Pokrývá: uptime (web žije?), error tracking (padá to u reálných uživatelů?), metriky (latence/paměť/sockety/5xx), logy (rotace, disk), bezpečnostní alerty (brute-force/5xx spike běží TEĎ) a incident-response runbook (co dělat, když to spadne). Stack: 1 server, docker-compose.prod (mongo+redis+meili+backend), Caddy proxy, Discord komunita. Doporučené nástroje cost-conscious: UptimeRobot + Sentry free + Discord webhook alerty + docker log rotace. NEspouští se jednou — běží pořád; skill je návod, jak ho postavit a provozovat.
---

# Skill: monitoring (třetí noha — hlídač běžícího provozu)

**Proč třetí noha.** `plny-audit` a `pentest` jsou **předletová kontrola** — snímek „než to pustím ven".
Jakmile je web živý s reálnými uživateli (500 jeskyní), potřebuješ **přístroje za letu**: víš, když
server spadne, když někoho útok trefil, když latence roste, když dochází disk. Bez toho se o výpadku
nebo útoku dozvíš od hráčů na Discordu — ne od systému. Audit hledá, pentest ověří, **monitoring hlídá.**

> **Klíčový rozdíl:** audit+pentest = point-in-time gate (spustíš, doběhne). Monitoring = **always-on
> systém**, ne skill, který „proběhne". Tenhle skill je návod, jak ho **postavit a provozovat**.

## Co monitorovat — golden signals × náš stack

Čtyři zlaté signály (Google SRE) namapované na projekt-ikaros:

| Signál | Co to je | Kde měřit u nás |
|---|---|---|
| **Latency** | jak dlouho trvá odpověď | Caddy access log / Sentry perf / p95 hot endpointů (worlds, chat history, pages) |
| **Traffic** | kolik requestů/socketů | aktivní Socket.IO spojení, RPS, počet aktivních světů |
| **Errors** | míra selhání | 5xx rate (BE), FE JS chyby (Sentry), failed WS handshake, mailer bounce |
| **Saturation** | jak blízko limitům | RSS/heap, event-loop lag, Mongo pool, **disk** (429 MB textur/deploy + růst DB), CPU |

## Vrstvy (6) — co postavit, čím, a co potřebuje TVÉ rozhodnutí

| # | Vrstva | Co | Doporučený nástroj (cost-conscious) | Potřebuje od tebe |
|---|---|---|---|---|
| 1 | **Uptime** | web žije zvenčí? | **UptimeRobot** (free) — ping `/health` (BE) + FE origin á 1-5 min | účet + URL |
| 2 | **Error tracking** | padá to u reálných uživatelů? | **Sentry** (free tier) — `@sentry/nestjs` (BE) + `@sentry/react` (FE) | Sentry účet → DSN |
| 3 | **Metriky** | latence/paměť/sockety/5xx | rozšířený **`/health` readiness** (Mongo+Redis+Meili+disk+RSS) + volitelně `/metrics` (prom-client) | — (kód, viz níže) |
| 4 | **Logy** | rotace, disk-fill | docker `json-file` s `max-size`/`max-file` v compose | edit compose |
| 5 | **Alerty** | „něco hoří" TEĎ | **Discord webhook** (máš komunitu) — health degraded, 5xx spike, restart loop, disk >80 %, auth-fail spike | webhook URL |
| 6 | **Incident response** | co dělat, když spadne | runbook (níže) + rollback + restore | přečíst + zálohu (řeší se) |

## Konkrétní kroky (build)

### Krok 1 — Rozšířit `/health` na skutečný readiness probe (kód, bez účtu)
Dnes `app.controller.ts` kontroluje jen backend/mongo/env/cloudinary/vapid. **Doplnit: Redis (ping),
MeiliSearch (health), mailer (SMTP verify volitelně), disk (volné místo na uploads/mongo volume), RSS.**
Health-gate deploye (styl OPS 31) i UptimeRobot pak vidí realitu. Endpoint vrací `status: ok|degraded`.

### Krok 2 — Discord alert helper (kód, no-op bez webhooku)
Malý provider, který na `DISCORD_ALERT_WEBHOOK` (env) pošle embed. Bez env = no-op (jako VAPID/Cloudinary
fallbacky). Volat z: health-cron (degraded), global exception filter (5xx spike přes práh), auth
(login-fail spike = brute-force běží), disk-check. **Rate-limit alertů** (max 1/typ/10 min), ať tě
nezahltí vlastní alert-flood.

### Krok 3 — GlitchTip / Sentry error tracking (vybráno: self-hosted GlitchTip)
GlitchTip je Sentry-protokol-kompatibilní → používá se stejné SDK (`@sentry/*`), jen `SENTRY_DSN` míří
na vlastní GlitchTip instanci. Setup:
1. **GlitchTip instance** — přidat službu do `docker-compose.prod.yml` (image `glitchtip/glitchtip` +
   postgres + redis worker; oficiální compose z glitchtip.com/documentation) NEBO samostatný stack.
   Vytvořit projekt → dostat **DSN**.
2. **BE** — `npm i @sentry/nestjs`; `instrument.ts` (`Sentry.init({dsn: process.env.SENTRY_DSN})`)
   importovat jako **úplně první** řádek `main.ts` (před AppModule); `SentryModule.forRoot()` do
   AppModule; `SentryGlobalFilter` NEBO ponechat náš `HttpExceptionFilter` a přidat `Sentry.captureException`
   do 5xx větve. Prázdné `SENTRY_DSN` = init no-op (vypnuto).
3. **FE** (tam se dnes chyby ZTRÁCEJÍ — `GlobalErrorBoundary` jen `console.error`, chybí
   `unhandledrejection` handler): `npm i @sentry/react`; `Sentry.init` v `main.tsx`; `Sentry.captureException`
   v `GlobalErrorBoundary.componentDidCatch` + globální `window.addEventListener('unhandledrejection'|'error')`.
   FE DSN je veřejný (jde do bundlu) — OK.
> ⚠️ Nelze ověřit bez běžící GlitchTip instance + DSN → tento krok je **hand-off** (potřebuje tvou infru).

### Krok 4 — Log rotace ✅ UŽ EXISTUJE
`docker-compose.prod.yml` má `x-logging: &default-logging` (json-file, LH-05) aplikovaný na všechny
služby. Hotovo, není co dělat.

### Krok 5 — UptimeRobot (účet — tvoje akce)
Monitor na `https://<api>/api/health` (keyword `"status":"ok"`) + na FE origin. Alert → Discord webhook.
Odchytí i to, co interní monitoring nevidí (celý server/proxy dole).

### ✅ Co je HOTOVO (kód, na `main`) — stav 2026-07-11
- **`/health` readiness** — aktivně Mongo+Redis+Meili + disk/SMTP/paměť info (`07d4623`, `5508c27`).
- **`AlertService`** — Discord webhook, rate-limited, no-op bez env (`b385a59`).
- **5xx alert** + **error tracking** (`@sentry/node captureException`) z exception filtru (`6463a59`, `7765de1`).
- **Health-cron** (á min) — dep down/up + **disk <15 %** + **RSS práh** + **denní heartbeat** (`18a65e4`, `5508c27`, `8ea3d69`).
- **Brute-force alert** — login-fail spike (`96ad06a`).
- **BE Sentry** — `Sentry.init` guardované `SENTRY_DSN` (`7765de1`).
- **FE Sentry** — `@sentry/react` + globální `unhandledrejection`/`error` handlery + boundary capture
  (working tree FE repo — **commituješ ty**; `src/shared/lib/monitoring.ts`).
- **Komunitní oznámení** — nový svět / postava → `DISCORD_EVENTS_WEBHOOK` (`94197e3`).
- Env vše zadrátováno do `deploy.yml` + compose (`350eb40`, `7765de1`). Log rotace (LH-05). Webhooky živě OK (204).
**Zbývá (JEN tvoje infra/akce):** GitHub secrety `DISCORD_*`/`SENTRY_DSN` · GlitchTip instance → DSN ·
UptimeRobot účet (externí dead-man switch) · commit FE + `VITE_SENTRY_DSN` · deploy.

## Incident-response runbook (co dělat, když to hoří)

1. **Detekce:** alert (Discord/UptimeRobot) NEBO hlášení hráče. Ověř `/health` + `docker compose ps` + logy.
2. **Triáž:** co je degraded? (health checks ukážou vrstvu). Bezpečnostní incident (útok) vs provozní (pád).
3. **Mitigace:**
   - Služba spadlá → `docker compose restart <svc>` (Mongo/Redis/Meili/backend).
   - Špatný deploy → **rollback na předchozí image tag** (⚠️ dnes deploy dělá `prune`+rebuild `latest` =
     žádný rollback — dluh SKEW/OPS; než se vyřeší, rollback = redeploy předchozího commitu).
   - Disk plný → smaž staré docker images (`docker image prune`), rotuj logy, zkontroluj uploads volume.
   - Aktivní útok → identifikuj vzor (auth-fail spike = brute → ban IP/rate-limit; 5xx spike = DoS/ReDoS).
   - Data poškozená → **restore ze zálohy** (zálohu řešíš mimo; RTO změř při restore drillu).
4. **Komunikace:** status hráčům (Discord), pokud výpadek > pár minut.
5. **Post-mortem:** co selhalo, proč monitoring (ne)zachytil, jaká pojistka → zapiš do `chybovy-denik`.

## Bezpečnostní monitoring (napojení na pentest)

Monitoring je i **runtime detekce útoku**: alert na (a) spike neúspěšných loginů/2FA (brute-force běží),
(b) 5xx spike (DoS/ReDoS/exploit), (c) SSRF/egress pokusy v logu, (d) náhlý růst tvorby entit
(anti-abuse). Ideál: **plánovaný „hlídač"** (cron), co periodicky pouští pentest baseline + `/health`
proti produkci a alertuje → z jednorázového pentestu se stane nepřetržitý.

## Definice HOTOVO (třetí noha stojí)
Uptime monitor běží a alertuje · Sentry chytá FE+BE chyby · `/health` pokrývá všechny závislosti ·
logy rotují · aspoň jeden alert-kanál (Discord) funguje a byl OTESTOVÁN (vyvolej degraded → přišel
alert) · incident runbook existuje a je 1 stránka · rollback cesta definovaná.

## Rozhodnutí, která potřebuju od tebe (než „rozjet naplno")
1. **Error tracking:** Sentry free (externí, snadné) vs self-hosted GlitchTip (data doma, víc práce)?
2. **Alert kanál:** Discord webhook URL (doporučeno — máš komunitu) — vytvoř a dej.
3. **Uptime:** UptimeRobot účet (free) — nebo jiný?
4. **SMTP health:** ověřovat SMTP aktivně v `/health` (pomalé, drží slot) NE / jen konfig-presence?

## Pasti prostředí
- `/health` je veřejný (UptimeRobot ho volá) → **NEvracet citlivé detaily** (verze, interní hosty, env
  hodnoty) — jen `ok/degraded` + názvy vrstev.
- Aktivní SMTP/Meili check v `/health` = pomalé volání na kritické cestě → dej mu timeout, nebo měř
  asynchronně (cache výsledek), ať health-ping není sám zdrojem latence.
- Discord webhook URL je **secret** (kdokoli s ním spamuje kanál) → env/secret, ne do gitu.
- Alert rate-limit povinný — bez něj degraded stav vygeneruje stovky zpráv/min.
- Sentry DSN (FE) je veřejný (jde do bundlu) — to je OK (Sentry design); BE DSN drž v env.
- BE+FE nemíchat v jedné dávce; po BE změně restart. Git BE dle instrukce, FE ručně.
