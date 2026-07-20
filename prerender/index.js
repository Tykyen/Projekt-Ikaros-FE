// 15B.1 — Prerender sidecar.
// Pro crawlery (Googlebot, Seznambot, sociální scrapery) načte SPA v headless
// Chromium, počká až se obsah domaluje (window.__PRERENDER_READY__), a vrátí
// hotové HTML. Lidé sem nikdy nedojdou — nginx je na SPA pustí přímo.
//
// Bezpečnost (leak-safe, viz spec-15B.1 §3): render běží jako ANONYM — žádné
// cookies/Authorization. Privátní obsah je serverově nedostupný anonymovi
// (BE OptionalJwtAuthGuard → 404), takže ho prerender fyzicky nezíská.

import express from "express";
import { LRUCache } from "lru-cache";
import puppeteer from "puppeteer-core";

const PORT = Number(process.env.PORT ?? 3000);
// Interní adresa SPA (nginx) v docker síti — sem prohlížeč chodí pro stránky.
const FRONTEND_INTERNAL = process.env.FRONTEND_INTERNAL ?? "http://frontend:80";
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/usr/bin/chromium-browser";
// Jak dlouho čekat na signál „SPA domalována", než to vzdáme a vrátíme co je.
const READY_TIMEOUT = Number(process.env.READY_TIMEOUT ?? 8000);
// Tvrdý strop na celý render (goto + wait), ať jedna zaseklá stránka neblokuje.
const NAV_TIMEOUT = Number(process.env.NAV_TIMEOUT ?? 15000);
// 24.2 — po kolika renderech Chromium recyklovat (0 = nikdy). Sdílená instance
// jinak žije, dokud nespadne, a headless Chromium přitom postupně roste.
// Default 50 (sníženo z 200 po prvním měření: 419 MiB / 768 MiB po ~11
// renderech). Hodnotu přebíjí `RECYCLE_AFTER` z compose.
const RECYCLE_AFTER = Number(process.env.RECYCLE_AFTER ?? 50);

// TTL cache per skupina rout (ms): statické stránky se mění zřídka → dlouho,
// dynamický obsah (světy/články/galerie) → krátce, ať náhled nezastará.
const TTL_STATIC = 24 * 60 * 60 * 1000; // 24 h
const TTL_DYNAMIC = 30 * 60 * 1000; // 30 min
// 21.5 — hub „Společná tvorba" je statický (mění se zřídka) → dlouhé TTL jako
// napoveda. Stuby (bestiar/herbar/…) jsou noindex, TTL nerozhoduje.
const STATIC_PATHS = /^\/(podminky)?$|^\/ikaros\/(napoveda|tvorba)/;

function ttlForPath(pathname) {
  return STATIC_PATHS.test(pathname) ? TTL_STATIC : TTL_DYNAMIC;
}

// Cache klíč = jen path (žádný uživatel/token) — privátní se stejně nerenderuje,
// takže nemůže dojít k záměně odpovědí mezi uživateli (spec §3 bod 4).
// 24.2 — `max` (počet položek) o paměti neříká nic: 500 velkých HTML může být
// klidně 200 MB. `maxSize` v bajtech je skutečný strop, `max` zůstává jako
// druhá pojistka proti tisícům drobných odpovědí.
const CACHE_MAX_BYTES = 64 * 1024 * 1024;
const cache = new LRUCache({
  max: 500,
  maxSize: CACHE_MAX_BYTES,
  sizeCalculation: (html) => Buffer.byteLength(html) || 1,
  ttl: TTL_DYNAMIC,
});

// Jeden sdílený prohlížeč pro všechny požadavky (drahé je startovat ho znovu);
// per request otevřeme jen novou kartu (page) a zase ji zavřeme.
let browserPromise = null;
// 24.2 — kolik renderů odbavil SOUČASNÝ browser + kolik jich právě běží.
// Recyklovat smíme jen na nule, jinak bychom zavřeli prohlížeč pod rukama
// requestu, který na něm má otevřenou kartu.
let renderCount = 0;
let inflight = 0;

