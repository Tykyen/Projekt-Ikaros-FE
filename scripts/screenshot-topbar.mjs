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
  await page.waitForTimeout(3000);

  // Top bar zoom
  await page.screenshot({
    path: path.join(OUT_DIR, 'severske-runy-topbar.png'),
    clip: { x: 1200, y: 0, width: 720, height: 90 },
  });

  // Sidebar zoom (chat section + active button visibility)
  await page.screenshot({
    path: path.join(OUT_DIR, 'severske-runy-chat-zoom.png'),
    clip: { x: 0, y: 600, width: 360, height: 280 },
  });

  console.log('✓ topbar + chat-zoom done');
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
