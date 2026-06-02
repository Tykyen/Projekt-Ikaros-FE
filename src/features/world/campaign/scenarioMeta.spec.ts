import { describe, it, expect } from 'vitest';
import {
  buildTree,
  flattenTree,
  getMeta,
  mergeMeta,
  type ScenarioMeta,
} from './scenarioMeta';
import type { CampaignScenario } from './types';

function scen(
  id: string,
  overrides: Partial<CampaignScenario> = {},
  meta: Partial<ScenarioMeta> = {},
): CampaignScenario {
  const base: CampaignScenario = {
    id,
    worldId: 'w',
    ownerId: 'me',
    isShared: false,
    title: id,
    order: 0,
    subjectIds: [],
    storylineIds: [],
    images: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
  if (Object.keys(meta).length > 0) {
    base.contentData = { storyTree: { ...meta } };
  }
  return base;
}

describe('getMeta', () => {
  it('vrátí konzistentní defaulty pro scénář bez storyTree', () => {
    const m = getMeta(scen('a'));
    expect(m.parentId).toBeNull();
    expect(m.kind).toBe('scene');
    expect(m.status).toBe('draft');
    expect(m.mapSceneIds).toEqual([]);
    expect(m.pageSlugs).toEqual([]);
    expect(m.bestieIds).toEqual([]);
  });

  it('přečte uložená pole', () => {
    const m = getMeta(
      scen(
        'a',
        {},
        {
          parentId: 'p',
          kind: 'folder',
          status: 'active',
          body: '<p>x</p>',
          gmNotes: 'tajné',
          bestieIds: ['b1'],
          order: 3,
        },
      ),
    );
    expect(m.parentId).toBe('p');
    expect(m.kind).toBe('folder');
    expect(m.status).toBe('active');
    expect(m.body).toBe('<p>x</p>');
    expect(m.gmNotes).toBe('tajné');
    expect(m.bestieIds).toEqual(['b1']);
    expect(m.order).toBe(3);
  });

  it('je robustní na poškozený contentData (nehází)', () => {
    const broken = scen('a');
    broken.contentData = { storyTree: 'nonsense' as unknown as object };
    const m = getMeta(broken);
    expect(m.status).toBe('draft');
    expect(m.parentId).toBeNull();
  });

  it('neplatný status spadne na draft', () => {
    const m = getMeta(scen('a', {}, { status: 'bogus' as ScenarioMeta['status'] }));
    expect(m.status).toBe('draft');
  });

  it('přečte mapPrep (obrázky + legenda) a odfiltruje vadné řádky legendy', () => {
    const m = getMeta(
      scen(
        'a',
        {},
        {
          mapPrep: {
            imageUrl: 'http://x/mapa.png',
            numberedImageUrl: 'http://x/cisla.png',
            legend: [
              { label: '1', text: 'brána' },
              { label: 2 as unknown as string, text: null as unknown as string },
            ],
          },
        },
      ),
    );
    expect(m.mapPrep?.imageUrl).toBe('http://x/mapa.png');
    expect(m.mapPrep?.numberedImageUrl).toBe('http://x/cisla.png');
    expect(m.mapPrep?.legend).toEqual([
      { label: '1', text: 'brána' },
      { label: '', text: '' }, // vadné hodnoty → prázdné stringy, ne pád
    ]);
  });

  it('bez mapPrep vrací undefined', () => {
    expect(getMeta(scen('a')).mapPrep).toBeUndefined();
  });
});

describe('mergeMeta (read-merge-write)', () => {
  it('změna jednoho pole zachová ostatní (status nesmaže body)', () => {
    const s = scen('a', {}, { body: '<p>příběh</p>', bestieIds: ['b1'] });
    const next = mergeMeta(s, { status: 'active' });
    const tree = (next.storyTree as ScenarioMeta);
    expect(tree.status).toBe('active');
    expect(tree.body).toBe('<p>příběh</p>');
    expect(tree.bestieIds).toEqual(['b1']);
  });

  it('zachová ostatní klíče contentData mimo storyTree', () => {
    const s = scen('a', {}, { status: 'draft' });
    s.contentData = { ...s.contentData, legacyField: 42 };
    const next = mergeMeta(s, { status: 'resolved' });
    expect(next.legacyField).toBe(42);
    expect((next.storyTree as ScenarioMeta).status).toBe('resolved');
  });
});

describe('buildTree', () => {
  it('poskládá hierarchii dle parentId a seřadí dle meta.order', () => {
    const list = [
      scen('akt', {}, { kind: 'folder', order: 0 }),
      scen('s2', {}, { parentId: 'akt', order: 1 }),
      scen('s1', {}, { parentId: 'akt', order: 0 }),
    ];
    const roots = buildTree(list);
    expect(roots).toHaveLength(1);
    expect(roots[0].scenario.id).toBe('akt');
    expect(roots[0].children.map((c) => c.scenario.id)).toEqual(['s1', 's2']);
    expect(roots[0].children[0].depth).toBe(1);
  });

  it('dangling parent (smazaný rodič) → uzel spadne na kořen, nezmizí', () => {
    const list = [scen('orphan', {}, { parentId: 'neexistuje' })];
    const roots = buildTree(list);
    expect(roots.map((r) => r.scenario.id)).toEqual(['orphan']);
  });

  it('cyklus (a→b→a) nezpůsobí zacyklení, uzly se zobrazí', () => {
    const list = [
      scen('a', {}, { parentId: 'b' }),
      scen('b', {}, { parentId: 'a' }),
    ];
    const roots = buildTree(list);
    const ids = flattenTree(roots)
      .map((n) => n.scenario.id)
      .sort();
    expect(ids).toEqual(['a', 'b']);
  });
});
