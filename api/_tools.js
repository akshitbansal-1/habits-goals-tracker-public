// Shared tool definitions and execution logic for the Ask feature.
// Used by both api/ask.js (Vercel) and server.js (Express dev server).

export const TOOLS = [
  {
    name: 'get_habits_for_date',
    description: 'Get all habits and their completion status for a specific date.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
      },
      required: ['date'],
    },
  },
  {
    name: 'get_history',
    description:
      'Get daily habit completion summary for the last N days. Returns completion counts and percentage per day.',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Number of days to look back (1-365). Default 7.' },
      },
    },
  },
  {
    name: 'get_stats',
    description:
      'Get habit completion statistics broken down by category (meal, skincare, habit) for the last N days.',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Number of days to look back (1-365). Default 7.' },
      },
    },
  },
  {
    name: 'get_goals',
    description:
      'Get all goals with their progress (actual vs target completions), status, deadline, and linked habit IDs.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_items',
    description: 'Get the full list of all habits with their IDs, names, categories, and descriptions.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_habit_completions',
    description: 'Get the daily completion history for a specific habit by its ID.',
    input_schema: {
      type: 'object',
      properties: {
        item_id: { type: 'integer', description: 'The habit ID (from get_items).' },
        days: { type: 'integer', description: 'Number of days to look back (1-365). Default 30.' },
      },
      required: ['item_id'],
    },
  },
]

/** Convert canonical tools to Gemini functionDeclarations format. */
export function toGeminiTools() {
  return [
    {
      functionDeclarations: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      })),
    },
  ]
}

/** Create a tool executor bound to a pg pool. */
export function createExecutor(pool) {
  return async function executeAskTool(toolName, toolInput) {
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
}

export const SYSTEM_PROMPT_TEMPLATE = (today) =>
  `You are a helpful assistant for a personal habits and goals tracking app. Today's date is ${today}.

The app tracks three categories of daily habits: meals, skincare, and habit (general habits).
Each habit is either completed or not for each day. Goals link to habits and track progress toward a target number of completions.

When answering:
- Use the tools to fetch the actual data needed to answer the question
- Be specific — cite actual numbers, dates, and habit names from the data
- Keep answers concise but informative
- If the user asks about "this week" use 7 days, "this month" use 30 days, "this year" use 365 days`

/** Run the agentic ask loop with Anthropic. */
export async function askWithAnthropic(anthropicClient, question, executeAskTool) {
  const today = new Date().toISOString().split('T')[0]
  const evidence = []
  const messages = [{ role: 'user', content: question }]
  let iterations = 0

  while (iterations < 10) {
    iterations++
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT_TEMPLATE(today),
      tools: TOOLS,
      messages,
    })

    if (response.stop_reason === 'end_turn') {
      const answer = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
      return { answer, evidence }
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content })
      const toolResults = []
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue
        let data
        try { data = await executeAskTool(block.name, block.input) }
        catch (err) { data = { error: err.message } }
        evidence.push({ tool: block.name, params: block.input, data })
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(data) })
      }
      messages.push({ role: 'user', content: toolResults })
    } else {
      break
    }
  }
  return { answer: 'Unable to generate a response.', evidence }
}

/** Run the agentic ask loop with Google Gemini. */
export async function askWithGemini(geminiClient, question, executeAskTool) {
  const today = new Date().toISOString().split('T')[0]
  const evidence = []

  const model = geminiClient.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT_TEMPLATE(today),
    tools: toGeminiTools(),
  })

  const chat = model.startChat({ history: [] })
  let result = await chat.sendMessage(question)

  let iterations = 0
  while (iterations < 10) {
    iterations++
    const candidate = result.response.candidates?.[0]
    if (!candidate) break

    const parts = candidate.content?.parts ?? []
    const fnCallParts = parts.filter((p) => p.functionCall)

    if (fnCallParts.length === 0) break

    const fnResponses = []
    for (const part of fnCallParts) {
      const { name, args } = part.functionCall
      let data
      try { data = await executeAskTool(name, args ?? {}) }
      catch (err) { data = { error: err.message } }
      evidence.push({ tool: name, params: args ?? {}, data })
      fnResponses.push({ functionResponse: { name, response: { result: data } } })
    }

    result = await chat.sendMessage(fnResponses)
  }

  const answer = result.response.text()
  return { answer, evidence }
}
