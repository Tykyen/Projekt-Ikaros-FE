import { getTheme } from './registry';
import type { ThemeId } from './types';

const loadedFonts = new Set<string>();
const loadedDecorations = new Set<string>();

/**
 * Krok 5.0 — klíče CSS custom properties nastavené posledním `applyTheme`.
 * Před další aplikací se odstraní, aby override z předchozího motivu
 * (token, který nový motiv nedefinuje) „nevisel" na `:root`.
 */
let lastAppliedKeys: string[] = [];

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

function preloadBackground(url: string | null | undefined): void {
  if (!url || typeof window === 'undefined') return;
  const img = new Image();
  img.src = url;
}

/**
 * Aplikuje motiv na `:root`. Krok 5.0 — volitelné `opts`:
 *  - `overrides` — CSS tokeny vrstvené NAD `theme.vars` (custom theme světa).
 *  - `backgroundUrl` — pozadí k preloadu (skutečné vykreslení řeší layout).
 *
 * Před zápisem odstraní tokeny předchozí aplikace (čistý swap, žádné
 * „visící" overrides).
 */
export async function applyTheme(
  id: string,
  opts?: { overrides?: Record<string, string>; backgroundUrl?: string },
): Promise<void> {
  const theme = getTheme(id);
  const root = document.documentElement;

  // Cleanup tokenů z předchozí aplikace.
  for (const key of lastAppliedKeys) {
    root.style.removeProperty(key);
  }

  root.setAttribute('data-theme', theme.id);

  const applied: string[] = [];
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
    applied.push(key);
  }
  if (opts?.overrides) {
    for (const [key, value] of Object.entries(opts.overrides)) {
      root.style.setProperty(key, value);
      applied.push(key);
    }
  }
  lastAppliedKeys = applied;

  preloadBackground(opts?.backgroundUrl ?? theme.background);

  const fontPromises: Promise<void>[] = [];
  if (theme.fonts.logo) fontPromises.push(loadFont(theme.fonts.logo));
  if (theme.fonts.display && theme.fonts.display !== theme.fonts.logo) {
    fontPromises.push(loadFont(theme.fonts.display));
  }
  if (theme.fonts.body && theme.fonts.body !== theme.fonts.display) {
    fontPromises.push(loadFont(theme.fonts.body));
  }

  await Promise.all([loadDecorations(theme.id as ThemeId), ...fontPromises]);
}

/**
 * 16.1d — načte fonty motivu BEZ zápisu na `:root`. Pro skin chatu, který může
 * mít jiný font než aktivní motiv světa (override skin → svět ho nenačetl).
 * Reuse `loadFont` (dedup přes `loadedFonts`).
 */
export async function loadThemeFonts(id: string): Promise<void> {
  const theme = getTheme(id);
  const tasks: Promise<void>[] = [];
  if (theme.fonts.logo) tasks.push(loadFont(theme.fonts.logo));
  if (theme.fonts.display && theme.fonts.display !== theme.fonts.logo) {
    tasks.push(loadFont(theme.fonts.display));
  }
  if (theme.fonts.body && theme.fonts.body !== theme.fonts.display) {
    tasks.push(loadFont(theme.fonts.body));
  }
  await Promise.all(tasks);
}
