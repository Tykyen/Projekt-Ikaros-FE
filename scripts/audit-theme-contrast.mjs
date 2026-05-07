import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

// WCAG contrast formula
function relLuminance(hex) {
  const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!rgb) return 0;
  const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [
  { fg: '--text-primary',   bg: '--bg-primary',   min: 4.5, label: 'body text on primary bg' },
  { fg: '--text-primary',   bg: '--bg-card',      min: 4.5, label: 'body text on card' },
  { fg: '--text-secondary', bg: '--bg-primary',   min: 4.5, label: 'secondary text on primary bg' },
  { fg: '--accent',         bg: '--bg-primary',   min: 3.0, label: 'accent on primary (UI)' },
  { fg: '--text-on-accent', bg: '--accent',       min: 4.5, label: 'on-accent text' },
  { fg: '--text-on-danger', bg: '--danger',       min: 4.5, label: 'on-danger text' },
];

async function audit() {
  const themesDir = path.resolve('src/themes/themes');
  const themeDirs = (await readdir(themesDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let totalIssues = 0;

  for (const id of themeDirs) {
    const indexPath = path.join(themesDir, id, 'index.ts');
    const content = await readFile(indexPath, 'utf8');

    const vars = {};
    const re = /'(--[\w-]+)':\s+'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))'/g;
    let m;
    while ((m = re.exec(content))) {
      const [, key, value] = m;
      vars[key] = value;
    }

    const issues = [];
    for (const pair of PAIRS) {
      const fg = vars[pair.fg];
      const bg = vars[pair.bg];
      if (!fg || !bg) continue;
      if (!fg.startsWith('#') || !bg.startsWith('#')) continue;
      const ratio = contrast(fg, bg);
      const min = pair.min;
      if (ratio < min) {
        issues.push(`  ✗ ${pair.label}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1 (need ≥${min})`);
      }
    }

    if (issues.length > 0) {
      console.log(`\n${id}:`);
      issues.forEach((i) => console.log(i));
      totalIssues += issues.length;
    } else {
      console.log(`✓ ${id}`);
    }
  }

  console.log(`\n${totalIssues > 0 ? `\n${totalIssues} contrast issue(s) found.` : '\nAll themes pass WCAG AA.'}`);
  if (totalIssues > 0) process.exit(1);
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
