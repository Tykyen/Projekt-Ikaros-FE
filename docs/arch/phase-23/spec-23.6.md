# Spec 23.6 — Drobný infra hardening

**Stav:** schváleno uživatelem 2026-07-19 (vč. rozšíření o FE port 8081) · **② a ③ UZAVŘENY ZJIŠTĚNÍM** (viz Výsledek ověření — loopback bind na této infra zakázán, ufw bez přínosu) · ① implementováno, čeká FE deploy
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

## Výsledek ověření (2026-07-19, server-check workflow + testy zvenku)

Blokující předpoklad **NEPLATÍ** — a odhalil, že celá premisa ② byla mylná:

- Na hostu ŽÁDNÝ Caddy není (žádná služba, žádný kontejner, `/etc/caddy` neexistuje).
- Stroj má jen privátní IP (10.10.10.111); veřejnou 5.39.203.33 drží **NAT/edge proxy poskytovatele (leafhost) na jiném stroji** — ta ukončuje TLS a routuje `/api` → 3001, zbytek → 8081 po interní síti.
- → **Loopback bind by odřízl produkci. ② se NENASAZUJE**, mapping vrácen na původní (v obou compose zůstává varovný komentář, aby se to nezkusilo znovu).
- Testy zvenku na 5.39.203.33: port 3001/8080/27017 timeout, 8081 refused → **NAT porty do internetu nepouští**, původní hrozba runbooku §1 veřejně neexistuje.
- ③ ufw: `Status: inactive`. Rozhodnutí NEZAPÍNAT: docker-proxy porty ufw obcházejí (iptables DOCKER chain), z internetu je stejně filtruje NAT, a hrozí odříznutí SSH. 
- **Nové nálezy — OPRAVENO TÝŽ DEN** (uživatel nechtěl odkládat jako dluh) přes `server-hardening.yml` (diagnose/apply, auto-rollback při selhání edge ověření):
  - `matrix-mongodb` (stará .NET DB) publikovala 27017 na 0.0.0.0 → **127.0.0.1** (interní komunikace přes docker síť `matrix_matrix-network` netknutá, backend restart).
  - interní síť 10.10.10.0/24 → iptables **DOCKER-USER**: RETURN edge proxy 10.10.10.104 + host + ESTABLISHED, DROP zbytek /24; persistence systemd `docker-user-hardening.service`. Ověřeno živě: pravidly tečou pakety, web+API přes edge zelené.
- Vedlejší produkty: workflow `server-check.yml` (read-only diagnostika serveru) + `server-hardening.yml` (opravy s pojistkou) — oba FE repo, `workflow_dispatch`, bez nutnosti SSH z lokálu; runbook §1/§5/§7 přepsán podle reality.

## Ověření po FE deployi (zbývá jen ①)

1. `docker inspect projekt-ikaros-fe --format '{{json .HostConfig.LogConfig}}'` → `max-size 10m, max-file 3` (totéž prerender) — jde vyčíst i přes server-check workflow po přidání kroku, nebo stačí `docker compose ps` + kontrola, že web běží.
2. Živý web funguje beze změny (log rotace nemá funkční dopad).

## Vědomě nekryto

- Mongo/Redis auth → karta 30.5.
- Lokálně ověřeno `docker compose config`: FE i BE resolved config má `host_ip: 127.0.0.1` a json-file 3× 10 MB na obou FE službách.