async function getBrowser() {
  if (!browserPromise) {
    const launched = puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      // --no-sandbox je v kontejneru nutné (běží jako root, žádný user namespace);
      // bezpečnostní hranice je sám kontejner.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    browserPromise = launched;
    renderCount = 0;
    // Když prohlížeč spadne, zahodíme promise → příští request ho nastartuje znovu.
    // Porovnání s `launched` je nutné: při recyklaci zavíráme browser ručně a
    // mezitím už může běžet nový. Bez téhle podmínky by opožděný `disconnected`
    // starého prohlížeče zahodil promise toho NOVÉHO a osiřel by běžící proces.
    launched.then((b) =>
      b.on("disconnected", () => {
        if (browserPromise === launched) browserPromise = null;
      }),
    );
  }
  return browserPromise;
}

// 24.2 — recyklace vysloužilého prohlížeče. Volá se po každém renderu; zabere
// až když doběhnou všechny souběžné requesty. Nový prohlížeč nastartuje líně
// příští `getBrowser()`, takže tady nic nepředstartováváme.
async function maybeRecycleBrowser() {
  if (RECYCLE_AFTER <= 0 || renderCount < RECYCLE_AFTER || inflight > 0) return;
  const current = browserPromise;
  if (!current) return;
  browserPromise = null;
  renderCount = 0;
  try {
    const browser = await current;
    await browser.close();
    console.log(`[prerender] Chromium recyklován po ${RECYCLE_AFTER} renderech`);
  } catch (err) {
    // Zavření selhalo → promise je stejně zahozená, příští request nastartuje
    // čerstvý prohlížeč. Osiřelý proces uklidí nejpozději restart kontejneru.
    console.error("[prerender] recyklace selhala:", err?.message ?? err);
  }
}

async function renderPage(pathname) {
  // 24.2 — inflight se zvedá jako PRVNÍ, ještě před `await getBrowser()`.
  // Kdyby se zvedal až po něm, vzniklo by okno pro race: request B čeká na
  // `await`, mezitím request A doběhne, uvidí inflight === 0 a zavře prohlížeč —
  // a B by pak volal `newPage()` nad zavřeným browserem. Vnější `finally` čítač
  // vždy sníží, takže ani selhání `getBrowser()` ho nenechá viset.
  inflight++;
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      page.setDefaultNavigationTimeout(NAV_TIMEOUT);
      // 15B.7 — marker v UA, ať analytics ping z renderované SPA BE odfiltruje
      // (sidecar = headless Chrome, jinak by každý render nafoukl návštěvnost).
      const ua = await browser.userAgent();
      await page.setUserAgent(`${ua} Ikaros-Prerender`);
      // Render jako anonym — žádné hlavičky uživatele se nepřenášejí.
      await page.goto(FRONTEND_INTERNAL + pathname, { waitUntil: "domcontentloaded" });
      // Počkáme na signál, že SPA dořešila data; když nepřijde, vrátíme co je
      // (graceful degradation — radši neúplné HTML než 5xx, spec OO6).
      await page
        .waitForFunction("window.__PRERENDER_READY__ === true", { timeout: READY_TIMEOUT })
        .catch(() => {});
      return await page.content();
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    inflight--;
    // Počítáme i neúspěšné rendery — prohlížeč zatížily stejně jako povedené.
    renderCount++;
    // Nečekáme: recyklace nesmí zdržet odpověď crawlerovi (chyby si řeší sama).
    void maybeRecycleBrowser();
  }
}

const app = express();

// Healthcheck pro docker/compose.
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/{*path}", async (req, res) => {
  const pathname = req.originalUrl; // path + query, tak jak ho předá nginx

  const cached = cache.get(pathname);
  if (cached) {
    res.set("X-Prerender-Cache", "HIT");
    return res.status(200).type("html").send(cached);
  }

  try {
    const html = await renderPage(pathname);
    cache.set(pathname, html, { ttl: ttlForPath(pathname) });
    res.set("X-Prerender-Cache", "MISS");
    return res.status(200).type("html").send(html);
  } catch (err) {
    // Tvrdé selhání renderu — radši ať nginx pustí bota na holou SPA,
    // než aby dostal chybu. 5xx by mohlo poškodit indexaci.
    console.error(`[prerender] render selhal pro ${pathname}:`, err?.message ?? err);
    res.set("X-Prerender-Error", "1");
    return res.status(503).send("");
  }
});

app.listen(PORT, () => {
  console.log(`[prerender] poslouchá na :${PORT}, SPA = ${FRONTEND_INTERNAL}`);
});
