import pool from '../_db.js'

export default async function handler(req, res) {
  const id = parseInt(req.query.id)
  if (isNaN(id)) return res.status(400).json({ error: 'invalid id' })

  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json(result.rows[0])
    } catch (err) { res.status(500).json({ error: err.message }) }
  } else if (req.method === 'PUT') {
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
  } else if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING id', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
      res.json({ deleted: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
