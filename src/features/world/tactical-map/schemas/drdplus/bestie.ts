/**
 * 16.2d-bestie — Dračí doupě Plus bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. JSON sdílen FE+BE přes export-schemas script.
 * Spec: docs/arch/phase-16/spec-16.2d-bestie-drdplus.md.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const drdplusBestieSchema = schema as SystemEntitySchema;
