// F6-BE codemod (error-contract audit, EC-05) — odstraní MRTVÉ pole `statusCode: NNN,`
// z objektů uvnitř `throw new *Exception({...})`. HttpExceptionFilter status bere z
// exception.getStatus(), takže statusCode v těle je ignorováno (potvrzeno M-SHAPE).
//
// Bezpečnost: nahrazuje POUZE uvnitř balancovaných throw bloků (ne náhodný statusCode
// v response/DTO/test datech). Přeskakuje .spec/.test soubory.
//
// Spuštění:  node scripts/strip-throw-statuscode.mjs          (dry-run: jen report)
//            node scripts/strip-throw-statuscode.mjs --write  (zapíše změny)
import fs from 'node:fs';
import path from 'node:path';

const BE_SRC = 'c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src';
const WRITE = process.argv.includes('--write');
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage']);

const isTarget = (n) =>
  n.endsWith('.ts') &&
  !n.endsWith('.spec.ts') &&
  !n.endsWith('.test.ts') &&
  !n.endsWith('.d.ts');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) out.push(...walk(path.join(dir, e.name)));
    } else if (isTarget(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}

// vrátí [start,end) rozsahy obsahu uvnitř `throw new XException( ... )` (vč. závorek)
function throwRanges(src) {
  const ranges = [];
  const re = /throw\s+new\s+\w*Exception\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = re.lastIndex;
    let depth = 1;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === '`' || ch === '"' || ch === "'") {
        const q = ch; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      }
      i++;
    }
    ranges.push([m.index, i]);
  }
  return ranges;
}

const STATUSCODE_LINE = /\n[ \t]*statusCode:\s*\d+,/g;
let totalRemoved = 0;
let filesChanged = 0;

for (const f of walk(BE_SRC)) {
  let src = fs.readFileSync(f, 'utf8');
  const ranges = throwRanges(src);
  if (!ranges.length) continue;
  // od konce, ať se indexy neposunou
  let removedInFile = 0;
  for (let r = ranges.length - 1; r >= 0; r--) {
    const [s, e] = ranges[r];
    const block = src.slice(s, e);
    const cleaned = block.replace(STATUSCODE_LINE, () => { removedInFile++; return ''; });
    if (cleaned !== block) src = src.slice(0, s) + cleaned + src.slice(e);
  }
  if (removedInFile) {
    totalRemoved += removedInFile;
    filesChanged++;
    console.log(`  ${path.relative(BE_SRC, f).replace(/\\/g, '/')}: -${removedInFile}`);
    if (WRITE) fs.writeFileSync(f, src, 'utf8');
  }
}

console.log(`\n${WRITE ? 'ZAPSÁNO' : 'DRY-RUN'}: ${totalRemoved} statusCode řádků v ${filesChanged} souborech`);
if (!WRITE) console.log('Spusť s --write pro zápis.');
