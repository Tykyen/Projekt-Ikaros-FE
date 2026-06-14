# 03 — CORS + WS origin

> **Osy:** `OG` (origin CORS/WS), `FB` (dev fallback), částečně `HD` (konzistence).
> **Cílová otázka:** je v produkci **REST CORS**, **WebSocket origin** i **static asset CORS** uzavřený
> na **produkční FE** — nebo allowlist drží `localhost`, dev stroj nebo wildcard?

---

## Povrch — 4 místa nastavení originu

| # | Vrstva | Kde | Origin zdroj |
|---|---|---|---|
| 1 | REST HTTP CORS | main.ts:23-29 | `[FRONTEND_URL ?? 'http://localhost:5173', 'http://localhost:5174']` |
| 2 | WS CORS (Socket.IO adapter) | socket-io.adapter.ts:6-29 | `ALLOWED_ORIGINS` = totéž (+ `:5174`) |
| 3 | WS CORS (BaseGateway) | base.gateway.ts:10-13 | **přímý** `process.env.FRONTEND_URL ?? 'http://localhost:5173'` (BEZ `:5174`) |
| 4 | Static `/static/` CORS | main.ts:36-42 | `FRONTEND_URL ?? 'http://localhost:5173'` (explicit header) |

> 💡 **Dvojí zdroj WS originu:** adapter (#2) a BaseGateway (#3) nastavují CORS nezávisle a **nesouhlasí**
> (`:5174` jen v adapteru). Která vrstva reálně rozhoduje? Socket.IO adapter je server-level, gateway
> dekorátor namespace-level — ověřit, který má přednost a zda gateway hodnota není mrtvá/konfliktní.

---

## Kontrolní kroky (sweep)

1. **Allowlist v prod** (K-PC4) — `http://localhost:5174` je **hardcoded** ve všech 4? V prod zbytečně povolený dev origin. Ověř, zda je gated (`NODE_ENV`) nebo vždy přítomen.
2. **`credentials: true`** — všechny 4 mají? (nutné pro JWT/cookie). Ověř, že origin **není `*`** zároveň s `credentials:true` (prohlížeč to odmítne, ale i tak špatný signál).
3. **ConfigService vs process.env** (K-PC13) — #3 čte `process.env` přímo, ostatní mix. Sjednotit zdroj originu na jedno místo (config helper).
4. **Static CORS** — `Access-Control-Allow-Origin` + `Cross-Origin-Resource-Policy: cross-origin` na `/static/` (WebGL textury). Ověř, že origin = produkční FE, ne localhost.
5. **`maxHttpBufferSize`** — adapter 5MB (socket-io.adapter.ts:26) — konzistentní s body limitem (oblast 08)?

---

## Seed mapping

- **K-PC4** 🟠 `OG`/`FB` — localhost:5174 v prod allowlistu (hlavní nález oblasti).
- **K-PC13** 🟡 `OG`/`HD` — base.gateway přímý process.env, dvojí zdroj WS originu.
- **K-PC10** 🟠 `PA` — origin musí matchovat FE `VITE_API_URL` (kruh, oblast 07).

## Pasti

- ⚠️ Cross-ref [ws-contract] (paměť `project_ws_security_patterns`) — WS **identita/room** security řeší ten audit; tady jen **origin/CORS config**.
- ⚠️ `:5174` je dev Vite fallback port (když `:5173` obsazen) — v prod nemá co dělat.
- ⚠️ Při změně FE originu (server-swap na `www.projekt-ikaros.com`) musí všechny 4 vrstvy souhlasit.

## Pozitiva k ověření

- ✅ `credentials: true` napříč (správné pro auth).
- ✅ Origin je **explicitní allowlist**, ne `origin: true` / `*` (lepší než wildcard).
