// エラーメッセージなどUI全体で共有する定数
export const FORM_ERROR_MESSAGES = {
  SUBMISSION_FAILED: 'エラーが発生しました: ',
} as const;

export const COMMUTE_ERROR_MESSAGES = {
  COMMUTE_INCOMPLETE:
    '交通費の各項目（日時・最寄り駅・訪問先駅・金額）を入力してください。',
} as const;

export const EXPENSE_ERROR_MESSAGES = {
  EXPENSE_INCOMPLETE: '経費の日付、内容、金額を入力してください。',
  RECEIPT_REQUIRED: '経費には領収書の添付が必須です。',
  CERTIFICATE_REQUIRED: '資格受験の経費には合格通知書の添付が必須です。',
  RECEIPT_ENCODE_FAILED: '領収書の変換に失敗しました。',
  CERTIFICATE_ENCODE_FAILED: '合格通知書の変換に失敗しました。',
} as const;
