/**
 * MVP-B — in-situ taháky jako topiky: mapování publika je KONTRAKT.
 * Nejcitlivější případ: Pomocný PJ vidí PJ verzi taháku (naHelpAudience),
 * ale orchestraci scén NEřídí (naCanManageScenes — isPjStrict).
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import {
  INSITU_TOPIKY,
  naCanManageScenes,
  naHelpAudience,
} from '../insitu';
import type { VypravecAudience } from '../types';

describe('naHelpAudience — kontrakt „?" zná jen pj/hrac', () => {
  it.each<[VypravecAudience, 'pj' | 'hrac']>([
    ['pj', 'pj'],
    ['pomocnyPJ', 'pj'],
    ['admin', 'pj'],
    ['korektor', 'hrac'],
    ['hrac', 'hrac'],
    ['ctenar', 'hrac'],
    ['prihlaseny', 'hrac'],
    ['anon', 'hrac'],
  ])('%s → %s', (vstup, ocekavano) => {
    expect(naHelpAudience(vstup)).toBe(ocekavano);
  });
});

describe('naCanManageScenes — isPjStrict', () => {
  it('Pomocný PJ scény neřídí, plný PJ a elevovaný admin ano', () => {
    expect(naCanManageScenes('pomocnyPJ')).toBe(false);
    expect(naCanManageScenes('pj')).toBe(true);
    expect(naCanManageScenes('admin')).toBe(true);
    expect(naCanManageScenes('hrac')).toBe(false);
  });
});

describe('INSITU_TOPIKY — loadery vrací renderovatelné komponenty', () => {
  it.each(INSITU_TOPIKY.map((t) => [t.id, t] as const))(
    '%s se načte a vyrenderuje',
    async (_id, topik) => {
      const mod = await topik.bodyComponent!();
      const { unmount } = render(
        createElement(mod.default, { audience: 'pj' }),
      );
      unmount();
    },
  );

  it('orchestrace: Pomocný PJ dostane upozornění „jen plný PJ"', async () => {
    const mod = await INSITU_TOPIKY.find(
      (t) => t.id === 'insitu.orchestrace',
    )!.bodyComponent!();
    render(createElement(mod.default, { audience: 'pomocnyPJ' }));
    expect(screen.getAllByText(/jen plný PJ/).length).toBeGreaterThan(0);
  });
});
