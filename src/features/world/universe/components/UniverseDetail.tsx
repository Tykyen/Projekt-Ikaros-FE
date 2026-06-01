// 10.1c — detail vybraného uzlu: frakce, spojení (proklik), wiki odkaz,
// PJ quick-toggle viditelnosti (mimo edit mód → PATCH).
import { Link } from 'react-router-dom';
import { nodeTypeLabel } from '../types';
import type { UniverseNode, UniverseLink } from '../types';
import { connectionsOf } from '../universeSelectors';
import styles from './UniversePanel.module.css';

interface Props {
  node: UniverseNode;
  nodes: UniverseNode[];
  links: UniverseLink[];
  worldSlug: string;
  isPJ: boolean;
  onSelectNode: (id: string) => void;
  /** PJ — rychlé skrýt/odhalit (PATCH). undefined = skryto (hráč / edit mód). */
  onToggleVisibility?: (node: UniverseNode) => void;
  visibilityBusy?: boolean;
}

export function UniverseDetail({
  node,
  nodes,
  links,
  worldSlug,
  isPJ,
  onSelectNode,
  onToggleVisibility,
  visibilityBusy,
}: Props) {
  const connections = connectionsOf(node.id, links, nodes);

  return (
    <div className={styles.detail}>
      <h3 className={styles.detailTitle}>{node.name}</h3>
      <div className={styles.detailMeta}>{nodeTypeLabel(node.type)}</div>

      <div className={styles.detailRow}>
        <strong>Frakce:</strong> {node.alliance || 'Neznámá'}
      </div>

      {node.pageSlug && (
        <Link
          to={`/svet/${worldSlug}/${node.pageSlug}`}
          className={styles.wikiLink}
        >
          📖 Otevřít wiki stránku
        </Link>
      )}

      {connections.length > 0 && (
        <div className={styles.detailRow}>
          <strong>Spojení ({connections.length}):</strong>
          <ul className={styles.connList}>
            {connections.map((c) => (
              <li key={c.node.id}>
                <button
                  type="button"
                  className={styles.connLink}
                  onClick={() => onSelectNode(c.node.id)}
                >
                  {c.node.name}
                  <span className={styles.connType}>
                    {nodeTypeLabel(c.node.type)}
                    {c.isOrbit ? ' / Orbit' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPJ && onToggleVisibility && (
        <button
          type="button"
          className={styles.toggleVisBtn}
          disabled={visibilityBusy}
          onClick={() => onToggleVisibility(node)}
        >
          {node.isPublic ? '🙈 Skrýt hráčům' : '👁 Zveřejnit'}
        </button>
      )}
    </div>
  );
}
