# CakeUz — How to use

A step-by-step guide for running your home cake shop on
**https://asanka-a.github.io/CakeUz/**.

> The app saves to Supabase (your live database) the moment you click Save.
> A copy of everything is backed up automatically twice a night — once to
> your Google Sheet, once to a JSON file in GitHub.

---

## 1. The six tabs

| Tab | What it's for |
|---|---|
| **Dashboard** | Revenue, profit and quick alerts at a glance |
| **Inventory** | Every ingredient you have, with stock + current cost |
| **Shopping** | Log a real-world shopping trip (auto-updates ingredient prices and stock) |
| **Recipes** | Define what goes into each cake + its default batch costs |
| **Orders** | Customer orders, costing snapshot, profit per order |
| **Recipe Cost Estimator** *(formerly "Pricing")* | "What should I charge?" tool |
| **Activity Log** | Searchable audit trail of every change ever made |

---

## 2. Daily workflow at a glance

```
Buy something  →  Shopping → New trip       (or Inventory → Edit → "Log a new purchase")
Make a recipe  →  Recipes  → + Add recipe   (or Clone an existing one)
Take an order  →  Orders   → + New order
Bake it        →  Orders   → ✓ Done         (deducts stock automatically)
End of month   →  Dashboard for profit; Activity Log → search to audit
```

---

## 3. How to do each thing

### 3.1 Add a new ingredient (first time you buy it)

1. **Inventory** tab → **+ Add ingredient**
2. Fill in:
   - **Name** — e.g. *Cake flour*
   - **Storage unit** — pick the unit you'll use to *count* it in your recipes (kg, g, ml, L, pcs…)
   - **Quantity bought** — how much of that unit you have now (e.g. `1` for 1 kg)
   - **Total price** — what you paid in SGD for that quantity
3. A helper line shows the per-unit cost it'll save (e.g. *"Per-unit cost: SGD 2.85 per kg"*) — sanity-check this before saving
4. **Add ingredient**

### 3.2 Edit an ingredient (correct a name, adjust stock, log a new purchase)

1. **Inventory** → **Edit** on the row
2. Top section — direct edit of **Name / Stock / Cost** (use this for typo fixes or stock-count corrections)
3. Bottom section — **"Or log a new purchase"** — fill in *Bought qty* and *Total price* and the system will:
   - **Add** the bought qty to current stock
   - **Recalculate** the per-unit cost from the new total price
   - Add a row to the price history chart
4. **Save changes**

### 3.3 See the price history of an ingredient

**Inventory** → **Prices** button on the row. Shows a chart + list of every price change for that one ingredient.

### 3.4 See the full audit log of one ingredient (or recipe / order)

Any row's **Log** button (or "View change log" inside the recipe View modal) opens a modal listing every add/edit/delete that touched that one item, with old → new values.

### 3.5 Log a shopping trip (the full-batch way)

Use this when you go shopping and want to record several items at once.

1. **Shopping** tab → **+ New trip**
2. **Date**, **Shop name**
3. *(Optional)* Upload a photo of the receipt
4. For each item:
   - Pick the ingredient
   - **Qty** (in any compatible unit — pick from the dropdown)
   - **Total price** for that purchase
5. **Save trip**

When you save, the system:
- Adds the qty to that ingredient's stock
- Updates the ingredient's per-unit cost from your total price
- Appends a row to the price history
- Logs an activity entry

### 3.6 Create a recipe

1. **Recipes** tab → **+ Add recipe**
2. *(Optional)* **Start from existing recipe** dropdown — pick a similar recipe to pre-fill everything; rename and tweak
3. **Recipe name** — e.g. *Chocolate Fudge Cake*
4. **Yield** — free text, e.g. *"1 whole cake (8 inch)"*
5. **Suggested sell price per unit** — what you usually charge for one of these
6. **Batch costs (defaults for new orders):**
   - **Labour** in SGD — flat per order (typically $20)
   - **Electricity** in SGD — flat per order (~$5)
   - **Packing / unit** in SGD — per cake (~$2)
7. **Ingredients** — for each ingredient, pick it, enter qty, pick the unit
   *Example: 250 g of flour even though flour is stored in kg — the system converts.*
8. **Save recipe**

### 3.7 Clone an existing recipe

**Recipes** → **Clone** button on the row → form opens pre-filled with name *"Copy of …"* and all ingredient lines copied. Tweak and **Save**.

(You can also do this inside Add Recipe via the "Start from existing recipe" dropdown — same effect.)

### 3.8 Edit a recipe

**Recipes** → **Edit** on the row. Same form as Add. **Save changes**.

### 3.9 Delete a recipe

**Recipes** → **Del** on the row → confirm.
*Orders previously placed using this recipe keep their cost snapshot, so deleting a recipe does not corrupt past orders.*

### 3.10 Place an order

