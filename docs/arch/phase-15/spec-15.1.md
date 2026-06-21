# Spec 15.1 — PWA: instalace na plochu (offline shell + install hint + iOS)

Navazuje na **13.2c** (manifest, push SW, registrace, ikony). 13.2c dodalo
*instalovatelnost kvůli pushi*; 15.1 dělá z webu „skutečnou appku": přežije
výpadek sítě slušnou hláškou, aktivně pobízí k instalaci a funguje i na iOS
(kde bez PWA na ploše nechodí push).

## Cíl

- Při výpadku sítě se místo „dino hry" prohlížeče ukáže tematická **offline
  stránka**; appka po prvním načtení startuje rychleji (assety z cache).
- **Aktivní pobídka k instalaci** — vlastní nenápadný banner místo skrytého
  browserového menu; na iOS instrukční návod (jiná cesta než Android/desktop).
- iOS metadata, aby ikona/název na ploše seděly a appka běžela fullscreen.

## Stav před 15.1 (z 13.2c — neměnit, jen rozšířit)

- ✅ [manifest.webmanifest](../../../public/manifest.webmanifest) — `standalone`, ikony 192/512/maskable, theme/background color.
- ✅ [index.html](../../../index.html) — `<link rel="manifest">`, `theme-color`.
- ✅ [sw.js](../../../public/sw.js) — **jen** push (`push`/`notificationclick`/`pushsubscriptionchange`), **žádný `fetch` handler**.
- ✅ [main.tsx](../../../src/app/main.tsx) — registrace SW (`/sw.js?api=<origin>`).
- ✅ ikony bez alfy (colorType 2) → použitelné jako `apple-touch-icon` bez podkládání.

## Rozhodnutí (schváleno uživatelem)

1. **Offline = jen app shell + offline stránka, žádná data.** Ikaros je
   real-time (chat, mapa, novinky); cacheovat data = zastaralý stav + peklo
   invalidace. Cílem je slušný offline fallback, ne offline režim.
2. **Vlastní install hint** (Android/desktop přes `beforeinstallprompt`, iOS
   instrukční), dismissible, nezobrazovat ve standalone režimu.
3. **Ruční SW** (žádný `vite-plugin-pwa`/Workbox) — nechceme injektovat
   fungující push SW a riskovat jeho rozbití; rozsah je „malý".

## A — Offline shell cache (rozšíření `public/sw.js`)

📚 *Service worker fetch handler* = SW může zachytit každý síťový požadavek
stránky a rozhodnout, zda vrátit z cache nebo ze sítě.

### A1 — Dev guard (KRITICKÉ)

Dnešní SW je „bezpečný v dev" právě proto, že nemá `fetch` handler — jinak by
cacheoval Vite dev moduly a **rozbil HMR**. Proto:

- [main.tsx](../../../src/app/main.tsx) přidá do SW URL parametr `&mode=prod`
  **jen** když `import.meta.env.PROD`.
- SW aktivuje `fetch`/cache logiku **pouze** když `mode=prod`. V dev zůstává
  push-only (dnešní chování beze změny).

### A2 — Cache lifecycle

- Konstanta verze, např. `const CACHE = 'ikaros-shell-v1'`.
- `install`: precache `OFFLINE_URL = '/offline.html'` (+ stávající `skipWaiting`).
- `activate`: smaž všechny cache kromě aktuální verze (`caches.keys` → delete);
  ponech stávající `clients.claim`.

### A3 — `fetch` strategie (jen `mode=prod`, jen GET same-origin)

- **Navigace** (`request.mode === 'navigate'`): **network-first** → při selhání
  sítě vrať `/offline.html` z cache. (Necacheujeme `index.html` jako shell —
  prázdná appka bez dat je matoucí; čistá offline stránka je poctivější.)
- **Assety** `/assets/*` (Vite je hashuje → immutable): **cache-first**, na miss
  fetch + ulož. Tím „cache shellu" = JS/CSS bundle → rychlý další start.
- **Vše ostatní** (API, cross-origin fonty, `/icons/`, `/themes/`…): **nech
  projít** (žádný `respondWith`) — neřešíme, neriskujeme stale.

### A4 — `offline.html`

Self-contained statická stránka v `public/offline.html`: inline CSS, fialové
synthwave ladění (brand), logo/ikona, text „Jsi offline — Ikaros potřebuje
připojení", tlačítko „Zkusit znovu" (`location.reload()`). **Žádné externí
závislosti** (funguje i bez nacacheovaných assetů). Min. responsivní.

## B — Install hint UI (nový modul `src/features/pwa/`)

### B1 — `useInstallPrompt()` hook

- Drží zachycený `beforeinstallprompt` event (Android/desktop Chromium):
  `e.preventDefault()` + ulož do stavu → `canInstall`.
