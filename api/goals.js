import pool from './_db.js'

export default async function handler(req, res) {
  const id = req.query.id ? parseInt(req.query.id) : null

  // ── Collection routes (no id) ──────────────────────────────────────────────

  if (!id) {
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
      } catch (err) { res.status(500).json({ error: err.message }) }
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
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
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
        res.status(500).json({ error: err.message })
      } finally { client.release() }
      return
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Single-item routes (with id) ───────────────────────────────────────────

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'PUT') {
    const { title, description, identity_statement, why_it_matters, target_completions, deadline, status, linked_item_ids } = req.body
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const completedAt = status === 'completed' ? new Date() : null
      const result = await client.query(
        `UPDATE goals SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           identity_statement = COALESCE($3, identity_statement),
           why_it_matters = COALESCE($4, why_it_matters),
           target_completions = COALESCE($5, target_completions),
           deadline = COALESCE($6, deadline),
           status = COALESCE($7, status),
           completed_at = CASE WHEN $7 = 'completed' THEN $8 ELSE completed_at END
         WHERE id = $9 RETURNING *`,
        [
          title ? title.trim() : null,
          description !== undefined ? description : null,
          identity_statement !== undefined ? identity_statement : null,
          why_it_matters !== undefined ? why_it_matters : null,
          target_completions || null,
          deadline !== undefined ? deadline : null,
          status || null,
          completedAt,
          id,
        ]
      )
      if (!result.rows.length) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'Goal not found' })
      }
      if (Array.isArray(linked_item_ids)) {
        await client.query('DELETE FROM habit_goal_links WHERE goal_id = $1', [id])
        if (linked_item_ids.length > 0) {
          const values = linked_item_ids.map((_, i) => `($1, $${i + 2})`).join(', ')
          await client.query(
            `INSERT INTO habit_goal_links (goal_id, item_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            [id, ...linked_item_ids]
          )
        }
      }
      await client.query('COMMIT')
      res.json(result.rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      res.status(500).json({ error: err.message })
    } finally { client.release() }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING id', [id])
      if (!result.rows.length) return res.status(404).json({ error: 'Goal not found' })
      res.json({ deleted: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
