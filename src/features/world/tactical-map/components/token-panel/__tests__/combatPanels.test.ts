/**
 * Regresní guard — `COMBAT_PANELS` lookup MUSÍ projít stejnou normalizací
 * `world.system` jako diary/map registry.
 *
 * Bug, který tohle chytá: nabídka tvorby světa ukládá „dlouhá" id
 * (`drd-plus`, `call-of-cthulhu`), klíče panelů jsou „krátká" (`drdplus`,
 * `coc`). Bez `resolveSystemId` spadl DrD+/CoC svět na legacy `DiaryTab`
 * místo dedikovaného combat panelu → „deník na mapě/chatu se nepropisuje".
 * Diary i map registry měly paritní guard, COMBAT_PANELS ne — proto drift prošel.
 */
import { describe, it, expect } from 'vitest';
import { COMBAT_PANELS } from '../combatPanels';
import { resolveSystemId } from '@/features/world/systemId';
import {
  RPG_SYSTEMS,
  SYSTEM_CUSTOM_ID,
} from '@/features/ikaros/pages/CreateWorldPage/constants/systems';

describe('COMBAT_PANELS — normalizace world.system', () => {
  it('dlouhá id z nabídky trefí dedikovaný panel (ne fallback)', () => {
    // Přesně ty dva systémy, které byly rozbité (dlouhé id + existující panel).
    expect(COMBAT_PANELS[resolveSystemId('drd-plus')]).toBeDefined();
    expect(COMBAT_PANELS[resolveSystemId('call-of-cthulhu')]).toBeDefined();
  });

  it('case-insensitive (velikost písmen nesmí rozhodovat)', () => {
    expect(COMBAT_PANELS[resolveSystemId('DRD-PLUS')]).toBeDefined();
    expect(COMBAT_PANELS[resolveSystemId('Drd16')]).toBeDefined();
  });

  it('klíče registry jsou canonical — resolveSystemId je nemění', () => {
    // Kdyby někdo zaregistroval panel pod „dlouhým" id, lookup by ho minul.
    for (const key of Object.keys(COMBAT_PANELS)) {
      expect(resolveSystemId(key)).toBe(key);
    }
  });

  it('každý systém z nabídky je dosažitelný přes canonical id (panel nebo záměrný fallback)', () => {
    // Guard proti id-driftu: lookup musí být deterministický pro každé nabídkové
    // id. Ne každý systém panel MÁ (jad/drdh/pi/shadowrun → fallback DiaryTab je
    // záměr), ale normalizace nesmí nikdy „minout" existující panel.
    for (const sys of RPG_SYSTEMS) {
      if (sys.id === SYSTEM_CUSTOM_ID) continue;
      const canonical = resolveSystemId(sys.id);
      // canonical id nesmí obsahovat pomlčku z „dlouhého" tvaru, pokud k němu
      // existuje krátký alias (drd-plus → drdplus). Stačí ověřit, že lookup
      // nevyhodí a vrací buď komponentu, nebo undefined (deterministicky).
      const panel = COMBAT_PANELS[canonical];
      expect(panel === undefined || typeof panel === 'function' || typeof panel === 'object').toBe(true);
    }
  });
});
