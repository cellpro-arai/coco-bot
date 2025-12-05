import { getIncidentList as _getIncidentList } from './incident/getIncidentList';
import { submitIncident as _submitIncident } from './incident/submitIncident';
import { getUploadFolderUrl as _getUploadFolderUrl } from './drive/getUploadFolderUrl';
import { sendSlack as _sendSlack } from './slack/sendSlack';
import { getCurrentUserAndAll as _getCurrentUserAndAll } from './user/permissionManager';
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
  window.getIncidentList = _getIncidentList;
  window.submitIncident = _submitIncident;
  window.getUploadFolderUrl = _getUploadFolderUrl;
  window.sendSlack = _sendSlack;
  window.getCurrentUserAndAll = _getCurrentUserAndAll;
  window.addUser = _addUser;
  window.removeUser = _removeUser;
}
