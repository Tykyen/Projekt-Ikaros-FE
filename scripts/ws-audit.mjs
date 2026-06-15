// FE↔BE WebSocket kontraktní audit. Porovná socket eventy mezi FE a BE.
// Najde: FE poslouchá event, který BE neemituje (mrtvý listener — N-4/5/27),
//        FE emituje event, který BE nemá handler (zahozený emit — N-28).
// Pozn.: heuristika přes regex — dynamické názvy (`${x}`) a aliasy můžou dát
// false-positive; bere se jako vodítko, ne absolutní pravda.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Portabilní cesty (AR-09): relativně od scripts/ + env override pro CI multi-repo.
const BE_ROOT = process.env.IKAROS_BE_ROOT || path.resolve(__dirname, '../../Projekt-ikaros');
const BE = path.resolve(BE_ROOT, 'backend/src');
const FE = path.resolve(__dirname, '..', 'src');

function walk(dir, pred) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') stack.push(p);
      } else if (pred(p)) out.push(p);
    }
  }
  return out;
}

const isTest = (p) =>
  /\.(spec|test)\.(ts|tsx)$/.test(p) || p.includes('__tests__');

function collect(root, patterns, fileFilter) {
  const map = new Map(); // event -> Set<file>
  for (const f of walk(root, fileFilter)) {
    const src = fs.readFileSync(f, 'utf8');
    for (const re of patterns) {
      let m;
      const rx = new RegExp(re, 'g');
      while ((m = rx.exec(src))) {
        const ev = m[1];
        if (!ev || ev.includes('${')) continue; // přeskoč dynamické
        if (!map.has(ev)) map.set(ev, new Set());
        map.get(ev).add(path.relative(root, f));
      }
    }
  }
  return map;
}

// ── FE: co poslouchá / co emituje ──
const feFilter = (p) =>
  (p.endsWith('.ts') || p.endsWith('.tsx')) && !isTest(p);
const feListens = collect(
  FE,
  [
    String.raw`useSocketEvent[^(]*\(\s*['"\`]([^'"\`]+)['"\`]`,
    String.raw`socket\.on\(\s*['"\`]([^'"\`]+)['"\`]`,
    String.raw`\.on\(\s*['"\`]([a-z]+:[^'"\`]+)['"\`]`,
  ],
  feFilter,
);
const feEmits = collect(
  FE,
  [String.raw`socket\.emit\(\s*['"\`]([^'"\`]+)['"\`]`,
   String.raw`\.emit\(\s*['"\`]([a-z]+:[^'"\`]+)['"\`]`],
  feFilter,
);

// ── BE: co emituje / co má handler ──
const beFilter = (p) => p.endsWith('.ts') && !isTest(p);
const beEmits = collect(
  BE,
  [
    String.raw`\.emit\(\s*['"\`]([^'"\`]+)['"\`]`,
    String.raw`\.to\([^)]*\)\s*\.emit\(\s*['"\`]([^'"\`]+)['"\`]`,
  ],
  beFilter,
);
const beHandlers = collect(
  BE,
  [String.raw`@SubscribeMessage\(\s*['"\`]([^'"\`]+)['"\`]`],
  beFilter,
);

// Klientské eventy mají typicky `:` (presence:update, friend:request:incoming).
// Interní EventEmitter2 eventy mají `.` (friendship.requested) — ty ignorujeme,
// porovnáváme jen socket-style `:` eventy.
const isClientEvent = (e) => e.includes(':') && !e.includes('.');

console.log('=== FE poslouchá event, který BE NEEMITUJE (mrtvý listener) ===');
let dead = 0;
for (const [ev, files] of [...feListens].sort()) {
  if (!isClientEvent(ev)) continue;
  if (!beEmits.has(ev)) {
    dead++;
    console.log(`  ⚠️  ${ev.padEnd(34)} ← ${[...files][0]}`);
  }
}
if (!dead) console.log('  ✓ žádný');

console.log('\n=== FE emituje event, který BE NEMÁ handler (zahozený emit) ===');
let lost = 0;
for (const [ev, files] of [...feEmits].sort()) {
  if (!isClientEvent(ev)) continue;
  if (!beHandlers.has(ev)) {
    lost++;
    console.log(`  ⚠️  ${ev.padEnd(34)} → ${[...files][0]}`);
  }
}
if (!lost) console.log('  ✓ žádný');

console.log(
  `\nFE listens: ${feListens.size}, FE emits: ${feEmits.size}, BE emits: ${beEmits.size}, BE handlers: ${beHandlers.size}`,
);
console.log(`Nálezy: ${dead} mrtvých listenerů, ${lost} zahozených emitů.`);
