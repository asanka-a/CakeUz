# CakeUz by Asanka — Full Project Summary
**For:** Developer / VS Code Claude Agent  
**Date:** May 2026  
**Status:** Frontend complete. Google Sheets backend wired but needs API URL inserted.

---

## 1. What This Is

A browser-based shop management system for **CakeUz by Asanka** — a home cake shop based in **Singapore**. Built as a single `index.html` file, hosted on **GitHub Pages** (free). Currency is **SGD**.

---

## 2. What Is Already Built

### Modules (all functional in current index.html)

| Module | What it does |
|---|---|
| **Dashboard** | Revenue, profit, pending orders, low stock alerts, recent activity feed |
| **Inventory** | Ingredient list — stock levels, current price, % change vs last purchase, status badges (In stock / Low / Critical) |
| **Price History** | Per-ingredient price log + Chart.js line chart showing cost trend over time |
| **Shopping Trips** | Log shopping trips: date, shop name, items bought, qty, unit price. Auto-updates ingredient cost and stock on save. |
| **AI Receipt Scanner** | Upload receipt photo → calls Anthropic Claude API (claude-sonnet-4-20250514) → extracts items and prices → auto-fills the shopping trip form |
| **Recipes** | Recipe management with ingredient breakdown, live cost calculation using current ingredient prices, margin badge |
| **Orders** | Customer order intake — due dates, overdue alerts (highlighted red), mark-as-done, running totals |
| **Pricing Calculator** | Per-recipe: ingredient cost + overhead % + labour = total cost + suggested sell price at target margin + actual margin |
| **Activity Log** | Chronological log of every system change (add/edit/delete/order/shopping) with timestamp and colour-coded type dot |

### Branding
- Logo: CakeUz by Asanka — embedded as base64 PNG directly in the HTML (no external file)
- Primary colour: **Golden yellow `#F5A623`** (from logo)
- Secondary colour: **Dark navy `#2D3E50`** (from logo text)
- Topbar: white background with golden yellow bottom border so logo sits naturally
- Font: DM Sans (body) + Playfair Display (headings) — Google Fonts

### Units supported (user selects per ingredient)
`kg, g, mg, lb, oz, L, ml, fl oz, tsp, tbsp, cup, pcs`

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JavaScript — zero framework, zero build step |
| Charts | Chart.js 4.4.1 (cdnjs CDN) |
| AI Receipt Scan | Anthropic API `/v1/messages` — model `claude-sonnet-4-20250514` |
| Fonts | Google Fonts CDN |
| Hosting | GitHub Pages (static, free) |
| Database | Google Sheets + Google Apps Script (wired, needs URL) |
| Currency | SGD — formatted via `fmtMoney()` function |

---

## 4. Data Storage — The Main Outstanding Task

### Current situation
All state lives in a JavaScript object `S` in browser memory. Data is lost on refresh. The DB layer is fully wired in the code but the Apps Script URL has not been inserted yet.

### What is wired
- `API_URL` constant at top of script — currently set to `'YOUR_APPS_SCRIPT_URL_HERE'`
- `DB_ENABLED` boolean — automatically `false` until URL is set
- `dbGet(action)` — async fetch GET to Apps Script
- `dbPost(action, data)` — async fetch POST to Apps Script
- Every save/edit/delete action calls the corresponding `dbPost()` — ingredients, recipes, orders, shopping trips, activity log
- On page load, `init()` calls `dbGet('load')` to restore all data from Sheets
- A yellow warning banner is shown when `DB_ENABLED` is false
- A loading overlay is shown while fetching data on startup

### What needs to be done
1. Create a Google Spreadsheet named `CakeUz Data`
2. Open Extensions → Apps Script
3. Paste `Code.gs` (provided — 322 lines)
4. Run `initialiseSheets()` once — creates all sheet tabs with correct headers
5. Deploy as Web App (Execute as: Me, Access: Anyone)
6. Copy the deployed URL
7. In `index.html`, replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL
8. Upload updated `index.html` to GitHub

