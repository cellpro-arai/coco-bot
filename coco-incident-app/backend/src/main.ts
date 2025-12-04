import { getOrCreateIncidentSheet as _getOrCreateIncidentSheet } from './incident/getOrCreateIncidentSheet';
import { getIncidentList as _getIncidentList } from './incident/getIncidentList';
import { submitIncident as _submitIncident } from './incident/submitIncident';
import { findIncidentRowByDate as _findIncidentRowByDate } from './incident/findIncidentRowByDate';
import { uploadFileToDrive as _uploadFileToDrive } from './drive';
import {
  getScriptProperty as _getScriptProperty,
  extractSheetIdFromUrl as _extractSheetIdFromUrl,
  extractFolderIdFromUrl as _extractFolderIdFromUrl,
  getAdminEmails as _getAdminEmails,
  isAdmin as _isAdmin,
} from './utils';
import { sendSlack as _sendSlack } from './slack/sendSlack';

/**
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index').setTitle(
    '【セルプロ】インシデント管理'
  );
}

// ============================================================
// GASのグローバルスコープに関数を登録
// ============================================================
declare const window: any;

if (typeof window !== 'undefined') {
  window.doGet = doGet;
  window.getIncidentList = _getIncidentList;
  window.submitIncident = _submitIncident;
  window.getOrCreateIncidentSheet = _getOrCreateIncidentSheet;
  window.findIncidentRowByDate = _findIncidentRowByDate;
  window.getScriptProperty = _getScriptProperty;
  window.extractSheetIdFromUrl = _extractSheetIdFromUrl;
  window.extractFolderIdFromUrl = _extractFolderIdFromUrl;
  window.getAdminEmails = _getAdminEmails;
  window.isAdmin = _isAdmin;
  window.uploadFileToDrive = _uploadFileToDrive;
  window.sendSlack = _sendSlack;
}
