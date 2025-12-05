/**
 * インシデントステータスの定数
 */
export const INCIDENT_STATUS = {
  REPORTED: '起票',
  REVIEW_REQUESTED: '確認依頼',
  REJECTED: '差し戻し',
  IN_PROGRESS: '対応中',
  CLOSED: 'クローズ',
} as const;

export type IncidentStatus =
  (typeof INCIDENT_STATUS)[keyof typeof INCIDENT_STATUS];
