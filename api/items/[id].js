import pool from '../_db.js'

const VALID_CATEGORIES = ['meal', 'skincare', 'habit']

export default async function handler(req, res) {
  const id = parseInt(req.query.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'PUT') {
    const { name, description, category, sort_order, active } = req.body
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` })
    }
    try {
      const result = await pool.query(
        `UPDATE items
         SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           sort_order = COALESCE($4, sort_order),
           active = COALESCE($5, active)
         WHERE id = $6
         RETURNING *`,
        [
          name ? name.trim() : null,
          description !== undefined ? description : null,
          category || null,
          sort_order !== undefined ? sort_order : null,
          active !== undefined ? active : null,
          id,
        ]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' })
      res.json(result.rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      // Check if any logs exist for this item
      const logCheck = await pool.query(
        'SELECT COUNT(*) AS cnt FROM daily_logs WHERE item_id = $1',
        [id]
      )
      const hasLogs = parseInt(logCheck.rows[0].cnt) > 0

      if (hasLogs) {
        // Soft-delete to preserve history
        const result = await pool.query(
          'UPDATE items SET active = false WHERE id = $1 RETURNING *',
          [id]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' })
        res.json({ deleted: false, deactivated: true, item: result.rows[0] })
      } else {
        // Hard-delete if no logs
        const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id])
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' })
        res.json({ deleted: true, deactivated: false })
      }
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
