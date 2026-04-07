import pool from '../_db.js'

export default async function handler(req, res) {
  const id = parseInt(req.query.id)
  if (isNaN(id)) return res.status(400).json({ error: 'invalid id' })

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
  } else if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM note_folders WHERE id = $1 RETURNING id', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json({ deleted: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
