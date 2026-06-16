// Generátor PWA + notifikačních ikon z Ikaros loga (okřídlená postava).
// Zdroj 1024×1024 PNG → app ikony (any), maskable (safe-zone padding),
// favicon a notifikační badge (monochromní silueta na průhledném pozadí).
//
//   node scripts/gen-ikaros-icons.mjs
//
// Výstup do c:/tmp/icons-out pro vizuální kontrolu; teprve pak kopie do public.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'c:/tmp/ikaros-logo.png';
const OUT = 'c:/tmp/icons-out';
mkdirSync(OUT, { recursive: true });

// Vzorkuj barvu pozadí z rohu (pro maskable plátno — splyne s logem).
const corner = await sharp(SRC)
  .extract({ left: 4, top: 4, width: 1, height: 1 })
  .raw()
  .toBuffer();
const bg = { r: corner[0], g: corner[1], b: corner[2] };
console.log('pozadí loga:', bg);

// App ikony „any" — logo i s tmavým pozadím (zobrazí se na ploše jak je).
await sharp(SRC).resize(192, 192).png().toFile(`${OUT}/icon-192.png`);
await sharp(SRC).resize(512, 512).png().toFile(`${OUT}/icon-512.png`);

// Maskable — logo zmenšené do safe-zóny (~74 %), zbytek barva pozadí loga.
// Android ořezne do kruhu/squircle; křídlo se tak neuřízne.
const logo380 = await sharp(SRC).resize(380, 380).toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { ...bg, alpha: 1 } },
})
  .composite([{ input: logo380, gravity: 'center' }])
  .png()
  .toFile(`${OUT}/icon-maskable-512.png`);

// Favicon — malý, celé logo (konzistentní s app ikonou).
await sharp(SRC).resize(48, 48).webp({ quality: 92 }).toFile(`${OUT}/favicon.webp`);

// Notifikační badge — Android bere jen alfa a kreslí monochromní siluetu.
// Práh: světlá silueta (béžová ~220) → opaque, tmavé pozadí → průhledné.
const alpha = await sharp(SRC)
  .resize(96, 96)
  .greyscale()
  .threshold(100)
  .toColourspace('b-w')
  .toBuffer();
await sharp({
  create: { width: 96, height: 96, channels: 3, background: { r: 255, g: 255, b: 255 } },
})
  .joinChannel(alpha)
  .png()
  .toFile(`${OUT}/badge-96.png`);

console.log('hotovo →', OUT);
