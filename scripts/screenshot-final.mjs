import { chromium } from 'playwright';
import path from 'node:path';

const URL = 'http://localhost:5180';
const OUT_DIR = path.resolve('docs/arch/phase-1/_screenshots');

const VIEWPORTS = [
  { name: 'final-desktop', w: 1920, h: 1080, isMobile: false, scale: 1 },
  { name: 'final-tablet',  w: 768, h: 1024, isMobile: false, scale: 1 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: vp.scale,
      isMobile: vp.isMobile,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ikaros.theme', JSON.stringify('severske-runy')); } catch (e) {}
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);

    await page.screenshot({
      path: path.join(OUT_DIR, `severske-runy-${vp.name}.png`),
      fullPage: false,
    });
    console.log(`✓ ${vp.name} ${vp.w}×${vp.h}`);

    await ctx.close();
  }

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
