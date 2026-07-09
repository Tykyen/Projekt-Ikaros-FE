import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { ExternalLink } from 'lucide-react';
import { Badge, Spinner } from '@/shared/ui';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import {
  useMyReports,
  useMyDecisions,
  REPORT_CATEGORY_LABELS,
  REPORT_TARGET_TYPE_LABELS,
  MODERATION_ACTION_LABELS,
  MODERATION_ACTION_DESCRIPTIONS,
  type ContentReportStatus,
  type MyDecisionItem,
} from '@/shared/moderation';
import { AppealModal } from '@/features/moderation/components/AppealModal';
import styles from './ProfileSections.module.css';
import m from './ModerationSection.module.css';

/**
 * 20B B3-FE — uživatelský pohled na moderaci ve vlastním profilu:
 *  - „Moje hlášení": co jsem nahlásil a v jakém je to stavu (pohled oznamovatele).
 *  - „Rozhodnutí o mém obsahu": moderační zásahy vůči mnou vytvořenému obsahu
 *    = statement of reasons dle DSA čl. 17 (pohled autora).
 *
 * Odvolání proti rozhodnutí (tlačítko) přijde v B4 — zatím jen nenápadná pozn.
 * Sekce se renderuje jen přihlášenému; obě query jsou `enabled` dle přihlášení.
 */

/** pending/triaged/resolved → český label + barevný odznak (theme tokeny). */
const STATUS_LABELS: Record<ContentReportStatus, string> = {
  pending: 'Čeká',
  triaged: 'V řešení',
  resolved: 'Vyřízeno',
};

const STATUS_VARIANT: Record<
  ContentReportStatus,
  'warning' | 'accent' | 'success'
> = {
  pending: 'warning',
  triaged: 'accent',
  resolved: 'success',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
}

/** targetUrl je interní cesta; otevíráme v nové kartě jako admin readout. */
function TargetLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      className={m.link}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label} <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}

export function ModerationSection() {
  const isAuthed = useAtomValue(isAuthenticatedAtom);

  const reports = useMyReports(isAuthed);
  const decisions = useMyDecisions(isAuthed);

  // Rozhodnutí, proti kterému právě otevřený modal podává odvolání (B4).
  const [appealTarget, setAppealTarget] = useState<MyDecisionItem | null>(null);

  if (!isAuthed) return null;

  return (
    <section className={styles.card} aria-label="Moderace">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Moderace</h2>
      </header>

      {/* ─── Moje hlášení ─────────────────────────────────────────────── */}
      <div className={m.block}>
        <h3 className={m.subTitle}>Moje hlášení</h3>

        {reports.isPending && (
          <div className={m.loading}>
            <Spinner /> Načítám…
          </div>
        )}

        {reports.isError && (
          <p className={styles.error}>Hlášení se nepodařilo načíst.</p>
        )}

        {reports.data && reports.data.length === 0 && (
          <p className={styles.empty}>Zatím jsi nic nenahlásil.</p>
        )}

        {reports.data && reports.data.length > 0 && (
          <ul className={m.reportList}>
            {reports.data.map((r) => (
              <li key={r.reportId} className={m.reportRow}>
                <div className={m.reportMain}>
                  <span className={m.reportCategory}>
                    {REPORT_CATEGORY_LABELS[r.category] ?? r.category}
                  </span>
                  <span className={m.reportTarget}>
                    {REPORT_TARGET_TYPE_LABELS[r.targetType] ?? r.targetType}
                    {r.targetUrl && (
                      <>
                        {' · '}
                        <TargetLink url={r.targetUrl} label="Zobrazit" />
                      </>
                    )}
                  </span>
                </div>
                <div className={m.reportSide}>
                  <Badge variant={STATUS_VARIANT[r.status]}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                  <span className={m.reportDate}>{formatDate(r.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ─── Rozhodnutí o mém obsahu ──────────────────────────────────── */}
      <div className={m.block}>
        <h3 className={m.subTitle}>Rozhodnutí o mém obsahu</h3>

        {decisions.isPending && (
          <div className={m.loading}>
            <Spinner /> Načítám…
          </div>
        )}

        {decisions.isError && (
          <p className={styles.error}>Rozhodnutí se nepodařilo načíst.</p>
        )}

        {decisions.data && decisions.data.length === 0 && (
          <p className={styles.empty}>
            Žádná rozhodnutí — vůči tvému obsahu nebyl proveden žádný moderační
            zásah.
          </p>
        )}

        {decisions.data && decisions.data.length > 0 && (
          <ul className={m.decisionList}>
            {decisions.data.map((d) => (
              <li key={d.decisionId} className={m.decisionCard}>
                <div className={m.decisionHead}>
                  <span className={m.decisionAction}>
                    {MODERATION_ACTION_LABELS[d.action] ?? d.action}
                  </span>
                  <span className={m.decisionDate}>
                    {formatDate(d.createdAt)}
                  </span>
                </div>

                {MODERATION_ACTION_DESCRIPTIONS[d.action] && (
                  <p className={m.decisionDesc}>
                    {MODERATION_ACTION_DESCRIPTIONS[d.action]}
                  </p>
                )}

                <div className={m.field}>
                  <span className={m.fieldLabel}>Odůvodnění</span>
                  <p className={m.fieldValue}>{d.reasonText}</p>
                </div>

                <div className={m.field}>
                  <span className={m.fieldLabel}>Právní / smluvní základ</span>
                  <p className={m.fieldValue}>{d.legalOrPolicyGround}</p>
                </div>

                <div className={m.decisionMeta}>
                  <span>
                    {REPORT_TARGET_TYPE_LABELS[d.targetType] ?? d.targetType}
                  </span>
                  {d.targetUrl && (
                    <>
                      <span className={m.dot}>·</span>
                      <TargetLink url={d.targetUrl} label="Zobrazit obsah" />
                    </>
                  )}
                </div>

                {d.appealId ? (
                  <p className={m.appealNote}>
                    Odvolání podáno, čeká na přezkum.
                  </p>
                ) : d.action !== 'M0_none' ? (
                  <div className={m.appealRow}>
                    <button
                      type="button"
                      className={m.appealBtn}
                      onClick={() => setAppealTarget(d)}
                    >
                      Odvolat se
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {appealTarget && (
        <AppealModal
          open
          onClose={() => setAppealTarget(null)}
          decisionId={appealTarget.decisionId}
          actionLabel={
            MODERATION_ACTION_LABELS[appealTarget.action] ?? appealTarget.action
          }
          onSubmitted={() => setAppealTarget(null)}
        />
      )}
    </section>
  );
}
