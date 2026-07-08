/**
 * 19.1 — zrcadlo BE `GrowthStats`
 * (`backend/src/modules/admin/dto/growth-stats.dto.ts`).
 * Onboarding funnel + retenční ukazatele pro admin Přehled.
 * Vše odvozené z DB timestampů — žádný nový tracking (spec 19.1).
 */

/** Milníky trychtýře v pořadí registrace → hraje. */
export type FunnelStepKey =
  | 'registered'
  | 'joinedWorld'
  | 'character'
  | 'action'
  | 'dice';

export interface GrowthFunnelStep {
  key: FunnelStepKey;
  /** distinct uživatelé, kteří milníku dosáhli (all-time). */
  total: number;
  /** z nich registrovaní v okně `days` (kohorta nováčků). */
  recent: number;
}

export interface GrowthCohort {
  /** měsíc registrace `YYYY-MM`. */
  month: string;
  registered: number;
  /** z kohorty aktivních k dnešku (lastSeenAt ≤ 30 d). */
  active: number;
}

export interface GrowthStats {
  range: { days: number; generatedAt: string };
  funnel: {
    steps: GrowthFunnelStep[];
  };
  retention: {
    /** 0..1 — vrátili se aspoň jednou po registraci (> 24 h). */
    activationRate: number;
    /** 0..1 — WAU/MAU (lepkavost). */
    stickiness: number;
    /** aktivní za 7 dní. */
    wau: number;
    /** aktivní za 30 dní. */
    mau: number;
    /** survival kohorty, posl. ~6 měsíců. */
    cohorts: GrowthCohort[];
  };
  acquisition: {
    /** anonymní návštěvníci z 15B.7 analytiky (období `days`). */
    visitors: number;
    /** registrace v okně `days`. */
    signups: number;
    /** signups/visitors; null když visitors = 0. */
    signupRate: number | null;
  };
}

export type GrowthDays = 7 | 30 | 90;
