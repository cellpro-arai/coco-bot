/**
 * スプレッドシートIDを設定する関数（初回のみ実行）
 * Apps Scriptエディタから手動で実行してください
 */
function setSpreadsheetId() {
  const spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE'; // ここに実際のスプレッドシートIDを入力
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('SPREADSHEET_ID', spreadsheetId);
  Logger.log('スプレッドシートIDを設定しました: ' + spreadsheetId);
}

function doGet(e) {
  const items = getAllRecords('商品');
  const template = HtmlService.createTemplateFromFile('index');
  template.deployURL = ScriptApp.getService().getUrl();
  template.formHTML = getFormHTML(e, items);
  const htmlOutput = template.evaluate();
  return htmlOutput;
}

function getAllRecords(sheetName) {
  // Get spreadsheet ID from script properties
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('スプレッドシートIDが設定されていません。setSpreadsheetId()を実行してください。');
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const labels = values.shift();

  const records = [];
  for(const value of values) {
    const record = {};
    labels.forEach((label, index) => {
      record[label] = value[index];      
    });
    records.push(record);
  }

  return records;
}

function getFormHTML(e, items, alert='') {
  const email = e.parameter.email ? e.parameter.email : '';
  const username = e.parameter.username ? e.parameter.username : '';

  let html = `
    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control" id="email" name="email" required value="${email}">
    </div>

    <div class="mb-3">
      <label for="username" class="form-label">お名前</label>
      <input type="text" class="form-control" id="username" name="username" required value="${username}">
    </div>

    <p class="mb-3">商品の個数を入力してください。</p>
    <p class="text-danger">${alert}</p>

    <table class="table">
      <thead>
        <tr>
          <th scope="col">商品</th>
          <th scope="col">単価</th>
          <th scope="col">個数</th>
        </tr>
      </thead>
      <tbody>
  `;

  for(const item of items) {
    const itemId = item['商品ID'];
    const itemName = item['商品名'];
    const unitPrice = item['単価'];
    const zaiko = item['在庫数'];
    if(zaiko > 0) {
      html += `<tr>`;
      html += `<td>${itemName}</td>`;
      html += `<td>@¥${unitPrice.toLocaleString()}</td>`;
      html += `<td>`;
      html += `<select class="form-select" name="${itemId}">`;
      
      for(let i = 0; i <= zaiko; i++) {
        if(i == Number(e.parameter[itemId])) {
          html += `<option value="${i}" selected>${i}</option>`;
        } else {
          html += `<option value="${i}">${i}</option>`;
        }
      }

      html += `</select>`;
      html += `</td>`;
      html += `</tr>`;
    }
  }

  html += `</tbody>`;
  html += `</table>`;

  return html;
}