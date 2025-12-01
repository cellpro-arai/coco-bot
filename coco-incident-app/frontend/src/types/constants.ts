/**
 * AI解析ステータスの定数
 */
export const AI_ANALYSIS_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  NONE: 'none',
} as const;

export type AiAnalysisStatus =
  (typeof AI_ANALYSIS_STATUS)[keyof typeof AI_ANALYSIS_STATUS];
