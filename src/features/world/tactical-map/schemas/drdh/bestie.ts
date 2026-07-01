/**
 * 16b bestie — Dračí Hlídka (drdh) bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. JSON sdílen FE+BE přes export-schemas script.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const drdhBestieSchema = schema as SystemEntitySchema;
