/**
 * 16.2d Fáze 2 — DrD+ token schéma (editovatelná instance bestie na mapě).
 * Canonical = `token.json`. Podmnožina bestie polí (bez Velikost/Rozměry/Výskyt)
 * + runtime `postih`. Edit save sanitizuje systemStats na tyto klíče (BE STRICT).
 * Spec: docs/arch/phase-16/spec-16.2d-bestie-drdplus.md §9.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const drdplusTokenSchema = schema as SystemEntitySchema;
