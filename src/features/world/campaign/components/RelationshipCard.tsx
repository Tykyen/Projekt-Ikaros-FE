import clsx from 'clsx';
import { Badge } from '@/shared/ui';
import { REL_STATUS_LABELS } from '../labels';
import type { CampaignRelationship, CampaignSubject } from '../types';
import { SubjectAvatar } from './SubjectAvatar';
import { EmotionChip, PriorityPips } from './Bits';
import s from './campaign.module.css';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  dormant: 'default',
  crisis: 'danger',
  closed: 'default',
};

/** Karta vztahu z pohledu vybraného subjektu (ukazuje druhou stranu). */
export function RelationshipCard({
  rel,
  selectedSubjectId,
  subjects,
  selected,
  onClick,
}: {
  rel: CampaignRelationship;
  selectedSubjectId: string;
  subjects: CampaignSubject[];
  selected: boolean;
  onClick: () => void;
}) {
  const isA = rel.subjectAId === selectedSubjectId;
  const otherId = isA ? rel.subjectBId : rel.subjectAId;
  const other = subjects.find((x) => x.id === otherId);
  const fromSel = isA ? rel.sideA : rel.sideB;
  const toSel = isA ? rel.sideB : rel.sideA;

  return (
    <button
      type="button"
      className={clsx(s.relCard, selected && s.relCardActive)}
      onClick={onClick}
    >
      <div className={s.relCardHead}>
        {other && <SubjectAvatar subject={other} size={32} />}
        <span className={s.relCardName}>{other?.name ?? 'Neznámý'}</span>
        <Badge variant={STATUS_VARIANT[rel.status] ?? 'default'}>
          {REL_STATUS_LABELS[rel.status]}
        </Badge>
        <PriorityPips value={rel.priority} />
      </div>
      <div className={s.relCardSides}>
        <EmotionChip tag={fromSel.emotionTag} valence={fromSel.valence} prefix="→ " />
        <EmotionChip tag={toSel.emotionTag} valence={toSel.valence} prefix="← " />
      </div>
      {rel.shared.whatHappened && (
        <p className={s.relCardSummary}>{rel.shared.whatHappened}</p>
      )}
    </button>
  );
}
