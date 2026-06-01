import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { buildNodeObject } from './nodeObjects';
import type { UniverseNode } from './types';

// SpriteText vytváří canvas 2D kontext (jsdom nemá) → mock na prázdný Object3D.
vi.mock('three-spritetext', () => ({
  default: class {
    color = '';
    fontWeight = '';
    textHeight = 0;
    position = { y: 0 };
  },
}));

function node(partial: Partial<UniverseNode>): UniverseNode {
  return {
    id: 'n',
    name: 'N',
    color: '#ffcc00',
    size: 5,
    isPublic: true,
    visibleToPlayerIds: [],
    ...partial,
  };
}

function meshes(group: THREE.Group): THREE.Mesh[] {
  return group.children.filter(
    (c): c is THREE.Mesh => c.type === 'Mesh',
  );
}

describe('buildNodeObject', () => {
  it('planet → Sphere + MeshLambertMaterial', () => {
    const g = buildNodeObject(node({ type: 'planet' }));
    const body = meshes(g)[0];
    expect(body.geometry.type).toBe('SphereGeometry');
    expect(body.material).toBeInstanceOf(THREE.MeshLambertMaterial);
  });

  it('asteroid → DodecahedronGeometry', () => {
    const g = buildNodeObject(node({ type: 'asteroid' }));
    expect(meshes(g)[0].geometry.type).toBe('DodecahedronGeometry');
  });

  it('moon → menší Sphere (radius = size·0.8)', () => {
    const g = buildNodeObject(node({ type: 'moon', size: 10 }));
    const geo = meshes(g)[0].geometry as THREE.SphereGeometry;
    expect(geo.type).toBe('SphereGeometry');
    expect(geo.parameters.radius).toBeCloseTo(8);
  });

  it('star → přidá PointLight', () => {
    const g = buildNodeObject(node({ type: 'star' }));
    expect(
      g.children.some((c: THREE.Object3D) => c instanceof THREE.PointLight),
    ).toBe(true);
  });

  it('blackhole → akreční disk (RingGeometry mesh)', () => {
    const g = buildNodeObject(node({ type: 'blackhole' }));
    expect(meshes(g).some((m) => m.geometry.type === 'RingGeometry')).toBe(
      true,
    );
  });

  it('nebula → core mesh + additive transparent materiál', () => {
    const g = buildNodeObject(node({ type: 'nebula' }));
    // tělo + jádro = 2 meshe
    expect(meshes(g).length).toBe(2);
    const body = meshes(g)[0].material as THREE.MeshBasicMaterial;
    expect(body.transparent).toBe(true);
    expect(body.blending).toBe(THREE.AdditiveBlending);
  });

  it('hasRing → přidá prsten (RingGeometry)', () => {
    const g = buildNodeObject(node({ type: 'planet', hasRing: true }));
    expect(meshes(g).some((m) => m.geometry.type === 'RingGeometry')).toBe(
      true,
    );
  });

  it('bez hasRing → žádný prsten', () => {
    const g = buildNodeObject(node({ type: 'planet' }));
    expect(meshes(g).every((m) => m.geometry.type !== 'RingGeometry')).toBe(
      true,
    );
  });

  it('img → texturovaný MeshBasicMaterial s map', () => {
    const g = buildNodeObject(
      node({ type: 'planet', img: 'https://cdn/x.png' }),
    );
    const mat = meshes(g)[0].material as THREE.MeshBasicMaterial;
    expect(mat).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(mat.map).not.toBeNull();
  });
});
