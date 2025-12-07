import { ExpenseData } from '../types/type';
import {
  formatCommuterRoute,
  formatOfficeFrequency,
  setFileHyperlink,
  appendRowWithHeaderPositions,
} from '../utils';
import {
  getHeaderColumnPositions,
  getOrCreateExpenseManagementSheet,
  getOrCreateMonthlyManagementSpreadsheet,
  backupExistingRow,
} from './expenseManagementSheetFormat';
import { getActiveEmployees } from './employeeManagement';
import { backupUserDriveData } from '../drive';

const APPROVED_ERROR_MESSAGE =
  '承認済みの申請は更新できません。管理者に連絡してください。';

interface SaveManagementOptions {
  submissionStartedAt?: Date;
  skipFileBackup?: boolean;
}

/**
 * 既存提出分のファイルをアップロード前にバックアップする
 *
 * 管理シートで対象ユーザーのステータスを確認し、未提出以外の場合は
 * Drive 上の勤務表/経費精算フォルダをバックアップフォルダへ移動します。
 * 承認済みステータスの場合はエラーを送出します。
 *
 * @param {string} userEmail - 提出者のメールアドレス
 * @param {Date} submissionMonth - 提出月
 * @param {Date} [submissionStartedAt] - 提出処理開始日時
 * @returns {boolean} ファイルバックアップを実行した場合は true
 */
export function backupExistingSubmissionFiles(
  userEmail: string,
  submissionMonth: Date,
  submissionStartedAt?: Date
): boolean {
  const { spreadsheet: managementSS } =
    getOrCreateMonthlyManagementSpreadsheet(submissionMonth);
  const expenseSheet = getOrCreateExpenseManagementSheet(managementSS);
  const headerPositions = getHeaderColumnPositions(expenseSheet);
  const targetRow = findRowByEmail(expenseSheet, headerPositions, userEmail);

  if (targetRow <= 0) {
    return false;
  }

  const statusColumn = headerPositions.get('提出ステータス');
  const oldStatus = statusColumn
    ? String(expenseSheet.getRange(targetRow, statusColumn).getValue() || '')
    : '';

  if (oldStatus === '承認済み') {
    throw new Error(APPROVED_ERROR_MESSAGE);
  }

  if (!oldStatus || oldStatus === '未提出') {
    return false;
  }

  backupUserDriveData(userEmail, submissionMonth, submissionStartedAt);
  return true;
}

/**
 * 月別マネジメントシートに経費精算情報を登録する
 *
 * rootFolder/{yyyy}/{mm}/管理シート の階層で自動生成された月別スプレッドシートに、
 * 勤務表、経費精算書フォルダへのリンクを含む経費データを保存します。
 * メールアドレスをキーとして既存行を検索し、見つかった場合は上書き更新、
 * 見つからない場合は新規行を追加します。
 * 提出がない項目には「提出なし」と記録され、ハイパーリンクは設定されません。
 *
 * @param {ExpenseData} expenseData - 経費精算の基本データ（氏名、提出月、勤務時間など）
 * @param {string} userEmail - 提出者のメールアドレス
 * @param {Date} submissionMonth - 提出月（expenseData.submissionMonthから変換、月別フォルダの判定に使用）
 * @param {string} workScheduleFolderUrl - 勤務表フォルダのURL
 * @param {string} expenseReportFolderUrl - 経費精算書フォルダのURL
 * @param {SaveManagementOptions} [options] - バックアップ制御用オプション
 * @returns {void}
 */
export function saveToManagementSS(
  expenseData: ExpenseData,
  userEmail: string,
  submissionMonth: Date,
  workScheduleFolderUrl: string,
  expenseReportFolderUrl: string,
  options?: SaveManagementOptions
): void {
  // 無効従業員チェック：有効な従業員のみ更新を許可
  const activeEmployees = getActiveEmployees();
  const activeEmailSet = new Set(activeEmployees.map(emp => emp.email));
  if (!activeEmailSet.has(userEmail)) {
    Logger.log(`無効な従業員 ${userEmail} からの提出をスキップします。`);
    return;
  }

  // 提出月に基づいて月別管理スプレッドシートを取得または作成
  const { spreadsheet: managementSS } =
    getOrCreateMonthlyManagementSpreadsheet(submissionMonth);
  const expenseSheet = getOrCreateExpenseManagementSheet(managementSS);

  const commuterRoute = formatCommuterRoute(
    expenseData.nearestStation,
    expenseData.workStation
  );

  // 提出がない場合のチェック
  const hasWorkSchedule = !!workScheduleFolderUrl;
  const hasExpenseData = !!expenseReportFolderUrl;

  // ヘッダー位置を検出
  const headerPositions = getHeaderColumnPositions(expenseSheet);

  // データマップを作成
  const dataMap = buildManagementDataMap(
    expenseData,
    userEmail,
    hasWorkSchedule,
    hasExpenseData,
    commuterRoute
  );

  // メールアドレス列で既存行を検索
  const targetRow = findRowByEmail(expenseSheet, headerPositions, userEmail);

  let lastRow: number;
  let newStatus: string;

  if (targetRow > 0) {
    // 既存行を更新
    Logger.log(
      `メールアドレス ${userEmail} の既存行（${targetRow}行目）を更新します。`
    );

    // 既存の提出ステータスを取得
    const statusColumn = headerPositions.get('提出ステータス');
    const oldStatus = statusColumn
      ? String(expenseSheet.getRange(targetRow, statusColumn).getValue() || '')
      : '';

    // 承認済みの場合は更新禁止
    if (oldStatus === '承認済み') {
      throw new Error(APPROVED_ERROR_MESSAGE);
    }

    // バックアップ処理（未提出以外の場合）
    if (oldStatus && oldStatus !== '未提出') {
      if (!options?.skipFileBackup) {
        backupUserDriveData(
          userEmail,
          submissionMonth,
          options?.submissionStartedAt
        );
      }
      backupExistingRow(
        managementSS,
        expenseSheet,
        targetRow,
        userEmail,
        oldStatus
      );
    }

    // データを更新
    updateRowWithHeaderPositions(
      expenseSheet,
      headerPositions,
      dataMap,
      targetRow
    );

    // ステータス遷移ロジック
    if (oldStatus === '差戻し') {
      newStatus = '再提出済み';
    } else {
      newStatus = '提出済み';
    }

    lastRow = targetRow;
  } else {
    // 新規行を追加
    Logger.log(`メールアドレス ${userEmail} の新規行を追加します。`);
    lastRow = appendRowWithHeaderPositions(
      expenseSheet,
      headerPositions,
      dataMap
    );
    newStatus = '提出済み';
  }

  // 提出ステータスを更新
  const statusColumn = headerPositions.get('提出ステータス');
  if (statusColumn) {
    expenseSheet.getRange(lastRow, statusColumn).setValue(newStatus);
    Logger.log(`提出ステータスを「${newStatus}」に更新しました。`);
  }

  // 勤務表列にフォルダリンクを設定（提出がある場合のみ）
  if (hasWorkSchedule) {
    const column = headerPositions.get('勤務表');
    if (column) {
      setFileHyperlink(
        expenseSheet,
        lastRow,
        column,
        '勤務表フォルダ',
        workScheduleFolderUrl
      );
    }
  }

  // 経費精算書列にフォルダリンクを設定（データがある場合のみ）
  if (hasExpenseData) {
    const column = headerPositions.get('経費精算書');
    if (column) {
      setFileHyperlink(
        expenseSheet,
        lastRow,
        column,
        '経費精算書フォルダ',
        expenseReportFolderUrl
      );
    }
  }
}

