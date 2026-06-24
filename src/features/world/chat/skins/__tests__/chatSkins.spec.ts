import { describe, it, expect } from 'vitest';
import { CHAT_SKINS, CHAT_SKIN_IDS, isChatSkin } from '../registry';

/** 16.1d — registr skinů chatu (= světové motivy). */
describe('chat skin registry (16.1d)', () => {
  it('má 12 světových motivů, ikaros první (baseline)', () => {
    expect(CHAT_SKIN_IDS).toHaveLength(12);
    expect(CHAT_SKINS).toHaveLength(12);
    expect(CHAT_SKIN_IDS[0]).toBe('ikaros');
  });

  it('každý skin má neprázdný label (z theme registru) + emoji', () => {
    for (const s of CHAT_SKINS) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.emoji.length).toBeGreaterThan(0);
    }
  });

  it('isChatSkin: světový motiv true, platformový/cizí/null false', () => {
    expect(isChatSkin('cyberpunk')).toBe(true);
    expect(isChatSkin('western')).toBe(true);
    expect(isChatSkin('ikaros')).toBe(true);
    // platformový motiv (ne světový) → není skin chatu
    expect(isChatSkin('pergamen')).toBe(false);
    expect(isChatSkin('nonsense')).toBe(false);
    expect(isChatSkin(null)).toBe(false);
    expect(isChatSkin(undefined)).toBe(false);
  });
});
