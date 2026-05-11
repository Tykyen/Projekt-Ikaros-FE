import { chromium } from 'playwright';
import path from 'node:path';

const URL = 'http://localhost:5180/chat/hospoda';
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

  // Show NavLink to hospoda — najdeme button
  const result = await page.evaluate(() => {
    const link = document.querySelector('a[data-nav-key="hospoda"]');
    if (!link) return { found: false };
    return {
      found: true,
      className: link.className,
      isActive: link.className.includes('Active'),
      rect: link.getBoundingClientRect(),
      bg: getComputedStyle(link).background.slice(0, 200),
      borderColor: getComputedStyle(link).borderColor,
      boxShadow: getComputedStyle(link).boxShadow.slice(0, 200),
    };
  });
  console.log(JSON.stringify(result, null, 2));

  // Screenshot top-left sidebar with active hospoda
  await page.screenshot({
    path: path.join(OUT_DIR, 'severske-runy-chat-active.png'),
    clip: { x: 0, y: 700, width: 360, height: 250 },
  });
  console.log('✓ chat-active');

  await browser.close();
}

main().catch(console.error);
