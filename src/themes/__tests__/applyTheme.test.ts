import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyTheme } from '../applyTheme';
import { THEMES } from '../registry';

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.cssText = '';
    document.head.innerHTML = '';
  });

  it('sets data-theme attribute on html', async () => {
    await applyTheme('modre-nebe');
    expect(document.documentElement.getAttribute('data-theme')).toBe('modre-nebe');
  });

  it('applies all CSS variables from theme.vars', async () => {
    await applyTheme('modre-nebe');
    const theme = THEMES['modre-nebe']!;
    for (const [key, value] of Object.entries(theme.vars)) {
      expect(document.documentElement.style.getPropertyValue(key)).toBe(value);
    }
  });

  it('falls back to default theme for unknown id', async () => {
    await applyTheme('neexistuje');
    expect(document.documentElement.getAttribute('data-theme')).toBe('modre-nebe');
  });

  it('applies overrides on top of theme.vars (krok 5.0)', async () => {
    await applyTheme('modre-nebe', {
      overrides: { '--theme-accent': '#abcdef' },
    });
    expect(
      document.documentElement.style.getPropertyValue('--theme-accent'),
    ).toBe('#abcdef');
  });

  it('clears stale --theme-* properties between applies (krok 5.0)', async () => {
    await applyTheme('modre-nebe', {
      overrides: { '--theme-extra-token': 'red' },
    });
    expect(
      document.documentElement.style.getPropertyValue('--theme-extra-token'),
    ).toBe('red');
    // Druhý motiv override token nedefinuje → musí se vyčistit.
    await applyTheme('temna-cerven');
    expect(
      document.documentElement.style.getPropertyValue('--theme-extra-token'),
    ).toBe('');
  });

  it('preloads background image when defined', async () => {
    const theme = THEMES['modre-nebe']!;
    const original = theme.background;
    theme.background = '/themes/backgrounds/test.webp';
    const ImageMock = vi.fn(function (this: { src: string }) {
      this.src = '';
    });
    vi.stubGlobal('Image', ImageMock);
    await applyTheme('modre-nebe');
    expect(ImageMock).toHaveBeenCalled();
    theme.background = original;
    vi.unstubAllGlobals();
  });
});
