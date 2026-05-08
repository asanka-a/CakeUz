// ============================================================
// CakeUz by Asanka — Google Apps Script Backend
// Paste this entire file into Google Apps Script
// Deploy as Web App: Execute as Me, Anyone can access
// ============================================================

const SHEETS = {
  ingredients: 'Ingredients',
  priceHistory: 'PriceHistory',
  recipes: 'Recipes',
  recipeIngredients: 'RecipeIngredients',
  orders: 'Orders',
  shoppingTrips: 'ShoppingTrips',
  shoppingItems: 'ShoppingItems',
  activityLog: 'ActivityLog'
};

const HEADERS = {
  Ingredients:       ['id','name','stock','unit','cost'],
  PriceHistory:      ['ingId','date','cost'],
  Recipes:           ['id','name','yield','sellPrice'],
  RecipeIngredients: ['recipeId','ingId','qty','unit'],
  Orders:            ['id','customer','customerPhone','customerEmail','customerAddress','recipeId','qty','note','dueDate','status','sellPriceSnapshot','ingredientCost','ingredientSnapshot','completedDate'],
  ShoppingTrips:     ['id','date','shop','total','receiptImg'],
  ShoppingItems:     ['tripId','ingId','qty','unitPrice'],
  ActivityLog:       ['type','action','detail','time']
};

// ── INITIALISE SHEETS ────────────────────────────────────────
// Creates missing sheets and appends missing header columns to existing ones.
// Safe to run multiple times — never destroys existing data.
function initialiseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const added = [];
  Object.entries(HEADERS).forEach(([name, cols]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      sheet.getRange(1, 1, 1, cols.length)
        .setBackground('#2D3E50').setFontColor('#FFFFFF').setFontWeight('bold');
      added.push(name + ' (created)');
    } else {
      // Ensure all expected header columns exist; append any that are missing
      const existingHeaders = sheet.getLastColumn() > 0
        ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        : [];
      const missing = cols.filter(c => existingHeaders.indexOf(c) < 0);
      if (missing.length) {
        const startCol = existingHeaders.length + 1;
        sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
        sheet.getRange(1, startCol, 1, missing.length)
          .setBackground('#2D3E50').setFontColor('#FFFFFF').setFontWeight('bold');
        added.push(name + ': +' + missing.join(','));
      }
    }
  });
  return JSON.stringify({ ok: true, message: 'Sheets initialised', changes: added });
}

// ── HELPERS ──────────────────────────────────────────────────
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
  sheet.appendRow(row);
}

function bulkAppendRows(sheetName, rows) {
  if (!rows || rows.length === 0) return;
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const matrix = rows.map(rowData => headers.map(h => rowData[h] !== undefined ? rowData[h] : ''));
  sheet.getRange(sheet.getLastRow() + 1, 1, matrix.length, headers.length).setValues(matrix);
}

function updateRowById(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      headers.forEach((h, j) => {
        if (updates[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(updates[h]);
      });
      return true;
    }
  }
  return false;
}

function deleteRowById(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteRowsByField(sheetName, field, value) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const col = headers.indexOf(field);
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][col]) === String(value)) sheet.deleteRow(i + 1);
  }
}

function clearDataRows(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
}

function nextId(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  const ids = data.slice(1).map(r => parseInt(r[idCol]) || 0);
  return Math.max(...ids) + 1;
}

// Resolve ID: trust the frontend if it sent one; otherwise generate.
function resolveId(sheetName, providedId) {
  const n = parseInt(providedId);
  if (!isNaN(n) && n > 0) return n;
  return nextId(sheetName);
}