---

## 5. Google Sheets Structure (created by initialiseSheets())

| Sheet | Columns |
|---|---|
| Ingredients | id, name, stock, unit, cost |
| PriceHistory | ingId, date, cost |
| Recipes | id, name, yield, sellPrice |
| RecipeIngredients | recipeId, ingId, qty |
| Orders | id, customer, recipeId, qty, note, dueDate, status |
| ShoppingTrips | id, date, shop, total, receiptImg |
| ShoppingItems | tripId, ingId, qty, unitPrice |
| ActivityLog | type, action, detail, time |

---

## 6. Key Code Locations in index.html

| What | Where to find it |
|---|---|
| API URL to insert | `const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';` — top of `<script>` |
| Currency setting | `const CURRENCY = 'SGD';` — top of script |
| All app state | `const S = { ... }` object — ingredients, recipes, orders, shoppingTrips, priceHistory |
| Activity log array | `const activityLog = []` — separate from S |
| DB functions | `dbGet()`, `dbPost()` — top of script, after API_URL |
| Boot function | `async function init()` — bottom of script |
| Money formatter | `const fmtMoney = n => ...` — change here to update all currency display |
| Logo | Embedded as `data:image/png;base64,...` in the topbar `<img>` tag |
| Unit options | All unit `<select>` dropdowns — kg, g, mg, lb, oz, L, ml, fl oz, tsp, tbsp, cup, pcs |

---

## 7. Apps Script (Code.gs) — Function Reference

| Function | Triggered by |
|---|---|
| `initialiseSheets()` | Run once manually to create sheet structure |
| `loadAll()` | GET ?action=load — returns all data as JSON on page load |
| `addIngredient(data)` | POST action=addIngredient |
| `editIngredient(data)` | POST action=editIngredient |
| `deleteIngredient(data)` | POST action=deleteIngredient |
| `addRecipe(data)` | POST action=addRecipe |
| `deleteRecipe(data)` | POST action=deleteRecipe |
| `addOrder(data)` | POST action=addOrder |
| `updateOrderStatus(data)` | POST action=updateOrderStatus |
| `deleteOrder(data)` | POST action=deleteOrder |
| `addShoppingTrip(data)` | POST action=addShoppingTrip — also updates ingredient cost + stock |
| `deleteShoppingTrip(data)` | POST action=deleteShoppingTrip |
| `addLog(data)` | POST action=addLog |
| `clearLog()` | POST action=clearLog |

---

## 8. Known Limitations / Future Work

| Item | Notes |
|---|---|
| Receipt images in Sheets | receiptImg is stored as base64 string — large images may hit Apps Script payload limits. Consider storing in Google Drive and saving the file URL instead |
| No user authentication | Anyone with the URL can use the app. Add Google login or a simple PIN if needed |
| No stock deduction on order completion | When an order is marked Done, ingredient stock is not reduced. This needs to be added — deduct recipe ingredient quantities from stock on status change |
| Concurrent edits | Last write wins — no conflict resolution if two people edit simultaneously |
| Recipe editing | Currently recipes can only be added or deleted — an edit recipe function is not built yet |
| Mobile layout | Functional on mobile but tables can be cramped on small screens — a responsive card layout for mobile would improve UX |
| PDF/report export | Monthly profit summary export not yet built |

---

## 9. Files Delivered

| File | Purpose |
|---|---|
| `index.html` | Complete frontend app — upload to GitHub Pages |
| `Code.gs` | Google Apps Script backend — paste into Apps Script editor |

---

## 10. GitHub Pages Hosting

- Repository: `github.com/username/cakeuz`
- Live URL: `https://username.github.io/cakeuz`
- To update: upload new `index.html` via Add file → Upload files → Commit changes
- Changes go live within ~1 minute

---

*CakeUz by Asanka — Built May 2026*
