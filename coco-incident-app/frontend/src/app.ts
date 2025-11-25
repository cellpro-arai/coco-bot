import './app.css';

// Alpine.js用のグローバル関数
declare global {
  interface Window {
    incidentApp: () => any;
    google: any;
  }
}

export function incidentApp() {
  return {
    // ビュー管理
    currentView: 'list' as 'list' | 'form',
    theme: localStorage.getItem('theme') || 'light',

    // データ管理
    incidents: [] as any[],
    loading: false,
    error: '',

    // フォーム管理
    submitting: false,
    success: false,
    improvementSuggestions: '',
    formData: {
      registeredDate: '', // 編集モードの場合に設定される（識別子として使用）
      caseName: '',
      assignee: '',
      summary: '',
      stakeholders: '',
      details: '',
      status: '対応中',
      fileDataList: [] as any[],
      previousAiSuggestions: '', // 編集時の前回AI改善案
    },

    // 初期化
    init() {
      this.applyTheme();
      this.loadIncidents();
    },

    // テーマを適用
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
    },

    // テーマを切り替え
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', this.theme);
      this.applyTheme();
    },

    // インシデント一覧を読み込み
    loadIncidents() {
      this.loading = true;
      this.error = '';

      if (typeof window.google === 'undefined') {
        // 開発環境用のモックデータ
        setTimeout(() => {
          this.incidents = [
            {
              registeredDate: '2025-01-15',
              caseName: 'システムダウン',
              assignee: '山田太郎',
              summary: '決済システムが停止',
              status: '対応中',
            },
            {
              registeredDate: '2025-01-14',
              caseName: 'データ不整合',
              assignee: '佐藤花子',
              summary: '在庫データに不整合',
              status: '完了',
            },
          ];
          this.loading = false;
        }, 500);
        return;
      }

      window.google.script.run
        .withSuccessHandler((result: any) => {
          this.incidents = result;
          this.loading = false;
        })
        .withFailureHandler((error: any) => {
          this.error = 'データの読み込みに失敗しました: ' + error.message;
          this.loading = false;
        })
        .getIncidentList();
    },

    // 新規起票画面を表示
    showForm() {
      this.resetForm();
      this.currentView = 'form';
    },

    // 編集画面を表示
    editIncident(incident: any) {
      this.formData.registeredDate = incident.registeredDate;
      this.formData.caseName = incident.caseName;
      this.formData.assignee = incident.assignee;
      this.formData.summary = incident.summary;
      this.formData.stakeholders = incident.stakeholders || '';
      this.formData.details = incident.details || '';
      this.formData.status = incident.status;
      this.formData.fileDataList = [];
      this.formData.previousAiSuggestions =
        incident.improvementSuggestions || '';
      this.currentView = 'form';
    },

    // 一覧画面に戻る
    backToList() {
      this.currentView = 'list';
      this.resetForm();
      this.loadIncidents();
    },

    // ファイルアップロード処理
    handleFileUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      const files = input.files;
      if (!files || files.length === 0) return;

      const fileDataList: any[] = [];
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
    },

    // フォーム送信
    submitForm() {
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

      if (typeof window.google === 'undefined') {
        // 開発環境用のモック
        setTimeout(() => {
          this.success = true;
          this.submitting = false;
          this.improvementSuggestions = '【モック】改善案が表示されます';
        }, 1000);
        return;
      }

      window.google.script.run
        .withSuccessHandler((result: any) => {
          this.success = true;
          this.submitting = false;
          this.improvementSuggestions = result.improvementSuggestions || '';
          this.resetForm();
        })
        .withFailureHandler((error: any) => {
          this.error = '送信に失敗しました: ' + error.message;
          this.submitting = false;
        })
        .submitIncident(this.formData);
    },

    // フォームをリセット
    resetForm() {
      this.formData.registeredDate = '';
      this.formData.caseName = '';
      this.formData.assignee = '';
      this.formData.summary = '';
      this.formData.stakeholders = '';
      this.formData.details = '';
      this.formData.status = '対応中';
      this.formData.fileDataList = [];
      this.formData.previousAiSuggestions = '';
      const fileInput = document.getElementById(
        'fileUpload'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      this.error = '';
      this.success = false;
      this.improvementSuggestions = '';
    },
  };
}

// Alpine.jsのグローバル関数として登録
window.incidentApp = incidentApp;