// ── LOAD ALL DATA ─────────────────────────────────────────────
function loadAll() {
  try {
    const ingredients = sheetToObjects('Ingredients');
    const priceHistoryRows = sheetToObjects('PriceHistory');
    const recipes = sheetToObjects('Recipes');
    const recipeIngredients = sheetToObjects('RecipeIngredients');
    const orders = sheetToObjects('Orders');
    const shoppingTrips = sheetToObjects('ShoppingTrips');
    const shoppingItems = sheetToObjects('ShoppingItems');
    const activityLog = sheetToObjects('ActivityLog');

    const priceHistory = {};
    priceHistoryRows.forEach(r => {
      const id = String(r.ingId);
      if (!priceHistory[id]) priceHistory[id] = [];
      priceHistory[id].push({ date: r.date, cost: parseFloat(r.cost) });
    });

    recipes.forEach(r => {
      r.id = parseInt(r.id);
      r.sellPrice = parseFloat(r.sellPrice);
      r.ingredients = recipeIngredients
        .filter(ri => String(ri.recipeId) === String(r.id))
        .map(ri => ({ ingId: parseInt(ri.ingId), qty: parseFloat(ri.qty), unit: ri.unit ? String(ri.unit) : '' }));
    });

    ingredients.forEach(i => {
      i.id = parseInt(i.id);
      i.stock = parseFloat(i.stock);
      i.cost = parseFloat(i.cost);
    });

    orders.forEach(o => {
      o.id = parseInt(o.id);
      o.recipeId = parseInt(o.recipeId);
      o.qty = parseInt(o.qty);
      o.sellPriceSnapshot = parseFloat(o.sellPriceSnapshot) || 0;
      o.ingredientCost = parseFloat(o.ingredientCost) || 0;
      if (o.ingredientSnapshot && typeof o.ingredientSnapshot === 'string') {
        try { o.ingredientSnapshot = JSON.parse(o.ingredientSnapshot); }
        catch(e) { o.ingredientSnapshot = []; }
      } else if (!o.ingredientSnapshot) {
        o.ingredientSnapshot = [];
      }
    });

    shoppingTrips.forEach(t => {
      t.id = parseInt(t.id);
      t.total = parseFloat(t.total);
      t.items = shoppingItems
        .filter(si => String(si.tripId) === String(t.id))
        .map(si => ({ ingId: parseInt(si.ingId), qty: parseFloat(si.qty), unitPrice: parseFloat(si.unitPrice) }));
    });

    return JSON.stringify({
      ok: true,
      ingredients, priceHistory, recipes, orders, shoppingTrips, activityLog
    });
  } catch(e) {
    return JSON.stringify({ ok: false, error: e.toString() });
  }
}

// ── INGREDIENTS ───────────────────────────────────────────────
function addIngredient(data) {
  const id = resolveId('Ingredients', data.id);
  appendRow('Ingredients', { id, name: data.name, stock: data.stock, unit: data.unit, cost: data.cost });
  appendRow('PriceHistory', { ingId: id, date: data.date, cost: data.cost });
  return JSON.stringify({ ok: true, id });
}

function editIngredient(data) {
  const ok = updateRowById('Ingredients', data.id, {
    name: data.name, stock: data.stock, unit: data.unit, cost: data.cost
  });
  if (!ok) return JSON.stringify({ ok: false, error: 'Ingredient id ' + data.id + ' not found' });
  if (data.priceChanged) {
    appendRow('PriceHistory', { ingId: data.id, date: data.date, cost: data.cost });
  }
  return JSON.stringify({ ok: true });
}

function deleteIngredient(data) {
  deleteRowById('Ingredients', data.id);
  deleteRowsByField('PriceHistory', 'ingId', data.id);
  return JSON.stringify({ ok: true });
}

// ── RECIPES ───────────────────────────────────────────────────
function addRecipe(data) {
  const id = resolveId('Recipes', data.id);
  appendRow('Recipes', { id, name: data.name, yield: data.yield, sellPrice: data.sellPrice });
  data.ingredients.forEach(ri => {
    appendRow('RecipeIngredients', { recipeId: id, ingId: ri.ingId, qty: ri.qty, unit: ri.unit || '' });
  });
  return JSON.stringify({ ok: true, id });
}

function editRecipe(data) {
  const ok = updateRowById('Recipes', data.id, {
    name: data.name, yield: data.yield, sellPrice: data.sellPrice
  });
  if (!ok) return JSON.stringify({ ok: false, error: 'Recipe id ' + data.id + ' not found' });
  deleteRowsByField('RecipeIngredients', 'recipeId', data.id);
  data.ingredients.forEach(ri => {
    appendRow('RecipeIngredients', { recipeId: data.id, ingId: ri.ingId, qty: ri.qty, unit: ri.unit || '' });
  });
  return JSON.stringify({ ok: true });
}

