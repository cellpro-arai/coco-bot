import { getIncidentList as _getIncidentList } from './incident/getIncidentList';
import { submitIncident as _submitIncident } from './incident/submitIncident';
import { uploadFileToDrive as _uploadFileToDrive } from './drive/drive';
import { sendSlack as _sendSlack } from './slack/sendSlack';
import {
  getAllPermissions as _getAllPermissions,
  getCurrentUserAndAll as _getCurrentUserAndAll,
  addUser as _addUser,
  removeUser as _removeUser,
} from './permissions/permissionManager';

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
  window.sendSlack = _sendSlack;
  window.getAllPermissions = _getAllPermissions;
  window.getCurrentUserAndAll = _getCurrentUserAndAll;
  window.addUser = _addUser;
  window.removeUser = _removeUser;
}
