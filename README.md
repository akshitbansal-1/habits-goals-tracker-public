# Daily Tracker — Setup Guide

## Prerequisites
- Node.js (v16+)
- PostgreSQL running locally

---

## Step 1: Create the Database

```bash
psql -U postgres
```

Inside psql:
```sql
CREATE DATABASE daily_tracker;
\q
```

---

## Step 2: Run Schema

```bash
psql -U postgres -d daily_tracker -f schema.sql
```

---

## Step 3: Install Dependencies

```bash
npm install
```

---

## Step 4: Configure DB credentials (if not default)

Default config assumes:
- host: localhost
- port: 5432
- user: postgres
- password: postgres
- database: daily_tracker

To override, set env vars before running:
```bash
export DB_PASSWORD=yourpassword
export DB_USER=youruser
```

Or create a `.env` file and install dotenv (`npm install dotenv`), then add `require('dotenv').config()` to top of server.js.

---

## Step 5: Seed Initial Data

Run once to populate all meals, skincare, and habits:

```bash
node seed.js
```

You should see:
```
✅ Seeded 22 items successfully.
   Meals: 6
   Skincare: 9
   Habits: 8
```

---

## Step 6: Start the Server

```bash
npm start
```

Open in browser: **http://localhost:3000**

---

## Daily Use

- Open http://localhost:3000 each morning
- Check off items as you complete them through the day
- Click ▿ on any item to see criteria and description
- Navigate past 7 days using the date bar at top
- Refreshes automatically at midnight for a new day

---

## Customising Items

To add/edit/remove habits, edit `seed.js` and re-run `node seed.js`.

⚠️ Re-seeding clears all `daily_logs` history. To edit without losing history:
```sql
-- Add a new item
INSERT INTO items (name, description, category, sort_order)
VALUES ('New Habit', 'Description here. Criteria: What counts as done.', 'habit', 9);

-- Disable (hide) an item without deleting
UPDATE items SET active = false WHERE name = 'Item Name';
```

---

## Categories
- **meal** — your daily diet plan (6 items)
- **skincare** — AM/PM routine + daily checks (9 items)
- **habit** — daily behaviours and targets (8 items)
