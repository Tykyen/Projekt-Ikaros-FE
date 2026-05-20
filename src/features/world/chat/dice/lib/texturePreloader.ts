import { FATE_DICE_SKINS, getDiceSkin } from './diceSkins';
import type { FateDiceSkin } from './diceSkins';

const preloadedSkinIds = new Set<string>();
const preloadedUrls = new Set<string>();
const inFlight = new Map<string, Promise<void>>();

const TEXTURE_PREFIX = '/textures/';

function collectSkinUrls(skin: FateDiceSkin): string[] {
  const urls: string[] = [];
  for (const key of Object.keys(skin) as (keyof FateDiceSkin)[]) {
    const v = skin[key];
    if (typeof v === 'string' && v.startsWith(TEXTURE_PREFIX)) urls.push(v);
  }
  return urls;
}

function preloadOne(url: string): Promise<void> {
  if (preloadedUrls.has(url)) return Promise.resolve();
  const existing = inFlight.get(url);
  if (existing) return existing;

  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => {
      preloadedUrls.add(url);
      inFlight.delete(url);
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = url;
  });

  inFlight.set(url, p);
  return p;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
};

function scheduleIdle(fn: () => void): void {
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(fn, { timeout: 1500 });
  } else {
    setTimeout(fn, 0);
  }
}

export function preloadSkin(skinId: string): void {
  if (!skinId || preloadedSkinIds.has(skinId)) return;
  const skin = getDiceSkin(skinId);
  if (!skin) return;
  preloadedSkinIds.add(skinId);
  const urls = collectSkinUrls(skin);
  scheduleIdle(() => {
    urls.forEach((u) => {
      void preloadOne(u);
    });
  });
}

export function preloadSkinMapping(mapping: Record<string, string> | undefined | null): void {
  if (!mapping) return;
  const ids = new Set(Object.values(mapping).filter(Boolean));
  ids.forEach((id) => preloadSkin(id));
}

export function preloadAllSkins(): void {
  FATE_DICE_SKINS.forEach((s) => preloadSkin(s.id));
}
