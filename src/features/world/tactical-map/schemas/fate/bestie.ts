/**
 * 10.2c-edit-9g — Fate (Příběhy impéria) bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. Fate = stress boxy místo HP, aspects + skills + stunts.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const fateBestieSchema = schema as SystemEntitySchema;
