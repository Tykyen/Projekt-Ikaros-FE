import { Badge, Button } from '@/shared/ui';
import { SUBJECT_STATUS_LABELS, TYPE_LABELS } from '../labels';
import { typeCssVar } from '../campaignColors';
import type { CampaignSubject } from '../types';
import { SubjectAvatar } from './SubjectAvatar';
import s from './campaign.module.css';

/** Pravý panel — detail subjektu + akce dle režimu (edit/delete vs kopie). */
export function SubjectDetail({
  subject,
  readOnly,
  onEdit,
  onDelete,
  onCopy,
}: {
  subject: CampaignSubject;
  readOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  return (
    <div className={s.detail}>
      <div className={s.detailHead}>
        <SubjectAvatar subject={subject} size={48} />
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

      {subject.linkedPageSlug && (
        <a className={s.link} href={`/${subject.linkedPageSlug}`}>
          → Wiki stránka
        </a>
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
