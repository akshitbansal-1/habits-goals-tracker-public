import express from 'express'
import pg from 'pg'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { Pool, types } = pg

// Return DATE columns as 'YYYY-MM-DD' strings instead of Date objects
types.setTypeParser(1082, (val) => val)

const app = express()
const PORT = process.env.PORT || 3000

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// ─── Today ────────────────────────────────────────────────────────────────────

async function ensureTodayRows(client, date) {
  await client.query(`
    INSERT INTO daily_logs (item_id, log_date, completed)
    SELECT id, $1, false FROM items WHERE active = true
    ON CONFLICT (item_id, log_date) DO NOTHING
  `, [date])
}

app.get('/api/today', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  const client = await pool.connect()
  try {
    await ensureTodayRows(client, date)
    const result = await client.query(`
      SELECT i.id, i.name, i.description, i.category, i.sort_order,
             dl.completed, dl.completed_at, dl.log_date
      FROM items i
      JOIN daily_logs dl ON dl.item_id = i.id AND dl.log_date = $1
      WHERE i.active = true
      ORDER BY i.category, i.sort_order
    `, [date])
    res.json({ date, items: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

// ─── Toggle ───────────────────────────────────────────────────────────────────

app.post('/api/toggle', async (req, res) => {
  const { item_id, date } = req.body
  if (!item_id || !date) return res.status(400).json({ error: 'item_id and date required' })
  const client = await pool.connect()
  try {
    const current = await client.query(
      'SELECT completed FROM daily_logs WHERE item_id = $1 AND log_date = $2',
      [item_id, date]
    )
    if (current.rows.length === 0) return res.status(404).json({ error: 'Log not found' })
    const newVal = !current.rows[0].completed
    const completedAt = newVal ? new Date() : null
    await client.query(
      'UPDATE daily_logs SET completed = $1, completed_at = $2 WHERE item_id = $3 AND log_date = $4',
      [newVal, completedAt, item_id, date]
    )
    res.json({ item_id, date, completed: newVal, completed_at: completedAt })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

// ─── History ──────────────────────────────────────────────────────────────────

app.get('/api/history', async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365)
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT dl.log_date,
             COUNT(*) FILTER (WHERE dl.completed = true) AS completed_count,
             COUNT(*) AS total_count,
             ROUND(100.0 * COUNT(*) FILTER (WHERE dl.completed = true) / NULLIF(COUNT(*), 0)) AS pct
      FROM daily_logs dl
      JOIN items i ON i.id = dl.item_id AND i.active = true
      WHERE dl.log_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
      GROUP BY dl.log_date ORDER BY dl.log_date DESC
    `, [days])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

// ─── Stats ────────────────────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365)
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT i.category,
             COUNT(*) FILTER (WHERE dl.completed = true) AS completed,
             COUNT(*) AS total
      FROM daily_logs dl
      JOIN items i ON i.id = dl.item_id AND i.active = true
      WHERE dl.log_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
      GROUP BY i.category
    `, [days])
    res.json({ weekly: result.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message })
  }
})

// ─── Items CRUD ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['meal', 'skincare', 'habit']

app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY category, sort_order, id')
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/items', async (req, res) => {
  const { name, description, category, sort_order } = req.body
  if (!name || !category) return res.status(400).json({ error: 'name and category required' })
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'invalid category' })
  try {
    const result = await pool.query(
      'INSERT INTO items (name, description, category, sort_order, active) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [name.trim(), description || null, category, sort_order || 0]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/items/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const { name, description, category, sort_order, active } = req.body
  if (category && !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'invalid category' })
  try {
    const result = await pool.query(
      `UPDATE items SET
         name = COALESCE($1, name), description = COALESCE($2, description),
         category = COALESCE($3, category), sort_order = COALESCE($4, sort_order),
         active = COALESCE($5, active)
       WHERE id = $6 RETURNING *`,
      [name ? name.trim() : null, description !== undefined ? description : null,
       category || null, sort_order !== undefined ? sort_order : null,
       active !== undefined ? active : null, id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/items/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const logCheck = await pool.query('SELECT COUNT(*) AS cnt FROM daily_logs WHERE item_id = $1', [id])
    if (parseInt(logCheck.rows[0].cnt) > 0) {
      const result = await pool.query('UPDATE items SET active = false WHERE id = $1 RETURNING *', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json({ deleted: false, deactivated: true, item: result.rows[0] })
    } else {
      const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json({ deleted: true, deactivated: false })
    }
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Goals CRUD ───────────────────────────────────────────────────────────────

const GOALS_QUERY = `
  SELECT g.*,
    COALESCE(COUNT(dl.id), 0)::int AS actual_completions,
    COALESCE(ARRAY_AGG(DISTINCT hgl.item_id) FILTER (WHERE hgl.item_id IS NOT NULL), '{}') AS linked_item_ids
  FROM goals g
  LEFT JOIN habit_goal_links hgl ON hgl.goal_id = g.id
  LEFT JOIN daily_logs dl ON dl.item_id = hgl.item_id
    AND dl.log_date >= g.created_at::date AND dl.completed = true
  GROUP BY g.id
  ORDER BY CASE g.status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, g.created_at DESC
`

app.get('/api/goals', async (req, res) => {
  try {
    const result = await pool.query(GOALS_QUERY)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/goals', async (req, res) => {
  const { title, description, identity_statement, why_it_matters, target_completions, deadline, linked_item_ids } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  if (!target_completions || target_completions < 1) return res.status(400).json({ error: 'target_completions must be positive' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const goalResult = await client.query(
      'INSERT INTO goals (title, description, identity_statement, why_it_matters, target_completions, deadline) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title.trim(), description || null, identity_statement || null, why_it_matters || null, target_completions, deadline || null]
    )
    const goal = goalResult.rows[0]
    if (Array.isArray(linked_item_ids) && linked_item_ids.length > 0) {
      const vals = linked_item_ids.map((_, i) => `($1, $${i + 2})`).join(', ')
      await client.query(`INSERT INTO habit_goal_links (goal_id, item_id) VALUES ${vals} ON CONFLICT DO NOTHING`, [goal.id, ...linked_item_ids])
    }
    await client.query('COMMIT')
    res.status(201).json({ ...goal, linked_item_ids: linked_item_ids || [], actual_completions: 0 })
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

app.put('/api/goals/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const { title, description, identity_statement, why_it_matters, target_completions, deadline, status, linked_item_ids } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const completedAt = status === 'completed' ? new Date() : null
    const result = await client.query(
      `UPDATE goals SET
         title = COALESCE($1, title), description = COALESCE($2, description),
         identity_statement = COALESCE($3, identity_statement), why_it_matters = COALESCE($4, why_it_matters),
         target_completions = COALESCE($5, target_completions), deadline = COALESCE($6, deadline),
         status = COALESCE($7, status),
         completed_at = CASE WHEN $7 = 'completed' THEN $8 ELSE completed_at END
       WHERE id = $9 RETURNING *`,
      [title ? title.trim() : null, description !== undefined ? description : null,
       identity_statement !== undefined ? identity_statement : null, why_it_matters !== undefined ? why_it_matters : null,
       target_completions || null, deadline !== undefined ? deadline : null,
       status || null, completedAt, id]
    )
    if (!result.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }) }
    if (Array.isArray(linked_item_ids)) {
      await client.query('DELETE FROM habit_goal_links WHERE goal_id = $1', [id])
      if (linked_item_ids.length > 0) {
        const vals = linked_item_ids.map((_, i) => `($1, $${i + 2})`).join(', ')
        await client.query(`INSERT INTO habit_goal_links (goal_id, item_id) VALUES ${vals} ON CONFLICT DO NOTHING`, [id, ...linked_item_ids])
      }
    }
    await client.query('COMMIT')
    res.json(result.rows[0])
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

app.delete('/api/goals/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const result = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING id', [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── SPA fallback ─────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n🚀 Habit Tracker API running at http://localhost:${PORT}`)
  console.log(`   Run "npm run dev" to start the Vite frontend at http://localhost:5173`)
})
