import { describe, it, expect } from 'vitest';
import { parseEntryScript } from './useAppUpdate';

describe('parseEntryScript', () => {
  it('vytáhne src vstupního module scriptu (Vite formát)', () => {
    const html = `<!doctype html><html><head>
      <link rel="modulepreload" href="/assets/react-DNH5yp63.js">
      <script type="module" crossorigin src="/assets/index-Dc46-2YY.js"></script>
      </head><body></body></html>`;
    expect(parseEntryScript(html)).toBe('/assets/index-Dc46-2YY.js');
  });

  it('nezáleží na pořadí atributů (src před type)', () => {
    const html = `<script src="/assets/index-ABC123.js" type="module"></script>`;
    expect(parseEntryScript(html)).toBe('/assets/index-ABC123.js');
  });

  it('ignoruje ne-module scripty a modulepreload linky', () => {
    const html = `<link rel="modulepreload" href="/assets/react-x.js">
      <script src="/assets/legacy-y.js"></script>
      <script type="module" src="/assets/index-Z9.js"></script>`;
    expect(parseEntryScript(html)).toBe('/assets/index-Z9.js');
  });

  it('vrátí null, když žádný module script není', () => {
    expect(parseEntryScript('<html><body>nic</body></html>')).toBeNull();
  });

  it('dvě různé verze → různé otisky (detekce deploye)', () => {
    const a = parseEntryScript(
      `<script type="module" src="/assets/index-AAAA.js"></script>`,
    );
    const b = parseEntryScript(
      `<script type="module" src="/assets/index-BBBB.js"></script>`,
    );
    expect(a).not.toBe(b);
  });
});
