# 02 — Secrets

> **Osy:** `SC` (secrets), `SS` (secret sken stromu + git historie), částečně `KR` (TTL), `TL` (transport).
> **Cílová otázka:** je každý secret **z env**, **silný**, **bez defaultu/placeholderu v kódu** a **není
> v git historii** — a chrání aplikaci i bez konfigurace (fail-fast), místo aby ji tiše odemkl (bypass)?

---

## Povrch

| Secret | Čte | Chování bez hodnoty | Klasifikace deploy |
|---|---|---|---|
| `JWT_SECRET` | auth.module.ts:25 | **throw** (fail-fast ✅) | secret |
| `JWT_REFRESH_SECRET` | auth.service.ts:74 | **throw** ✅ | secret |
| `TURNSTILE_SECRET` | captcha.service.ts:36 | **`return true` → bypass** 🔴 | secret |
| `CLOUDINARY_URL` | upload.service.ts:121 | log error → disk fallback | secret |
| `MEILI_API_KEY` / `MEILI_MASTER_KEY` | meili-search.service.ts:31 | `''` → bez auth | secret |
| `VAPID_PRIVATE_KEY` (+SUBJECT/PUBLIC) | push.service.ts:30-32 | push off (app nepadne) | secret/var |
| `SMTP_PASS` | smtp-mailer.provider.ts:38 | LogMailer fallback | secret |

---

## Kontrolní kroky (sweep)

1. **Default/placeholder v kódu** — pro každý secret: je `?? throw` (good) nebo `?? 'něco'` / `?? ''` / žádný (tiše prázdné)? Sestav tabulku „fail-safe vs fail-open".
2. **`TURNSTILE_SECRET` bypass** (K-PC1) — [captcha.service.ts:36-41]: bez secretu vrací `true`. Ověř, zda je bypass **gated** na `NODE_ENV !== 'production'` (pak by-design dev) nebo **bezpodmínečný** (pak 🔴 v prod). Recon naznačuje bezpodmínečný + warn.
3. **M-SECRET sken stromu** (K-PC19) — gitleaks/regex: hledá hardcoded klíče, `JWT_SECRET=` s reálnou hodnotou, placeholdery v `.env.example` (jsou placeholdery, ne reálné?).
4. **M-SECRET sken historie** — `git log -p` přes oba repo: nezůstal secret v starém commitu? Cross-ref [paměť `project_git_history_cleanup`] (filter-repo proběhl — ověřit úplnost).
5. **`.env*` v repu** — je nějaký `.env` (ne `.example`) commitnutý? `.gitignore` ho kryje?
6. **Vars vs secrets** — žádný secret omylem v `deploy.yml` jako `vars` (čitelné v logu)?

---

## Seed mapping

- **K-PC1** 🔴 `FB`/`SC` — captcha bypass bez secretu (hlavní 🔴 oblasti).
- **K-PC14** ⚖️ `SC` — JWT/refresh fail-fast (pozitivum; `TE` zmutuje `throw`→`'dev'` → test musí zčervenat).
- **K-PC19** 🟡 `SS` — secret sken stromu + historie.
- **K-PC12** 🟡 `KR` — JWT 7d / refresh 30d (viz oblast 08).
- **K-PC18** 🟡 `TL` — JWT v localStorage (XSS); refresh cookie flags (viz oblast 08).

## Pasti

- ⚠️ **Nezapisovat reálné secrety do registru** — jen názvy proměnných + fallback řetězce z kódu.
- ⚠️ Site-key vs secret: `VITE_TURNSTILE_SITE_KEY` (veřejný, FE) ≠ `TURNSTILE_SECRET` (BE-only). Nezaměnit.
- ⚠️ Boot-probe (`BP`) testovat s **dummy** secrety, ne produkčními.

## Pozitiva k ověření

- ✅ JWT/refresh fail-fast — nejlepší vzor v repu; cíl rozšířit na ostatní 🔴 proměnné.
