// 10.1a — WebGL force graph (wrapper kolem react-force-graph-3d).
// Měří container (ResizeObserver → width/height), per-typ tělesa z nodeObjects,
// pauza simulace po ustálení (onEngineStop → zoomToFit jednou).
import { useEffect, useRef, useState } from 'react';
import ForceGraph3D, {
  type ForceGraphMethods,
  type NodeObject,
  type LinkObject,
} from 'react-force-graph-3d';
import { AmbientLight } from 'three';
import { buildNodeObject } from '../nodeObjects';
import type { UniverseLink, UniverseMap, UniverseNode } from '../types';
import styles from './UniverseGraph.module.css';

export type UniverseGraphHandle = ForceGraphMethods<
  NodeObject<UniverseNode>,
  LinkObject<UniverseNode, UniverseLink>
>;

type FgNode = NodeObject<UniverseNode>;

interface Props {
  data: UniverseMap;
  editMode: boolean;
  fgRef: React.MutableRefObject<UniverseGraphHandle | undefined>;
  onNodeClick: (node: UniverseNode) => void;
  onNodeRightClick: (node: UniverseNode) => void;
  /** edit mód — po dotažení dragu uloží novou pozici do draftu. */
  onNodeMoved?: (id: string, x: number, y: number, z: number) => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

export function UniverseGraph({
  data,
  editMode,
  fgRef,
  onNodeClick,
  onNodeRightClick,
  onNodeMoved,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const zoomedRef = useRef(false);
  const reduce = prefersReducedMotion();

  // měření containeru
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // force tuning + ambient light (jas pro Lambert tělesa)
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const scene = fg.scene();
    if (scene && !scene.getObjectByName('universe-ambient')) {
      const amb = new AmbientLight(0xffffff, 2.5);
      amb.name = 'universe-ambient';
      scene.add(amb);
    }
    fg.d3Force('charge')?.strength(-150).distanceMax(120);
    const linkForce = fg.d3Force('link');
    linkForce?.distance((l: UniverseLink) => (l.isOrbit ? 10 : 45));
    fg.d3Force('center')?.strength(0.02);
  }, [fgRef, data]);

  return (
    <div ref={wrapRef} className={styles.graphWrap}>
      {size.width > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="#000000"
          nodeLabel="name"
          nodeRelSize={1}
          nodeVal={(n: FgNode) => n.size}
          nodeThreeObject={(n: FgNode) => buildNodeObject(n as UniverseNode)}
          linkColor={() => 'rgba(120, 130, 220, 0.5)'}
          linkWidth={1.5}
          enableNodeDrag={editMode}
          warmupTicks={reduce ? 0 : 20}
          cooldownTime={reduce ? 2000 : 15000}
          onNodeClick={(n: FgNode) => onNodeClick(n as UniverseNode)}
          onNodeRightClick={(n: FgNode) =>
            onNodeRightClick(n as UniverseNode)
          }
          onNodeDragEnd={(n: FgNode) => {
            if (onNodeMoved && typeof n.x === 'number') {
              onNodeMoved(n.id as string, n.x, n.y ?? 0, n.z ?? 0);
            }
          }}
          onEngineStop={() => {
            const fg = fgRef.current;
            if (fg && !zoomedRef.current && !editMode) {
              fg.zoomToFit(reduce ? 0 : 1000, 150);
              zoomedRef.current = true;
            }
          }}
        />
      )}
    </div>
  );
}
