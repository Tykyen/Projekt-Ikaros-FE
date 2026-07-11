// _conn.mjs — sdílený connect helper pro +db proof vrstvu.
// Bere MONGODB_URI z backend/.env (dotenv.parse, hodnota NIKDY netiskne — CH-014).
// Balíčky (mongodb/dotenv/cloudinary) resolví z BE node_modules přes createRequire.
import { createRequire } from 'module';
import { readFileSync } from 'fs';

export const BACKEND = 'C:/Matrix/ProjektIkaros/Projekt-ikaros/backend';
const require = createRequire(`file:///${BACKEND}/package.json`);
export const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
export const cloudinary = require('cloudinary').v2;

const env = dotenv.parse(readFileSync(`${BACKEND}/.env`));
// Zpřístupni pro cloudinary SDK, aniž bys tiskl hodnoty. cloudinary se auto-konfiguruje
// při require (dřív než tady) → CLOUDINARY_URL musíme naparsovat a nastavit ručně.
for (const k of ['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (env[k] && !process.env[k]) process.env[k] = env[k];
}
if (env.CLOUDINARY_URL) {
  const m = env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (m) cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3], secure: true });
} else if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}

// Vrací sanitizované info o cíli (host/port/db) — BEZ credentials.
export function sanitize(uri) {
  try {
    const u = new URL(uri);
    return {
      host: u.hostname,
      port: u.port || '27017',
      db: (u.pathname || '/').replace(/^\//, '') || '(default)',
      hasAuth: Boolean(u.username),
    };
  } catch {
    return { host: '(unparsed)', port: '?', db: '?', hasAuth: false };
  }
}

// Připoj se. URI z .env; pokud host neresolvuje (docker název), fallback na 127.0.0.1.
export async function getClient({ dbNameOverride } = {}) {
  const uri = env.MONGODB_URI || env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('Chybí MONGODB_URI v backend/.env');
  const tryUris = [uri];
  try {
    const u = new URL(uri);
    if (!['localhost', '127.0.0.1'].includes(u.hostname)) {
      u.hostname = '127.0.0.1';
      tryUris.push(u.toString());
    }
  } catch { /* multi-host uri — necháme jak je */ }

  let lastErr;
  for (const candidate of tryUris) {
    const client = new MongoClient(candidate, { serverSelectionTimeoutMS: 4000 });
    try {
      await client.connect();
      await client.db().command({ ping: 1 });
      const db = dbNameOverride ? client.db(dbNameOverride) : client.db();
      return { client, db, info: sanitize(candidate) };
    } catch (e) {
      lastErr = e;
      await client.close().catch(() => {});
    }
  }
  throw lastErr;
}

// Set _id (nebo jiného pole) dané kolekce jako string.
export async function idSet(db, coll, field = '_id') {
  const docs = await db.collection(coll).find({}, { projection: { [field]: 1 } }).toArray();
  return new Set(docs.map((d) => String(field === '_id' ? d._id : d[field])).filter((v) => v && v !== 'undefined'));
}

// Dokumenty v `coll`, jejichž `field` (string) NENÍ ve validSet. Vrací {count, samples:[_id...]}.
export async function dangling(db, coll, field, validSet, extra = {}) {
  const docs = await db.collection(coll)
    .find({ [field]: { $ne: null, $exists: true }, ...extra }, { projection: { [field]: 1 } })
    .toArray();
  const bad = docs.filter((d) => !validSet.has(String(d[field])));
  return { count: bad.length, samples: bad.slice(0, 5).map((d) => `${d._id} (${field}=${d[field]})`) };
}
