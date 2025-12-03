/**
 * デフォルトの提出月を取得します
 * 7日以前の場合は先月を返す
 */
export const getDefaultSubmissionMonth = (): string => {
  const today = new Date();
  const day = today.getDate();

  // 7日以前の場合は先月を返す
  if (day <= 7) {
    today.setMonth(today.getMonth() - 1);
  }

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * 提出月の選択肢を生成します（前月、当月、翌月）
 */
export const getSubmissionMonthOptions = () => {
  const today = new Date();
  const options = [];

  // 前月、当月、翌月の3つの選択肢を生成
  for (let i = -1; i <= 1; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    const label = `${year}年${month}月`;
    options.push({ value, label });
  }

  return options;
};
