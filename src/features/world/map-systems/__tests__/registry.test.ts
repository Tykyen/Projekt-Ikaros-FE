/**
 * 10.2-prep-3 — testy map-system plugin registry.
 *
 * Pokrytí: alias resolve, fallback na generic, defaultDice per systém.
 */
import { describe, it, expect } from "vitest";
import { getMapSystemPlugin, listMapSystems } from "../registry";
import {
  RPG_SYSTEMS,
  SYSTEM_CUSTOM_ID,
} from "../../../ikaros/pages/CreateWorldPage/constants/systems";

describe("getMapSystemPlugin", () => {
  it("resolvuje canonical system ID", () => {
    expect(getMapSystemPlugin("matrix").id).toBe("matrix");
    expect(getMapSystemPlugin("coc").id).toBe("coc");
    expect(getMapSystemPlugin("dnd5e").id).toBe("dnd5e");
  });

  it("resolvuje aliasy", () => {
    expect(getMapSystemPlugin("dnd").id).toBe("dnd5e");
    expect(getMapSystemPlugin("pribehy_imperia").id).toBe("pi");
    expect(getMapSystemPlugin("pribehy-imperia").id).toBe("pi");
    expect(getMapSystemPlugin("pribehy").id).toBe("pi");
  });

  it('16.2a — aliasy dlouhych id z nabidky', () => {
    expect(getMapSystemPlugin("draci-hlidka").id).toBe("drdh");
    expect(getMapSystemPlugin("drd-plus").id).toBe("drdplus");
    expect(getMapSystemPlugin("call-of-cthulhu").id).toBe("coc");
  });

  it("case-insensitive", () => {
    expect(getMapSystemPlugin("FATE").id).toBe("fate");
    expect(getMapSystemPlugin("DnD").id).toBe("dnd5e");
  });

  it("null / undefined / prázdný string → generic", () => {
    expect(getMapSystemPlugin(null).id).toBe("generic");
    expect(getMapSystemPlugin(undefined).id).toBe("generic");
    expect(getMapSystemPlugin("").id).toBe("generic");
  });

  it("neznámý systém → generic (žádný crash)", () => {
    expect(getMapSystemPlugin("mysterygame").id).toBe("generic");
  });

  it("každý plugin má defaultDice non-empty array", () => {
    for (const id of listMapSystems()) {
      const plugin = getMapSystemPlugin(id);
      expect(plugin.defaultDice.length).toBeGreaterThan(0);
    }
  });

  it("FATE-based systémy mají defaultDice=fate", () => {
    expect(getMapSystemPlugin("fate").defaultDice).toContain("fate");
    expect(getMapSystemPlugin("pi").defaultDice).toContain("fate");
    expect(getMapSystemPlugin("matrix").defaultDice).toContain("fate");
  });

  it("D&D 5e má d20 default", () => {
    expect(getMapSystemPlugin("dnd5e").defaultDice).toContain("d20");
  });

  it("CoC má d100 default", () => {
    expect(getMapSystemPlugin("coc").defaultDice).toContain("d100");
  });
});

describe("listMapSystems", () => {
  it("vrací všech 13 registrovaných systémů", () => {
    const list = listMapSystems();
    expect(list).toHaveLength(13);
    expect(list).toContain("matrix");
    expect(list).toContain("generic");
  });
});

describe("parita s nabídkou RPG_SYSTEMS", () => {
  // 16.2a guard — každý systém, který jde vybrat při tvorbě světa, musí mít
  // v map registry plugin (přímo nebo aliasem). `vlastni` = generic záměrně.
  // Tenhle test chytí jakýkoli budoucí id-drift mezi nabídkou a engine.
  for (const sys of RPG_SYSTEMS) {
    if (sys.id === SYSTEM_CUSTOM_ID) continue;
    it(`„${sys.label}" (${sys.id}) → dedikovaný plugin, ne generic`, () => {
      expect(getMapSystemPlugin(sys.id).id).not.toBe("generic");
    });
  }
});

describe("rollCategories", () => {
  it("matrix/fate mají kategorie skill+initiative+custom", () => {
    expect(getMapSystemPlugin("matrix").rollCategories).toEqual(
      expect.arrayContaining(["skill", "initiative", "custom"]),
    );
    expect(getMapSystemPlugin("fate").rollCategories).toContain("custom");
  });

  it("generic má aspoň custom", () => {
    expect(getMapSystemPlugin("neznamy").rollCategories).toContain("custom");
  });

  it("každý registrovaný plugin má rollCategories non-empty", () => {
    for (const id of listMapSystems()) {
      const plugin = getMapSystemPlugin(id);
      expect(plugin.rollCategories.length).toBeGreaterThan(0);
    }
  });
});
