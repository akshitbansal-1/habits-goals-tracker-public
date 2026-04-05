# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server at http://localhost:5173 (proxies /api to :3000)
node server.js     # Start Express dev server at http://localhost:3000 (run alongside npm run dev)
npm run build      # TypeScript check + Vite production build → dist/
npm run preview    # Preview the production build locally
vercel dev         # Alternative: runs frontend + Vercel API functions together (needs Vercel CLI)
```

**Local dev setup:** Run `node server.js` in one terminal and `npm run dev` in another. The Vite dev server at :5173 proxies all `/api` requests to Express at :3000.

No test setup exists in this project.

## Environment

Requires a `.env` file with:
```
DATABASE_URL=postgres://...
```

The app uses Supabase (cloud PostgreSQL). SSL is enabled with `rejectUnauthorized: false`.
Use the Supabase **pooler URL** (port 6543) for `DATABASE_URL`, not the direct connection URL (port 5432).

When deploying to Vercel: add `DATABASE_URL` in the Vercel project dashboard under Environment Variables.

## Architecture

**Frontend:** Vite + React 18 + TypeScript + Tailwind CSS  
**Backend (dev):** Express `server.js` (mirrors all Vercel function routes)  
**Backend (prod):** Vercel serverless functions in `/api/` (Node.js ESM)  
**Database:** PostgreSQL via Supabase

### Frontend (`src/`)

- `main.tsx` — App entry, ThemeProvider + React Query + React Router
- `App.tsx` — Layout shell with sticky `Header`
- `pages/` — 4 pages: `DashboardPage`, `AnalyticsPage`, `GoalsPage`, `ManagePage`
- `components/` — Organized by feature: `layout/`, `dashboard/`, `analytics/`, `goals/`, `manage/`, `ui/`
- `hooks/` — React Query hooks: `useToday`, `useHistory`, `useStats`, `useItems`, `useGoals`
- `lib/api.ts` — Typed `fetch` wrappers for all API endpoints
- `lib/quotes.ts` — Static motivational quotes array (~30 entries)
- `lib/theme.tsx` — Theme context (`useTheme`, `useChartColors`); dark/light mode via CSS vars
- `types/index.ts` — Shared TypeScript interfaces

### Theming

Colors are defined as CSS custom properties in `src/index.css`:
- `:root` = dark mode (default)
- `:root.light` = light mode (toggled by adding `light` class to `<html>`)

Tailwind colors map to CSS vars: `bg-bg`, `bg-bg-card`, `border-bg-border`, `text-primary`, `text-text-muted`.
Theme is persisted to `localStorage`. Toggle button is in the `Header` component.

**Font:** Inter (body), IBM Plex Mono (monospace labels/code elements)

### Backend (`api/` — Vercel functions)

All functions use ES module syntax (`import`/`export default`). Shared DB pool in `api/_db.js`.
The `server.js` Express file mirrors all these routes exactly for local development.

| File | Method | Route | Notes |
|------|--------|-------|-------|
| `api/today.js` | GET | `/api/today?date=` | Auto-creates daily_logs via ensureTodayRows |
| `api/toggle.js` | POST | `/api/toggle` | Toggles completion for `{ item_id, date }` |
| `api/history.js` | GET | `/api/history?days=` | Days clamped 1–365 |
| `api/stats.js` | GET | `/api/stats?days=` | Category-level stats |
| `api/health.js` | GET | `/api/health` | DB connectivity check |
| `api/items/index.js` | GET+POST | `/api/items` | List all items / create item |
| `api/items/[id].js` | PUT+DELETE | `/api/items/:id` | Update / soft-or-hard delete |
| `api/goals/index.js` | GET+POST | `/api/goals` | List goals with computed progress / create goal |
| `api/goals/[id].js` | PUT+DELETE | `/api/goals/:id` | Update (syncs habit links) / delete |

**Date handling:** `api/_db.js` sets `types.setTypeParser(1082, val => val)` so PostgreSQL `DATE` columns return as `'YYYY-MM-DD'` strings rather than JavaScript `Date` objects. The same parser is applied in `server.js`.

### Database

**`schema.sql`** — Original tables: `items` and `daily_logs`  
**`migrations/001_add_goals.sql`** — Run once against Supabase to add `goals` and `habit_goal_links` tables

Tables:
- `items` — Master habit list: `name`, `description`, `category` (meal|skincare|habit), `sort_order`, `active`
- `daily_logs` — Per-day completion records: unique on `(item_id, log_date)`
- `goals` — Goal tracking: `title`, `identity_statement`, `why_it_matters`, `target_completions`, `deadline`, `status`
- `habit_goal_links` — Many-to-many: links habits to goals for progress counting

**Goal progress** is computed via SQL JOIN at query time — counts completions of linked habits from the goal's `created_at` date.

### Deployment (Vercel)

`vercel.json` routes `/api/*` to serverless functions and all other paths to `index.html` (SPA fallback).

```bash
vercel deploy --prod   # Deploy to production
```
