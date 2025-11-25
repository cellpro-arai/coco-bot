import * as api from '../api';
import { initialFormData } from '../state';
import { FileData, Incident } from '../types';
import { ComponentContext } from '../context';

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
  this.success = false;
  try {
    const result = await api.submitIncident(this.formData);
    this.success = true;
    this.improvementSuggestions = result.improvementSuggestions || '';

    const isUpdate = !!(
      this.formData.registeredDate && this.formData.registeredDate.trim()
    );

    if (isUpdate) {
      // 更新: 既存のインシデントを探して更新
      const index = this.incidents.findIndex(
        inc => inc.registeredDate === this.formData.registeredDate
      );
      if (index !== -1) {
        // バックエンドから返されたrecordで更新
        this.incidents[index] = {
          ...result.record,
          summary: this.formData.summary,
          stakeholders: this.formData.stakeholders,
          details: this.formData.details,
          improvementSuggestions: result.improvementSuggestions || '',
        };
      }
    } else {
      // 新規登録: バックエンドから返されたrecordをリストの先頭に追加
      const newIncident: Incident = {
        ...result.record,
        summary: this.formData.summary,
        stakeholders: this.formData.stakeholders,
        details: this.formData.details,
        improvementSuggestions: result.improvementSuggestions || '',
      };
      this.incidents.unshift(newIncident);
    }
  } catch (error: any) {
    this.error = error.message;
  } finally {
    this.submitting = false;
  }
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
  this.success = false;
  this.improvementSuggestions = '';
}
