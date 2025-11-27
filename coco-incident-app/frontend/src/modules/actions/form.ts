import * as api from '../api';
import { initialFormData } from '../state';
import { FileData, Incident } from '../types';
import { ComponentContext } from '../context';
import { backToList } from './changeView';

/**
 * フォームを送信します。
 */
export async function submitForm(this: ComponentContext) {
  if (
    !this.formData.caseName ||
    !this.formData.assignee ||
    !this.formData.summary
  ) {
    this.error = '必須項目を入力してください';
    return;
  }
  this.submitting = true;
  this.error = '';

  try {
    const result = await api.submitIncident(this.formData);

    const isUpdate = !!(
      this.formData.registeredDate && this.formData.registeredDate.trim()
    );

    const submittedIncidentData: Incident = {
      ...result.record,
      summary: this.formData.summary,
      stakeholders: this.formData.stakeholders,
      details: this.formData.details,
      improvementSuggestions: result.improvementSuggestions || '',
    };

    if (isUpdate) {
      // 更新: 既存のインシデントを探して更新
      const index = this.incidents.findIndex(
        inc => inc.registeredDate === this.formData.registeredDate
      );
      if (index !== -1) {
        this.incidents[index] = submittedIncidentData;
      }
    } else {
      // 新規登録: リストの先頭に追加
      this.incidents.unshift(submittedIncidentData);
    }
    this.submittedIncident = submittedIncidentData;
    this.showSuccessModal = true;
  } catch (error: any) {
    this.error = error.message || '送信に失敗しました';
  } finally {
    this.submitting = false;
  }
}

/**
 * 送信成功モーダルを閉じて一覧に戻ります。
 */
export function closeSuccessModal(this: ComponentContext) {
  this.showSuccessModal = false;
  backToList.call(this);
}

/**
 * ファイルアップロードを処理します。
 * @param event イベントオブジェクト
 */
export function handleFileUpload(this: ComponentContext, event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  const fileDataList: FileData[] = [];
  let filesProcessed = 0;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        const base64Data = (e.target.result as string).split(',')[1];
        fileDataList.push({
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        });
      }
      filesProcessed++;
      if (filesProcessed === files.length) {
        this.formData.fileDataList = fileDataList;
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * フォームをリセットします。
 */
export function resetForm(this: ComponentContext) {
  this.formData = { ...initialFormData };
  this.selectedIncident = null;
  const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
  this.error = '';
  this.submittedIncident = null;
  this.showSuccessModal = false;
}
