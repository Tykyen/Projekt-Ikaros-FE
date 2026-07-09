/**
 * Spec 20B (Fáze B2) — sdílený modul generického reportu & moderace.
 * Enumy zrcadlí BE (žádný import z BE), hooky volají `/moderation/*`.
 */
export { ReportButton } from './ReportButton';
export { ReportModal } from './ReportModal';
export type { ReportTargetProps } from './ReportModal';
export {
  useCreateReport,
  useMyReports,
  useMyDecisions,
  useResolveReport,
  useSubmitAppeal,
  useReviewAppeal,
  MODERATION_KEY,
} from './useModeration';
export type {
  CreateReportInput,
  MyReportItem,
  MyDecisionItem,
  ResolveReportInput,
  ContentReportStatus,
  AppealOutcome,
  SubmitAppealInput,
  ReviewAppealInput,
  AppealListItem,
} from './types';
export { APPEAL_OUTCOME_LABELS } from './types';
export {
  REPORT_TARGET_TYPE_LABELS,
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_ORDER,
  LOW_BARRIER_CATEGORIES,
  MODERATION_ACTION_LABELS,
  MODERATION_ACTION_DESCRIPTIONS,
  MODERATION_ACTION_ORDER,
  ACCOUNT_LEVEL_ACTIONS,
  isAccountLevelAction,
} from './enums';
export type {
  ReportTargetType,
  ReportCategory,
  ModerationAction,
} from './enums';
