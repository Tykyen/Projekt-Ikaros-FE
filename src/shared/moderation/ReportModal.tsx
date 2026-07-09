import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { Modal } from '@/shared/ui/Modal/Modal';
import { parseApiError } from '@/shared/api/client';
import {
  LOW_BARRIER_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_ORDER,
  type ReportCategory,
  type ReportTargetType,
} from './enums';
import { useCreateReport } from './useModeration';
import s from './ReportModal.module.css';

const MAX_REASON = 2000;
const GOOD_FAITH_TEXT =
  'Prohlašuji, že informace jsou podle mého nejlepšího vědomí pravdivé.';
// BE používá @IsEmail — jednoduchá klientská validace stačí (BE má finální slovo).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ReportTargetProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Aktuální cesta cíle; když chybí, doplní se z `window.location`. */
  targetUrl?: string;
  worldId?: string;
  /** Krátký výřez textu / název reportovaného obsahu. */
  targetSnapshot: string;
  targetAuthorName: string;
  targetAuthorId?: string;
}

interface Props extends ReportTargetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Spec 20B (Fáze B2) — formulář nahlášení obsahu. Kategorie + důvod povinné,
 * e-mail předvyplněný (povinný kromě `minor_safety`), prohlášení dobré víry
 * povinné, volby „informovat mě" a „anonymně". A11y (focus trap, Escape,
 * role=dialog) řeší sdílený `Modal`. Komponenta se montuje jen když `open`
 * (viz `ReportButton`), takže stav startuje čistý při každém otevření.
 */
export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetUrl,
  worldId,
  targetSnapshot,
  targetAuthorName,
  targetAuthorId,
}: Props) {
  const user = useAtomValue(currentUserAtom);
  const create = useCreateReport();
  const uid = useId();

  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [goodFaith, setGoodFaith] = useState(false);
  const [notifyMe, setNotifyMe] = useState(true);
  const [anonymous, setAnonymous] = useState(false);

  const emailOptional =
    category !== '' && LOW_BARRIER_CATEGORIES.includes(category);
  const trimmedReason = reason.trim();
  const trimmedEmail = email.trim();
  const emailValid =
    trimmedEmail === '' ? emailOptional : EMAIL_RE.test(trimmedEmail);
  const isValid =
    category !== '' &&
    trimmedReason.length > 0 &&
    trimmedReason.length <= MAX_REASON &&
    emailValid &&
    goodFaith;

  function handleSubmit() {
    // isValid garantuje neprázdnou kategorii → TS ji přes alias zúží na ReportCategory.
    if (!isValid) return;
    create.mutate(
      {
        targetType,
        targetId,
        targetUrl: targetUrl ?? window.location.pathname + window.location.search,
        worldId,
        targetSnapshot,
        targetAuthorName,
        targetAuthorId,
        category,
        reason: trimmedReason,
        reporterEmail: trimmedEmail === '' ? undefined : trimmedEmail,
        goodFaith,
        notifyMe,
        anonymous,
      },
      {
        onSuccess: () => {
          toast.success('Hlášení bylo odesláno moderátorům. Děkujeme.');
          onClose();
        },
        onError: (err) => toast.error(parseApiError(err)),
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Nahlásit obsah" size="md">
      <p className={s.help}>
        Nahlašuješ: <strong className={s.target}>{targetAuthorName}</strong>
        {targetSnapshot ? (
          <span className={s.snapshot}> — „{truncate(targetSnapshot, 120)}"</span>
        ) : null}
      </p>

      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className={s.field}>
          <label className={s.label} htmlFor={`${uid}-cat`}>
            Kategorie <span className={s.req}>*</span>
          </label>
          <select
            id={`${uid}-cat`}
            className={s.select}
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory | '')}
            required
          >
            <option value="" disabled>
              Vyber kategorii…
            </option>
            {REPORT_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {REPORT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor={`${uid}-reason`}>
            Důvod <span className={s.req}>*</span>
          </label>
          <textarea
            id={`${uid}-reason`}
            className={s.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Popiš, co je s obsahem v nepořádku…"
            rows={5}
            maxLength={MAX_REASON}
            required
          />
          <span className={s.counter}>
            {reason.length} / {MAX_REASON}
          </span>
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor={`${uid}-email`}>
            E-mail{' '}
            {emailOptional && <span className={s.optional}>(nepovinné)</span>}
          </label>
          <input
            id={`${uid}-email`}
            className={s.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tvuj@email.cz"
          />
          {!emailValid && trimmedEmail !== '' && (
            <span className={s.error}>Zadej platný e-mail.</span>
          )}
        </div>

        <label className={s.check} htmlFor={`${uid}-gf`}>
          <input
            id={`${uid}-gf`}
            type="checkbox"
            checked={goodFaith}
            onChange={(e) => setGoodFaith(e.target.checked)}
          />
          <span>
            {GOOD_FAITH_TEXT} <span className={s.req}>*</span>
          </span>
        </label>

        <label className={s.check} htmlFor={`${uid}-notify`}>
          <input
            id={`${uid}-notify`}
            type="checkbox"
            checked={notifyMe}
            onChange={(e) => setNotifyMe(e.target.checked)}
          />
          <span>Informovat mě o výsledku</span>
        </label>

        <label className={s.check} htmlFor={`${uid}-anon`}>
          <input
            id={`${uid}-anon`}
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <span>Nahlásit anonymně — moje jméno se moderátorovi nezobrazí</span>
        </label>

        <div className={s.actions}>
          <button
            type="button"
            className={s.btnSecondary}
            onClick={onClose}
            disabled={create.isPending}
          >
            Zrušit
          </button>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={!isValid || create.isPending}
          >
            {create.isPending ? 'Odesílám…' : 'Odeslat hlášení'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
