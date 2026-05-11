import { chromium } from 'playwright';

const URL = 'http://localhost:5180';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    try { window.localStorage.setItem('ikaros.theme', JSON.stringify('severske-runy')); } catch (e) {}
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Inspect actual DOM class names + data attributes
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const out = {
      theme: root.getAttribute('data-theme'),
      shell: document.querySelector('[data-shell]')?.getAttribute('data-shell'),
      cornerOrnaments: [],
      navItems: [],
      cards: [],
      logoImg: null,
    };

    // CornerOrnament
    document.querySelectorAll('[data-position]').forEach((el, i) => {
      if (i < 6) out.cornerOrnaments.push({
        className: el.className,
        position: el.getAttribute('data-position'),
        rect: el.getBoundingClientRect(),
        computedBg: getComputedStyle(el).backgroundImage.slice(0, 80),
        width: getComputedStyle(el).width,
      });
    });

    // navItem
    document.querySelectorAll('a[data-nav-key]').forEach((el, i) => {
      if (i < 3) {
        const icon = el.querySelector('[class*="navItemIcon"]');
        out.navItems.push({
          className: el.className,
          navKey: el.getAttribute('data-nav-key'),
          iconClassName: icon?.className,
          iconBg: icon ? getComputedStyle(icon).backgroundImage.slice(0, 100) : 'no icon',
        });
      }
    });

    // Cards
    document.querySelectorAll('[data-frame-panel]').forEach((el) => {
      out.cards.push({
        className: el.className.slice(0, 100),
        panel: el.getAttribute('data-frame-panel'),
        rect: { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height },
      });
    });

    // Logo
    const logoImg = document.querySelector('[class*="logoImg"]');
    if (logoImg) {
      out.logoImg = {
        className: logoImg.className,
        display: getComputedStyle(logoImg).display,
        bg: getComputedStyle(logoImg).backgroundImage.slice(0, 100),
        width: getComputedStyle(logoImg).width,
        height: getComputedStyle(logoImg).height,
      };
    }

    return out;
  });

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
