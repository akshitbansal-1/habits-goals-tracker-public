import pool from '../_db.js'

export default async function handler(req, res) {
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
  } else if (req.method === 'POST') {
    const { folder_id, title = 'Untitled', content = '' } = req.body
    if (!folder_id) return res.status(400).json({ error: 'folder_id required' })
    try {
      const result = await pool.query(
        'INSERT INTO notes (folder_id, title, content) VALUES ($1, $2, $3) RETURNING *',
        [folder_id, title.trim() || 'Untitled', content]
      )
      res.status(201).json(result.rows[0])
    } catch (err) { res.status(500).json({ error: err.message }) }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
