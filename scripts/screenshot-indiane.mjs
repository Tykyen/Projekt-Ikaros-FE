import { chromium } from 'playwright';
import path from 'node:path';

const URL = process.env.SCREENSHOT_URL || 'http://localhost:5181';
const OUT_DIR = path.resolve('docs/arch/phase-1/_screenshots');
const THEME_ID = 'indiane';

const VIEWPORTS = [
  { name: 'mobile-375',   w: 375,  h: 812,  isMobile: true,  scale: 2 },
  { name: 'tablet-1024',  w: 1024, h: 768,  isMobile: false, scale: 2 },
  { name: 'desktop-1440', w: 1440, h: 900,  isMobile: false, scale: 1 },
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
    await page.addInitScript((themeId) => {
      try { window.localStorage.setItem('ikaros.theme', JSON.stringify(themeId)); } catch (e) {}
    }, THEME_ID);
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3500);

    await page.screenshot({
      path: path.join(OUT_DIR, `${THEME_ID}-${vp.name}.png`),
      fullPage: true,
      animations: 'disabled',
      timeout: 60000,
    });
    console.log(`✓ ${vp.name} ${vp.w}×${vp.h}`);

    if (vp.name === 'desktop-1440') {
      const welcome = page.locator('[data-frame-panel="card"]').first();
      if (await welcome.count()) {
        await welcome.screenshot({
          path: path.join(OUT_DIR, `${THEME_ID}-welcome-zoom.png`),
          animations: 'disabled',
          timeout: 60000,
        });
        console.log(`✓ welcome-zoom`);
      }
      const sidebar = page.locator('[data-frame-panel="sidebar"]').first();
      if (await sidebar.count()) {
        await sidebar.screenshot({
          path: path.join(OUT_DIR, `${THEME_ID}-sidebar-zoom.png`),
          animations: 'disabled',
          timeout: 60000,
        });
        console.log(`✓ sidebar-zoom`);
      }
    }

    await ctx.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
