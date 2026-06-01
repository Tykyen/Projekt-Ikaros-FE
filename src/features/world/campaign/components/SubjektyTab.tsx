import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, ConfirmDialog } from '@/shared/ui';
import {
  useCreateRelationship,
  useCreateSubject,
  useDeleteRelationship,
  useDeleteSubject,
  useUpdateRelationship,
  useUpdateSubject,
} from '../api';
import { parseApiError } from '@/shared/api/client';
import { useSubjectImages } from '../useSubjectImages';
import type {
  CampaignRelationship,
  CampaignSubject,
  CreateRelationshipInput,
  CreateSubjectInput,
} from '../types';
import { SubjectRail } from './SubjectRail';
import { SubjectForm } from './SubjectForm';
import { SubjectDetail } from './SubjectDetail';
import { RelationshipCard } from './RelationshipCard';
import { RelationshipForm } from './RelationshipForm';
import { RelationshipDetail } from './RelationshipDetail';
import s from './campaign.module.css';

const STATUS_ORDER: Record<string, number> = {
  crisis: 0,
  active: 1,
  dormant: 2,
  closed: 3,
};

export function SubjektyTab({
  worldId,
  subjects,
  relationships,
  readOnly,
  isPJ,
  selSubjectId,
  setSelSubjectId,
  selRelId,
  setSelRelId,
  onSwitchToMine,
}: {
  worldId: string;
  subjects: CampaignSubject[];
  relationships: CampaignRelationship[];
  readOnly: boolean;
  isPJ: boolean;
  selSubjectId: string | null;
  setSelSubjectId: (id: string | null) => void;
  selRelId: string | null;
  setSelRelId: (id: string | null) => void;
  onSwitchToMine: () => void;
}) {
  const imageFor = useSubjectImages(worldId);
  const createSubject = useCreateSubject(worldId);
  const updateSubject = useUpdateSubject(worldId);
  const deleteSubject = useDeleteSubject(worldId);
  const createRel = useCreateRelationship(worldId);
  const updateRel = useUpdateRelationship(worldId);
  const deleteRel = useDeleteRelationship(worldId);

  const [subjectForm, setSubjectForm] = useState<{
    open: boolean;
    editing?: CampaignSubject;
  }>({ open: false });
  const [relForm, setRelForm] = useState<{
    open: boolean;
    editing?: CampaignRelationship;
  }>({ open: false });
  const [delSubject, setDelSubject] = useState<CampaignSubject | null>(null);
  const [delRel, setDelRel] = useState<CampaignRelationship | null>(null);

  const selectedSubject = subjects.find((x) => x.id === selSubjectId) ?? null;
  const selectedRel = relationships.find((x) => x.id === selRelId) ?? null;

  const subjectRels = useMemo(() => {
    if (!selSubjectId) return [];
    return relationships
      .filter(
        (r) =>
          r.subjectAId === selSubjectId || r.subjectBId === selSubjectId,
      )
      .sort((a, b) => {
        const d = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        return d !== 0 ? d : b.priority - a.priority;
      });
  }, [relationships, selSubjectId]);

  function onError(e: unknown) {
    toast.error(parseApiError(e));
  }

  function submitSubject(input: CreateSubjectInput) {
    const editing = subjectForm.editing;
    if (editing) {
      updateSubject.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success('Subjekt upraven');
            setSubjectForm({ open: false });
          },
          onError,
        },
      );
    } else {
      createSubject.mutate(input, {
        onSuccess: (created) => {
          toast.success('Subjekt vytvořen');
          setSubjectForm({ open: false });
          setSelSubjectId(created.id);
        },
        onError,
      });
    }
  }

  function submitRel(input: CreateRelationshipInput) {
    const editing = relForm.editing;
    if (editing) {
      updateRel.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success('Vztah upraven');
            setRelForm({ open: false });
          },
          onError,
        },
      );
    } else {
      createRel.mutate(input, {
        onSuccess: (created) => {
          toast.success('Vztah vytvořen');
          setRelForm({ open: false });
          setSelRelId(created.id);
        },
        onError,
      });
    }
  }

  function copySubject(subject: CampaignSubject) {
    createSubject.mutate(
      {
        name: `${subject.name} (kopie)`,
        type: subject.type,
        status: subject.status,
        tags: subject.tags,
        linkedPageSlug: subject.linkedPageSlug,
        linkedCharacterSlug: subject.linkedCharacterSlug,
        notes: subject.notes,
      },
      {
        onSuccess: () => {
          toast.success('Zkopírováno do tvé vrstvy');
          onSwitchToMine();
        },
        onError,
      },
    );
  }

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
        onAdd={() => setSubjectForm({ open: true })}
      />

      <div className={s.main}>
        <div className={s.mainHead}>
          <span className={s.mainTitle}>
            {selectedSubject
              ? `Vztahy — ${selectedSubject.name}`
              : 'Vyber subjekt'}
          </span>
          {selectedSubject && !readOnly && (
            <Button
              size="sm"
              onClick={() =>
                setRelForm({ open: true })
              }
            >
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
            onEdit={() => setRelForm({ open: true, editing: selectedRel })}
            onDelete={() => setDelRel(selectedRel)}
          />
        ) : selectedSubject ? (
          <SubjectDetail
            subject={selectedSubject}
            readOnly={readOnly}
            imageFor={imageFor}
            onEdit={() =>
              setSubjectForm({ open: true, editing: selectedSubject })
            }
            onDelete={() => setDelSubject(selectedSubject)}
            onCopy={() => copySubject(selectedSubject)}
          />
        ) : (
          <div className={s.empty}>Vyber subjekt nebo vztah</div>
        )}
      </div>

      <SubjectForm
        key={`subj-${subjectForm.open ? subjectForm.editing?.id ?? 'new' : 'closed'}`}
        open={subjectForm.open}
        worldId={worldId}
        initial={subjectForm.editing}
        isPending={createSubject.isPending || updateSubject.isPending}
        onClose={() => setSubjectForm({ open: false })}
        onSubmit={submitSubject}
      />
      {selectedSubject && (
        <RelationshipForm
          key={`rel-${relForm.open ? relForm.editing?.id ?? 'new' : 'closed'}`}
          open={relForm.open}
          subjects={subjects}
          subjectAId={relForm.editing?.subjectAId ?? selectedSubject.id}
          initial={relForm.editing}
          isPJ={isPJ}
          isPending={createRel.isPending || updateRel.isPending}
          onClose={() => setRelForm({ open: false })}
          onSubmit={submitRel}
        />
      )}

      <ConfirmDialog
        open={!!delSubject}
        onClose={() => setDelSubject(null)}
        title="Smazat subjekt"
        message={`Opravdu smazat „${delSubject?.name}" a všechny jeho vztahy?`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteSubject.isPending}
        onConfirm={() => {
          if (!delSubject) return;
          deleteSubject.mutate(delSubject.id, {
            onSuccess: () => {
              toast.success('Subjekt smazán');
              if (selSubjectId === delSubject.id) setSelSubjectId(null);
              setSelRelId(null);
              setDelSubject(null);
            },
            onError,
          });
        }}
      />
      <ConfirmDialog
        open={!!delRel}
        onClose={() => setDelRel(null)}
        title="Smazat vztah"
        message="Opravdu smazat tento vztah?"
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteRel.isPending}
        onConfirm={() => {
          if (!delRel) return;
          deleteRel.mutate(delRel.id, {
            onSuccess: () => {
              toast.success('Vztah smazán');
              if (selRelId === delRel.id) setSelRelId(null);
              setDelRel(null);
            },
            onError,
          });
        }}
      />
    </div>
  );
}
