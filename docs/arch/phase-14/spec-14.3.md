# Spec 14.3 — Bezpečnostní hlavičky (CSP, HSTS, helmet)

**Status:** 🚧 Kód hotový (2026-06-19) — FE build+lint+CSP guard+envsubst sim zelené, BE build+lint zelené. Nasazeno jako **report-only**; čeká: deploy + BE restart + sběr porušení → enforce (přepnout `CSP_HEADER_NAME`).
**Rozsah:** FE (nginx, jádro) + BE (helmet, API hardening) — žádná aplikační logika, jen HTTP hlavičky a konfigurace
**Repo:** `Projekt-ikaros-FE` (nginx.conf, docker-compose, deploy.yml) + `Projekt-ikaros` (BE main.ts, env validace)
**Velikost:** malá — odhad ~6–8 souborů (FE ~4, BE ~3)
**Autor:** PJ + Claude
**Datum:** 2026-06-19
**Roadmap:** `docs/roadmap2.md` → Fáze 14 → 14.3
**Souvisí:** PC-18 (httpOnly/Secure/SameSite cookie — již hotovo), PC-02/PC-21 (odstřižení od `www.patrikzplzne.cz` — embedding modely), 14.2 (Turnstile na registraci → `challenges.cloudflare.com` v CSP), `project_pixi_async_init` (PixiJS WebGL → `img-src blob:`)

---

## 1. Cíl

Dát prohlížeči pravidla, která:

1. **Neutralizují XSS** — i kdyby do stránky pronikl injektovaný skript (chat, bio, články, migrovaný obsah), **Content-Security-Policy** zabrání jeho spuštění (whitelist zdrojů skriptů/stylů/spojení). Záchranná síť pro případ, že sanitizace selže.
2. **Vynutí HTTPS** — **HSTS** (Strict-Transport-Security) řekne prohlížeči, ať s doménou už nikdy nemluví přes nešifrované HTTP.
3. **Doplní hardening** — `Referrer-Policy`, `Permissions-Policy`, potvrzení `X-Frame-Options`/`X-Content-Type-Options`.

---

## 2. Kontext / motivace

Platforma je plná uživatelského textu (chat napříč světy, bio, články, migrovaný obsah ze starého webu) → přirozený cíl XSS. Sanitizace TipTap obsahu je první obrana; CSP je **druhá, nezávislá vrstva** — i kdyby sanitizace měla díru, CSP injektovaný `<script>` nepustí ke spuštění. Cookie jsou už HttpOnly/Secure/SameSite (PC-18), takže i při XSS útočník nevykrade session cookie přes JS — CSP tuto obranu uzavírá tím, že skript vůbec nespustí.

### 2.1 Architektonická realita (klíčové — odchylka od zadání roadmapy)

Roadmapa říká *„BE: helmet middleware + laděná CSP"*. **To je nepřesné.** Topologie produkce:

```
prohlížeč ──HTTPS──> [edge/Cloudflare TLS] ──> FE nginx kontejner (:80)  → index.html + JS/CSS assety
                                            └─> BE NestJS (:3000)          → JEN /api (JSON) + /static/ (obrázky)
```

- **HTML dokument**, který prohlížeč renderuje a do kterého se XSS injektuje, servíruje **FE nginx**, ne NestJS.
- BE vrací **JSON** (`/api`) a **obrázky** (`/static/`) — to prohlížeč nerenderuje jako stránku se skripty.

⇒ **Hlavní XSS-CSP musí být na FE nginx** (`nginx.conf`), kde žije HTML dokument. Helmet CSP na BE by seděla jen na JSON odpovědích = skoro nulová XSS ochrana.

**Rozdělení práce (schváleno 2026-06-19):**

| Vrstva | Co řeší | Riziko rozbití |
|---|---|---|
| **FE `nginx.conf`** | Hlavní XSS-CSP, HSTS, Referrer-Policy, Permissions-Policy | **vysoké** — jádro, vyžaduje report-only fázi |
| **BE helmet** | Restriktivní `default-src 'none'` CSP pro API + HSTS + nosniff + Referrer-Policy + `frame-ancestors 'none'` | nízké — JSON nic nerozbije |

