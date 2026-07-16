import { describe, it, expect } from 'vitest';
import { RPG_SYSTEMS } from '@/features/ikaros/pages/CreateWorldPage/constants/systems';
import { resolveSystemId } from '@/features/world/systemId';
import { PLATFORM_SYSTEMS, PLATFORM_SYSTEM_IDS, systemLabel } from './systems';

/**
 * 19.3b — hlídač driftu mezi třemi registry systémů.
 *
 * Proč: `world.system` drží „dlouhá" id (`drd-plus`), platformové katalogy
 * canonical (`drdplus`). PJ nábor systém ZDĚDÍ ze světa → když most
 * `resolveSystemId` vrátí id, které v `PLATFORM_SYSTEMS` není, lístek se do
 * filtru nikdy nechytne a nikdo si toho nevšimne. Nový systém ve wizardu tedy
 * MUSÍ mít protějšek tady (nebo alias v `SYSTEM_ALIASES`).
 */
describe('parita RPG_SYSTEMS → resolveSystemId → PLATFORM_SYSTEMS', () => {
  for (const sys of RPG_SYSTEMS) {
    it(`„${sys.label}" (${sys.id}) má canonical protějšek`, () => {
      expect(PLATFORM_SYSTEM_IDS).toContain(resolveSystemId(sys.id));
    });
  }
});

describe('PLATFORM_SYSTEMS', () => {
  it('canonical id jsou unikátní', () => {
    expect(new Set(PLATFORM_SYSTEM_IDS).size).toBe(PLATFORM_SYSTEMS.length);
  });

  it('id jsou už canonical (resolveSystemId je nemění)', () => {
    for (const sys of PLATFORM_SYSTEMS) {
      expect(resolveSystemId(sys.id)).toBe(sys.id);
    }
  });

  it('systemLabel překládá id, neznámé vrací beze změny', () => {
    expect(systemLabel('coc')).toBe('Volání Cthulhu');
    expect(systemLabel('neznamy-system')).toBe('neznamy-system');
  });
});
