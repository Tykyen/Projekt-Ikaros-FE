import { chromium } from 'playwright';
import path from 'node:path';

const URL = 'http://localhost:5181';
const OUT_DIR = path.resolve('docs/arch/phase-1/_screenshots');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  try { window.localStorage.setItem('ikaros.theme', JSON.stringify('indiane')); } catch (e) {}
});
await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(3500);
await page.screenshot({
  path: path.join(OUT_DIR, 'indiane-desktop-1440.png'),
  fullPage: true,
  animations: 'disabled',
  timeout: 60000,
});

const welcome = page.locator('[data-frame-panel="card"]').first();
if (await welcome.count()) {
  await welcome.screenshot({
    path: path.join(OUT_DIR, 'indiane-welcome-zoom.png'),
    animations: 'disabled',
    timeout: 60000,
  });
  console.log('saved indiane-welcome-zoom.png');
}
console.log('saved indiane-desktop-1440.png');
await browser.close();
