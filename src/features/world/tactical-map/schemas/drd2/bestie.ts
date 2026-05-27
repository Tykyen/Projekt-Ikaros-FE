/**
 * 10.2d-prep-A — DrD2 bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. JSON sdílen FE+BE přes export-schemas script.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const drd2BestieSchema = schema as SystemEntitySchema;
