/**
 * 10.2c-edit-9g — D&D 5E bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const dnd5eBestieSchema = schema as SystemEntitySchema;
