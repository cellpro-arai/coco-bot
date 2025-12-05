/**
 * @fileoverview ステータス管理に関するユーティリティ関数
 */
import { INCIDENT_STATUS } from '../types/constants';

/**
 * 使用可能なステータス一覧を取得
 */
export const getAllStatuses = () => [
  INCIDENT_STATUS.REPORTED,
  INCIDENT_STATUS.REVIEW_REQUESTED,
  INCIDENT_STATUS.REJECTED,
  INCIDENT_STATUS.IN_PROGRESS,
  INCIDENT_STATUS.CLOSED,
];

/**
 * ステータスが非活性かどうかを判定
 * @param status 対象のステータス
 * @param selectedIncident 選択中のインシデント（新規起票時はnull）
 * @param isAdmin 管理者フラグ
 * @returns true の場合、そのステータスは非活性（選択不可）
 */
export const isStatusDisabled = (
  status: string,
  selectedIncident: { registeredDate?: string } | null,
  isAdmin: boolean
): boolean => {
  if (!selectedIncident) {
    // 新規起票時は「起票」のみ有効
    return status !== INCIDENT_STATUS.REPORTED;
  }

  // 更新時は「起票」を非活性
  if (status === INCIDENT_STATUS.REPORTED) {
    return true;
  }

  if (isAdmin) {
    // 管理者は全て有効（起票以外）
    return false;
  } else {
    // ユーザーロールは「確認依頼」のみ有効
    return status !== INCIDENT_STATUS.REVIEW_REQUESTED;
  }
};

/**
 * ステータス変更が可能かどうかを判定
 * @param currentStatus 現在のステータス
 * @param newStatus 変更先のステータス
 * @param isAdmin 管理者フラグ
 * @returns true の場合、変更可能
 */
export const canChangeStatus = (
  currentStatus: string,
  newStatus: string,
  isAdmin: boolean
): boolean => {
  // 同じステータスには変更不可
  if (currentStatus === newStatus) {
    return false;
  }

  // 「起票」への変更は不可
  if (newStatus === INCIDENT_STATUS.REPORTED) {
    return false;
  }

  if (isAdmin) {
    // 管理者は全て変更可能（起票以外）
    return true;
  } else {
    // ユーザーロールは「確認依頼」へのみ変更可能
    return newStatus === INCIDENT_STATUS.REVIEW_REQUESTED;
  }
};
