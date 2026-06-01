// 10.1c — lokální draft mapy pro edit mód. Všechny strukturální operace
// mutují draft; „Uložit" pošle celý draft jako full PUT.
import { useCallback, useRef, useState } from 'react';
import type { UniverseMap, UniverseNode, UniverseLink } from '../types';

function linkTouchesNode(link: UniverseLink, nodeId: string): boolean {
  return link.source === nodeId || link.target === nodeId;
}

export interface UseUniverseDraftResult {
  draft: UniverseMap | null;
  isDirty: boolean;
  /** Načte baseline ze serveru (vstup do edit módu / resync). */
  reset: (map: UniverseMap) => void;
  addNode: (node: UniverseNode) => void;
  updateNode: (id: string, patch: Partial<UniverseNode>) => void;
  /** Smaže uzel + kaskádně všechny napojené hrany. */
  removeNode: (id: string) => void;
  addLink: (link: UniverseLink) => void;
  removeLink: (source: string, target: string) => void;
  moveNode: (id: string, x: number, y: number, z: number) => void;
}

export function useUniverseDraft(): UseUniverseDraftResult {
  const [draft, setDraft] = useState<UniverseMap | null>(null);
  const baselineRef = useRef<string>('');
  const [isDirty, setIsDirty] = useState(false);

  const reset = useCallback((map: UniverseMap) => {
    baselineRef.current = JSON.stringify(map);
    setDraft(map);
    setIsDirty(false);
  }, []);

  const mutate = useCallback(
    (fn: (m: UniverseMap) => UniverseMap) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        setIsDirty(JSON.stringify(next) !== baselineRef.current);
        return next;
      });
    },
    [],
  );

  const addNode = useCallback(
    (node: UniverseNode) =>
      mutate((m) => ({ ...m, nodes: [...m.nodes, node] })),
    [mutate],
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<UniverseNode>) =>
      mutate((m) => ({
        ...m,
        nodes: m.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      })),
    [mutate],
  );

  const removeNode = useCallback(
    (id: string) =>
      mutate((m) => ({
        ...m,
        nodes: m.nodes.filter((n) => n.id !== id),
        links: m.links.filter((l) => !linkTouchesNode(l, id)),
      })),
    [mutate],
  );

  const addLink = useCallback(
    (link: UniverseLink) =>
      mutate((m) => {
        const exists = m.links.some(
          (l) =>
            (l.source === link.source && l.target === link.target) ||
            (l.source === link.target && l.target === link.source),
        );
        return exists ? m : { ...m, links: [...m.links, link] };
      }),
    [mutate],
  );

  const removeLink = useCallback(
    (source: string, target: string) =>
      mutate((m) => ({
        ...m,
        links: m.links.filter(
          (l) => !(l.source === source && l.target === target),
        ),
      })),
    [mutate],
  );

  const moveNode = useCallback(
    (id: string, x: number, y: number, z: number) =>
      mutate((m) => ({
        ...m,
        nodes: m.nodes.map((n) => (n.id === id ? { ...n, x, y, z } : n)),
      })),
    [mutate],
  );

  return {
    draft,
    isDirty,
    reset,
    addNode,
    updateNode,
    removeNode,
    addLink,
    removeLink,
    moveNode,
  };
}