function deleteRecipe(data) {
  deleteRowById('Recipes', data.id);
  deleteRowsByField('RecipeIngredients', 'recipeId', data.id);
  return JSON.stringify({ ok: true });
}

// ── ORDERS ────────────────────────────────────────────────────
function addOrder(data) {
  const id = resolveId('Orders', data.id);
  appendRow('Orders', {
    id,
    customer: data.customer,
    customerPhone: data.customerPhone || '',
    customerEmail: data.customerEmail || '',
    customerAddress: data.customerAddress || '',
    recipeId: data.recipeId,
    qty: data.qty,
    note: data.note || '',
    dueDate: data.dueDate,
    status: data.status || 'pending',
    sellPriceSnapshot: data.sellPriceSnapshot || 0,
    ingredientCost: data.ingredientCost || 0,
    ingredientSnapshot: data.ingredientSnapshot ? JSON.stringify(data.ingredientSnapshot) : '',
    completedDate: data.completedDate || ''
  });
  return JSON.stringify({ ok: true, id });
}

function updateOrderStatus(data) {
  const updates = { status: data.status };
  if (data.completedDate !== undefined) updates.completedDate = data.completedDate;
  // Apply stock deltas if provided (used for done/undone transitions)
  if (Array.isArray(data.stockDeltas)) {
    const sheet = getSheet('Ingredients');
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idCol = headers.indexOf('id');
    const stockCol = headers.indexOf('stock');
    data.stockDeltas.forEach(d => {
      for (let i = 1; i < rows.length; i++) {
        if (parseInt(rows[i][idCol]) === parseInt(d.ingId)) {
          const cur = parseFloat(rows[i][stockCol]) || 0;
          const next = Math.round((cur + d.delta) * 1000) / 1000;
          sheet.getRange(i + 1, stockCol + 1).setValue(next);
          break;
        }
      }
    });
  }
  const ok = updateRowById('Orders', data.id, updates);
  if (!ok) return JSON.stringify({ ok: false, error: 'Order id ' + data.id + ' not found' });
  return JSON.stringify({ ok: true });
}

function deleteOrder(data) {
  deleteRowById('Orders', data.id);
  return JSON.stringify({ ok: true });
}

// ── SHOPPING ──────────────────────────────────────────────────
function addShoppingTrip(data) {
  const id = resolveId('ShoppingTrips', data.id);
  appendRow('ShoppingTrips', {
    id, date: data.date, shop: data.shop, total: data.total, receiptImg: data.receiptImg || ''
  });
  data.items.forEach(item => {
    appendRow('ShoppingItems', { tripId: id, ingId: item.ingId, qty: item.qty, unitPrice: item.unitPrice });
  });
  // Update ingredient costs and stock
  data.items.forEach(item => {
    const sheet = getSheet('Ingredients');
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idCol = headers.indexOf('id');
    const costCol = headers.indexOf('cost');
    const stockCol = headers.indexOf('stock');
    for (let i = 1; i < rows.length; i++) {
      if (parseInt(rows[i][idCol]) === parseInt(item.ingId)) {
        if (item.unitPrice > 0) {
          sheet.getRange(i + 1, costCol + 1).setValue(item.unitPrice);
          appendRow('PriceHistory', { ingId: item.ingId, date: data.date, cost: item.unitPrice });
        }
        const newStock = parseFloat(rows[i][stockCol]) + parseFloat(item.qty);
        sheet.getRange(i + 1, stockCol + 1).setValue(Math.round(newStock * 1000) / 1000);
        break;
      }
    }
  });
  return JSON.stringify({ ok: true, id });
}

function deleteShoppingTrip(data) {
  deleteRowById('ShoppingTrips', data.id);
  deleteRowsByField('ShoppingItems', 'tripId', data.id);
  return JSON.stringify({ ok: true });
}

// ── ACTIVITY LOG ──────────────────────────────────────────────
function addLog(data) {
  appendRow('ActivityLog', { type: data.type, action: data.action, detail: data.detail, time: data.time });
  return JSON.stringify({ ok: true });
}

function clearLog() {
  clearDataRows('ActivityLog');
  return JSON.stringify({ ok: true });
}

