import { chromium } from 'playwright';
import path from 'node:path';

const URL = 'http://localhost:5180';
const OUT_DIR = path.resolve('docs/arch/phase-1/_screenshots');

async function setupTheme(page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('ikaros.theme', JSON.stringify('severske-runy'));
    } catch (e) {}
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Desktop
  {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();
    await setupTheme(page);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // allow theme decorations to load
    await page.screenshot({ path: path.join(OUT_DIR, 'severske-runy-desktop.png'), fullPage: false });
    console.log('✓ desktop 1920×1080');
    await ctx.close();
  }

  // Mobile
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await setupTheme(page);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, 'severske-runy-mobile.png'), fullPage: false });
    console.log('✓ mobile 375×812');
    await ctx.close();
  }

  await browser.close();
  console.log(`Outputs: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
