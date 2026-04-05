import pool from './_db.js'

async function ensureTodayRows(client, date) {
  await client.query(
    `INSERT INTO daily_logs (item_id, log_date, completed)
     SELECT id, $1, false
     FROM items
     WHERE active = true
     ON CONFLICT (item_id, log_date) DO NOTHING`,
    [date]
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const date = req.query.date || new Date().toISOString().split('T')[0]
  const client = await pool.connect()
  try {
    await ensureTodayRows(client, date)
    const result = await client.query(
      `SELECT
         i.id, i.name, i.description, i.category, i.sort_order,
         dl.completed, dl.completed_at, dl.log_date
       FROM items i
       JOIN daily_logs dl ON dl.item_id = i.id AND dl.log_date = $1
       WHERE i.active = true
       ORDER BY i.category, i.sort_order`,
      [date]
    )
    res.json({ date, items: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}
