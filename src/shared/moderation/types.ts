/**
 * Spec 20B (Fáze B2) — FE typy modulu `moderation`. Zrcadlí BE DTO/kontrakt
 * (`create-report.dto.ts`, `resolve-report.dto.ts`, `moderation-entities`).
 * `reporterId`/`reporterName` si BE bere z tokenu — FE je NIKDY neposílá.
 */
import type {
  ModerationAction,
  ReportCategory,
  ReportTargetType,
} from './enums';

export type ContentReportStatus = 'pending' | 'triaged' | 'resolved';

/** Body pro `POST /moderation/reports`. */
export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  targetUrl?: string;
  worldId?: string;
  /** Krátký denormalizovaný výřez obsahu (BE max 5000). */
  targetSnapshot: string;
  targetAuthorName: string;
  targetAuthorId?: string;
  category: ReportCategory;
  /** Volný text důvodu (BE max 2000). */
  reason: string;
  reporterEmail?: string;
  /** Prohlášení dobré víry (povinné true). */
  goodFaith: boolean;
  evidence?: string;
  /** Informovat oznamovatele o výsledku. */
  notifyMe: boolean;
  /** Skrýt identitu oznamovatele moderátorovi. */
  anonymous: boolean;
}

/** Položka „moje hlášení" — `GET /moderation/reports/mine`. */
export interface MyReportItem {
  reportId: string;
  targetType: ReportTargetType;
  targetUrl?: string;
  category: ReportCategory;
  status: ContentReportStatus;
  createdAt: string;
}

/** Body pro `POST /moderation/reports/:id/resolve`. */
export interface ResolveReportInput {
  action: ModerationAction;
  reasonText: string;
  legalOrPolicyGround: string;
}

/**
 * Položka „rozhodnutí o mém obsahu" — `GET /moderation/decisions/mine`.
 * Odůvodnění rozhodnutí (statement of reasons, DSA čl. 17) směrem k autorovi
 * postiženého obsahu. `appealId` je vyplněné až po podání odvolání (B4).
 */
export interface MyDecisionItem {
  decisionId: string;
  action: ModerationAction;
  reasonText: string;
  legalOrPolicyGround: string;
  category: ReportCategory;
  targetType: ReportTargetType;
  targetUrl?: string;
  createdAt: string;
  appealId?: string;
}

// ─── Odvolání proti rozhodnutí (B4, DSA čl. 20) ───────────────────────────

/** Výsledek přezkumu odvolání (`POST /moderation/appeals/:id/review`). */
export type AppealOutcome = 'upheld' | 'overturned';

export const APPEAL_OUTCOME_LABELS: Record<AppealOutcome, string> = {
  upheld: 'Potvrdit rozhodnutí',
  overturned: 'Zrušit rozhodnutí',
};

/** Body pro `POST /moderation/decisions/:id/appeal`. */
export interface SubmitAppealInput {
  /** Důvod odvolání (BE max 2000). */
  reason: string;
}

/** Body pro `POST /moderation/appeals/:id/review`. */
export interface ReviewAppealInput {
  outcome: AppealOutcome;
  /** Poznámka přezkoumávajícího moderátora (BE max 2000). */
  reviewerNote: string;
}

/**
 * Položka fronty odvolání — `GET /pending-actions?type=moderation_appeal`.
 * Doménově (enum) typovaná varianta; generická infra Zpracovat tabu pracuje
 * se string-typovaným `AppealReviewListItem` z `@/shared/types` (stejný vzor
 * jako `ContentReportListItem`).
 */
export interface AppealListItem {
  appealId: string;
  decisionId: string;
  appellantName: string;
  /** Důvod, který uvedl odvolatel. */
  reason: string;
  /** Původní moderační akce, proti níž odvolání směřuje. */
  action: ModerationAction;
  /** Typ cíle původního rozhodnutí. */
  targetType: ReportTargetType;
  createdAt: string;
}
