/**
 * Spec 26.1 / 02 §3.7 — zpracování surových assetů Vypravěče.
 * Vstup:  src/assets/vypravec/raw/*.png   (dodává vlastník z generátoru)
 * Výstup: src/assets/vypravec/           (ořezané PNG + WebP velikosti)
 *         src/assets/vypravec/silueta-*.png (1-bit černé siluety pro masku)
 *
 * Kroky: auto-detekce green screenu (rohové pixely) → chroma-key + despill →
 * bbox ořez podle alfy → čtvercové plátno s 4% paddingem → resize výstupy.
 * Spuštění: node scripts/vypravec-assets.mjs   (idempotentní, přepisuje výstupy)
 */
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RAW = path.resolve('src/assets/vypravec/raw');
const OUT = path.resolve('src/assets/vypravec');

/** velikosti dle role assetu (02 §3.7): [png, ...webp] */
const ROLE = {
  avatar: { png: 256, webp: [96, 192] },
  bust: { png: 512, webp: [256, 512] },
  master: { png: 1024, webp: [512, 1024] },
};
const roleOf = (name) =>
  name.includes('avatar') ? 'avatar' : name.includes('master') ? 'master' : 'bust';

/** Siluety se derivují z těchto assetů (maska FAB uvnitř světa = Joe). */
const SILUETY = ['ishida-master', 'ishida-bust-ukazuje', 'joe-master', 'joe-bust-ukazuje'];

function isGreen(r, g, b, a) {
  return a > 200 && g > 90 && g > r * 1.35 && g > b * 1.35;
}

/**
 * Vypečená „šachovnice průhlednosti" (náhled z generátoru, ~240/~254 šedá):
 * pozadí je souvislé s okrajem → flood-fill od všech okrajových pixelů přes
 * pixely blízké jednomu ze dvou odstínů šachovnice. Neukousne slonovinu uvnitř
 * postavy (není spojená s okrajem cestou přes barvy šachovnice).
 * Vrací true, pokud šachovnici našel a vymaskoval (alfa→0 + 1px feather okraje).
 */
function keyCheckerboard(raw, width, height) {
  const px = (x, y) => {
    const i = (y * width + x) * 4;
    return [raw[i], raw[i + 1], raw[i + 2], raw[i + 3]];
  };
  // odstíny z rohů: čekáme dva ploché světlé odstíny (šedá/bílá), nízká sytost
  const cs = [px(2, 2), px(width - 3, 2), px(2, height - 3), px(width - 3, height - 3), px(30, 2), px(2, 30)];
  const flat = cs.filter(([r, g, b, a]) => a > 200 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8 && r > 225);
  if (flat.length < 4) return false;
  const shades = [...new Set(flat.map(([r]) => r))].sort((a, b) => a - b);
  const lo = shades[0];
  const hi = shades[shades.length - 1];
  const isBgColor = (r, g, b) =>
    Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && (Math.abs(r - lo) <= 8 || Math.abs(r - hi) <= 8);

  const bg = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) {
    stack.push(x, x + (height - 1) * width);
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + width - 1);
  }
  while (stack.length) {
    const p = stack.pop();
    if (bg[p]) continue;
    const i = p * 4;
    if (!isBgColor(raw[i], raw[i + 1], raw[i + 2])) continue;
    bg[p] = 1;
    const x = p % width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (p >= width) stack.push(p - width);
    if (p < width * (height - 1)) stack.push(p + width);
  }
  let keyed = 0;
  for (let p = 0; p < bg.length; p++) {
    if (bg[p]) {
      raw[p * 4 + 3] = 0;
      keyed++;
    }
  }
  if (keyed < width * height * 0.05) return false; // nic podstatného — nebyla to šachovnice
  // 1px feather: pixel postavy sousedící s pozadím → poloviční alfa (anti-halo)
  for (let p = 0; p < bg.length; p++) {
    if (bg[p]) continue;
    const x = p % width;
    const sousedi =
      (x > 0 && bg[p - 1]) ||
      (x < width - 1 && bg[p + 1]) ||
      (p >= width && bg[p - width]) ||
      (p < width * (height - 1) && bg[p + width]);
    if (sousedi) raw[p * 4 + 3] = Math.min(raw[p * 4 + 3], 128);
  }
  return true;
}

async function process(file) {
  const name = path.basename(file, '.png');
  const img = sharp(path.join(RAW, file)).ensureAlpha();
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();

  // green screen? — vzorek 4 rohů
  const corner = (x, y) => {
    const i = (y * width + x) * 4;
    return [raw[i], raw[i + 1], raw[i + 2], raw[i + 3]];
  };
  const corners = [corner(2, 2), corner(width - 3, 2), corner(2, height - 3), corner(width - 3, height - 3)];
  const greenBg = corners.filter(([r, g, b, a]) => isGreen(r, g, b, a)).length >= 3;
  const checkerBg = !greenBg && keyCheckerboard(raw, width, height);

  // chroma-key + despill + bbox
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let [r, g, b, a] = [raw[i], raw[i + 1], raw[i + 2], raw[i + 3]];
      if (greenBg && isGreen(r, g, b, a)) {
        raw[i + 3] = 0;
        a = 0;
      } else if (greenBg && g > Math.max(r, b)) {
        raw[i + 1] = Math.max(r, b); // despill zelených okrajů
      }
      if (a > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) throw new Error(`${file}: prázdná alfa po klíčování`);

  // čtvercové plátno s 4% paddingem, postava centrovaná
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const side = Math.round(Math.max(bw, bh) * 1.08);
  const cut = sharp(raw, { raw: { width, height, channels: 4 } }).extract({
    left: minX,
    top: minY,
    width: bw,
    height: bh,
  });
  const square = sharp(await cut.png().toBuffer()).extend({
    top: Math.floor((side - bh) / 2),
    bottom: Math.ceil((side - bh) / 2),
    left: Math.floor((side - bw) / 2),
    right: Math.ceil((side - bw) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const squareBuf = await square.png().toBuffer();

  // výstupy dle role
  const { png, webp } = ROLE[roleOf(name)];
  await sharp(squareBuf).resize(png, png).png().toFile(path.join(OUT, `${name}.png`));
  for (const w of webp) {
    await sharp(squareBuf).resize(w, w).webp({ quality: 88 }).toFile(path.join(OUT, `${name}-${w}.webp`));
  }

  // silueta (plná čerň z alfy)
  if (SILUETY.includes(name)) {
    const sq = sharp(squareBuf);
    const { width: sw, height: sh } = await sq.metadata();
    const sraw = await sq.ensureAlpha().raw().toBuffer();
    for (let i = 0; i < sraw.length; i += 4) {
      const on = sraw[i + 3] > 128 ? 255 : 0;
      sraw[i] = 0;
      sraw[i + 1] = 0;
      sraw[i + 2] = 0;
      sraw[i + 3] = on;
    }
    await sharp(sraw, { raw: { width: sw, height: sh, channels: 4 } })
      .resize(512, 512)
      .png()
      .toFile(path.join(OUT, `silueta-${name}.png`));
  }

  return { name, greenBg, checkerBg, side };
}

const files = (await readdir(RAW)).filter((f) => f.endsWith('.png'));
await mkdir(OUT, { recursive: true });
console.log(`Zpracovávám ${files.length} souborů z ${RAW}`);
for (const f of files) {
  const r = await process(f);
  console.log(
    ` ✓ ${r.name}${r.greenBg ? ' (green screen odklíčován)' : ''}${r.checkerBg ? ' (šachovnice odklíčována)' : ' (alfa beze změny!)'}`,
  );
}
console.log('Hotovo →', OUT);