/**
 * 管理シートに登録するデータマップを構築する
 *
 * 経費精算データをヘッダー名をキーとするMapに変換します。
 * 提出の有無に応じて、対応する列に「提出なし」または実際の値を設定します。
 *
 * @param {ExpenseData} expenseData - 経費精算の基本データ
 * @param {string} userEmail - 提出者のメールアドレス
 * @param {boolean} hasWorkSchedule - 勤務表の提出があるかどうか
 * @param {boolean} hasExpenseData - 経費データ（交通費または経費）の提出があるかどうか
 * @param {string} commuterRoute - 定期券の区間（フォーマット済み）
 * @returns {Map<string, string | number | Date>} ヘッダー名をキーとするデータマップ
 */
function buildManagementDataMap(
  expenseData: ExpenseData,
  userEmail: string,
  hasWorkSchedule: boolean,
  hasExpenseData: boolean,
  commuterRoute: string
): Map<string, string | number | Date> {
  const dataMap = new Map<string, string | number | Date>();
  dataMap.set('提出日時', new Date());
  dataMap.set('メールアドレス', userEmail);
  dataMap.set('氏名', expenseData.name);
  dataMap.set('提出月', expenseData.submissionMonth);
  dataMap.set('勤務表', hasWorkSchedule ? '勤務表' : '提出なし');
  dataMap.set('経費精算書', hasExpenseData ? '経費精算書' : '提出なし');
  dataMap.set('開始時間', expenseData.workStartTime);
  dataMap.set('終了時間', expenseData.workEndTime);
  dataMap.set('出社頻度', formatOfficeFrequency(expenseData.officeFrequency));
  dataMap.set(
    '定期券購入',
    expenseData.hasCommuterPass === 'yes' ? '有り' : '無し'
  );
  dataMap.set('定期区間', commuterRoute);
  dataMap.set('定期券金額', expenseData.monthlyFee);
  dataMap.set('備考', expenseData.remarks);
  return dataMap;
}

/**
 * メールアドレスで既存行を検索する
 *
 * 管理シートのメールアドレス列を検索し、一致する行番号を返します。
 * 見つからない場合は0を返します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 検索対象のシート
 * @param {Map<string, number>} headerPositions - ヘッダー位置のマップ
 * @param {string} email - 検索するメールアドレス
 * @returns {number} 一致した行番号（見つからない場合は0）
 */
function findRowByEmail(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>,
  email: string
): number {
  const emailColumn = headerPositions.get('メールアドレス');
  if (!emailColumn) {
    Logger.log('メールアドレス列が見つかりません。');
    return 0;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    // ヘッダー行のみ、またはデータなし
    return 0;
  }

  // メールアドレス列のデータを取得（ヘッダー行を除く）
  const emailValues = sheet
    .getRange(2, emailColumn, lastRow - 1, 1)
    .getValues();

  // メールアドレスが一致する行を検索
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      return i + 2; // 2行目から開始するため、+2
    }
  }

  return 0; // 見つからない場合
}

/**
 * ヘッダー位置マップに基づいて既存行のデータを更新する
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @param {Map<string, number>} headerPositions - ヘッダー位置のマップ
 * @param {Map<string, string | number | Date>} dataMap - 更新するデータのマップ
 * @param {number} row - 更新対象の行番号
 * @returns {void}
 */
function updateRowWithHeaderPositions(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>,
  dataMap: Map<string, string | number | Date>,
  row: number
): void {
  dataMap.forEach((value, header) => {
    const column = headerPositions.get(header);
    if (column !== undefined) {
      sheet.getRange(row, column).setValue(value);
    }
  });
}
