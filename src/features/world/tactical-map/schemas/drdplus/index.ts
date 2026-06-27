/**
 * 16.2d-bestie — Dračí doupě Plus schémata (bestie). Registruje se v bootstrap.
 * Spec: docs/arch/phase-16/spec-16.2d-bestie-drdplus.md.
 */
import { drdplusBestieSchema } from './bestie';
import { drdplusTokenSchema } from './token';
import type { SystemEntitySchema } from '../types';

export const drdplusSchemas: SystemEntitySchema[] = [
  drdplusBestieSchema,
  drdplusTokenSchema,
];
