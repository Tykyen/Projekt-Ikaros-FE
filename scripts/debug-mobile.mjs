import { chromium } from 'playwright';

const URL = 'http://localhost:5180';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { window.localStorage.setItem('ikaros.theme', JSON.stringify('severske-runy')); } catch (e) {}
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => {
    const body = document.querySelector('[data-shell="ikaros"]');
    const layoutBody = body?.querySelector('[class*="body"]:not([class*="sidebar"])');
    const main = body?.querySelector('main');
    const welcomeCard = document.querySelector('[data-frame-panel="card"]');
    const sidebar = document.querySelector('[class*="sidebar"]');
    const measure = (el) => el ? {
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      computedDisplay: getComputedStyle(el).display,
      classes: el.className.slice(0, 150),
    } : null;
    return {
      window: { w: window.innerWidth, h: window.innerHeight },
      shell: measure(body),
      layoutBody: measure(layoutBody),
      main: measure(main),
      welcomeCard: measure(welcomeCard),
      sidebar: measure(sidebar),
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(console.error);
