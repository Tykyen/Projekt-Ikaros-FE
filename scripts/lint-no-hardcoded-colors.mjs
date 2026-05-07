import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('src');
const ALLOW = [
  'src/themes/themes/',          // theme definice mají hexy
  'src/themes/_shared/',          // base reset/tokens
  'src/__tests__/',               // testy
  'src/themes/__tests__/',
];
const HEX_RE = /(?<!var\(--[\w-]*?:\s*?)#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /\b(rgb|rgba|hsl|hsla)\s*\(/g;
const COLOR_NAME_RE = /\b(?:background|color|border)\s*:\s*(red|blue|green|black|white|gray|grey)\b/gi;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(p);
    } else if (/\.(css|tsx?)$/.test(entry.name)) {
      yield p;
    }
  }
}

let violations = 0;

for await (const file of walk(ROOT)) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if (ALLOW.some((a) => rel.includes(a))) continue;

  const content = await readFile(file, 'utf8');
  const issues = [];
  for (const m of content.matchAll(HEX_RE)) issues.push(`hex ${m[0]}`);
  for (const m of content.matchAll(RGB_RE)) issues.push(`${m[1]}(...)`);
  for (const m of content.matchAll(COLOR_NAME_RE)) issues.push(`color name "${m[1]}"`);

  if (issues.length > 0) {
    console.error(`✗ ${rel}`);
    for (const issue of issues) console.error(`    ${issue}`);
    violations += issues.length;
  }
}

if (violations > 0) {
  console.error(`\nFound ${violations} hardcoded color(s). Use var(--token) instead.`);
  process.exit(1);
} else {
  console.log('✓ No hardcoded colors found in components.');
}
