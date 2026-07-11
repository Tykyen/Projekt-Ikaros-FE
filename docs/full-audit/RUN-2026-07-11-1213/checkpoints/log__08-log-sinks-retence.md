# log-hygiene — 08 log sinks & retence + 3RD wire debug (RUN-2026-07-11-1213)

**Osy SINK/3RD. Verdikt: docker rotace ✅, 3RD OFF ✅; NOVÝ off-device sink (Sentry+Discord) → LH-13.**

## SINK — docker (LH-05 drží)
- [docker-compose.prod.yml:4-8] `x-logging: &default-logging` (driver json-file, max-size 10m, max-file 3) aplikováno na všechny služby [:15,51,67,83]. ✅ rotace + strop.
- [docker-compose.yml:19-22] dev totéž. ✅
- Scanner `--docker`: logging blok=ANO, rotace=ANO (obě). `driver: bridge` [:157] je síťový, ne log (nezaměnit).

## 3RD — wire-level debug (LH-07 drží)
Scanner: mongoose.set('debug')=OFF, nodemailer logger:true/debug:true=OFF, DEBUG env=OFF. ✅ CI guard `audit:logs` [FE .github/workflows/ci.yml:133] aktivní.

## 🆕 LH-13 (🟡) — NOVÝ off-device sink: agregátor
Plán měl „žádný agregátor/Sentry" jako vědomou hranici L9. **Už neplatí:**
- **BE Sentry** (`@sentry/node`) — `Sentry.captureException` na 5xx [http-exception.filter.ts:62], **deploy-wired** `SENTRY_DSN` [docker-compose.prod.yml:124, deploy.yml:80]. Když je secret nastaven, chyby egresují do GlitchTip/Sentry. Retence/přístup teď žijí v agregátoru (mimo hranici L9 → nutno konfigurovat retenci tam).
- **Discord AlertService** [alert.service.ts] — POST embed na `DISCORD_ALERT_WEBHOOK`. Callery ověřeny bez PII: brute-force (počet), 5xx (kód+name+message capped 500), health-monitor (dep name/disk/RSS/uptime — infra), heartbeat. ✅ žádná PII/secret do Discordu.
- **FE Sentry** — viz log__07 (latentní, DSN nezapojen).

**Gap:** BE Sentry bez `beforeSend` scrubberu (nízké riziko — SDK default `sendDefaultPii:false`, 5xx=plain Error). Discord = čisté. Doporučení: scrubber sdílet s FE (log__07) + zdokumentovat retenci agregátoru.
