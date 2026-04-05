import pg from 'pg'
import 'dotenv/config'

const { Pool, types } = pg

// Return DATE columns as 'YYYY-MM-DD' strings instead of JavaScript Date objects
// Prevents issues with timezone shifts when formatting dates on the frontend
types.setTypeParser(1082, (val) => val)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export default pool
