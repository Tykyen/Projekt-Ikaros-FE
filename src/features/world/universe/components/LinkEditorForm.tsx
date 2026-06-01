// 10.1c — správa hran (cest mezi tělesy). Pracuje nad draftem.
import { useState } from 'react';
import type { UniverseNode, UniverseLink } from '../types';
import { sortedByName } from '../universeSelectors';
import styles from './UniversePanel.module.css';

interface Props {
  nodes: UniverseNode[];
  links: UniverseLink[];
  onAddLink: (link: UniverseLink) => void;
  onRemoveLink: (source: string, target: string) => void;
}

export function LinkEditorForm({
  nodes,
  links,
  onAddLink,
  onRemoveLink,
}: Props) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [isOrbit, setIsOrbit] = useState(false);
  const sorted = sortedByName(nodes);
  const nameById = new Map(nodes.map((n) => [n.id, n.name]));

  const add = () => {
    if (!source || !target || source === target) return;
    onAddLink({ source, target, isOrbit });
    setSource('');
    setTarget('');
    setIsOrbit(false);
  };

  return (
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>Spojení</h3>

      <select
        className={styles.select}
        value={source}
        onChange={(e) => setSource(e.target.value)}
      >
        <option value="">Z tělesa…</option>
        {sorted.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      >
        <option value="">Do tělesa…</option>
        {sorted.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={isOrbit}
          onChange={(e) => setIsOrbit(e.target.checked)}
        />
        <span>Oběžná dráha (krátká spojnice)</span>
      </label>

      <button type="button" className={styles.btn} onClick={add}>
        + Přidat spojení
      </button>

      {links.length > 0 && (
        <ul className={styles.connList}>
          {links.map((l, i) => (
            <li
              key={`${l.source}-${l.target}-${i}`}
              className={styles.formRow}
              style={{ alignItems: 'center' }}
            >
              <span style={{ flex: 1, fontSize: '0.85rem' }}>
                {nameById.get(l.source) ?? l.source} →{' '}
                {nameById.get(l.target) ?? l.target}
                {l.isOrbit ? ' (orbit)' : ''}
              </span>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.btnDanger}`}
                title="Smazat spojení"
                onClick={() => onRemoveLink(l.source, l.target)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
