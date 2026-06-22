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

// TTL cache per skupina rout (ms): statické stránky se mění zřídka → dlouho,
// dynamický obsah (světy/články/galerie) → krátce, ať náhled nezastará.
const TTL_STATIC = 24 * 60 * 60 * 1000; // 24 h
const TTL_DYNAMIC = 30 * 60 * 1000; // 30 min
const STATIC_PATHS = /^\/(podminky)?$|^\/ikaros\/napoveda/;

function ttlForPath(pathname) {
  return STATIC_PATHS.test(pathname) ? TTL_STATIC : TTL_DYNAMIC;
}

// Cache klíč = jen path (žádný uživatel/token) — privátní se stejně nerenderuje,
// takže nemůže dojít k záměně odpovědí mezi uživateli (spec §3 bod 4).
const cache = new LRUCache({ max: 500, ttl: TTL_DYNAMIC });

// Jeden sdílený prohlížeč pro všechny požadavky (drahé je startovat ho znovu);
// per request otevřeme jen novou kartu (page) a zase ji zavřeme.
let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      // --no-sandbox je v kontejneru nutné (běží jako root, žádný user namespace);
      // bezpečnostní hranice je sám kontejner.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    // Když prohlížeč spadne, zahodíme promise → příští request ho nastartuje znovu.
    browserPromise.then((b) => b.on("disconnected", () => (browserPromise = null)));
  }
  return browserPromise;
}

async function renderPage(pathname) {
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
