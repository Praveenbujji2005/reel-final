const SHEET_NAME = 'Leads';
const TIMEZONE = 'Asia/Kolkata';

const HEADERS = [
  'Received (IST)',
  'Enquiry ID',
  'Name',
  'Phone',
  'Email',
  'Package / Service',
  'Event Date',
  'City',
  'Locality',
  'Brand / Company',
  'Message',
  'Source Form',
  'Status',
  'Notes',
];

const STATUS_OPTIONS = ['New', 'Contacted', 'Follow-up', 'Booked', 'Not interested', 'Spam'];

const COL = {
  id: HEADERS.indexOf('Enquiry ID') + 1,
  status: HEADERS.indexOf('Status') + 1,
  notes: HEADERS.indexOf('Notes') + 1,
};

function setupSheet() {
  const sheet = getOrCreateSheet_();

  sheet.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setBackground('#1f1f1f')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  const maxRows = sheet.getMaxRows();
  sheet.getRange(2, 1, maxRows - 1, COL.status - 1).setNumberFormat('@');

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL.status, maxRows - 1, 1).setDataValidation(statusRule);

  sheet.setColumnWidths(1, HEADERS.length, 150);
  sheet.setColumnWidth(COL.id, 210);
  sheet.setColumnWidth(HEADERS.indexOf('Message') + 1, 320);
  sheet.setColumnWidth(COL.notes, 320);
  sheet.getRange(2, COL.status, maxRows - 1, 1).setBackground('#fff8e1');
  sheet.getRange(2, COL.notes, maxRows - 1, 1).setBackground('#fff8e1').setWrap(true);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'invalid_json' });
  }

  const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!expectedSecret || body.secret !== expectedSecret) {
    return json_({ ok: false, error: 'unauthorized' });
  }

  const lead = body.lead || {};
  const id = String(lead.id || '').trim();
  if (!id) {
    return json_({ ok: false, error: 'missing_id' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    const sheet = getOrCreateSheet_();
    if (sheet.getLastRow() === 0) setupSheet();

    if (isDuplicate_(sheet, id)) {
      return json_({ ok: true, duplicate: true });
    }

    const row = [
      formatReceived_(lead.createdAt),
      id,
      lead.customerName,
      lead.phone,
      lead.email,
      lead.selectedService,
      lead.eventDate,
      lead.city,
      lead.locality,
      lead.companyName,
      lead.message,
      lead.sourcePage,
    ].map(safeCell_);

    row.push('New', '');
    sheet.appendRow(row);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'reelxpress-leads' });
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function isDuplicate_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const match = sheet
    .getRange(2, COL.id, lastRow - 1, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext();
  return match !== null;
}

function formatReceived_(createdAt) {
  const date = createdAt ? new Date(createdAt) : new Date();
  const valid = isNaN(date.getTime()) ? new Date() : date;
  return Utilities.formatDate(valid, TIMEZONE, 'dd MMM yyyy, hh:mm a');
}

function safeCell_(value) {
  const text = value === null || value === undefined ? '' : String(value).slice(0, 2000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
