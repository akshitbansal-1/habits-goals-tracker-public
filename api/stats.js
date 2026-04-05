import pool from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365)
  const client = await pool.connect()
  try {
    const catStats = await client.query(
      `SELECT
         i.category,
         COUNT(*) FILTER (WHERE dl.completed = true) AS completed,
         COUNT(*) AS total
       FROM daily_logs dl
       JOIN items i ON i.id = dl.item_id AND i.active = true
       WHERE dl.log_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
       GROUP BY i.category`,
      [days]
    )
    res.json({ weekly: catStats.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}
