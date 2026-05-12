// ============================================================
// CakeUz — Daily backup from Supabase to Google Sheets
//
// This file no longer serves as the live DB. The app at
// https://asanka-a.github.io/CakeUz/ talks directly to Supabase.
// This script's only job is to pull a snapshot of every Supabase
// table into the Google Sheet tabs once a day, so you always have
// a human-readable backup you can open without logging into Supabase.
//
// One-time setup:
//   1. Paste this file into the Apps Script editor, save.
//   2. From the toolbar, pick "installDailyTrigger" in the function
//      dropdown and click Run. Authorise when prompted.
//      → A daily job is created for 23:00 Asia/Singapore.
//   3. (Optional) Run "backupFromSupabase" once manually to seed.
//
// To change the time of day, edit BACKUP_HOUR below and re-run
// installDailyTrigger.
// ============================================================

const SUPABASE_URL = 'https://puwdbrsvqbxeanoewycy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1d2RicnN2cWJ4ZWFub2V3eWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDY2ODIsImV4cCI6MjA5NDEyMjY4Mn0.Hqub2GM1iZuey5qzd2hOlP1G4QV98sigfgshd7p8g1k';

const BACKUP_HOUR = 23;   // 23 = 11 PM Asia/Singapore
const BACKUP_TZ   = 'Asia/Singapore';

const TABLES = [
  'ingredients',
  'price_history',
  'recipes',
  'recipe_ingredients',
  'orders',
  'shopping_trips',
  'shopping_items',
  'activity_log'
];

// ── MAIN ENTRY (run by the scheduled trigger) ─────────────────
function backupFromSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summary = [];
  TABLES.forEach(name => {
    try {
      const rows = fetchTable(name);
      writeSheet(ss, name, rows);
      summary.push(name + ': ' + rows.length);
    } catch (e) {
      summary.push(name + ': ERROR — ' + e.message);
    }
  });
  // Write the run summary to a "_backup_log" tab so you can see when it last ran
  writeBackupLog(ss, summary);
  return summary.join(', ');
}

function fetchTable(name) {
  // Supabase REST defaults to a small page size; pass &limit=100000 to get everything.
  const url = SUPABASE_URL + '/rest/v1/' + name + '?select=*&limit=100000';
  const resp = UrlFetchApp.fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error('HTTP ' + resp.getResponseCode() + ' ' + resp.getContentText().substring(0, 200));
  }
  return JSON.parse(resp.getContentText());
}

function writeSheet(ss, name, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clear();
  if (!rows || rows.length === 0) {
    sheet.getRange(1, 1).setValue('(empty)');
    return;
  }
  // Union of keys across rows so columns added later still show up
  const headerSet = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => headerSet.add(k)));
  const headers = Array.from(headerSet);
  const data = rows.map(r => headers.map(h => {
    const v = r[h];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);  // jsonb columns
    return v;
  }));
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#2D3E50').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.setFrozenRows(1);
}

function writeBackupLog(ss, summary) {
  const name = '_backup_log';
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, 2).setValues([['ran_at', 'summary']])
      .setBackground('#2D3E50').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, 2).setValues([[
    Utilities.formatDate(new Date(), BACKUP_TZ, 'yyyy-MM-dd HH:mm:ss'),
    summary.join(', ')
  ]]);
}

// ── ONE-TIME SETUP ────────────────────────────────────────────
function installDailyTrigger() {
  // Remove any existing triggers for this handler so re-running is safe
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'backupFromSupabase') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('backupFromSupabase')
    .timeBased()
    .atHour(BACKUP_HOUR)
    .everyDays(1)
    .inTimezone(BACKUP_TZ)
    .create();
  return 'Daily backup trigger installed for ' + BACKUP_HOUR + ':00 ' + BACKUP_TZ + '.';
}

function uninstallDailyTrigger() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'backupFromSupabase') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  return 'Removed ' + removed + ' trigger(s).';
}