---

## 3. Klíčová rozhodnutí (brainstorm 2026-06-19)

| Téma | Volba | Důvod |
|---|---|---|
| Kde žije hlavní CSP | **FE nginx.conf**, ne BE | CSP chrání HTML dokument; ten servíruje nginx (viz §2.1). |
| BE helmet role | **Doplňkový API hardening** — `helmet()` s restriktivní `contentSecurityPolicy: { default-src 'none' }`, `frameguard deny`, HSTS, `referrerPolicy`, `noSniff` | Kdyby někdo otevřel `…/api/...` přímo v prohlížeči, nespustí se nic. Levné, JSON to nerozbije. |
| Inline pre-hydration skript ([index.html:13-24](../../../index.html#L13)) | **SHA-256 hash** v `script-src 'sha256-…'` | Skript je statický (anti-FOUT theme setter). Hash funguje na statickém nginx hostu bez runtime injekce. ⚠️ Při změně skriptu nutno hash přepočítat → CI guard / build-time výpočet (viz §6). |
| ~~nonce~~ | **zamítnuto** | Nonce vyžaduje runtime injekci do HTML i hlavičky (nginx `sub_filter`) — křehké, statický host k tomu není stavěný. |
| ~~externí .js soubor~~ | **zamítnuto** | Extra blokující request v `<head>` + riziko bliku motivu (FOUT), kvůli kterému je skript inline. |
| Zavedení CSP | **Report-only fáze první** (`Content-Security-Policy-Report-Only`), pak tvrdé vynucení | TipTap / PixiJS / Turnstile / fonty mohou injektovat zdroje, které statická analýza nezachytí. Report-only sbírá reálná porušení bez rozbití webu. |
| `style-src` a `'unsafe-inline'` | **Začít BEZ `'unsafe-inline'`**, ověřit v report-only | React `style={{}}` jede přes CSSOM (ne `style=""` atribut) → CSP `style-src` ho **neblokuje**. Riziko jsou jen knihovny injektující `<style>`. Pokud report-only odhalí nutnost → přidat `'unsafe-inline'` jen pro `style-src` (skripty zůstanou tvrdé). |
| Backend doména v CSP (per-env) | **nginx envsubst template** + runtime env `BACKEND_HOST` (holý host bez schématu) | Dev/prod mají jinou backend doménu. Template = jedna konfigurace, hodnota z env (vzor jako `VITE_API_URL` build-arg). |
| `connect-src` pro WebSocket | **Holý host bez schématu** (`api.example.com`, ne `https://…`) | CSP zdroj bez schématu matchne https (polling) i wss (websocket) naráz → Socket.IO `transports:['websocket','polling']` pokryto jednou hodnotou. |
| HSTS na nginx (:80 za TLS proxy) | **Nastavit `always`**, prohlížeč ho ctí jen po HTTPS | TLS končí na edge proxy; hlavička z nginx projde k prohlížeči a aplikuje se na HTTPS spojení. `includeSubDomains` ano, `preload` **až po ověření** (nevratné). |
| `frame-ancestors` | **`'self'`** (nginx) — odpovídá stávajícímu `X-Frame-Options: SAMEORIGIN` | Žádný legitimní embedding do cizí stránky; CSP `frame-ancestors` je modernější ekvivalent. |

---

## 4. Rozsah

### 4.1 V rozsahu 14.3

**FE (`Projekt-ikaros-FE`):**

- `nginx.conf` → přejmenovat na **template** (`default.conf.template`) v `/etc/nginx/templates/`, doplnit do `location /`:
  - `Content-Security-Policy` (resp. `-Report-Only` ve fázi 1) — viz §5.1
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` — vypnout nepoužívané API (geolocation, camera, microphone, …); ponechat to, co PWA/push potřebuje
  - migrovat `X-Frame-Options`/`X-Content-Type-Options` (zachovat) — případně `frame-ancestors` v CSP
- `Dockerfile` → kopie `default.conf.template` do `/etc/nginx/templates/` místo `/etc/nginx/conf.d/default.conf` (nginx:alpine envsubst mechanismus), nastavit `NGINX_ENVSUBST_FILTER` aby se nahradily jen naše proměnné (ne nginx `$uri` apod.)
- `docker-compose.yml` → `environment: BACKEND_HOST: ${BACKEND_HOST:-}` (+ `CSP_REPORT_ONLY` přepínač fáze)
- `.github/workflows/deploy.yml` → zapsat `BACKEND_HOST` do serverového `.env` (odvozeno z `VITE_API_URL` / nová GitHub var)
- skript/CI guard na **SHA-256 hash** pre-hydration skriptu (§6)

**BE (`Projekt-ikaros`):**

- `npm i helmet`
- `main.ts` → `app.use(helmet({ … }))` po `enableCors`, před `useStaticAssets`:
  - `contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }` (API nevrací nic k načtení)
  - `strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true }`
  - `referrerPolicy: { policy: 'no-referrer' }`
  - `frameguard: { action: 'deny' }`, `noSniff: true`, `xssFilter` dle defaultu
  - **`crossOriginResourcePolicy: false`** ⚠️ — `/static/` si CORP řídí sám (`cross-origin` pro PixiJS WebGL textury, [main.ts:77](../../../../Projekt-ikaros/backend/src/main.ts#L77)); helmet default `same-origin` by WebGL textury rozbil
- env validace → `BACKEND_HOST` (FE) zdokumentovat; BE helmet bez nové povinné env

### 4.2 Mimo rozsah

- **Nonce-based CSP** (SSR by ji umožnila) — teď ne, hash stačí
- **CSP reporting endpoint** (`report-uri`/`report-to` sběr na server) — report-only fáze poběží přes prohlížeč konzoli/DevTools; serverový sběr = volitelný follow-up **14.3-a**
- **`preload` do HSTS preload listu** — nevratné, až po dlouhém ověření v prod (follow-up)
- Odstranění závislosti na `www.patrikzplzne.cz` (embedding modely, PC-02/21) — řeší 14.8; pokud by FE někdy ty domény volal, doplnit do CSP tam
- Změna CORS logiky (`origins.ts`) — funguje, nesahá se

---

## 5. CSP direktivy (FE nginx)

### 5.1 Návrh policy (ladí se v report-only fázi)

```
default-src 'self';
script-src 'self' 'sha256-<HASH_PRE_HYDRATION>' https://challenges.cloudflare.com;
style-src 'self' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https://res.cloudinary.com ${BACKEND_HOST};
connect-src 'self' ${BACKEND_HOST} https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
worker-src 'self';
manifest-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
upgrade-insecure-requests;
```

### 5.2 Zdroj každého povolení (z průzkumu kódu)

| Direktiva | Hodnota | Proč / kde |
|---|---|---|
| `script-src` | `'sha256-…'` | inline pre-hydration theme setter [index.html:13](../../../index.html#L13) |
| `script-src` `frame-src` | `https://challenges.cloudflare.com` | Cloudflare Turnstile (registrace) — `@marsidev/react-turnstile`, [RegisterModal.tsx](../../../src/features/auth/components/RegisterModal.tsx) |
| `style-src` | `https://fonts.googleapis.com` | Google Fonts stylesheet [index.html:56](../../../index.html#L56) + runtime `applyTheme.ts` |
| `font-src` | `https://fonts.gstatic.com` `data:` | webfont soubory + base64 fonty |
| `img-src` | `https://res.cloudinary.com` | uživatelské obrázky + dice skiny ([diceSkins.ts](../../../src/features/world/chat/dice/lib/diceSkins.ts)) |
| `img-src` | `${BACKEND_HOST}` | `/static/` fallback obrázky (Cloudinary outage) |
| `img-src` | `data:` `blob:` | PixiJS WebGL textury / canvas / avatar blob |
| `connect-src` | `${BACKEND_HOST}` | REST `/api` + Socket.IO (wss + polling — holý host kryje obojí) |
| `connect-src` | `https://challenges.cloudflare.com` | Turnstile validace |
| `worker-src` | `'self'` | service worker `/sw.js` (push/PWA) |
| `manifest-src` | `'self'` | `manifest.webmanifest` (PWA) |

⚠️ **Otevřené k ověření v report-only:** zda TipTap/ProseMirror nebo jiná knihovna injektuje `<style>` (→ případně `'unsafe-inline'` jen pro `style-src`). Zda Turnstile potřebuje i jinou subdoménu než `challenges.cloudflare.com`.

---

## 6. Hash pre-hydration skriptu (CI guard)

Inline skript je statický → SHA-256 z přesného obsahu `<script>…</script>` (bez tagů). Aby se nerozbil tichý drift (někdo upraví skript, hash neaktualizuje → CSP zablokuje vlastní skript → bílá stránka):

- **build-time/CI**: skript spočítá hash z `index.html` a porovná/vloží do nginx template; mismatch = chyba buildu.
- Detail (přesný skript, kam hash vložit) → implementační plán.

💡 Bez tohoto guardu je hash-based CSP křehká — proto je guard součástí rozsahu, ne dluh.

---

## 7. Postup nasazení (report-only → enforce)

1. **Fáze 1 — report-only**: nasadit jako `Content-Security-Policy-Report-Only` (`CSP_REPORT_ONLY=1`). Web funguje plně, porušení se jen hlásí (DevTools konzole). Posbírat reálná porušení na produkci přes běžné scénáře (chat, mapa, registrace, témata, push).
2. **Fáze 2 — ladění**: doplnit chybějící zdroje / rozhodnout o `style-src 'unsafe-inline'`.
3. **Fáze 3 — enforce**: přepnout na tvrdé `Content-Security-Policy` (`CSP_REPORT_ONLY=0`).
4. BE helmet lze nasadit rovnou na tvrdo (API nic nerozbije).

---

## 8. Ověření / testy

- **Lokálně**: `docker compose build && up`, otevřít web, projít kritické cesty (login → svět → mapa → chat → registrace s Turnstile → přepnutí motivu → push subscribe), v DevTools **0 CSP violations** (v enforce fázi).
- **Hlavičky**: `curl -I https://<fe>/` → ověřit přítomnost CSP/HSTS/Referrer-Policy; `curl -I https://<be>/api/health` → BE helmet hlavičky.
- **BE**: helmet nesmí rozbít `/static/` CORP (PixiJS textury) — ověřit načtení mapy s obrázkovým pozadím.
- **Build guard**: úmyslná změna pre-hydration skriptu → CI hash mismatch musí selhat.
- `mobil-desktop` skill po jakékoli viditelné změně (nemělo by být — jde o hlavičky).

---

## 9. Rizika

| Riziko | Mitigace |
|---|---|
| CSP rozbije legitimní zdroj (bílá stránka) | Report-only fáze první; enforce až po 0 porušení |
| Hash drift → CSP zablokuje vlastní skript | CI guard (§6) |
| helmet default CORP `same-origin` rozbije `/static/` WebGL textury | `crossOriginResourcePolicy: false` (řídí si `/static/` sám) |
| HSTS na špatné doméně / před hotovým HTTPS | `preload` MIMO rozsah; `max-age` lze snížit; aplikuje se jen po HTTPS |
| envsubst nahradí nginx `$uri` | `NGINX_ENVSUBST_FILTER` na náš prefix |

---

## 10. Otevřené otázky (k potvrzení / vyřeší se v report-only)

1. **Backend doména pro `BACKEND_HOST`** — odvodit automaticky z `VITE_API_URL` v deploy.yml (strip schématu), nebo nová GitHub var? *(navrhuji odvodit — jeden zdroj pravdy)*
2. **`style-src 'unsafe-inline'`** — rozhodne report-only fáze; držet skripty tvrdé bez ohledu na styly.
3. **Serverový report sběr** (`report-uri`) — teď ne (follow-up 14.3-a), nebo rovnou? *(navrhuji odložit)*
