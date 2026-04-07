import pool from './_db.js'

export default async function handler(req, res) {
  const id = req.query.id ? parseInt(req.query.id) : null

  // ── Collection routes (no id) ──────────────────────────────────────────────

  if (!id) {
    if (req.method === 'GET') {
      const folder_id = parseInt(req.query.folder_id)
      if (isNaN(folder_id)) return res.status(400).json({ error: 'folder_id required' })
      try {
        const result = await pool.query(
          `SELECT id, folder_id, title, sort_order, created_at, updated_at
           FROM notes WHERE folder_id = $1 ORDER BY updated_at DESC`,
          [folder_id]
        )
        res.json(result.rows)
      } catch (err) { res.status(500).json({ error: err.message }) }
      return
    }

    if (req.method === 'POST') {
      const { folder_id, title = 'Untitled', content = '' } = req.body
      if (!folder_id) return res.status(400).json({ error: 'folder_id required' })
      try {
        const result = await pool.query(
          'INSERT INTO notes (folder_id, title, content) VALUES ($1, $2, $3) RETURNING *',
          [folder_id, title.trim() || 'Untitled', content]
        )
        res.status(201).json(result.rows[0])
      } catch (err) { res.status(500).json({ error: err.message }) }
      return
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Single-item routes (with id) ───────────────────────────────────────────

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json(result.rows[0])
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  if (req.method === 'PUT') {
    const { title, content } = req.body
    try {
      const result = await pool.query(
        `UPDATE notes SET
           title = COALESCE($1, title),
           content = COALESCE($2, content)
         WHERE id = $3 RETURNING *`,
        [title !== undefined ? (title.trim() || 'Untitled') : null,
         content !== undefined ? content : null, id]
      )
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json(result.rows[0])
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING id', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json({ deleted: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
