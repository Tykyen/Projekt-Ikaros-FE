/**
 * 10.2c-edit-9g — barrel export D&D 5E schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { dnd5eBestieSchema } from './bestie';
import { dnd5eTokenSchema } from './token';

export { dnd5eBestieSchema, dnd5eTokenSchema };

/** Všechna D&D 5E schémata pro hromadnou registraci v bootstrap. */
export const dnd5eSchemas: SystemEntitySchema[] = [
  dnd5eBestieSchema,
  dnd5eTokenSchema,
];
