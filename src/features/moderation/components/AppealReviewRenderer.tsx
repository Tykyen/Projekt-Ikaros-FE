import { useState } from 'react';
import { Gavel } from 'lucide-react';
import {
  MODERATION_ACTION_LABELS,
  REPORT_TARGET_TYPE_LABELS,
  type ModerationAction,
  type ReportTargetType,
} from '@/shared/moderation';
import type { AppealReviewListItem } from '@/shared/types';
import { AppealReviewModal } from './AppealReviewModal';
import s from './Appeal.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

function actionLabel(a: string): string {
  return MODERATION_ACTION_LABELS[a as ModerationAction] ?? a;
}

function targetLabel(t: string): string {
  return REPORT_TARGET_TYPE_LABELS[t as ReportTargetType] ?? t;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('cs-CZ');
}

// ─── Left slot — ikona přezkumu ─────────────────────────────────────────

export function AppealReviewLeft() {
  return (
    <div className={s.left}>
      <Gavel size={28} aria-hidden />
      <span className={s.leftLabel}>Odvolání</span>
    </div>
  );
}

// ─── Mid slot — odvolatel, důvod, původní akce, typ cíle ────────────────

export function AppealReviewMid({ item }: { item: AppealReviewListItem }) {
  return (
    <div className={s.mid}>
      <span className={s.title}>
        {item.appellantName}
        <span className={s.actionChip}>{actionLabel(item.action)}</span>
      </span>
      <p className={s.reasonBlock}>
        <span className={s.reasonLabel}>Důvod odvolání: </span>
        {item.reason}
      </p>
      <div className={s.meta}>
        <span>cíl: {targetLabel(item.targetType)}</span>
        <span className={s.dot}>·</span>
        <span>{formatDate(item.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── Actions slot — otevře review formulář (modal) ──────────────────────

export function AppealReviewActions({
  item,
  helpers,
}: {
  item: AppealReviewListItem;
  helpers: ActionsHelpers;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={s.btnReview}
        onClick={() => setOpen(true)}
        disabled={helpers.isLoading}
      >
        Přezkoumat
      </button>
      {open && (
        <AppealReviewModal
          open
          onClose={() => setOpen(false)}
          item={item}
          onReviewed={() => {
            setOpen(false);
            helpers.onResolve();
          }}
        />
      )}
    </>
  );
}
