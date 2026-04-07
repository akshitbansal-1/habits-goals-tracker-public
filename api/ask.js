import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import pool from './_db.js'
import { createExecutor, askWithAnthropic, askWithGemini } from './_tools.js'

const executeAskTool = createExecutor(pool)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, provider = 'anthropic' } = req.body
  if (!question?.trim()) return res.status(400).json({ error: 'question required' })

  try {
    let result
    if (provider === 'google') {
      if (!process.env.GEMINI_API_KEY) return res.status(400).json({ error: 'GEMINI_API_KEY not configured' })
      const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      result = await askWithGemini(geminiClient, question.trim(), executeAskTool)
    } else {
      if (!process.env.ANTHROPIC_API_KEY) return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured' })
      const anthropicClient = new Anthropic()
      result = await askWithAnthropic(anthropicClient, question.trim(), executeAskTool)
    }
    res.json(result)
  } catch (err) {
    console.error('ask error:', err)
    res.status(500).json({ error: err.message })
  }
}
