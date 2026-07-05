/**
 * 17.6 — Lazy singleton loader Jitsi External API (`external_api.js`).
 *
 * Vzor 13.3 `loadYoutubeApi`: skript se vloží jen jednou, všichni konzumenti
 * čekají na stejnou promisu. Funguje POUZE když CSP `script-src` obsahuje
 * `https://meet.jit.si` (viz default.conf.template) — jinak prohlížeč skript
 * odmítne a promisa se zamítne.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

const SRC = 'https://meet.jit.si/external_api.js';

let readyPromise: Promise<any> | null = null;

export function loadJitsiApi(): Promise<any> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve, reject) => {
    // Už načteno (jiný mount / HMR).
    if (window.JitsiMeetExternalAPI) {
      resolve(window.JitsiMeetExternalAPI);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () =>
        resolve(window.JitsiMeetExternalAPI),
      );
      existing.addEventListener('error', () => {
        readyPromise = null;
        reject(new Error('Jitsi API se nepodařilo načíst.'));
      });
      return;
    }

    const tag = document.createElement('script');
    tag.src = SRC;
    tag.async = true;
    tag.onload = () => resolve(window.JitsiMeetExternalAPI);
    tag.onerror = () => {
      readyPromise = null; // ať to jde zkusit znovu
      reject(new Error('Jitsi API se nepodařilo načíst.'));
    };
    document.head.appendChild(tag);
  });

  return readyPromise;
}
