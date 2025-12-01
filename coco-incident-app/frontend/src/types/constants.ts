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

/**
 * placeholder definitions
 */
export const PLACEHOLDERS = {
  STAKEHOLDER: `例:
- 顧客: 株式会社ABC 田中様
- 社内: 開発部 鈴木課長、営業部 佐藤係長
- ベンダー: XYZ社 高橋様`,

  TROUBLE_DETAIL: `例:
【発生日時】2025年1月15日 14:30頃
【発覚の経緯】顧客からの問い合わせ

【現象】
- サービスページにアクセスすると503エラーが表示される
- 管理画面も同様にアクセス不可

【影響範囲】全ユーザー（約1000名）

【対応状況】
14:35 - インフラチームに連絡、調査開始
14:50 - サーバー再起動を実施、復旧せず
15:10 - ログを確認、メモリ不足が原因と判明

【その他】
- 前日にデータベースの大量更新を実施していた
- 同様の事象は過去にも一度発生（2024年12月）`,
};
