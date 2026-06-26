/**
 * 16.2b-bestie — DrD 1.6 bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. JSON sdílen FE+BE přes export-schemas script.
 * Spec: docs/arch/phase-16/spec-16.2b-bestie-drd16.md.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const drd16BestieSchema = schema as SystemEntitySchema;
