/**
 * 13.3 — SoundCard (řádek seznamu).
 *
 * Levý barevný proužek dle mediaType, název + badge metadat + intensity tečky,
 * vpravo akce dle role/kontextu (náhled, edit, smazat, nominovat, importovat).
 */
import { Button } from '@/shared/ui';
import type { Sound } from '../types';
import {
  MEDIA_TYPE_LABELS,
  MEDIA_TYPE_COLORS,
  ENVIRONMENT_LABELS,
  EMOTIONAL_TONE_LABELS,
} from '../lib/soundEnums';
import styles from './SoundCard.module.css';

interface Props {
  sound: Sound;
  isPlaying: boolean;
  canEdit: boolean;
  /** 'world' = karta v knihovně světa; 'global' = karta v globálním tabu. */
  context: 'world' | 'global';
  onPreview: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onNominate?: () => void;
  onImport?: () => void;
}

export function SoundCard({
  sound,
  isPlaying,
  canEdit,
  context,
  onPreview,
  onEdit,
  onDelete,
  onNominate,
  onImport,
}: Props): React.ReactElement {
  const stripeColor = MEDIA_TYPE_COLORS[sound.mediaType];

  return (
    <div className={`${styles.card} ${isPlaying ? styles.cardPlaying : ''}`}>
      <span className={styles.stripe} style={{ background: stripeColor }} />

      <div className={styles.body}>
        <h3 className={styles.name}>{sound.name}</h3>
        <div className={styles.badges}>
          <span className={styles.badge} style={{ borderColor: stripeColor }}>
            {MEDIA_TYPE_LABELS[sound.mediaType]}
          </span>
          <span className={styles.badge}>
            {ENVIRONMENT_LABELS[sound.environment]}
          </span>
          <span className={styles.badge}>
            {EMOTIONAL_TONE_LABELS[sound.emotionalTone]}
          </span>
          <span
            className={styles.intensity}
            title={`Intenzita ${sound.intensity}/5`}
            aria-label={`Intenzita ${sound.intensity} z 5`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`${styles.dot} ${
                  n <= sound.intensity ? styles.dotOn : ''
                }`}
              />
            ))}
          </span>
          {sound.status === 'pending' && (
            <span className={styles.statusPending}>čeká na schválení</span>
          )}
          {sound.status === 'rejected' && (
            <span className={styles.statusRejected}>zamítnuto</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant={isPlaying ? 'primary' : 'ghost'}
          size="sm"
          onClick={onPreview}
        >
          {isPlaying ? '⏸ Hraje' : '▶ Náhled'}
        </Button>
        {context === 'global' && onImport && (
          <Button variant="ghost" size="sm" onClick={onImport}>
            Importovat
          </Button>
        )}
        {context === 'world' && canEdit && onNominate && (
          <Button variant="ghost" size="sm" onClick={onNominate}>
            Nominovat
          </Button>
        )}
        {context === 'world' && canEdit && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Upravit
          </Button>
        )}
        {context === 'world' && canEdit && onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Smazat
          </Button>
        )}
      </div>
    </div>
  );
}
