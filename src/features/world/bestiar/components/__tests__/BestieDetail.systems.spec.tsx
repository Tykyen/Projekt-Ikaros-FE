/**
 * 16.2h K2 — ověření, že univerzální `BestieDetail` vyrenderuje detail ze
 * schématu KAŽDÉHO registrovaného systému (systém = pole). Gate pro K4: staré
 * bespoke karty (Drd16BestieCard/FateBestieCard) smíme smazat jen když univerzál
 * pokryje i drd16/fae/fate.
 *
 * Postup: pro každý systém vezmi jeho bestie schéma z registry, syntetizuj
 * `systemStats` (hodnota na každé pole → nic se neskryje) a assertni, že se
 * vyrenderuje root, Popis, Poznámky a každá neprázdná sekce schématu.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BestieDetail } from '../BestieDetail';
import { bootstrapSchemas } from '@/features/world/tactical-map/schemas/bootstrap';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import type {
  SchemaField,
  SystemEntitySchema,
} from '@/features/world/tactical-map/schemas/types';

bootstrapSchemas();
const systems = systemEntitySchemaRegistry.listSystems();

/** Vyrob plausibilní hodnotu pro pole dle typu — aby žádné pole nebylo prázdné. */
function synthValue(field: SchemaField): unknown {
  switch (field.type) {
    case 'number':
      return 5;
    case 'enum':
      return field.enumValues?.[0] ?? 'x';
    case 'boolean':
      return true;
    case 'computed':
      return 7;
    case 'list':
      return [
        Object.fromEntries(
          (field.listItemFields ?? []).map((c) => [c.key, synthValue(c)]),
        ),
      ];
    case 'string':
    default:
      return 'text';
  }
}

/** Naplní systemStats hodnotou na každé pole schématu (+ .max sibling pro HP bar). */
function synthStats(schema: SystemEntitySchema): Record<string, unknown> {
  const stats: Record<string, unknown> = {};
  for (const section of schema.sections) {
    for (const f of section.fields) {
      stats[f.key] = synthValue(f);
      if (f.combatBehavior === 'damageable' && f.key.endsWith('.current')) {
        stats[f.key.replace(/\.current$/, '.max')] = 10;
      }
    }
  }
  return stats;
}

describe('BestieDetail — schema-driven detail napříč systémy (16.2h K2)', () => {
  it('bootstrap zaregistroval ≥14 systémů', () => {
    expect(systems.length).toBeGreaterThanOrEqual(14);
  });

  for (const sys of systems) {
    it(`${sys}: vyrenderuje root, Popis, Poznámky a všechny neprázdné sekce`, () => {
      const schema = systemEntitySchemaRegistry.get(sys, 'bestie');
      expect(schema).toBeTruthy();
      const stats = synthStats(schema!);

      const { container, unmount } = render(
        <BestieDetail
          schema={schema!}
          systemStats={stats}
          description="Popis bytosti pro test."
          notes="Tajná GM poznámka."
          canSeeNotes
        />,
      );

      expect(container.querySelector('[data-bestie-detail]')).toBeTruthy();

      const headings = Array.from(container.querySelectorAll('h5')).map(
        (h) => h.textContent ?? '',
      );
      // Popis (veřejný) + Poznámky (canSeeNotes) se vždy vyrenderují.
      expect(headings.some((h) => h.includes('Popis'))).toBe(true);
      expect(headings.some((h) => h.includes('Poznámky'))).toBe(true);
      // Každá sekce, co má pole, ukáže svůj label (nic se neztratí).
      for (const section of schema!.sections) {
        if (section.fields.length === 0) continue;
        expect(
          headings.some((h) => h.includes(section.label)),
          `sekce "${section.label}" (${sys}) se nevyrenderovala`,
        ).toBe(true);
      }

      unmount();
    });
  }

  it('Poznámky se NEvyrenderují bez canSeeNotes', () => {
    const schema = systemEntitySchemaRegistry.get('drdplus', 'bestie')!;
    const { container } = render(
      <BestieDetail
        schema={schema}
        systemStats={synthStats(schema)}
        description="Popis."
        notes="Tajné."
        canSeeNotes={false}
      />,
    );
    const headings = Array.from(container.querySelectorAll('h5')).map(
      (h) => h.textContent ?? '',
    );
    expect(headings.some((h) => h.includes('Poznámky'))).toBe(false);
  });
});