// ── RECOVERY (one-shot) ───────────────────────────────────────
// Wipes all data sheets and bulk-inserts a clean dataset.
// Payload shape:
//   { ingredients: [...], priceHistory: {ingId: [{date,cost}]}, recipes: [...],
//     orders: [...], shoppingTrips: [...], activityLog: [...] }
// Recipes carry their own .ingredients array.
// ShoppingTrips carry their own .items array.
function recoverAll(data) {
  initialiseSheets();
  ['Ingredients','PriceHistory','Recipes','RecipeIngredients',
   'Orders','ShoppingTrips','ShoppingItems'].forEach(clearDataRows);
  if (data.wipeLog) clearDataRows('ActivityLog');

  if (data.ingredients) {
    bulkAppendRows('Ingredients', data.ingredients.map(i => ({
      id: i.id, name: i.name, stock: i.stock, unit: i.unit, cost: i.cost
    })));
  }
  if (data.priceHistory) {
    const phRows = [];
    Object.entries(data.priceHistory).forEach(([ingId, entries]) => {
      entries.forEach(e => phRows.push({ ingId: parseInt(ingId), date: e.date, cost: e.cost }));
    });
    bulkAppendRows('PriceHistory', phRows);
  }
  if (data.recipes) {
    bulkAppendRows('Recipes', data.recipes.map(r => ({
      id: r.id, name: r.name, yield: r.yield, sellPrice: r.sellPrice
    })));
    const riRows = [];
    data.recipes.forEach(r => {
      (r.ingredients || []).forEach(ri => {
        riRows.push({ recipeId: r.id, ingId: ri.ingId, qty: ri.qty });
      });
    });
    bulkAppendRows('RecipeIngredients', riRows);
  }
  if (data.orders) {
    bulkAppendRows('Orders', data.orders.map(o => ({
      id: o.id, customer: o.customer, recipeId: o.recipeId, qty: o.qty,
      note: o.note, dueDate: o.dueDate, status: o.status || 'pending'
    })));
  }
  if (data.shoppingTrips) {
    bulkAppendRows('ShoppingTrips', data.shoppingTrips.map(t => ({
      id: t.id, date: t.date, shop: t.shop, total: t.total, receiptImg: t.receiptImg || ''
    })));
    const siRows = [];
    data.shoppingTrips.forEach(t => {
      (t.items || []).forEach(si => {
        siRows.push({ tripId: t.id, ingId: si.ingId, qty: si.qty, unitPrice: si.unitPrice });
      });
    });
    bulkAppendRows('ShoppingItems', siRows);
  }
  if (data.activityLog) {
    bulkAppendRows('ActivityLog', data.activityLog.map(l => ({
      type: l.type, action: l.action, detail: l.detail, time: l.time
    })));
  }
  return JSON.stringify({ ok: true, message: 'Recovery complete' });
}

// ── WEB APP ENTRY POINTS ──────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    if (action === 'init') result = initialiseSheets();
    else if (action === 'load') result = loadAll();
    else result = JSON.stringify({ ok: false, error: 'Unknown action: ' + action });
  } catch(err) {
    result = JSON.stringify({ ok: false, error: err.toString() });
  }
  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Bad JSON: ' + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const action = body.action;
  let result;
  try {
    if      (action === 'addIngredient')     result = addIngredient(body.data);
    else if (action === 'editIngredient')    result = editIngredient(body.data);
    else if (action === 'deleteIngredient')  result = deleteIngredient(body.data);
    else if (action === 'addRecipe')         result = addRecipe(body.data);
    else if (action === 'editRecipe')        result = editRecipe(body.data);
    else if (action === 'deleteRecipe')      result = deleteRecipe(body.data);
    else if (action === 'addOrder')          result = addOrder(body.data);
    else if (action === 'updateOrderStatus') result = updateOrderStatus(body.data);
    else if (action === 'deleteOrder')       result = deleteOrder(body.data);
    else if (action === 'addShoppingTrip')   result = addShoppingTrip(body.data);
    else if (action === 'deleteShoppingTrip')result = deleteShoppingTrip(body.data);
    else if (action === 'addLog')            result = addLog(body.data);
    else if (action === 'clearLog')          result = clearLog();
    else if (action === 'recoverAll')        result = recoverAll(body.data);
    else result = JSON.stringify({ ok: false, error: 'Unknown action: ' + action });
  } catch(err) {
    result = JSON.stringify({ ok: false, error: err.toString() });
  }
  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
}
