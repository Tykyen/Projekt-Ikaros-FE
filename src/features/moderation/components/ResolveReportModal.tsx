import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { Modal } from '@/shared/ui/Modal/Modal';
import { parseApiError } from '@/shared/api/client';
import {
  ACCOUNT_LEVEL_ACTIONS,
  MODERATION_ACTION_DESCRIPTIONS,
  MODERATION_ACTION_LABELS,
  MODERATION_ACTION_ORDER,
  useResolveReport,
  type ModerationAction,
} from '@/shared/moderation';
import type { ContentReportListItem } from '@/shared/types';
import s from './ContentReportRenderer.module.css';

const MAX_REASON = 2000;

interface Props {
  open: boolean;
  onClose: () => void;
  item: ContentReportListItem;
  onResolved: () => void;
}

/**
 * Spec 20B (Fáze B2) — vyřízení reportu (statement of reasons). Select akce
 * M0–M7 + odůvodnění + právní/smluvní základ → `POST /moderation/reports/
 * :id/resolve`. Account-level akce (M5–M7) vidí jen Admin/Superadmin; BE je
 * gate stejně vynutí (403 → hláška). Montuje se jen když `open`.
 */
export function ResolveReportModal({ open, onClose, item, onResolved }: Props) {
  const user = useAtomValue(currentUserAtom);
  const resolve = useResolveReport();
  const uid = useId();

  const isAdmin =
    user?.role === UserRole.Superadmin || user?.role === UserRole.Admin;
  // Ne-admin: account-level akce (M5–M7) z výběru skryjeme.
  const actionOptions: ModerationAction[] = isAdmin
    ? MODERATION_ACTION_ORDER
    : MODERATION_ACTION_ORDER.filter((a) => !ACCOUNT_LEVEL_ACTIONS.includes(a));

  const [action, setAction] = useState<ModerationAction | ''>('');
  const [reasonText, setReasonText] = useState('');
  const [ground, setGround] = useState('');

  const isValid =
    action !== '' &&
    reasonText.trim().length > 0 &&
    reasonText.trim().length <= MAX_REASON &&
    ground.trim().length > 0;

  function handleSubmit() {
    // isValid garantuje vybranou akci → TS ji přes alias zúží na ModerationAction.
    if (!isValid) return;
    resolve.mutate(
      {
        reportId: item.reportId,
        input: {
          action,
          reasonText: reasonText.trim(),
          legalOrPolicyGround: ground.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Report vyřízen a rozhodnutí zaznamenáno.');
          onResolved();
        },
        onError: (err) => toast.error(parseApiError(err)),
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Vyřídit report" size="md">
      <form
        className={s.resolveForm}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={`${uid}-action`}>
            Rozhodnutí (akce) <span className={s.req}>*</span>
          </label>
          <select
            id={`${uid}-action`}
            className={s.select}
            value={action}
            onChange={(e) => setAction(e.target.value as ModerationAction | '')}
            required
          >
            <option value="" disabled>
              Vyber akci…
            </option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {MODERATION_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
          {action !== '' && (
            <span className={s.hint}>
              {MODERATION_ACTION_DESCRIPTIONS[action]}
            </span>
          )}
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={`${uid}-reason`}>
            Odůvodnění <span className={s.req}>*</span>
          </label>
          <textarea
            id={`${uid}-reason`}
            className={s.textarea}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Zdůvodnění rozhodnutí (uvidí autor i oznamovatel)…"
            rows={4}
            maxLength={MAX_REASON}
            required
          />
          <span className={s.counter}>
            {reasonText.length} / {MAX_REASON}
          </span>
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={`${uid}-ground`}>
            Právní / smluvní základ <span className={s.req}>*</span>
          </label>
          <input
            id={`${uid}-ground`}
            className={s.input}
            type="text"
            value={ground}
            onChange={(e) => setGround(e.target.value)}
            placeholder="Např. porušení pravidel §4, DSA čl. 16…"
            required
          />
        </div>

        <div className={s.resolveActions}>
          <button
            type="button"
            className={s.btnSecondary}
            onClick={onClose}
            disabled={resolve.isPending}
          >
            Zrušit
          </button>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={!isValid || resolve.isPending}
          >
            {resolve.isPending ? 'Ukládám…' : 'Zaznamenat rozhodnutí'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
