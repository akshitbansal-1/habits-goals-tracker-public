import pool from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { item_id, date } = req.body
  if (!item_id || !date) return res.status(400).json({ error: 'item_id and date required' })

  const client = await pool.connect()
  try {
    const current = await client.query(
      'SELECT completed FROM daily_logs WHERE item_id = $1 AND log_date = $2',
      [item_id, date]
    )
    if (current.rows.length === 0) return res.status(404).json({ error: 'Log not found' })

    const newVal = !current.rows[0].completed
    const completedAt = newVal ? new Date() : null

    await client.query(
      'UPDATE daily_logs SET completed = $1, completed_at = $2 WHERE item_id = $3 AND log_date = $4',
      [newVal, completedAt, item_id, date]
    )
    res.json({ item_id, date, completed: newVal, completed_at: completedAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}
