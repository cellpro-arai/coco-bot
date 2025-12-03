import { useState, useRef, FormEvent, ChangeEvent } from 'react';

interface CommuteEntry {
  date: string;
  origin: string;
  destination: string;
  amount: string;
  tripType: string;
}

interface ExpenseEntry {
  date: string;
  category: string;
  description: string;
  amount: string;
  receiptFile: File | null;
  certificateFile: File | null;
}

interface FormData {
  name: string;
  submissionMonth: string;
  workScheduleFiles: File[];
  workStartTime: string;
  workEndTime: string;
  officeFrequency: string;
  hasCommuterPass: string;
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
  commuteEntries: CommuteEntry[];
  expenseEntries: ExpenseEntry[];
}

interface FileData {
  name: string;
  mimeType: string;
  data: string;
}

declare const google: any;

const createEmptyCommuteEntry = (): CommuteEntry => ({
  date: '',
  origin: '',
  destination: '',
  amount: '',
  tripType: 'oneWay',
});

const createEmptyExpenseEntry = (): ExpenseEntry => ({
  date: '',
  category: 'ebook',
  description: '',
  amount: '',
  receiptFile: null,
  certificateFile: null,
});

const getDefaultSubmissionMonth = (): string => {
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

const getSubmissionMonthOptions = () => {
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

const encodeFileToBase64 = (file: File | null): Promise<FileData | null> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        name: file.name,
        mimeType: file.type,
        data: base64,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function MainPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    submissionMonth: getDefaultSubmissionMonth(),
    workScheduleFiles: [],
    workStartTime: '09:00',
    workEndTime: '18:00',
    officeFrequency: 'fullRemote',
    hasCommuterPass: 'no',
    nearestStation: '',
    workStation: '',
    monthlyFee: '',
    remarks: '',
    commuteEntries: [],
    expenseEntries: [],
  });

  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const workScheduleInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWorkScheduleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        workScheduleFiles: [...prev.workScheduleFiles, ...files],
      }));
      // ファイル入力をリセットして同じファイルを再度選択できるようにする
      if (workScheduleInputRef.current) {
        workScheduleInputRef.current.value = '';
      }
    }
  };

  const removeWorkScheduleFile = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      workScheduleFiles: prev.workScheduleFiles.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const handleWorkScheduleButtonClick = () => {
    if (workScheduleInputRef.current) {
      workScheduleInputRef.current.click();
    }
  };

  const handleCommuteEntryChange = (
    index: number,
    field: keyof CommuteEntry,
    value: string
  ) => {
    setFormData(prev => {
      const updated = prev.commuteEntries.map((entry, idx) => {
        if (idx !== index) {
          return entry;
        }
        return { ...entry, [field]: value };
      });
      return { ...prev, commuteEntries: updated };
    });
  };

  const addCommuteEntry = () => {
    setFormData(prev => ({
      ...prev,
      commuteEntries: [...prev.commuteEntries, createEmptyCommuteEntry()],
    }));
  };

  const removeCommuteEntry = (index: number) => {
    setFormData(prev => {
      const updated = prev.commuteEntries.filter((_, idx) => idx !== index);
      return { ...prev, commuteEntries: updated };
    });
  };

  const duplicateCommuteEntry = (index: number) => {
    setFormData(prev => {
      const target = prev.commuteEntries[index];
      const cloned = { ...target, date: '' };
      const updated = [...prev.commuteEntries];
      updated.splice(index + 1, 0, cloned);
      return { ...prev, commuteEntries: updated };
    });
  };

  const handleExpenseEntryChange = (
    index: number,
    field: keyof ExpenseEntry,
    value: string
  ) => {
    setFormData(prev => {
      const updated = prev.expenseEntries.map((entry, idx) => {
        if (idx !== index) return entry;
        const nextEntry = { ...entry, [field]: value };
        if (!nextEntry.description && !nextEntry.amount) {
          nextEntry.receiptFile = null;
          nextEntry.certificateFile = null;
        }
        if (field === 'category' && value !== 'certification') {
          nextEntry.certificateFile = null;
        }
        return nextEntry;
      });
      return { ...prev, expenseEntries: updated };
    });
  };

  const handleExpenseReceiptChange = (index: number, file: File | null) => {
    setFormData(prev => {
      const updated = prev.expenseEntries.map((entry, idx) =>
        idx === index ? { ...entry, receiptFile: file } : entry
      );
      return { ...prev, expenseEntries: updated };
    });
  };

  const handleExpenseCertificateChange = (index: number, file: File | null) => {
    setFormData(prev => {
      const updated = prev.expenseEntries.map((entry, idx) =>
        idx === index ? { ...entry, certificateFile: file } : entry
      );
      return { ...prev, expenseEntries: updated };
    });
  };

  const addExpenseEntry = () => {
    setFormData(prev => ({
      ...prev,
      expenseEntries: [...prev.expenseEntries, createEmptyExpenseEntry()],
    }));
  };

  const removeExpenseEntry = (index: number) => {
    setFormData(prev => {
      const updated = prev.expenseEntries.filter((_, idx) => idx !== index);
      return { ...prev, expenseEntries: updated };
    });
  };

  const collectCommuteEntries = () => {
    const entries = [];

    for (const entry of formData.commuteEntries) {
      const hasValue =
        entry.date || entry.origin || entry.destination || entry.amount;
      if (!hasValue) {
        continue;
      }

      const isComplete =
        entry.date && entry.origin && entry.destination && entry.amount;
      if (!isComplete) {
        throw new Error(
          '交通費の各項目（日時・最寄り駅・訪問先駅・金額）を入力してください。'
        );
      }

      entries.push({ ...entry, tripType: entry.tripType || 'oneWay' });
    }

    return entries;
  };

  const collectExpenseEntries = async () => {
    const entries = [];

    for (const entry of formData.expenseEntries) {
      const hasValue = entry.date || entry.description || entry.amount;
      if (!hasValue) {
        continue;
      }

      if (!entry.date || !entry.description || !entry.amount) {
        throw new Error('経費の日付、内容、金額を入力してください。');
      }

      if (!entry.receiptFile) {
        throw new Error('経費には領収書の添付が必須です。');
      }

      const category = entry.category || 'other';

      if (category === 'certification' && !entry.certificateFile) {
        throw new Error('資格受験の経費には合格通知書の添付が必須です。');
      }

      const receiptFileData = await encodeFileToBase64(entry.receiptFile);

      if (!receiptFileData) {
        throw new Error('領収書の変換に失敗しました。');
      }

      let certificateFileData = null;
      if (category === 'certification') {
        certificateFileData = await encodeFileToBase64(entry.certificateFile);
        if (!certificateFileData) {
          throw new Error('合格通知書の変換に失敗しました。');
        }
      }

      entries.push({
        date: entry.date,
        category,
        description: entry.description,
        amount: entry.amount,
        receiptFile: receiptFileData,
        certificateFile: certificateFileData,
      });
    }

    return entries;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      // 勤務表ファイルをBase64エンコード
      const workScheduleFilesData = await Promise.all(
        formData.workScheduleFiles.map(file => encodeFileToBase64(file))
      );

      const commuteEntries = collectCommuteEntries();
      const expenseEntries = await collectExpenseEntries();

      // バックエンドに送信するデータを準備
      const expenseData = {
        name: formData.name,
        submissionMonth: formData.submissionMonth,
        workScheduleFiles: workScheduleFilesData,
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        officeFrequency: formData.officeFrequency,
        hasCommuterPass: formData.hasCommuterPass,
        nearestStation: formData.nearestStation,
        workStation: formData.workStation,
        monthlyFee: formData.monthlyFee,
        remarks: formData.remarks,
        commuteEntries,
        expenseEntries,
      };

      // Google Apps Scriptのバックエンド関数を呼び出し
      google.script.run
        .withSuccessHandler((result: any) => {
          alert(result.message);
          // フォームをリセット
          if (formRef.current) {
            formRef.current.reset();
          }
          setFormData({
            name: '',
            submissionMonth: getDefaultSubmissionMonth(),
            workScheduleFiles: [],
            workStartTime: '09:00',
            workEndTime: '18:00',
            officeFrequency: 'fullRemote',
            hasCommuterPass: 'no',
            nearestStation: '',
            workStation: '',
            monthlyFee: '',
            remarks: '',
            commuteEntries: [],
            expenseEntries: [],
          });
          setSubmitted(false);
        })
        .withFailureHandler((error: any) => {
          alert('エラーが発生しました: ' + error.message);
          setSubmitted(false);
        })
        .submitExpense(expenseData);
    } catch (error: any) {
      alert('エラーが発生しました: ' + error.message);
      setSubmitted(false);
    }
  };

  const hasCommuteEntries = formData.commuteEntries.length > 0;
  const hasExpenseEntries = formData.expenseEntries.length > 0;

  return (
    <>
      <main className="container">
        {/* ヘッダー */}
        <article className="text-center py-3">
          <div className="d-flex align-items-center justify-content-center mb-2">
            <i
              className="bi bi-receipt me-2"
              style={{ fontSize: '2rem', color: 'var(--pico-primary)' }}
            ></i>
            <h1 className="mb-0">経費精算フォーム</h1>
          </div>
          <p className="mb-0">経費精算に必要な情報を入力してください</p>
        </article>

        {/* フォーム */}
        <article>
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* 氏名 */}
            <legend className="required-label">氏名</legend>
            <label htmlFor="name">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="山田 太郎"
              />
            </label>

            {/* 提出月 */}
            <fieldset>
              <legend className="required-label">提出月</legend>
              <label htmlFor="submissionMonth">
                <select
                  id="submissionMonth"
                  name="submissionMonth"
                  value={formData.submissionMonth}
                  onChange={handleInputChange}
                  required
                >
                  {getSubmissionMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            {/* 勤務表 */}
            <fieldset>
              <label htmlFor="workScheduleFile">勤務表</label>
              <div className="work-schedule-input">
                <input
                  ref={workScheduleInputRef}
                  type="file"
                  id="workScheduleFile"
                  onChange={handleWorkScheduleFilesChange}
                  accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  multiple
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={handleWorkScheduleButtonClick}
                >
                  勤務表を選択
                </button>
              </div>
              {formData.workScheduleFiles.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {formData.workScheduleFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <span className="file-name" style={{ flex: 1 }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => removeWorkScheduleFile(index)}
                        style={{
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            {/* 交通費 */}
            <fieldset>
              <legend>交通費</legend>
              <div className="commute-table-container">
                <div className="commute-table-header">
                  <button
                    type="button"
                    className="secondary"
                    onClick={addCommuteEntry}
                  >
                    + 交通費を追加
                  </button>
                </div>
                {hasCommuteEntries && (
                  <small>
                    日付・最寄り駅・訪問先駅・金額を入力してください。
                  </small>
                )}
                {hasCommuteEntries ? (
                  <div className="commute-cards-grid">
                    {formData.commuteEntries.map((entry, index) => (
                      <div key={`commute-${index}`} className="commute-card">
                        <div className="commute-card-field">
                          <label
                            className="commute-card-label"
                            htmlFor={`commute-date-${index}`}
                          >
                            日付
                          </label>
                          <input
                            type="date"
                            id={`commute-date-${index}`}
                            value={entry.date}
                            onChange={e =>
                              handleCommuteEntryChange(
                                index,
                                'date',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="commute-card-field">
                          <label
                            className="commute-card-label"
                            htmlFor={`commute-origin-${index}`}
                          >
                            最寄り駅
                          </label>
                          <input
                            type="text"
                            id={`commute-origin-${index}`}
                            value={entry.origin}
                            onChange={e =>
                              handleCommuteEntryChange(
                                index,
                                'origin',
                                e.target.value
                              )
                            }
                            placeholder="例: 渋谷駅"
                          />
                        </div>

                        <div className="commute-card-field">
                          <label
                            className="commute-card-label"
                            htmlFor={`commute-destination-${index}`}
                          >
                            訪問先駅
                          </label>
                          <input
                            type="text"
                            id={`commute-destination-${index}`}
                            value={entry.destination}
                            onChange={e =>
                              handleCommuteEntryChange(
                                index,
                                'destination',
                                e.target.value
                              )
                            }
                            placeholder="例: 新宿駅"
                          />
                        </div>

                        <div className="commute-card-field">
                          <label
                            className="commute-card-label"
                            htmlFor={`commute-tripType-${index}`}
                          >
                            区分
                          </label>
                          <select
                            id={`commute-tripType-${index}`}
                            value={entry.tripType}
                            onChange={e =>
                              handleCommuteEntryChange(
                                index,
                                'tripType',
                                e.target.value
                              )
                            }
                          >
                            <option value="oneWay">片道</option>
                            <option value="roundTrip">往復</option>
                          </select>
                        </div>

                        <div className="commute-card-field">
                          <label
                            className="commute-card-label"
                            htmlFor={`commute-amount-${index}`}
                          >
                            片道の金額
                          </label>
                          <input
                            type="number"
                            id={`commute-amount-${index}`}
                            value={entry.amount}
                            onChange={e =>
                              handleCommuteEntryChange(
                                index,
                                'amount',
                                e.target.value
                              )
                            }
                            placeholder="例: 200"
                            min="0"
                          />
                        </div>

                        <div className="commute-card-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => duplicateCommuteEntry(index)}
                          >
                            複製
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => removeCommuteEntry(index)}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">
                    「+ 交通費を追加」を押すと入力欄が表示されます。
                  </p>
                )}
              </div>
            </fieldset>

            {/* 経費 */}
            <fieldset>
              <legend>経費</legend>
              <div className="expense-table-container">
                <div className="expense-table-header">
                  <button
                    type="button"
                    className="secondary"
                    onClick={addExpenseEntry}
                  >
                    + 経費を追加
                  </button>
                </div>
                {hasExpenseEntries && (
                  <small>
                    経費種別を選択し、日付、金額、内容を入力してください。資格受験は領収書に加え、合格通知書の添付が必須です。
                  </small>
                )}
                {hasExpenseEntries ? (
                  <div className="expense-cards-grid">
                    {formData.expenseEntries.map((entry, index) => {
                      const category = entry.category || 'other';
                      const isCertification = category === 'certification';
                      return (
                        <div key={`expense-${index}`} className="expense-card">
                          <div className="expense-card-row">
                            <div className="expense-card-field">
                              <label
                                className="expense-card-label"
                                htmlFor={`expense-category-${index}`}
                              >
                                経費種別
                              </label>
                              <select
                                id={`expense-category-${index}`}
                                value={entry.category}
                                onChange={e =>
                                  handleExpenseEntryChange(
                                    index,
                                    'category',
                                    e.target.value
                                  )
                                }
                              >
                                <option value="ebook">電子書籍</option>
                                <option value="book">書籍</option>
                                <option value="certification">資格受験</option>
                                <option value="other">その他</option>
                              </select>
                            </div>

                            <div className="expense-card-field">
                              <label
                                className="expense-card-label"
                                htmlFor={`expense-date-${index}`}
                              >
                                日付
                              </label>
                              <input
                                type="date"
                                id={`expense-date-${index}`}
                                value={entry.date}
                                onChange={e =>
                                  handleExpenseEntryChange(
                                    index,
                                    'date',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="expense-card-row">
                            <div className="expense-card-field">
                              <label
                                className="expense-card-label"
                                htmlFor={`expense-amount-${index}`}
                              >
                                金額（円）
                              </label>
                              <input
                                type="number"
                                id={`expense-amount-${index}`}
                                value={entry.amount}
                                onChange={e =>
                                  handleExpenseEntryChange(
                                    index,
                                    'amount',
                                    e.target.value
                                  )
                                }
                                placeholder="例: 3000"
                                min="0"
                              />
                            </div>

                            <div className="expense-card-field">
                              <label
                                className="expense-card-label"
                                htmlFor={`expense-description-${index}`}
                              >
                                内容
                              </label>
                              <input
                                type="text"
                                id={`expense-description-${index}`}
                                value={entry.description}
                                onChange={e =>
                                  handleExpenseEntryChange(
                                    index,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="例: TypeScript入門書"
                              />
                            </div>
                          </div>

                          <div
                            className={
                              isCertification
                                ? 'expense-card-row'
                                : 'expense-card-row-3'
                            }
                          >
                            <div className="expense-card-field">
                              <label
                                className="expense-card-label"
                                htmlFor={`expense-receipt-${index}`}
                              >
                                領収書
                              </label>
                              <input
                                type="file"
                                id={`expense-receipt-${index}`}
                                onChange={e =>
                                  handleExpenseReceiptChange(
                                    index,
                                    e.target.files?.[0] || null
                                  )
                                }
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              {entry.receiptFile && (
                                <span
                                  className="file-name"
                                  style={{
                                    fontSize: '0.7rem',
                                    marginTop: '0.2rem',
                                  }}
                                >
                                  {entry.receiptFile.name}
                                </span>
                              )}
                            </div>

                            {isCertification && (
                              <div className="expense-card-field">
                                <label
                                  className="expense-card-label"
                                  htmlFor={`expense-certificate-${index}`}
                                >
                                  合格通知書
                                </label>
                                <input
                                  type="file"
                                  id={`expense-certificate-${index}`}
                                  onChange={e =>
                                    handleExpenseCertificateChange(
                                      index,
                                      e.target.files?.[0] || null
                                    )
                                  }
                                  accept=".pdf,.jpg,.jpeg,.png"
                                />
                                {entry.certificateFile && (
                                  <span
                                    className="file-name"
                                    style={{
                                      fontSize: '0.7rem',
                                      marginTop: '0.2rem',
                                    }}
                                  >
                                    {entry.certificateFile.name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="expense-card-actions">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => removeExpenseEntry(index)}
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted">
                    「+ 経費を追加」を押すと入力欄が表示されます。
                  </p>
                )}
              </div>
            </fieldset>

            {/* 現場勤務状況 */}
            <fieldset>
              <legend className="required-label">現場勤務状況</legend>

              <div className="grid">
                <label htmlFor="workStartTime">
                  始業時間
                  <input
                    type="time"
                    id="workStartTime"
                    name="workStartTime"
                    value={formData.workStartTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label htmlFor="workEndTime">
                  就業時間
                  <input
                    type="time"
                    id="workEndTime"
                    name="workEndTime"
                    value={formData.workEndTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              {/* 出社頻度 */}
              <label htmlFor="officeFrequency">
                出社頻度
                <select
                  id="officeFrequency"
                  name="officeFrequency"
                  value={formData.officeFrequency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="fullRemote">フルリモート</option>
                  <option value="weekly1to2">週1~2出社</option>
                  <option value="weekly3to5">週3~5出社</option>
                </select>
              </label>
            </fieldset>

            {/* 定期券購入 */}
            <fieldset>
              <legend className="required-label">定期券購入</legend>
              <label>
                <input
                  type="radio"
                  name="hasCommuterPass"
                  value="yes"
                  checked={formData.hasCommuterPass === 'yes'}
                  onChange={handleInputChange}
                />
                有り
              </label>
              <label>
                <input
                  type="radio"
                  name="hasCommuterPass"
                  value="no"
                  checked={formData.hasCommuterPass === 'no'}
                  onChange={handleInputChange}
                />
                無し
              </label>
            </fieldset>

            {/* 定期券詳細（条件付き表示） */}
            {formData.hasCommuterPass === 'yes' && (
              <fieldset>
                <legend className="required-label">定期券詳細</legend>

                <div className="grid">
                  <label htmlFor="nearestStation">
                    最寄り駅
                    <input
                      type="text"
                      id="nearestStation"
                      name="nearestStation"
                      value={formData.nearestStation}
                      onChange={handleInputChange}
                      required={formData.hasCommuterPass === 'yes'}
                      placeholder="例: 渋谷駅"
                    />
                  </label>

                  <label htmlFor="workStation">
                    勤務先の駅
                    <input
                      type="text"
                      id="workStation"
                      name="workStation"
                      value={formData.workStation}
                      onChange={handleInputChange}
                      required={formData.hasCommuterPass === 'yes'}
                      placeholder="例: 新宿駅"
                    />
                  </label>
                </div>

                <label htmlFor="monthlyFee">
                  月額（円）
                  <input
                    type="number"
                    id="monthlyFee"
                    name="monthlyFee"
                    value={formData.monthlyFee}
                    onChange={handleInputChange}
                    required={formData.hasCommuterPass === 'yes'}
                    min="0"
                    placeholder="例: 15000"
                  />
                </label>
              </fieldset>
            )}

            {/* 備考 */}
            <label htmlFor="remarks">
              備考
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={4}
                placeholder="その他連絡事項があればご記入ください"
              ></textarea>
            </label>

            {/* 送信ボタン */}
            <button type="submit" disabled={submitted}>
              {submitted ? '送信中...' : '提出する'}
            </button>
          </form>
        </article>
      </main>

      {/* フッター */}
      <footer className="container text-center">
        <p className="mb-0">
          <small>&copy; 2025 Demo Inc. All rights reserved.</small>
        </p>
      </footer>
    </>
  );
}
