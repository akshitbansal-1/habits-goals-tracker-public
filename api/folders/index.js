import pool from '../_db.js'

export default async function handler(req, res) {
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
  } else if (req.method === 'POST') {
    const { name, icon = '📁', color = 'default', sort_order = 0 } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name required' })
    try {
      const result = await pool.query(
        'INSERT INTO note_folders (name, icon, color, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
        [name.trim(), icon, color, sort_order]
      )
      res.status(201).json({ ...result.rows[0], note_count: 0 })
    } catch (err) { res.status(500).json({ error: err.message }) }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
