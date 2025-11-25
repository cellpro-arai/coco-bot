import * as api from '../api';
import { initialFormData } from '../state';
import { FileData } from '../types';
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
    this.resetForm();
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
  const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
  this.error = '';
  this.success = false;
  this.improvementSuggestions = '';
}
