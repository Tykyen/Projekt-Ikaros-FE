/**
 * 10.2d-prep-B — Bestie card v list.
 */
import { Button } from '@/shared/ui';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { EntityStatbar } from '@/features/world/tactical-map/components/schema-form/EntityStatbar';
import { getImageStyle } from '@/shared/lib/imageStyle';
import type { Bestie } from '../types';
import { getBestieAbilities } from '../lib/bestieAbilities';
import styles from './BestieCard.module.css';

interface Props {
  bestie: Bestie;
  canEdit: boolean;
  canDelete: boolean;
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
  onEdit,
  onClone,
  onDelete,
}: Props): React.ReactElement {
  const schema = systemEntitySchemaRegistry.get(bestie.systemId, 'bestie');
  const abilities = getBestieAbilities(bestie);
  return (
    <article className={styles.card}>
      <div className={styles.avatar}>
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
      <div className={styles.body}>
        <h4 className={styles.name}>{bestie.name}</h4>
        {schema && (
          <EntityStatbar schema={schema} value={bestie.systemStats} compact />
        )}
        {abilities.length > 0 && (
          <ul className={styles.abilities} aria-label="Schopnosti">
            {abilities.map((a, i) => (
              <li key={i} className={styles.ability}>
                <span className={styles.abilityLabel}>{a.label}</span>
                {a.value && (
                  <span className={styles.abilityValue}>{a.value}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {bestie.notes && (
          <p className={styles.notes} title={bestie.notes}>
            {bestie.notes}
          </p>
        )}
      </div>
      <div className={styles.actions}>
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
    </article>
  );
}
