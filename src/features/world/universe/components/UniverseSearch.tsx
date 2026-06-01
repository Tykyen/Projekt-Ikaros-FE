// 10.1c — vyhledání uzlu (datalist) → výběr + fly-to.
import { useId } from 'react';
import type { UniverseNode } from '../types';
import { sortedByName } from '../universeSelectors';
import styles from './UniversePanel.module.css';

interface Props {
  nodes: UniverseNode[];
  onPick: (node: UniverseNode) => void;
}

export function UniverseSearch({ nodes, onPick }: Props) {
  const listId = useId();
  const sorted = sortedByName(nodes);

  return (
    <>
      <datalist id={listId}>
        {sorted.map((n) => (
          <option key={n.id} value={n.name} />
        ))}
      </datalist>
      <input
        className={styles.input}
        type="text"
        placeholder="🔍 Vyhledat těleso…"
        list={listId}
        onChange={(e) => {
          const found = nodes.find((n) => n.name === e.target.value);
          if (found) {
            onPick(found);
            e.target.value = '';
          }
        }}
      />
    </>
  );
}
