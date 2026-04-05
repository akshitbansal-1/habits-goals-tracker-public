import pool from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Sanitize days to prevent SQL injection — clamp to valid integer range
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365)
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT
         dl.log_date,
         COUNT(*) FILTER (WHERE dl.completed = true) AS completed_count,
         COUNT(*) AS total_count,
         ROUND(100.0 * COUNT(*) FILTER (WHERE dl.completed = true) / NULLIF(COUNT(*), 0)) AS pct
       FROM daily_logs dl
       JOIN items i ON i.id = dl.item_id AND i.active = true
       WHERE dl.log_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
       GROUP BY dl.log_date
       ORDER BY dl.log_date DESC`,
      [days]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}
