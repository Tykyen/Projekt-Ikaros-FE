#!/usr/bin/env node
/**
 * Krok 6.3 D-NEW-dice-texture-hosting — bulk upload dice textur do
 * Cloudinary folder `dice-skins/`.
 *
 * Idempotentní:
 * - Soubory se uploadují s public_id = basename bez extension v folder
 *   `dice-skins/`. Cloudinary s `overwrite: false` přeskočí existující.
 * - Výsledek: `scripts/dice-textures-cdn.json` s mappingem
 *   `{ originalFilename: { secureUrl, publicId } }`.
 *
 * Provoz:
 *   1. `CLOUDINARY_URL=cloudinary://key:secret@cloud node scripts/upload-dice-textures-to-cloudinary.mjs`
 *      (nebo má `.env` v `Projekt-ikaros/backend/.env` — script ji načte)
 *   2. Po dokončení spusť `node scripts/rewrite-dice-skins-urls.mjs` pro
 *      přepsání URL v `diceSkins.ts`.
 *   3. Po ověření že FE načítá z CDN, `git rm -r public/textures/`.
 *
 * Concurrency: 8 paralelních uploadů (Cloudinary free tier zvládá; pro
 * placený plán lze zvednout přes `CONCURRENCY` env).
 */

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEXTURES_DIR = join(ROOT, 'public/textures');
const OUTPUT_JSON = join(ROOT, 'scripts/dice-textures-cdn.json');
const FOLDER = 'dice-skins';
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 8);

// Cloudinary URL — z env nebo z backend/.env
let cloudUrl = process.env.CLOUDINARY_URL;
if (!cloudUrl) {
  const beEnv = resolve(ROOT, '../Projekt-ikaros/backend/.env');
  if (existsSync(beEnv)) {
    dotenv.config({ path: beEnv });
    cloudUrl = process.env.CLOUDINARY_URL;
  }
}
if (!cloudUrl) {
  console.error(
    'CLOUDINARY_URL chybí. Nastav env nebo umísti Projekt-ikaros/backend/.env.',
  );
  process.exit(1);
}

const parsed = new URL(cloudUrl);
cloudinary.config({
  cloud_name: parsed.hostname,
  api_key: decodeURIComponent(parsed.username),
  api_secret: decodeURIComponent(parsed.password),
  secure: true,
});

console.log(`Cloud: ${parsed.hostname}, folder: ${FOLDER}/`);

// 1) Sebrat všechny textury
const files = readdirSync(TEXTURES_DIR).filter((f) => {
  const full = join(TEXTURES_DIR, f);
  if (!statSync(full).isFile()) return false;
  return /\.(webp|png|jpg|jpeg|gif)$/i.test(f);
});
console.log(`Soubory k uploadu: ${files.length}`);

// 2) Načíst existující mapping (idempotence — pokud skript běžel dříve)
let mapping = {};
if (existsSync(OUTPUT_JSON)) {
  try {
    mapping = JSON.parse(readFileSync(OUTPUT_JSON, 'utf8'));
    console.log(`Předchozí mapping: ${Object.keys(mapping).length} záznamů`);
  } catch {
    /* clean start */
  }
}

// 3) Filtruj soubory, které ještě nejsou v mapping
const todo = files.filter((f) => !mapping[f]);
console.log(`K uploadu (nové): ${todo.length}`);

if (todo.length === 0) {
  console.log('Vše uploadované. ✅');
  process.exit(0);
}

/** Upload jeden soubor — vrátí { secureUrl, publicId }. */
async function uploadOne(filename) {
  const filePath = join(TEXTURES_DIR, filename);
  const publicId = basename(filename, extname(filename));
  return new Promise((resolveP, rejectP) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: FOLDER,
        public_id: publicId,
        overwrite: false,
        resource_type: 'image',
        unique_filename: false,
        use_filename: false,
      },
      (err, result) => {
        if (err) {
          // 409 / „already exists" — vyhledáme existující URL.
          if (err.http_code === 409 || err.message?.includes('already exists')) {
            cloudinary.api.resource(
              `${FOLDER}/${publicId}`,
              { resource_type: 'image' },
              (e2, res2) => {
                if (e2 || !res2) {
                  rejectP(e2 ?? new Error('Cannot fetch existing resource'));
                  return;
                }
                resolveP({
                  secureUrl: res2.secure_url,
                  publicId: res2.public_id,
                });
              },
            );
          } else {
            rejectP(err);
          }
        } else if (!result) {
          rejectP(new Error(`No result for ${filename}`));
        } else {
          resolveP({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      },
    );
  });
}

// 4) Paralelní upload s omezenou konkurencí
async function runBatched() {
  const queue = [...todo];
  let done = 0;
  let failed = 0;
  const startTime = Date.now();

  async function worker() {
    while (queue.length > 0) {
      const filename = queue.shift();
      try {
        const res = await uploadOne(filename);
        mapping[filename] = res;
        done++;
        if (done % 25 === 0 || queue.length === 0) {
          // Periodicky persist mapping — kdyby script spadl, neztratíme progress
          writeFileSync(OUTPUT_JSON, JSON.stringify(mapping, null, 2));
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = done / elapsed;
          const eta = queue.length / rate;
          console.log(
            `[${done}/${todo.length}] ${filename} → ${res.secureUrl.slice(-60)} | ${rate.toFixed(1)}/s ETA ${Math.round(eta)}s`,
          );
        }
      } catch (err) {
        failed++;
        console.error(`✗ ${filename}: ${err.message ?? err}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  writeFileSync(OUTPUT_JSON, JSON.stringify(mapping, null, 2));
  console.log(
    `\nHotovo: ${done} úspěšně, ${failed} chyb. Mapping uložen v ${OUTPUT_JSON}`,
  );
  if (failed > 0) process.exit(1);
}

await runBatched();
