/**
 * Shadowrun 6e — bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. SR6: fyzický záznamník (damageable) + omráčení,
 * 8 atributů (klik = pool), útoky/dovednosti s přímým poolem, kritter powers.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const shadowrunBestieSchema = schema as SystemEntitySchema;
