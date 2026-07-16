import { useMemo } from 'react';
import { Button } from '@/shared/ui';
import type { CampaignRelationship, CampaignSubject } from '../types';
import { SubjectRail } from './SubjectRail';
import { SubjectDetail } from './SubjectDetail';
import { RelationshipCard } from './RelationshipCard';
import { RelationshipDetail } from './RelationshipDetail';
import s from './campaign.module.css';

const STATUS_ORDER: Record<string, number> = {
  crisis: 0,
  active: 1,
  dormant: 2,
  closed: 3,
};

/**
 * Prezentační tab Subjekty — rail + vztahy vybraného subjektu + detail.
 * Tvorbu/editaci/mazání řeší rodič (`CampaignView`) přes callbacky, aby stejné
 * modaly šly vyvolat i z grafu (Síť). Žádné vlastní mutace ani modaly.
 */
export function SubjektyTab({
  subjects,
  relationships,
  readOnly,
  isPJ,
  selSubjectId,
  setSelSubjectId,
  selRelId,
  setSelRelId,
  imageFor,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onCopySubject,
  onAddRelationship,
  onEditRelationship,
  onDeleteRelationship,
  getMaterializeLabel,
  onMaterialize,
  materializePending,
}: {
  subjects: CampaignSubject[];
  relationships: CampaignRelationship[];
  readOnly: boolean;
  isPJ: boolean;
  selSubjectId: string | null;
  setSelSubjectId: (id: string | null) => void;
  selRelId: string | null;
  setSelRelId: (id: string | null) => void;
  imageFor: (s: CampaignSubject) => string | undefined;
  onAddSubject: () => void;
  onEditSubject: (subject: CampaignSubject) => void;
  onDeleteSubject: (subject: CampaignSubject) => void;
  onCopySubject: (subject: CampaignSubject) => void;
  onAddRelationship: (fromId: string) => void;
  onEditRelationship: (rel: CampaignRelationship) => void;
  onDeleteRelationship: (rel: CampaignRelationship) => void;
  /** Label akce materializace pro subjekt, nebo null (skryté; role/typ/vazba). */
  getMaterializeLabel: (subject: CampaignSubject) => string | null;
  onMaterialize: (subject: CampaignSubject) => void;
  materializePending: boolean;
}) {
  const selectedSubject = subjects.find((x) => x.id === selSubjectId) ?? null;
  const selectedRel = relationships.find((x) => x.id === selRelId) ?? null;

  const subjectRels = useMemo(() => {
    if (!selSubjectId) return [];
    return relationships
      .filter(
        (r) => r.subjectAId === selSubjectId || r.subjectBId === selSubjectId,
      )
      .sort((a, b) => {
        const d = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        return d !== 0 ? d : b.priority - a.priority;
      });
  }, [relationships, selSubjectId]);

  return (
    <div className={s.subjektyLayout}>
      <SubjectRail
        subjects={subjects}
        selectedId={selSubjectId}
        canAdd={!readOnly}
        imageFor={imageFor}
        onSelect={(id) => {
          setSelSubjectId(id);
          setSelRelId(null);
        }}
        onAdd={onAddSubject}
      />

      <div className={s.main}>
        <div className={s.mainHead}>
          <span className={s.mainTitle}>
            {selectedSubject
              ? `Vztahy — ${selectedSubject.name}`
              : 'Vyber subjekt'}
          </span>
          {selectedSubject && !readOnly && (
            <Button size="sm" onClick={() => onAddRelationship(selectedSubject.id)}>
              + Vztah
            </Button>
          )}
        </div>
        <div className={s.mainScroll}>
          {!selectedSubject ? (
            <div className={s.empty}>Vyber subjekt vlevo</div>
          ) : subjectRels.length === 0 ? (
            <div className={s.empty}>Žádné vztahy</div>
          ) : (
            subjectRels.map((r) => (
              <RelationshipCard
                key={r.id}
                rel={r}
                selectedSubjectId={selSubjectId!}
                subjects={subjects}
                selected={selRelId === r.id}
                imageFor={imageFor}
                onClick={() => setSelRelId(r.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className={s.detailPanel}>
        {selectedRel ? (
          <RelationshipDetail
            rel={selectedRel}
            subjects={subjects}
            isPJ={isPJ}
            readOnly={readOnly}
            onEdit={() => onEditRelationship(selectedRel)}
            onDelete={() => onDeleteRelationship(selectedRel)}
          />
        ) : selectedSubject ? (
          <SubjectDetail
            subject={selectedSubject}
            readOnly={readOnly}
            imageFor={imageFor}
            onEdit={() => onEditSubject(selectedSubject)}
            onDelete={() => onDeleteSubject(selectedSubject)}
            onCopy={() => onCopySubject(selectedSubject)}
            materializeLabel={getMaterializeLabel(selectedSubject) ?? undefined}
            materializePending={materializePending}
            onMaterialize={() => onMaterialize(selectedSubject)}
          />
        ) : (
          <div className={s.empty}>Vyber subjekt nebo vztah</div>
        )}
      </div>
    </div>
  );
}
