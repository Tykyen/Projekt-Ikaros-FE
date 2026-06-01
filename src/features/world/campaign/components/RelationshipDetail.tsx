import { Badge, Button } from '@/shared/ui';
import { REL_STATUS_LABELS } from '../labels';
import type { CampaignRelationship, CampaignSubject } from '../types';
import { EmotionChip, PriorityPips } from './Bits';
import s from './campaign.module.css';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  dormant: 'default',
  crisis: 'danger',
  closed: 'default',
};

function SideBlock({
  title,
  emotionTag,
  valence,
  behavior,
  gmIntent,
  isPJ,
}: {
  title: string;
  emotionTag?: string;
  valence?: number;
  behavior?: string;
  gmIntent?: string;
  isPJ: boolean;
}) {
  return (
    <section className={s.section}>
      <div className={s.sectionLabel}>{title}</div>
      <EmotionChip tag={emotionTag} valence={valence} />
      {behavior && <p className={s.sectionText}>{behavior}</p>}
      {isPJ && gmIntent && <p className={s.secretText}>🔒 {gmIntent}</p>}
    </section>
  );
}

/** Pravý panel — detail vztahu (obě strany, tajná pole jen PJ). */
export function RelationshipDetail({
  rel,
  subjects,
  isPJ,
  readOnly,
  onEdit,
  onDelete,
}: {
  rel: CampaignRelationship;
  subjects: CampaignSubject[];
  isPJ: boolean;
  readOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const nameOf = (id: string) => subjects.find((x) => x.id === id)?.name ?? '?';
  const a = nameOf(rel.subjectAId);
  const b = nameOf(rel.subjectBId);

  return (
    <div className={s.detail}>
      <div className={s.detailHead}>
        <div>
          <div className={s.detailTitle}>
            {a} ↔ {b}
          </div>
          <div className={s.detailMeta}>
            <Badge variant={STATUS_VARIANT[rel.status] ?? 'default'}>
              {REL_STATUS_LABELS[rel.status]}
            </Badge>
            <PriorityPips value={rel.priority} />
          </div>
        </div>
      </div>

      {rel.shared.whatHappened && (
        <section className={s.section}>
          <div className={s.sectionLabel}>Co se stalo</div>
          <p className={s.sectionText}>{rel.shared.whatHappened}</p>
        </section>
      )}
      {isPJ && rel.shared.behindTheScenes && (
        <section className={s.section}>
          <div className={s.sectionLabel}>🔒 Pozadí pro PJ</div>
          <p className={s.secretText}>{rel.shared.behindTheScenes}</p>
        </section>
      )}

      <SideBlock
        title={`${a} → ${b}`}
        emotionTag={rel.sideA.emotionTag}
        valence={rel.sideA.valence}
        behavior={rel.sideA.behavior}
        gmIntent={rel.sideA.gmIntent}
        isPJ={isPJ}
      />
      <SideBlock
        title={`${b} → ${a}`}
        emotionTag={rel.sideB.emotionTag}
        valence={rel.sideB.valence}
        behavior={rel.sideB.behavior}
        gmIntent={rel.sideB.gmIntent}
        isPJ={isPJ}
      />

      {rel.lastChangeNote && (
        <section className={s.section}>
          <div className={s.sectionLabel}>Poslední změna</div>
          <p className={s.sectionText}>{rel.lastChangeNote}</p>
        </section>
      )}

      {!readOnly && (
        <div className={s.detailActions}>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Upravit
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Smazat
          </Button>
        </div>
      )}
    </div>
  );
}
