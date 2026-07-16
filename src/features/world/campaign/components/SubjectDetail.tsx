import { Link } from 'react-router-dom';
import { Badge, Button } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { SUBJECT_STATUS_LABELS, TYPE_LABELS } from '../labels';
import { typeCssVar } from '../campaignColors';
import type { CampaignSubject } from '../types';
import { SubjectAvatar } from './SubjectAvatar';
import s from './campaign.module.css';

/** Pravý panel — detail subjektu + akce dle režimu (edit/delete vs kopie). */
export function SubjectDetail({
  subject,
  readOnly,
  imageFor,
  onEdit,
  onDelete,
  onCopy,
  materializeLabel,
  materializePending,
  onMaterialize,
}: {
  subject: CampaignSubject;
  readOnly: boolean;
  imageFor: (s: CampaignSubject) => string | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  /** 11.5 — label akce „založit reálnou stránku"; undefined = nelze/skryté. */
  materializeLabel?: string;
  materializePending?: boolean;
  onMaterialize?: () => void;
}) {
  const { worldSlug } = useWorldContext();
  return (
    <div className={s.detail}>
      <div className={s.detailHead}>
        <SubjectAvatar subject={subject} size={48} imageUrl={imageFor(subject)} />
        <div>
          <div className={s.detailTitle}>{subject.name}</div>
          <div className={s.detailMeta}>
            <Badge style={{ color: typeCssVar(subject.type) }}>
              {TYPE_LABELS[subject.type]}
            </Badge>
            <span className={s.dim}>{SUBJECT_STATUS_LABELS[subject.status]}</span>
          </div>
        </div>
      </div>

      {subject.tags.length > 0 && (
        <div className={s.tagRow}>
          {subject.tags.map((t) => (
            <span key={t} className={s.tag}>
              {t}
            </span>
          ))}
        </div>
      )}

      {subject.notes && (
        <section className={s.section}>
          <div className={s.sectionLabel}>Poznámka</div>
          <p className={s.sectionText}>{subject.notes}</p>
        </section>
      )}

      {(subject.linkedPageSlug || subject.linkedCharacterSlug) && (
        <Link
          className={s.link}
          to={`/svet/${worldSlug}/${
            subject.linkedPageSlug || subject.linkedCharacterSlug
          }`}
        >
          → Vyvolat stránku
        </Link>
      )}

      {!readOnly && materializeLabel && onMaterialize && (
        <Button
          variant="primary"
          size="sm"
          onClick={onMaterialize}
          loading={materializePending}
        >
          ✦ {materializeLabel}
        </Button>
      )}

      <div className={s.detailActions}>
        {readOnly ? (
          <Button variant="secondary" size="sm" onClick={onCopy}>
            📋 Kopírovat do mé vrstvy
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Upravit
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              Smazat
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
