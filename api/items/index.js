import pool from '../_db.js'

const VALID_CATEGORIES = ['meal', 'skincare', 'habit']

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT * FROM items ORDER BY category, sort_order, id'
      )
      res.json(result.rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
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
         VALUES ($1, $2, $3, $4, true)
         RETURNING *`,
        [name.trim(), description || null, category, sort_order || 0]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
