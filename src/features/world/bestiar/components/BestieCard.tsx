/**
 * 10.2d-prep-B — Bestie card v list.
 * 16.2h — univerzální motiv-aware karta: sbaleno (portrét · jméno · popis ·
 * akce · šipka) + rozbalovací detail (`BestieDetail`). Vzhled řídí motiv světa
 * (`data-theme`) přes tokeny + skiny (`bestieSkins.css`); stabilní selektor
 * `data-bestie-card`.
 */
import { useState } from 'react';
import { Button } from '@/shared/ui';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { getImageStyle } from '@/shared/lib/imageStyle';
import type { Bestie } from '../types';
import { BestieDetail } from './BestieDetail';
import styles from './BestieCard.module.css';
import './bestieSkins.css';

interface Props {
  bestie: Bestie;
  canEdit: boolean;
  canDelete: boolean;
  /** GM poznámky (`notes`) — vidí jen PJ+/vlastník. Odpojeno od `canEdit`
   *  (PJ smí ČÍST poznámky i u systémové bestie, kterou needituje). */
  canSeeNotes: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function BestieCard({
  bestie,
  canEdit,
  canDelete,
  canSeeNotes,
  onEdit,
  onClone,
  onDelete,
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false);

  const schema = systemEntitySchemaRegistry.get(bestie.systemId, 'bestie');

  const toggle = (): void => setOpen((o) => !o);

  return (
    <article className={styles.card} data-bestie-card data-open={open || undefined}>
      <div
        className={styles.head}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className={styles.portrait} data-bestie-portrait>
          {bestie.imageUrl ? (
            <img
              src={bestie.imageUrl}
              alt={bestie.name}
              style={getImageStyle(
                bestie.imageFocalX,
                bestie.imageFocalY,
                bestie.imageZoom,
                bestie.imageFit,
              )}
            />
          ) : (
            <div className={styles.fallback}>{getInitials(bestie.name)}</div>
          )}
        </div>

        <div className={styles.content}>
          <h4 className={styles.name}>{bestie.name}</h4>
          {bestie.description && (
            <p className={styles.blurb}>{bestie.description}</p>
          )}
        </div>

        <div className={styles.rightcol}>
          <span className={styles.chev} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- onClick jen stopPropagation (klik na akce nesmí přepnout kartu); reálné akce = vnořená <Button>, obal nesmí být role=button (nested interactive) */}
          <div
            className={`${styles.actions} print-hide`}
            onClick={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                Upravit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClone}>
              Klonovat
            </Button>
            {canDelete && (
              <Button variant="danger" size="sm" onClick={onDelete}>
                Smazat
              </Button>
            )}
          </div>
        </div>
      </div>

      {open && schema && (
        <BestieDetail
          schema={schema}
          systemStats={bestie.systemStats}
          description={bestie.description}
          notes={bestie.notes}
          canSeeNotes={canSeeNotes}
        />
      )}
    </article>
  );
}
