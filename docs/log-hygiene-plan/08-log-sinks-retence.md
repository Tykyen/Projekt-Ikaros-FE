# 08 — Log sinks & retence + third-party wire debug

> **Otázka:** kam log fyzicky teče, jak dlouho leží, kdo čte — a nemůže někdo jedním řádkem zapnout
> wire-level debug (mongoose/nodemailer/socket.io)? **Osy:** `SINK` `3RD`. **Plocha:**
> [docker-compose.prod.yml], [docker-compose.yml], BE Dockerfile, mongoose/nodemailer/socket.io/ioredis init.

## SINK — kam log teče

**Recon:** [docker-compose.prod.yml] má `networks: driver: bridge` (síť), **žádný `logging:` blok** na
službách. → Docker default = **`json-file` driver bez `max-size`/`max-file`**.

Řetězec: `process.stdout/stderr` → Docker `json-file` → `/var/lib/docker/containers/<id>/<id>-json.log` →
**roste donekonečna** → čte `docker logs` / kdokoli s přístupem k hostiteli/volume. **Žádný agregátor,
žádný Sentry** (vědomá hranice L9 — nelze harvestovat retenci, jen konstatovat absenci rotace).

| Check | Stav | Verdikt |
|---|---|---|
| `logging:` blok per service | ⬜ chybí | 🟠 `SINK` — K-LOG6 |
| `max-size` / `max-file` | ⬜ chybí | unbounded |
| log volume mimo container | ⬜ ? | ověřit kdo čte |

**Návrh fix:** per-service `logging: { driver: "json-file", options: { max-size: "10m", max-file: "3" } }`
(nebo `local` driver — efektivnější) → rotace + strop velikosti. Krije důsledek leaku (data nezůstanou
napořád), neřeší příčinu (oblasti 01-05).

## 3RD — wire-level third-party debug

**Recon:** žádný `mongoose.set('debug')`, žádné nodemailer `logger:true`/`debug:true`, žádné `DEBUG=`
v compose/deploy. **Aktuálně OFF — dobře.** Riziko = jeden řádek / env to zapne:

| Knihovna | Zapnutí | Co by leaklo |
|---|---|---|
| mongoose | `mongoose.set('debug', true)` | **každý dotaz s daty** (filtry, hodnoty, e-maily) |
| nodemailer | `createTransport({ logger: true, debug: true })` | **celá SMTP konverzace vč. AUTH** (App Password!) |
| socket.io | `DEBUG=socket.io:*` | **každý frame** (chat obsah, souřadnice) |
| ioredis | `DEBUG=ioredis:*` | příkazy/klíče |

**Co ověřit / guard:**
1. Potvrdit OFF napříč kódem + compose + deploy + Dockerfile (žádný `ENV DEBUG`).
2. **CI guard** (M-SCAN `--check`): selži, když přibude `mongoose.set('debug'`, nodemailer `logger:true`/
   `debug:true`, nebo `DEBUG=` v compose/deploy. → nikdo to neflikne tiše do prod.
3. `NODE_ENV=production` ověřit (cross-ref prod-config) — některé knihovny tlumí debug v prod samy.

## Pasti
- `driver: bridge` je **síťový** driver, ne logovací — nezaměnit (snadná chyba při čtení compose).
- `json-file` bez rotace = nejčastější prod chyba; i bez leaku zaplní disk.
- Cross-ref [prod-config DP](../prod-config-plan/07-deploy-parity.md) — compose hardening sdílené téma.
