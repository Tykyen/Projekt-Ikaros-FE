/**
 * 10.2d-prep-A C9 — FE-side mirror BE SystemStatsValidator.
 *
 * Pro optimistic apply před server roundtrip: validate user input proti
 * schema; pokud invalid, UI ukáže errors a mutation se nezavolá. BE má
 * autoritativní validator (C11) — FE jen pro UX rychlost.
 *
 * Konvence: returns `{valid, errors, filled}` ne throw — UI dostane errors
 * map pro inline display.
 *
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C9.
 */
import type {
  SchemaField,
  SystemEntitySchema,
} from '../schemas/types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  /** Plněné defaults pro vytváření (validateForCreate only). */
  filled: Record<string, unknown>;
}

/** Validuje payload pro CREATE (required + default fill + type check). */
export function validateForCreate(
  stats: Record<string, unknown>,
  schema: SystemEntitySchema,
): ValidationResult {
  const errors: Record<string, string> = {};
  const filled: Record<string, unknown> = { ...stats };

  for (const section of schema.sections) {
    for (const field of section.fields) {
      validateField(field, filled, errors, true);
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, filled };
}

/** Validuje patch (partial update — kontroluje jen pole v patch). */
export function validateForPatch(
  patch: Record<string, unknown>,
  schema: SystemEntitySchema,
): ValidationResult {
  const errors: Record<string, string> = {};
  const knownKeys = collectFieldKeys(schema);

  // Strict mode: unknown keys reject.
  for (const key of Object.keys(patch)) {
    if (!knownKeys.has(key)) {
      errors[key] = `Neznámé pole: ${key}`;
    }
  }

  // Validate present keys.
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.key in patch) {
        validateField(field, patch, errors, false);
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, filled: patch };
}

function collectFieldKeys(schema: SystemEntitySchema): Set<string> {
  const keys = new Set<string>();
  for (const section of schema.sections) {
    for (const field of section.fields) keys.add(field.key);
  }
  return keys;
}

function validateField(
  field: SchemaField,
  state: Record<string, unknown>,
  errors: Record<string, string>,
  isCreate: boolean,
): void {
  let value = state[field.key];

  // Default fill (jen create).
  if (isCreate && value === undefined && field.default !== undefined) {
    state[field.key] = field.default;
    value = field.default;
  }

  // Required check.
  if (field.required && (value === undefined || value === null || value === '')) {
    errors[field.key] = `${field.label} je povinné`;
    return;
  }

  // Computed pole se nevalidují (read-only).
  if (field.type === 'computed') return;

  // Skip type check pokud value undefined a not required.
  if (value === undefined || value === null) return;

  // Type checks.
  switch (field.type) {
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(num)) {
        errors[field.key] = `${field.label} musí být číslo`;
        return;
      }
      if (field.min !== undefined && num < field.min) {
        errors[field.key] = `${field.label}: minimum ${field.min}`;
      }
      if (field.max !== undefined && num > field.max) {
        errors[field.key] = `${field.label}: maximum ${field.max}`;
      }
      state[field.key] = num;
      break;
    }
    case 'string': {
      if (typeof value !== 'string') {
        errors[field.key] = `${field.label} musí být text`;
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        errors[field.key] = `${field.label} musí být true/false`;
      }
      break;
    }
    case 'enum': {
      if (typeof value !== 'string' || !field.enumValues?.includes(value)) {
        errors[field.key] = `${field.label}: neplatná hodnota`;
      }
      break;
    }
    case 'list': {
      if (!Array.isArray(value)) {
        errors[field.key] = `${field.label} musí být seznam`;
      }
      break;
    }
  }
}
