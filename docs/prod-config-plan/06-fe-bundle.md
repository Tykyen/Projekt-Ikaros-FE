# 06 — FE bundle + build

> **Osy:** `BL` (bundle leak), `DP` (build parita).
> **Cílová otázka:** co všechno končí v produkčním `dist/` — neuniká tam secret přes `VITE_*`, zdrojový
> kód přes **sourcemaps** nebo debug přes **console.log**? A dostal build **správné** `VITE_API_URL`?
>
> 📚 **Vite zapéká `VITE_*` do client bundlu při buildu.** Cokoli přes `VITE_*` je **veřejné** (stáhne si
> to každý z prohlížeče). Proto sem nesmí žádný secret — jen veřejné hodnoty (URL, site-key).

---

## Povrch

| Co | Kde | Stav |
|---|---|---|
| Vite config | vite.config.ts | minimální (`react()` + path alias) — žádné build options |
| API base URL | client.ts:8 | `VITE_API_URL ?? 'http://localhost:3000'` |
| WS URL | socket.ts:6 | totéž |
| Turnstile site-key | RegisterModal.tsx:50 | `VITE_TURNSTILE_SITE_KEY ?? '1x000…AA'` (veřejný test key) |
| Dockerfile build args | Dockerfile:5-9 | `ARG VITE_API_URL=` (prázdný default) → `ENV` |
| Build command | package.json:8 | `tsc -b && vite build` → `dist/` |

---

## Kontrolní kroky (sweep)

1. **Sourcemaps v prod** (K-PC9) — Vite default generuje `.map` jen v dev; ověř `build.sourcemap` (default `false` v prod = OK, ale potvrdit). Pokud `true` → zdrojový kód public v `dist/`.
2. **console.log stripping** (K-PC9) — Vite **nestripuje** `console.*` by default. Ověř, zda build má `esbuild.drop: ['console','debugger']` nebo terser option. Pravděpodobně ne → debug logy v prod bundlu.
3. **Secret leak přes VITE_** — grep `import.meta.env.VITE_` → je některá hodnota citlivá? Recon: jen `VITE_API_URL` (URL, ne secret) + `VITE_TURNSTILE_SITE_KEY` (veřejný site-key). ✅ žádný secret. Potvrdit, že nepřibyl.
4. **Dockerfile ARG prázdný default** (K-PC15) — [Dockerfile:5] `ARG VITE_API_URL=`. Build bez `--build-arg` → prázdné → runtime fallback `localhost:3000` v client.ts → **celý FE volá localhost**. Tichý (build nespadne). Návrh: fail build, pokud ARG prázdný (`RUN test -n "$VITE_API_URL"`).
5. **Build parita s deploy** — ověř, že `deploy.yml` (FE) předává `VITE_API_URL` jako `--build-arg` / compose build arg (cross-ref oblast 07).
6. **Bundle inspekce** (volitelně L4) — `grep` přes `dist/assets/*.js` na `localhost`, `newmatrix`, `patrikzplzne` → potvrdí, co se reálně zapeklo.

---

## Seed mapping

- **K-PC9** 🟡 `BL` — sourcemaps + console.log v prod bundlu.
- **K-PC15** 🟠 `DP`/`BL` — Dockerfile ARG prázdný → localhost zapečen.

## Pasti

- ⚠️ FE nemá runtime env — vše je build-time. Změna URL = **rebuild** (nelze přepsat za běhu).
- ⚠️ `VITE_TURNSTILE_SITE_KEY` test key `1x00…AA` je oficiální Cloudflare **always-pass** test key — v prod by zapečený test key = captcha vždy projde (FE strana). Ověř, že build dostane **produkční** site-key.
- ⚠️ FE bez prettieru ([feedback_fe_no_prettier]); build ověřuj `npm run build` (tsc -b) ([project_fe_build_preexisting_errors]).

## Pozitiva k ověření

- ✅ Žádný BE secret v `VITE_*` (jen URL + veřejný site-key).
- ✅ nginx security headers + immutable asset caching (recon §7) — viz oblast 08.
