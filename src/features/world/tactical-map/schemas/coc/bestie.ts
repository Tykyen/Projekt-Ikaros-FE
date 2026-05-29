/**
 * 10.2c-edit-9g — Call of Cthulhu bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. CoC = procenta (1–99) pro charakteristiky.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const cocBestieSchema = schema as SystemEntitySchema;
