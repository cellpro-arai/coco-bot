import { submitIncident as _submitIncident } from './incident/submitIncident';
import { getInitialData as _getInitialData } from './incident/getInitialData';
import { addUser as _addUser } from './user/addUser';
import { removeUser as _removeUser } from './user/removeUser';

/**
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('coco-incident-app')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ============================================================
// GASのグローバルスコープに関数を登録
// ============================================================
declare const window: any;

if (typeof window !== 'undefined') {
  window.doGet = doGet;
  window.getInitialData = _getInitialData;
  window.submitIncident = _submitIncident;
  window.addUser = _addUser;
  window.removeUser = _removeUser;
}
