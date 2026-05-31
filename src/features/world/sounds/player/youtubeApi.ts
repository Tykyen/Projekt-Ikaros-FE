/**
 * 13.3 — Lazy singleton loader YouTube IFrame API.
 *
 * Skript se vkládá jen jednou; všichni konzumenti čekají na stejnou promisu.
 * `window.YT.Player` je k dispozici až po `onYouTubeIframeAPIReady`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let readyPromise: Promise<any> | null = null;

export function loadYoutubeApi(): Promise<any> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve) => {
    // Už načteno (jiný kód / HMR).
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    // Zřetězit s případně existujícím callbackem.
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };

    // Vložit skript jen pokud tam ještě není.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });

  return readyPromise;
}