1. **Orders** tab → **+ New order**
2. **Customer** — Name, Phone, optionally Email, Address
3. **Recipe** — pick from your saved recipes. The cost fields below auto-fill from that recipe.
4. **Quantity** — number of cakes
5. **Due date**, **Note** (special requests)
6. **Pricing & cost** section — everything is pre-filled from the recipe and editable per order:
   - **Sell price / unit** — what you're charging this customer
   - **Labour**, **Electricity**, **Packing / unit** — adjust if this order took more or less effort
7. **Transport** — fill in if you're charging the customer for delivery. *Transport is invoiced separately and does not count toward cake profit.*
8. The helper box at the bottom shows live: ingredient cost, batch costs, total cake cost, cake revenue, cake profit and margin, and the invoice total (cake + transport).
9. **Place order**

### 3.11 Mark an order Done (and deduct stock)

**Orders** → **✓ Done** on the pending row.

The system:
- Subtracts the ingredient quantities (from the order's snapshot) from your inventory
- Sets the completion date to today
- Moves the order to the completed section of the list

If you don't have enough stock for an ingredient, you get a warning — you can still proceed (stock goes negative) so it never blocks you, but the warning tells you what's short.

### 3.12 Undo a completed order

**Orders** → **Undo** on a completed row. Status goes back to pending and the stock is restored.

### 3.13 View an order's full breakdown

**Orders** → **View** on any row. Shows:
- Customer details
- Recipe + qty + due date + status
- Ingredient lines as they were when the order was placed (with the prices at that moment)
- Labour, Electricity, Packing
- Total cake cost, sell, cake profit & margin
- Separated below: Transport and the **Invoice total** (cake revenue + transport — what the customer pays)

### 3.14 Delete an order

**Orders** → **Del** → confirm. *Tip: prefer Undo + edit over Delete; deletions remove the order forever (but the change is still in the Activity Log).*

### 3.15 Use the Recipe Cost Estimator

For "what should I charge?" exploration — not tied to any order.

**Recipe Cost Estimator** tab → pick a recipe → set Overhead %, Labour, Target margin %. The right-hand panel shows the suggested sell price to hit your margin and your current actual margin.

### 3.16 Search the audit log

**Activity Log** tab:
- **Search box** filters by any keyword (ingredient name, customer name, etc.)
- **Chip filters** at the top: All / Ingredients / Recipes / Orders / Trips
- Each entry shows old → new in red/green for edits

### 3.17 Clear the log

**Activity Log** → **Clear log** at the bottom (red button) → confirm. *Use rarely — the log is your audit trail.*

---

## 4. The modal "Discard unsaved changes?" prompt

Any form modal that you've typed into will ask before closing if you:
- Click outside the modal
- Press **Esc**
- Click **Cancel**

This is intentional — protects against accidental data loss in a half-filled form. If you've typed nothing, it closes silently.

---

## 5. Where your data lives

| Location | What |
|---|---|
| **Supabase** (live) | Source of truth. Open project dashboard via supabase.com to browse rows. |
| **Google Sheet** (nightly) | Apps Script `backupFromSupabase` overwrites the Sheet tabs every night at 23:00 SGT. There's a `_backup_log` tab showing when each run completed. |
| **GitHub `backups/` folder** (nightly) | A timestamped JSON file with every table, committed at 23:15 SGT. View at `github.com/asanka-a/CakeUz/tree/main/backups`. |

If something goes wrong with Supabase: open the most recent file in either backup location and you have a complete snapshot.

---

## 6. Common questions

**Q: I changed the price of Sugar. Will my completed orders show the new price?**
No — each order snapshots ingredient prices at the moment it was placed. Dashboard profit numbers stay historically accurate.

**Q: I deleted an ingredient by mistake. Can I recover?**
The deletion itself is logged in Activity Log. You'd re-add the ingredient (with a fresh ID) and re-edit any recipe that used it. Future fix idea: a "Soft delete with restore" mode.

**Q: My order shows margin in red — what does that mean?**
Margin <20% red, 20–40% amber, ≥40% green. Below 20% means after labour/electricity/packing/ingredient cost you're keeping less than 20¢ on every dollar — usually a signal to either raise the sell price or look for ingredients you can buy cheaper.

**Q: Transport shows up in the invoice total but not the profit. Why?**
Because transport is a pass-through — you're billing the customer for delivery, not earning margin on it. Keeps cake-cost math honest.

**Q: The page is slow to open.**
First load fetches from Supabase (Singapore) — usually <500 ms on broadband. If it's much slower, your connection is the bottleneck, not the app.

**Q: How do I see who changed what?**
Activity Log tab. For history of one specific ingredient/recipe/order, click the **Log** button on its row (or the *View change log* button inside Recipe View).

---

## 7. Asking for help

When you want to add a feature or report something odd, describe:
1. **What you were doing** ("I was placing an order for…")
2. **What you expected to happen**
3. **What actually happened** (and any error toast that appeared in the bottom-right)

Screenshots are great if you can include them.
