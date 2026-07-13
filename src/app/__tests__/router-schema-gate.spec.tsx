/**
 * D-AUDIT bundle SLO — smoke test lazy boundary `withSchemas` (router.tsx).
 *
 * `bootstrapSchemas()` už neběží sync v main.tsx (schémata by seděla v entry
 * chunku); schema-závislé routy (taktická mapa, bestiáře, world chat, pop-out
 * token) jsou gatované přes `withSchemas` — lazy factory čeká i na bootstrap.
 * Test ověřuje obě garance boundary:
 *  (1) komponenta se přes Suspense skutečně doloaduje (fallback → obsah),
 *  (2) v okamžiku prvního renderu stránky je registry naplněné (žádný race
 *      „schema chybí" na deep-linku před idle pojistkou v main.tsx).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { withSchemas } from '../router';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';

describe('withSchemas — schema-gated lazy boundary (D-AUDIT bundle)', () => {
  // Delší timeout: dynamic import bootstrap chunku v vitestu transformuje
  // ~14 schema modulů on-demand (na CI pomalé) — default 5 s nestačí.
  it('zobrazí Suspense fallback, doloaduje stránku a před renderem naplní registry', { timeout: 30_000 }, async () => {
    let registryAtFirstRender: unknown = 'nevyhodnoceno';
    function FakePage() {
      // Zachyť stav registry PŘESNĚ v okamžiku prvního renderu stránky.
      if (registryAtFirstRender === 'nevyhodnoceno') {
        registryAtFirstRender = systemEntitySchemaRegistry.get('drd2', 'bestie');
      }
      return <div>stránka-načtena</div>;
    }
    const Page = withSchemas(() => Promise.resolve({ default: FakePage }));

    render(
      <Suspense fallback={<div>loading-fallback</div>}>
        <Page />
      </Suspense>,
    );

    // (1) lazy boundary: nejdřív fallback, pak obsah
    expect(screen.getByText('loading-fallback')).toBeInTheDocument();
    expect(
      await screen.findByText('stránka-načtena', undefined, { timeout: 25_000 }),
    ).toBeInTheDocument();

    // (2) bootstrap doběhl před prvním renderem stránky
    expect(registryAtFirstRender).not.toBeNull();
    expect(registryAtFirstRender).not.toBe('nevyhodnoceno');
    // a registry drží i generic fallback (pojistka pro neznámé systémy)
    expect(systemEntitySchemaRegistry.get('generic', 'token')).not.toBeNull();
  });
});
