import { chromium } from 'playwright';
import path from 'node:path';

const URL = process.env.URL || 'http://localhost:5182';
const OUT_DIR = path.resolve('docs/arch/phase-1/_screenshots');

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 667  },
  { name: 'tablet',  width: 1024, height: 768  },
  { name: 'desktop', width: 1440, height: 900  },
];

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { window.localStorage.setItem('ikaros.theme', JSON.stringify('arabsky-svet')); } catch (e) {}
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.screenshot({
    path: path.join(OUT_DIR, `arabsky-svet-${vp.name}-${vp.width}.png`),
    fullPage: true,
    animations: 'disabled',
    timeout: 60000,
  });
  console.log(`saved arabsky-svet-${vp.name}-${vp.width}.png`);

  if (vp.name === 'desktop') {
    const welcome = page.locator('[data-frame-panel="card"]').first();
    if (await welcome.count()) {
      await welcome.screenshot({
        path: path.join(OUT_DIR, 'arabsky-svet-welcome-zoom.png'),
        animations: 'disabled',
        timeout: 60000,
      });
      console.log('saved arabsky-svet-welcome-zoom.png');
    }
    const sidebar = page.locator('[data-frame-panel="sidebar"]').first();
    if (await sidebar.count()) {
      await sidebar.screenshot({
        path: path.join(OUT_DIR, 'arabsky-svet-sidebar-zoom.png'),
        animations: 'disabled',
        timeout: 60000,
      });
      console.log('saved arabsky-svet-sidebar-zoom.png');
    }
  }

  await ctx.close();
}

await browser.close();
