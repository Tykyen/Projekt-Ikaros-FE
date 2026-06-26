/**
 * 16.2b Fáze 2 — DrD 1.6 token schéma (= bestie pole, entityType token).
 * Bestie token na mapě je editovatelná instance → save `token.systemStats`
 * validuje BE proti `<system>:token`. drd16 token = stejná pole jako bestie.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const drd16TokenSchema = schema as SystemEntitySchema;
