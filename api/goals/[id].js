import pool from '../_db.js'

export default async function handler(req, res) {
  const id = parseInt(req.query.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'PUT') {
    const { title, description, identity_statement, why_it_matters, target_completions, deadline, status, linked_item_ids } = req.body

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const completedAt = status === 'completed' ? new Date() : null

      const result = await client.query(
        `UPDATE goals
         SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           identity_statement = COALESCE($3, identity_statement),
           why_it_matters = COALESCE($4, why_it_matters),
           target_completions = COALESCE($5, target_completions),
           deadline = COALESCE($6, deadline),
           status = COALESCE($7, status),
           completed_at = CASE WHEN $7 = 'completed' THEN $8 ELSE completed_at END
         WHERE id = $9
         RETURNING *`,
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

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'Goal not found' })
      }

      // Sync habit links if provided
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
      console.error(err)
      res.status(500).json({ error: err.message })
    } finally {
      client.release()
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING id', [id])
      if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' })
      res.json({ deleted: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