- Detekce platformy: `isIos` (UA), `isStandalone`
  (`matchMedia('(display-mode: standalone)')` || `navigator.standalone`).
- Detekce dismiss: localStorage klíč `pwa:install-dismissed` (+ případně
  timestamp pro „neotravuj X dní" — viz B3).
- `install()`: zavolá `prompt()` na uloženém eventu, podle `userChoice`
  vyčistí stav.

### B2 — `InstallBanner` komponenta

- **Nezobrazí se**, když: `isStandalone` (už nainstalováno), dismissnuto, nebo
  (Android/desktop) `beforeinstallprompt` nepřišel a není iOS.
- **Android/desktop**: text + tlačítko „Nainstalovat aplikaci" → `install()`.
- **iOS Safari**: instrukční hint „Klepni na Sdílet → Přidat na plochu"
  (ikona share), protože `beforeinstallprompt` na iOS neexistuje. 💡 Bez instalace
  na iOS nechodí push — proto je iOS větev povinná, ne nice-to-have.
- Dismiss (×) → zapíše do localStorage, banner zmizí.
- Nenápadný (spodní banner / nízká vizuální váha), respektuje skin tokeny.

### B3 — Umístění a frekvence

- Vykreslit globálně (root) — nezávisle na přihlášení; instalovat může i
  nepřihlášený.
- Dismiss persistuje; znovu nabídnout nejdřív po delší době (rozhodnout v plánu:
  trvalý dismiss vs. re-nabídka po N dnech).
- 🔀 Alternativa „položka v Nastavení" — možná později; pro 15.1 stačí banner.

## C — iOS metadata + apple-touch-icon ([index.html](../../../index.html))

- `<link rel="apple-touch-icon" href="/icons/icon-192.png">` (bez alfy → bez
  černého podkladu; iOS si velikost přepočítá).
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="apple-mobile-web-app-title" content="Ikaros">`
- 🔁 Pozor na cache-busting: pokud `apple-touch-icon` dostane `?v=`, doplnit do
  [stamp-pwa-icons.mjs](../../../scripts/stamp-pwa-icons.mjs); jinak ho tam
  neřešit (iOS si ikonu cachuje sám, drobnost).

## Co se NEdělá (mimo rozsah 15.1)

- Žádné offline cacheování **dat** (API odpovědi, obrázky map/postav).
- Žádný background sync / offline fronta akcí.
- Žádný `vite-plugin-pwa` / Workbox refactor.
- Žádná změna push logiky (13.2c zůstává).

## Rizika a pasti

- ⚠️ **HMR v dev** — viz A1; pokud by se `mode=prod` gate zapomněl, SW v dev
  začne cacheovat moduly. Ověřit, že dev HMR funguje po změně.
- ⚠️ **`serviceWorker.ready`** — [usePush.ts:47](../../../src/features/notifications/api/usePush.ts#L47)
  na něj čeká; nový lifecycle (`skipWaiting`/`claim` už tam jsou) ho nesmí
  zablokovat. `.ready` se resolvne při aktivaci → OK.
- ⚠️ **Bobtnání assets cache** — staré hashované assety zůstanou po deployi.
  Drobnost (browser evictuje dle kvóty); případně bump `CACHE` verze při buildu.
- ⚠️ **Aktualizace SW** — `skipWaiting` + `claim` aktivuje nový SW hned;
  cache-first assety by mohly krátce míchat staré/nové. Hashované názvy to řeší
  (nová URL = miss = fetch).

## Ověření

- `npm run build` (tsc -b) prochází.
- Dev: HMR funguje, žádné cacheování modulů.
- Prod build: offline (DevTools → Offline) → navigace ukáže `offline.html`;
  druhý load rychlejší (assety z cache).
- Lighthouse PWA / „Installable" zelené; install banner se ukáže (desktop
  Chrome) a zmizí ve standalone.
- iOS Safari: apple-touch-icon + název na ploše; instrukční hint se ukáže.
- Push (13.2c) stále funguje — `usePush` enable/disable beze změny.
- `mobil-desktop` audit banneru + offline stránky.

## Dotčené soubory

- `public/sw.js` (rozšířit — fetch/cache lifecycle, gated `mode=prod`)
- `public/offline.html` (nový)
- `src/app/main.tsx` (`&mode=prod` do SW URL; mount `<InstallBanner>`)
- `src/features/pwa/useInstallPrompt.ts` (nový)
- `src/features/pwa/InstallBanner.tsx` (nový)
- `index.html` (iOS meta + apple-touch-icon)
- `scripts/stamp-pwa-icons.mjs` (jen pokud apple-touch-icon dostane `?v=`)
