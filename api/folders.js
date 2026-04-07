import pool from './_db.js'

export default async function handler(req, res) {
  const id = req.query.id ? parseInt(req.query.id) : null

  // ── Collection routes (no id) ──────────────────────────────────────────────

  if (!id) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT f.*, COUNT(n.id)::int AS note_count
          FROM note_folders f
          LEFT JOIN notes n ON n.folder_id = f.id
          GROUP BY f.id
          ORDER BY f.sort_order, f.created_at
        `)
        res.json(result.rows)
      } catch (err) { res.status(500).json({ error: err.message }) }
      return
    }

    if (req.method === 'POST') {
      const { name, icon = '📁', color = 'default', sort_order = 0 } = req.body
      if (!name?.trim()) return res.status(400).json({ error: 'name required' })
      try {
        const result = await pool.query(
          'INSERT INTO note_folders (name, icon, color, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
          [name.trim(), icon, color, sort_order]
        )
        res.status(201).json({ ...result.rows[0], note_count: 0 })
      } catch (err) { res.status(500).json({ error: err.message }) }
      return
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Single-item routes (with id) ───────────────────────────────────────────

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'PUT') {
    const { name, icon, color, sort_order } = req.body
    try {
      const result = await pool.query(
        `UPDATE note_folders SET
           name = COALESCE($1, name),
           icon = COALESCE($2, icon),
           color = COALESCE($3, color),
           sort_order = COALESCE($4, sort_order)
         WHERE id = $5 RETURNING *`,
        [name?.trim() || null, icon || null, color || null,
         sort_order !== undefined ? sort_order : null, id]
      )
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json(result.rows[0])
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM note_folders WHERE id = $1 RETURNING id', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json({ deleted: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
