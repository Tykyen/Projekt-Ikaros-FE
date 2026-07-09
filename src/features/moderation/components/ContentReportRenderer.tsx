import { useState } from 'react';
import { Flag, ExternalLink } from 'lucide-react';
import {
  REPORT_CATEGORY_LABELS,
  REPORT_TARGET_TYPE_LABELS,
  type ReportCategory,
  type ReportTargetType,
} from '@/shared/moderation';
import type { ContentReportListItem } from '@/shared/types';
import { ResolveReportModal } from './ResolveReportModal';
import s from './ContentReportRenderer.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

/** Naivní strip HTML — snapshot může být RTE HTML, pro náhled stačí text. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function targetLabel(t: string): string {
  return REPORT_TARGET_TYPE_LABELS[t as ReportTargetType] ?? t;
}

function categoryLabel(c: string): string {
  return REPORT_CATEGORY_LABELS[c as ReportCategory] ?? c;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('cs-CZ');
}

// ─── Left slot — ikona vlajky ───────────────────────────────────────────

export function ContentReportLeft() {
  return (
    <div className={s.left}>
      <Flag size={28} aria-hidden />
      <span className={s.leftLabel}>Report</span>
    </div>
  );
}

// ─── Mid slot — typ cíle, snapshot, autor, kategorie, důvod, oznamovatel ─

export function ContentReportMid({ item }: { item: ContentReportListItem }) {
  return (
    <div className={s.mid}>
      <span className={s.title}>
        {targetLabel(item.targetType)}
        <span className={s.categoryChip}>{categoryLabel(item.category)}</span>
      </span>
      <p className={s.snapshot}>{stripHtml(item.targetSnapshot)}</p>
      <p className={s.reason}>
        <span className={s.reasonLabel}>Důvod: </span>
        {item.reason}
      </p>
      <div className={s.meta}>
        <span>autor: {item.targetAuthorName}</span>
        <span className={s.dot}>·</span>
        <span>nahlásil: {item.reporterName ?? 'anonymní'}</span>
        <span className={s.dot}>·</span>
        <span>{formatDate(item.createdAt)}</span>
        {item.targetUrl && (
          <>
            <span className={s.dot}>·</span>
            <a
              className={s.link}
              href={item.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Otevřít <ExternalLink size={11} aria-hidden />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Actions slot — otevře resolve formulář (modal) ─────────────────────

export function ContentReportActions({
  item,
  helpers,
}: {
  item: ContentReportListItem;
  helpers: ActionsHelpers;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={s.btnResolve}
        onClick={() => setOpen(true)}
        disabled={helpers.isLoading}
      >
        Vyřídit
      </button>
      {open && (
        <ResolveReportModal
          open
          onClose={() => setOpen(false)}
          item={item}
          onResolved={() => {
            setOpen(false);
            helpers.onResolve();
          }}
        />
      )}
    </>
  );
}
