/**
 * Fate Accelerated (fae) bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. FAE = stress boxy, aspekty + 6 přístupů + triky +
 * následky (sloty). Liší se od `fate` (Core) jen blokem schopností (přístupy ↔
 * dovednosti) — stejně jako deník.
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const faeBestieSchema = schema as SystemEntitySchema;
