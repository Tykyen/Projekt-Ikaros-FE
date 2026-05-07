import { getTheme } from './registry';
import type { ThemeId } from './types';

const loadedFonts = new Set<string>();
const loadedDecorations = new Set<string>();

async function loadDecorations(themeId: ThemeId): Promise<void> {
  if (loadedDecorations.has(themeId)) return;
  const theme = getTheme(themeId);
  await theme.decorationsModule();
  loadedDecorations.add(themeId);
}

async function loadFont(family: string): Promise<void> {
  if (loadedFonts.has(family)) return;
  if (typeof document === 'undefined') return;
  if (document.fonts?.check?.(`16px "${family}"`)) {
    loadedFonts.add(family);
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;700&display=swap`;
  document.head.appendChild(link);
  try {
    await document.fonts?.load?.(`700 16px "${family}"`);
  } catch {
    /* ignore — font swap fallback by browser */
  }
  loadedFonts.add(family);
}

function preloadBackground(url: string | null): void {
  if (!url || typeof window === 'undefined') return;
  const img = new Image();
  img.src = url;
}

export async function applyTheme(id: string): Promise<void> {
  const theme = getTheme(id);
  document.documentElement.setAttribute('data-theme', theme.id);

  for (const [key, value] of Object.entries(theme.vars)) {
    document.documentElement.style.setProperty(key, value);
  }

  preloadBackground(theme.background);

  const fontPromises: Promise<void>[] = [];
  if (theme.fonts.logo) fontPromises.push(loadFont(theme.fonts.logo));
  if (theme.fonts.display && theme.fonts.display !== theme.fonts.logo) {
    fontPromises.push(loadFont(theme.fonts.display));
  }

  await Promise.all([loadDecorations(theme.id as ThemeId), ...fontPromises]);
}
