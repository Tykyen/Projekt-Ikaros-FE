import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useRef } from 'react';
import { UniverseGraph, type UniverseGraphHandle } from './UniverseGraph';
import { flyToNode } from './graphCamera';
import type { UniverseMap, UniverseNode } from '../types';

// zachytíme props předané do ForceGraph3D
let captured: Record<string, unknown> | null = null;
vi.mock('react-force-graph-3d', () => ({
  default: (props: Record<string, unknown>) => {
    captured = props;
    return <div data-testid="fg" />;
  },
}));

// jsdom nemá ResizeObserver ani nenulové clientWidth
beforeEach(() => {
  captured = null;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: 600,
  });
});

const map: UniverseMap = {
  id: 'm',
  worldId: 'w',
  nodes: [
    {
      id: 'a',
      name: 'A',
      color: '#fff',
      size: 5,
      isPublic: true,
      visibleToPlayerIds: [],
    },
  ],
  links: [],
};

function Harness(props: {
  editMode: boolean;
  onNodeClick: (n: UniverseNode) => void;
  onNodeMoved?: (id: string, x: number, y: number, z: number) => void;
}) {
  const ref = useRef<UniverseGraphHandle | undefined>(undefined);
  return (
    <UniverseGraph
      data={map}
      editMode={props.editMode}
      fgRef={ref}
      onNodeClick={props.onNodeClick}
      onNodeRightClick={() => {}}
      onNodeMoved={props.onNodeMoved}
    />
  );
}

describe('UniverseGraph', () => {
  it('předá graphData a editMode→enableNodeDrag (false)', () => {
    render(<Harness editMode={false} onNodeClick={() => {}} />);
    expect(captured?.graphData).toEqual(map);
    expect(captured?.enableNodeDrag).toBe(false);
  });

  it('editMode true → enableNodeDrag true', () => {
    render(<Harness editMode onNodeClick={() => {}} />);
    expect(captured?.enableNodeDrag).toBe(true);
  });

  it('onNodeClick předá UniverseNode', () => {
    const onClick = vi.fn();
    render(<Harness editMode={false} onNodeClick={onClick} />);
    (captured?.onNodeClick as (n: UniverseNode) => void)(map.nodes[0]);
    expect(onClick).toHaveBeenCalledWith(map.nodes[0]);
  });

  it('onNodeDragEnd s pozicí volá onNodeMoved', () => {
    const onMoved = vi.fn();
    render(<Harness editMode onNodeClick={() => {}} onNodeMoved={onMoved} />);
    (captured?.onNodeDragEnd as (n: Record<string, unknown>) => void)({
      id: 'a',
      x: 1,
      y: 2,
      z: 3,
    });
    expect(onMoved).toHaveBeenCalledWith('a', 1, 2, 3);
  });
});

describe('flyToNode', () => {
  it('zavolá cameraPosition když má uzel pozici', () => {
    const fg = { cameraPosition: vi.fn() } as unknown as UniverseGraphHandle;
    flyToNode(fg, { ...map.nodes[0], x: 10, y: 0, z: 0 });
    expect((fg.cameraPosition as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });

  it('no-op bez pozice', () => {
    const fg = { cameraPosition: vi.fn() } as unknown as UniverseGraphHandle;
    flyToNode(fg, map.nodes[0]);
    expect(fg.cameraPosition).not.toHaveBeenCalled();
  });
});
