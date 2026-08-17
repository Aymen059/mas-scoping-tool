import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { CLASSIFICATION_SYSTEM_PROMPT } from './systemPrompt'

const PORT = Number(process.env.API_PORT ?? 8787)
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
const MAX_INPUT_CHARS = 60_000

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[server] ANTHROPIC_API_KEY is not set — /api/classify will fail until it is configured in .env')
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const VALID_LAYER_IDS = new Set(['gov', 'app', 'net', 'plat', 'shared', 'infra', 'customer', 'gaps', 'corp'])
const LAYER_ONLY_IDS = new Set(['gov', 'app', 'net', 'plat', 'shared', 'infra'])
const VALID_STATUSES = new Set(['in', 'pending', 'excluded', 'optional', 'out'])
const VALID_SERVICE_STATUSES = new Set(['auth', 'noauth', 'pending', 'out'])
const VALID_TAGS = new Set(['gd', 'md', 'auth', 'noauth'])

function extractJsonArray(raw: string): unknown {
  const trimmed = raw.trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model response did not contain a JSON array')
  }
  return JSON.parse(trimmed.slice(start, end + 1))
}

app.post('/api/classify', async (req, res) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text : ''
    if (!text.trim()) {
      return res.status(400).json({ error: 'No text provided to classify' })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY — set it in .env at the project root' })
    }

    const truncated = text.slice(0, MAX_INPUT_CHARS)

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: truncated }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return res.status(502).json({ error: 'Model returned no text content' })
    }

    let parsed: unknown
    try {
      parsed = extractJsonArray(textBlock.text)
    } catch {
      return res.status(502).json({ error: 'Model response was not valid JSON', raw: textBlock.text })
    }

    if (!Array.isArray(parsed)) {
      return res.status(502).json({ error: 'Model response was not a JSON array' })
    }

    const items = parsed.filter((item): item is Record<string, unknown> => {
      if (!item || typeof item !== 'object') return false
      const o = item as Record<string, unknown>

      if (typeof o.name !== 'string' || !o.name.trim()) return false
      if (typeof o.layer_id !== 'string' || !VALID_LAYER_IDS.has(o.layer_id)) return false
      if (typeof o.desc !== 'string') o.desc = ''
      if (!Array.isArray(o.tags) || !o.tags.every(t => typeof t === 'string' && VALID_TAGS.has(t))) return false

      // Model output is best-effort — default a missing/invalid type to "component" rather than dropping the item.
      const type = o.type === 'service' ? 'service' : 'component'
      o.type = type

      if (type === 'service') {
        if (!LAYER_ONLY_IDS.has(o.layer_id)) return false
        if (typeof o.service_status !== 'string' || !VALID_SERVICE_STATUSES.has(o.service_status)) return false
      } else {
        if (typeof o.status !== 'string' || !VALID_STATUSES.has(o.status)) return false
      }

      return true
    })

    res.json({ items })
  } catch (err) {
    console.error('[server] /api/classify failed:', err)
    res.status(500).json({ error: 'Classification request failed' })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`[server] classification proxy listening on http://localhost:${PORT}`)
})
