import pool from '../_db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT
           g.*,
           COALESCE(COUNT(dl.id), 0)::int AS actual_completions,
           COALESCE(
             ARRAY_AGG(DISTINCT hgl.item_id) FILTER (WHERE hgl.item_id IS NOT NULL),
             '{}'
           ) AS linked_item_ids
         FROM goals g
         LEFT JOIN habit_goal_links hgl ON hgl.goal_id = g.id
         LEFT JOIN daily_logs dl
           ON dl.item_id = hgl.item_id
           AND dl.log_date >= g.created_at::date
           AND dl.completed = true
         GROUP BY g.id
         ORDER BY
           CASE g.status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,
           g.created_at DESC`
      )
      res.json(result.rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    return
  }

  if (req.method === 'POST') {
    const { title, description, identity_statement, why_it_matters, target_completions, deadline, linked_item_ids } = req.body
    if (!title) return res.status(400).json({ error: 'title required' })
    if (!target_completions || target_completions < 1) {
      return res.status(400).json({ error: 'target_completions must be a positive integer' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const goalResult = await client.query(
        `INSERT INTO goals (title, description, identity_statement, why_it_matters, target_completions, deadline)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title.trim(), description || null, identity_statement || null, why_it_matters || null, target_completions, deadline || null]
      )
      const goal = goalResult.rows[0]

      if (Array.isArray(linked_item_ids) && linked_item_ids.length > 0) {
        const values = linked_item_ids.map((_, i) => `($1, $${i + 2})`).join(', ')
        await client.query(
          `INSERT INTO habit_goal_links (goal_id, item_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [goal.id, ...linked_item_ids]
        )
      }

      await client.query('COMMIT')
      res.status(201).json({ ...goal, linked_item_ids: linked_item_ids || [], actual_completions: 0 })
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(err)
      res.status(500).json({ error: err.message })
    } finally {
      client.release()
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
