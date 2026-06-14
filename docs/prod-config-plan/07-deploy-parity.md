# 07 — Deploy parity + config kruh

> **Osy:** `DP` (deploy parity), `PA` (config parita FE↔BE), `ED` (env drift), `M-PARITY` 👑.
> **Cílová otázka:** shodují se 4 zdroje pravdy (kód ↔ `.env.example` ↔ `deploy.yml` ↔ `docker-compose.prod`)
> a tvoří FE↔BE konfigurace **konzistentní kruh** (origin matchuje, URL `https://`)?

---

## Povrch

| Artefakt | Repo | Co řeší |
|---|---|---|
| `.github/workflows/deploy.yml` (BE) | BE | SSH deploy, vars/secrets → server `.env`, **pre-deploy validace** (JWT, MEILI ≥16B) |
| `.github/workflows/deploy.yml` (FE) | FE | build s `VITE_*` build args, docker compose up |
| `docker-compose.prod.yml` (BE) | BE | service env (`:?required` / `:-default`), service names, healthchecks |
| `Dockerfile` (BE) | BE | multi-stage, `NODE_ENV=production`, `uploads` dir |
| `Dockerfile` (FE) | FE | `ARG VITE_*`, build → nginx |
| `docker-compose.yml` (FE) | FE | `FRONTEND_PORT`, build args |
| `nginx.conf` (FE) | FE | caching, security headers, SPA fallback |

---

## Kontrolní kroky (sweep)

1. **M-ENV 4-zdroj diff** (K-PC16) — kód × example × deploy × compose. Vyčísli čteno-nepředáno (riziko prod degrade) / předáno-nečteno (mrtvé). Cílová tabulka v registru.
2. **Pre-deploy validace pokrytí** — `deploy.yml` validuje JWT×2 + MEILI. Ověř, zda kryje **všechny 🔴** (chybí např. `MONGODB_URI`, `CLOUDINARY_URL`, `FRONTEND_URL`, `BACKEND_BASE_URL`, `TURNSTILE_SECRET`). Rozšířit guard.
3. **Vars vs secrets klasifikace** — žádný secret jako `vars` (čitelné v Actions logu). Cross-ref oblast 02 `SS`.
4. **Config kruh** (K-PC10, M-PARITY 👑) — ověř konzistenci:
   - FE `VITE_API_URL` → BE base (`https://api...` nebo `https://.../`).
   - BE `FRONTEND_URL` = CORS origin (oblast 03) = mailer `appUrl` (oblast 05) = produkční FE.
   - `BACKEND_BASE_URL` = veřejná BE URL (disk fallback, oblast 04).
   - **Všechna prod URL `https://`** (žádné `http://`).
5. **Docker `NODE_ENV=production`** — Dockerfile BE ✅; ověř, že kód, co větví na `NODE_ENV`, se chová prod-správně (oblast 08).
6. **FE build arg → bundle** — `VITE_API_URL` proteče Dockerfile ARG → `vite build` → `dist`. Ověř, že deploy předává reálnou hodnotu (ne prázdno, K-PC15).

---

## Seed mapping

- **K-PC16** 🟠 `ED`/`DP` — 4-zdroj drift (hlavní výstup, M-ENV).
- **K-PC10** 🟠 `PA` — config kruh FE↔BE (M-PARITY 👑, L6).
- **K-PC15** 🟠 `DP`/`BL` — FE build arg prázdný (oblast 06).

## Pasti

- ⚠️ Dva repo = dva `deploy.yml` = dvě sady vars/secrets. Kruh přesahuje hranici repo → M-PARITY musí číst oba.
- ⚠️ Compose `:?required` je **runtime** guard (kontejner nenastartuje), `deploy.yml test` je **deploy-time** guard. Redundance je OK, ale ověř, že aspoň jeden kryje každou 🔴.
- ⚠️ Cross-ref aktivní [paměť `project_deployment_handoff`] — uživatel je netechnický; výstup oblasti = **konkrétní checklist** vars/secrets k nastavení.

## Pozitiva k ověření

- ✅ Multi-stage Docker build, `NODE_ENV=production`, `npm prune --omit=dev`.
- ✅ `${VAR:?required}` na kritických compose proměnných.
- ✅ Pre-deploy validace existuje (rozšířit, ne tvořit od nuly).
