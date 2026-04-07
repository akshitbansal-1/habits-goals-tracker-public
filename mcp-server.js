import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import pg from 'pg'
import 'dotenv/config'

const { Pool, types } = pg
types.setTypeParser(1082, (val) => val)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const TOOLS = [
  {
    name: 'get_habits_for_date',
    description: 'Get all habits and their completion status for a specific date.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
      },
      required: ['date'],
    },
  },
  {
    name: 'get_history',
    description: 'Get daily habit completion summary for the last N days. Returns completion counts and percentage per day.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Number of days to look back (1-365). Default 7.' },
      },
    },
  },
  {
    name: 'get_stats',
    description: 'Get habit completion statistics broken down by category (meal, skincare, habit) for the last N days.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Number of days to look back (1-365). Default 7.' },
      },
    },
  },
  {
    name: 'get_goals',
    description: 'Get all goals with their progress (actual vs target completions), status, deadline, and linked habit IDs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_items',
    description: 'Get the full list of all habits with their IDs, names, categories, and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_habit_completions',
    description: 'Get the daily completion history for a specific habit by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'integer', description: 'The habit ID (from get_items).' },
        days: { type: 'integer', description: 'Number of days to look back (1-365). Default 30.' },
      },
      required: ['item_id'],
    },
  },
]

async function executeTool(toolName, toolInput) {
  const client = await pool.connect()
  try {
    switch (toolName) {
      case 'get_habits_for_date': {
        const result = await client.query(
          `SELECT i.id, i.name, i.description, i.category, i.sort_order,
                  dl.completed, dl.completed_at, dl.log_date
           FROM items i
           JOIN daily_logs dl ON dl.item_id = i.id AND dl.log_date = $1
           WHERE i.active = true
           ORDER BY i.category, i.sort_order`,
          [toolInput.date]
        )
        return { date: toolInput.date, items: result.rows }
      }
      case 'get_history': {
        const days = Math.min(Math.max(parseInt(toolInput.days) || 7, 1), 365)
        const result = await client.query(
          `SELECT dl.log_date,
                  COUNT(*) FILTER (WHERE dl.completed = true) AS completed_count,
                  COUNT(*) AS total_count,
                  ROUND(100.0 * COUNT(*) FILTER (WHERE dl.completed = true) / NULLIF(COUNT(*), 0)) AS pct
           FROM daily_logs dl
           JOIN items i ON i.id = dl.item_id AND i.active = true
           WHERE dl.log_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
           GROUP BY dl.log_date ORDER BY dl.log_date DESC`,
          [days]
        )
        return result.rows
      }
      case 'get_stats': {
        const days = Math.min(Math.max(parseInt(toolInput.days) || 7, 1), 365)
        const result = await client.query(
          `SELECT i.category,
                  COUNT(*) FILTER (WHERE dl.completed = true) AS completed,
                  COUNT(*) AS total
           FROM daily_logs dl
           JOIN items i ON i.id = dl.item_id AND i.active = true
           WHERE dl.log_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
           GROUP BY i.category`,
          [days]
        )
        return { weekly: result.rows }
      }
      case 'get_goals': {
        const result = await client.query(
          `SELECT g.*,
             COALESCE(COUNT(dl.id), 0)::int AS actual_completions,
             COALESCE(ARRAY_AGG(DISTINCT hgl.item_id) FILTER (WHERE hgl.item_id IS NOT NULL), '{}') AS linked_item_ids
           FROM goals g
           LEFT JOIN habit_goal_links hgl ON hgl.goal_id = g.id
           LEFT JOIN daily_logs dl ON dl.item_id = hgl.item_id
             AND dl.log_date >= g.created_at::date AND dl.completed = true
           GROUP BY g.id
           ORDER BY CASE g.status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, g.created_at DESC`
        )
        return result.rows
      }
      case 'get_items': {
        const result = await client.query('SELECT * FROM items ORDER BY category, sort_order, id')
        return result.rows
      }
      case 'get_habit_completions': {
        const item_id = parseInt(toolInput.item_id)
        const days = Math.min(Math.max(parseInt(toolInput.days) || 30, 1), 365)
        const result = await client.query(
          `SELECT dl.log_date, dl.completed, dl.completed_at
           FROM daily_logs dl
           WHERE dl.item_id = $1
             AND dl.log_date >= CURRENT_DATE - ($2 * INTERVAL '1 day')
           ORDER BY dl.log_date DESC`,
          [item_id, days]
        )
        return result.rows
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  } finally {
    client.release()
  }
}

const server = new Server(
  { name: 'habits-tracker', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: toolInput } = request.params
  try {
    const result = await executeTool(name, toolInput || {})
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
