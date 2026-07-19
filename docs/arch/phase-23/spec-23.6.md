# Spec 23.6 — Drobný infra hardening

**Stav:** schváleno uživatelem 2026-07-19 (vč. rozšíření o FE port 8081) · implementováno · **čeká:** ověření Caddyfile na serveru → deploy FE+BE → ufw
**Karta:** roadmap3 fáze 23, karta 23.6 · **Původ:** runbook §1 (port bind) + §5 (ufw) + LH-05 (log rotace, FE polovina)

## Problém

1. **FE `docker-compose.yml` nemá `logging:` blok** → Docker default json-file BEZ stropu. Nginx access log (každý request) roste donekonečna; BE compose to má vyřešené od LH-05, FE polovina chybí. Platí i pro prerender sidecar.
2. **BE publikuje port `"${BACKEND_PORT:-3001}:3000"` na 0.0.0.0** → kdo zná `IP:3001`, mluví s BE přímo přes plain HTTP a obchází Caddy TLS (runbook §1).
3. **ufw stav na serveru nikdy neověřen** (runbook §5) — nevíme, jestli firewall vůbec běží.

## Rozhodnutí

- **① FE log rotace:** převzít `x-logging` anchor z BE compose beze změny (json-file, max 3× 10 MB) a aplikovat na **obě** služby (`frontend` + `prerender`). Stejné hodnoty = jednotná politika napříč repy.
- **② Bind na loopback = volba A z runbooku (compose mapping), ne volba B (jen firewall):** deklarativní v repu, přežije reinstall serveru i změnu firewallu. BE mapping → `"127.0.0.1:${BACKEND_PORT:-3001}:3000"`; **stejný fix i FE** → `"127.0.0.1:${FRONTEND_PORT:-8081}:80"` (schváleno jako rozšíření karty). Firewall (③) zůstává jako druhá vrstva.
- **③ ufw:** žádný kód — ruční ověření na serveru dle runbooku §5 (příkazy níže). Po ② je 3001 na loopbacku, ufw je pojistka pro všechno ostatní.
- Mongo/Redis auth (runbook §2–3) **vědomě mimo** — až karta 30.5 (dle roadmapy).

## ⚠️ Blokující předpoklad pro ② (ověřit PŘED deployem, na serveru)

Bind na 127.0.0.1 funguje **jen pokud Caddy běží na témže hostu (ne v kontejneru) a proxuje na `localhost:3001` / `localhost:8081`**. Jinak by deploy odřízl proxy od BE/FE → výpadek.

```bash
systemctl status caddy | head -3            # Caddy jako host služba (ne docker)
grep -nE "3001|8081" /etc/caddy/Caddyfile   # reverse_proxy cíle = localhost / 127.0.0.1
ss -tlnp | grep -E "3001|8081"              # dnes: 0.0.0.0 (docker-proxy)
```

Pokud cíl v Caddyfile NENÍ localhost/127.0.0.1 → STOP, nenasazovat, probrat.

## Zásahy

| # | Repo · soubor | Změna |
|---|---|---|
| 1 | FE `docker-compose.yml` | `x-logging` anchor (8 řádků) + `logging: *default-logging` do `frontend` a `prerender` · port mapping → `"127.0.0.1:${FRONTEND_PORT:-8081}:80"` |
| 2 | BE `docker-compose.prod.yml` | port mapping backendu → `"127.0.0.1:${BACKEND_PORT:-3001}:3000"` + komentář proč |
| 3 | BE `docs/ops-runbook.md` | §1 přepsán (opraveno volbou A, ověřovací kroky před/po deployi) · §5 doplněn stav (výsledek ufw se vyplní po zásahu) |

Deploy: oba workflow dělají `compose down` + `up -d` → recreate, změny se projeví běžným deployem, žádný extra krok.

## Ruční kroky na serveru (uživatel, dle runbooku §5)

```bash
ufw status verbose                 # nejdřív jen zjistit stav
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp
ufw enable                         # POZOR: až po ověření, že OpenSSH pravidlo existuje
ufw status verbose                 # 3001 NESMÍ být v povolených
```

## Ověření po deployi

1. `docker inspect projekt-ikaros-fe --format '{{json .HostConfig.LogConfig}}'` → `max-size 10m, max-file 3` (totéž prerender).
2. `ss -tlnp | grep -E "3001|8081"` → jen `127.0.0.1`.
3. Z jiného stroje: `curl -m 5 http://SERVER_IP:3001/api/health` → timeout/refused (dnes odpovídá!); totéž `http://SERVER_IP:8081/`.
4. Živý web: login + načtení světa funguje (= Caddy → loopback BE OK).
5. `ufw status verbose` → active, jen OpenSSH/80/443.

## Vědomě nekryto

- Mongo/Redis auth → karta 30.5.
- Lokálně ověřeno `docker compose config`: FE i BE resolved config má `host_ip: 127.0.0.1` a json-file 3× 10 MB na obou FE službách.
