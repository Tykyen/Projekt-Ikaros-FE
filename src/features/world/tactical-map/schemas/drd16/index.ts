/**
 * 16.2b-bestie — DrD 1.6 (drd16) schémata pro schema engine.
 * Zatím jen bestie; token spadá na generic fallback (registry.get).
 */
import type { SystemEntitySchema } from '../types';
import { drd16BestieSchema } from './bestie';
import { drd16TokenSchema } from './token';

export { drd16BestieSchema, drd16TokenSchema };

export const drd16Schemas: SystemEntitySchema[] = [
  drd16BestieSchema,
  drd16TokenSchema,
];
