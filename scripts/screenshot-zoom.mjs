import { chromium } from 'playwright';
import path from 'node:path';

const URL = 'http://localhost:5180';
const OUT_DIR = path.resolve('docs/arch/phase-1/_screenshots');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    try { window.localStorage.setItem('ikaros.theme', JSON.stringify('severske-runy')); } catch (e) {}
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);

  // Zoom into sidebar area (left panel + part of main)
  await page.screenshot({
    path: path.join(OUT_DIR, 'severske-runy-sidebar-zoom.png'),
    clip: { x: 0, y: 0, width: 700, height: 800 },
  });
  console.log('✓ sidebar zoom 700×800');

  // Zoom into welcome arch + card area
  await page.screenshot({
    path: path.join(OUT_DIR, 'severske-runy-welcome-zoom.png'),
    clip: { x: 280, y: 50, width: 1300, height: 800 },
  });
  console.log('✓ welcome zoom 1300×800');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
