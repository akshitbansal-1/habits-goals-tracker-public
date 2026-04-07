import pool from './_db.js'

const VALID_CATEGORIES = ['meal', 'skincare', 'habit']

export default async function handler(req, res) {
  const id = req.query.id ? parseInt(req.query.id) : null

  // ── Collection routes (no id) ──────────────────────────────────────────────

  if (!id) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM items ORDER BY category, sort_order, id')
        res.json(result.rows)
      } catch (err) { res.status(500).json({ error: err.message }) }
      return
    }

    if (req.method === 'POST') {
      const { name, description, category, sort_order } = req.body
      if (!name || !category) return res.status(400).json({ error: 'name and category required' })
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` })
      }
      try {
        const result = await pool.query(
          `INSERT INTO items (name, description, category, sort_order, active)
           VALUES ($1, $2, $3, $4, true) RETURNING *`,
          [name.trim(), description || null, category, sort_order || 0]
        )
        res.status(201).json(result.rows[0])
      } catch (err) { res.status(500).json({ error: err.message }) }
      return
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Single-item routes (with id) ───────────────────────────────────────────

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'PUT') {
    const { name, description, category, sort_order, active } = req.body
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` })
    }
    try {
      const result = await pool.query(
        `UPDATE items SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           sort_order = COALESCE($4, sort_order),
           active = COALESCE($5, active)
         WHERE id = $6 RETURNING *`,
        [
          name ? name.trim() : null,
          description !== undefined ? description : null,
          category || null,
          sort_order !== undefined ? sort_order : null,
          active !== undefined ? active : null,
          id,
        ]
      )
      if (!result.rows.length) return res.status(404).json({ error: 'Item not found' })
      res.json(result.rows[0])
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const logCheck = await pool.query('SELECT COUNT(*) AS cnt FROM daily_logs WHERE item_id = $1', [id])
      const hasLogs = parseInt(logCheck.rows[0].cnt) > 0
      if (hasLogs) {
        const result = await pool.query('UPDATE items SET active = false WHERE id = $1 RETURNING *', [id])
        if (!result.rows.length) return res.status(404).json({ error: 'Item not found' })
        res.json({ deleted: false, deactivated: true, item: result.rows[0] })
      } else {
        const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id])
        if (!result.rows.length) return res.status(404).json({ error: 'Item not found' })
        res.json({ deleted: true, deactivated: false })
      }
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
