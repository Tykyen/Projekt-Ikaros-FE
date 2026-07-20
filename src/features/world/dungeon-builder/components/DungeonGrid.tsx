/**
 * 21.3c — sdílený grid karet podzemí (seznam světa, knihovna ve světě
 * i platformová knihovna). Akce dodává volající přes `actions`.
 */
import type { ReactNode } from 'react';
import type { DungeonMap } from '../types';
import { MAP_KIND_LABELS, normalizeMapKind } from '../types';
import { DungeonThumb } from './DungeonThumb';
import styles from './DungeonGrid.module.css';

export interface DungeonGridProps {
  dungeons: DungeonMap[];
  emptyText: string;
  onOpen: (d: DungeonMap) => void;
  /** Ikonová tlačítka do patičky karty. */
  actions: (d: DungeonMap) => ReactNode;
  /** Doplňkový text vedle rozměrů (např. „hráčská stavba"). */
  meta?: (d: DungeonMap) => string | null;
}

export function DungeonGrid({
  dungeons,
  emptyText,
  onOpen,
  actions,
  meta,
}: DungeonGridProps): React.ReactElement {
  if (dungeons.length === 0) {
    return (
      <div className={styles.stateWrap}>
        <p className={styles.empty}>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className={styles.grid}>
      {dungeons.map((d) => {
        const extra = meta?.(d);
        return (
          <article key={d.id} className={styles.card}>
            <button
              type="button"
              onClick={() => onOpen(d)}
              className={styles.thumbLink}
              aria-label={`Otevřít podzemí ${d.name || 'bez názvu'}`}
            >
              <DungeonThumb dungeon={d} />
            </button>
            <div className={styles.cardBody}>
              <div className={styles.cardText}>
                <h3 className={styles.cardName}>{d.name || 'Bez názvu'}</h3>
                <p className={styles.cardMeta}>
                  {/* D-077 — `normalizeMapKind`, ne ternár: ten shazoval
                      'wilderness' na 'dungeon', takže krajina se v seznamu
                      vydávala za podzemí. */}
                  {MAP_KIND_LABELS[normalizeMapKind(d.mapKind)]} ·{' '}
                  {d.gridWidth}×{d.gridHeight}
                  {extra ? ` · ${extra}` : ''}
                </p>
              </div>
              <div className={styles.cardActions}>{actions(d)}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
