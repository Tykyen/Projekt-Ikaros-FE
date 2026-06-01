// 10.1a — per-typ 3D těleso pro `react-force-graph-3d` `nodeThreeObject`.
// Čisté factory funkce (žádný WebGL render → testovatelné v jsdom).
// Port myšlenky z Matrix UniverseMap.tsx, bez hardcode jmen (Asgard/Svar → hasRing).
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import type { UniverseNode } from './types';

const RING_COLOR = 0xd9b382;

function bodyGeometry(node: UniverseNode): THREE.BufferGeometry {
  switch (node.type) {
    case 'asteroid':
      return new THREE.DodecahedronGeometry(node.size, 1);
    case 'moon':
      return new THREE.SphereGeometry(node.size * 0.8, 16, 16);
    default:
      return new THREE.SphereGeometry(node.size, 32, 32);
  }
}

/** Materiál tělesa + případné extra objekty (světlo, disk, jádro) přidané do group. */
function bodyMaterial(
  node: UniverseNode,
  group: THREE.Group,
): THREE.Material {
  // Texturovaná tělesa (kromě mlhoviny) — obrázek je plná Cloudinary URL.
  if (node.img && node.type !== 'nebula') {
    const texture = new THREE.TextureLoader().load(node.img);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: texture });
  }

  switch (node.type) {
    case 'star': {
      group.add(new THREE.PointLight(node.color, 2, node.size * 10));
      return new THREE.MeshBasicMaterial({ color: node.color });
    }
    case 'blackhole': {
      const disk = new THREE.Mesh(
        new THREE.RingGeometry(node.size * 1.5, node.size * 3, 64),
        new THREE.MeshBasicMaterial({
          color: node.color || 0xaa55ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        }),
      );
      disk.rotation.x = Math.PI / 2.2;
      disk.rotation.y = Math.PI / 8;
      group.add(disk);
      return new THREE.MeshBasicMaterial({ color: 0x000000 });
    }
    case 'nebula': {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(node.size * 0.5, 16, 16),
        new THREE.MeshBasicMaterial({
          color: node.color,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(core);
      return new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    }
    default:
      return new THREE.MeshLambertMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.9,
      });
  }
}

function addRing(node: UniverseNode, group: THREE.Group): void {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(node.size * 1.3, node.size * 2.5, 64),
    new THREE.MeshBasicMaterial({
      color: RING_COLOR,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.rotation.y = Math.PI / 8;
  group.add(ring);
}

function addLabel(node: UniverseNode, group: THREE.Group): void {
  const sprite = new SpriteText(node.name);
  sprite.color = 'white';
  sprite.fontWeight = 'bold';
  sprite.textHeight = Math.max(1.5, node.size * 0.55);
  sprite.position.y = node.size + 3;
  group.add(sprite);
}

/**
 * Sestaví 3D reprezentaci uzlu. Vrací `THREE.Group`:
 * tělo (Mesh) + label (SpriteText) + per-typ extra + volitelný prsten.
 */
export function buildNodeObject(node: UniverseNode): THREE.Group {
  const group = new THREE.Group();

  const geometry = bodyGeometry(node);
  const material = bodyMaterial(node, group);
  const body = new THREE.Mesh(geometry, material);
  if (node.type === 'asteroid') {
    body.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  }
  group.add(body);

  if (node.hasRing) addRing(node, group);
  addLabel(node, group);

  return group;
}
