/**
 * 10.2c-edit-9g — GURPS bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const gurpsBestieSchema = schema as SystemEntitySchema;
