import { describe, it, expect } from 'vitest';
import { classifyPageLink } from '../classifyPageLink';

// Reálné matrixLegacyLinks (isLegacyWorld/strip/remap) — integrační pokrytí
// sdíleného jádra, které používá read mode (useBrokenLinks) i editor
// (useBrokenLinkDecoration).
const matrixDir = new Set([
  'svedsko',
  'londyn',
  'abi',
  'jakuza',
  'undarbunndr',
]);

function classify(href: string, worldSlug = 'matrix', slugSet = matrixDir) {
  return classifyPageLink(href, { slugSet, worldSlug });
}

describe('classifyPageLink — interní / rozbitý / ignore', () => {
  it('externí odkaz → ignore', () => {
    expect(classify('https://example.com')).toEqual({ kind: 'ignore' });
  });

  it('mailto/tel/hash → ignore', () => {
    expect(classify('mailto:a@b.cz')).toEqual({ kind: 'ignore' });
    expect(classify('tel:123')).toEqual({ kind: 'ignore' });
    expect(classify('#kotva')).toEqual({ kind: 'ignore' });
  });

  it('holý slug existující → internal s prázdným suffixem', () => {
    expect(classify('svedsko')).toEqual({
      kind: 'internal',
      target: 'svedsko',
      suffix: '',
    });
  });

  it('root-relativní /slug existující → internal', () => {
    expect(classify('/londyn')).toEqual({
      kind: 'internal',
      target: 'londyn',
      suffix: '',
    });
  });

  it('už world-scoped odkaz → internal', () => {
    expect(classify('/svet/matrix/svedsko')).toEqual({
      kind: 'internal',
      target: 'svedsko',
      suffix: '',
    });
  });

  it('hash/kotva se zachová jako suffix', () => {
    expect(classify('svedsko#dejiny')).toEqual({
      kind: 'internal',
      target: 'svedsko',
      suffix: '#dejiny',
    });
  });

  it('neexistující slug → broken', () => {
    expect(classify('atlantida')).toEqual({ kind: 'broken' });
  });

  it('reserved world routa (pravidla) → ignore', () => {
    expect(classify('pravidla')).toEqual({ kind: 'ignore' });
  });

  it('vícesegmentová cesta (postava/abc) → ignore', () => {
    expect(classify('postava/abc')).toEqual({ kind: 'ignore' });
  });

  it('úvodní strana světa → ignore', () => {
    expect(classify('/svet/matrix')).toEqual({ kind: 'ignore' });
    expect(classify('/svet/matrix/')).toEqual({ kind: 'ignore' });
  });
});

describe('classifyPageLink — Matrix legacy shim', () => {
  it('A1: absolutní starý web s existujícím cílem → internal', () => {
    expect(classify('https://www.projekt-ikaros.com/svedsko')).toEqual({
      kind: 'internal',
      target: 'svedsko',
      suffix: '',
    });
  });

  it('A1: absolutní starý web s propadlým cílem → broken', () => {
    expect(
      classify('https://www.projekt-ikaros.com/boj-s-programy'),
    ).toEqual({ kind: 'broken' });
  });

  it('A1: hash za absolutním odkazem se zachová', () => {
    expect(classify('https://www.projekt-ikaros.com/svedsko#dejiny')).toEqual({
      kind: 'internal',
      target: 'svedsko',
      suffix: '#dejiny',
    });
  });

  it('A2: přejmenovaný slug (abigail-wattson) → kanonický cíl abi', () => {
    expect(classify('abigail-wattson')).toEqual({
      kind: 'internal',
      target: 'abi',
      suffix: '',
    });
  });

  it('A3: starý AKJ slug (akj-8-jakuza) → vlastník záložky jakuza', () => {
    expect(classify('akj-8-jakuza')).toEqual({
      kind: 'internal',
      target: 'jakuza',
      suffix: '',
    });
  });

  it('A3: AKJ bez dohledaného vlastníka (gm01) → broken', () => {
    expect(classify('gm01')).toEqual({ kind: 'broken' });
  });

  it('jiný svět: legacy shim se neaplikuje, starý web zůstane externí → ignore', () => {
    expect(
      classify('https://www.projekt-ikaros.com/svedsko', 'jiny-svet'),
    ).toEqual({ kind: 'ignore' });
  });

  it('jiný svět: holý slug existující → internal (bez legacy remapu)', () => {
    expect(classify('svedsko', 'jiny-svet')).toEqual({
      kind: 'internal',
      target: 'svedsko',
      suffix: '',
    });
  });
});
