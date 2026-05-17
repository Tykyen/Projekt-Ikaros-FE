import { describe, it, expect } from 'vitest';
import { classifyFile, formatBytes, validatePick } from './attachments';

/** File s vynucenou velikostí — `File.size` nelze nastavit konstruktorem. */
function file(name: string, type: string, size = 100): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('formatBytes', () => {
  it('bytes', () => expect(formatBytes(512)).toBe('512 B'));
  it('kilobytes', () => expect(formatBytes(2048)).toBe('2 kB'));
  it('megabytes s desetinnou čárkou', () =>
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1,5 MB'));
});

describe('classifyFile', () => {
  it('obrázek dle MIME', () =>
    expect(classifyFile(file('a.png', 'image/png'))).toBe('image'));
  it('dokument dle MIME', () =>
    expect(classifyFile(file('a.pdf', 'application/pdf'))).toBe('document'));
  it('nepodporovaný typ → null', () =>
    expect(classifyFile(file('a.exe', 'application/x-msdownload'))).toBeNull());
  it('.md s prázdným MIME → document (fallback dle přípony)', () =>
    expect(classifyFile(file('poznamky.md', ''))).toBe('document'));
});

describe('validatePick', () => {
  it('platný obrázek projde', () =>
    expect(validatePick([], file('a.png', 'image/png'))).toBeNull());

  it('nepodporovaný typ → chyba', () =>
    expect(
      validatePick([], file('a.exe', 'application/x-msdownload')),
    ).toMatch(/Nepodporovaný/));

  it('soubor nad 10 MB → chyba', () =>
    expect(
      validatePick([], file('big.png', 'image/png', 11 * 1024 * 1024)),
    ).toMatch(/10 MB/));

  it('11. obrázek → chyba', () => {
    const ten = Array.from({ length: 10 }, (_, i) =>
      file(`img${i}.png`, 'image/png'),
    );
    expect(validatePick(ten, file('extra.png', 'image/png'))).toMatch(
      /10 obrázků/,
    );
  });

  it('5. dokument → chyba', () => {
    const four = Array.from({ length: 4 }, (_, i) =>
      file(`doc${i}.pdf`, 'application/pdf'),
    );
    expect(validatePick(four, file('extra.pdf', 'application/pdf'))).toMatch(
      /4 dokumenty/,
    );
  });

  it('limity se počítají zvlášť — dokument projde i při 10 obrázcích', () => {
    const tenImages = Array.from({ length: 10 }, (_, i) =>
      file(`img${i}.png`, 'image/png'),
    );
    expect(
      validatePick(tenImages, file('a.pdf', 'application/pdf')),
    ).toBeNull();
  });
});
