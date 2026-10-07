interface Env {
  GROQ_API_KEY?: string
  OPENROUTER_API_KEY?: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  provider: 'groq' | 'openrouter'
  feature: string
  mode?: string
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  messages: ChatMessage[]
}

interface UpstreamResponse {
  choices?: Array<{ message?: { content?: unknown } }>
}

const systemInstruction = `You are the AI 360 learning and digital wellness coach. Follow this philosophy: use AI, understand AI, don't depend on AI. Be concise, warm, non-judgmental, practical, and uncertainty-aware. Encourage a user's own thinking and offer hints before full answers where appropriate. Never diagnose, shame, or recommend extreme detoxes.`
const allowedFeatures = new Set(['coach', 'independence', 'study', 'journal', 'voice', 'fact-check'])

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
}

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  let body: RequestBody
  try {
    const payload: unknown = await context.request.json()
    if (!payload || typeof payload !== 'object') return json({ error: 'Invalid request.' }, 400)
    const candidate = payload as Partial<RequestBody>
    if ((candidate.provider !== 'groq' && candidate.provider !== 'openrouter')
      || typeof candidate.feature !== 'string' || !allowedFeatures.has(candidate.feature)
      || (candidate.mode !== undefined && (typeof candidate.mode !== 'string' || candidate.mode.length > 40))
      || (candidate.model !== undefined && (typeof candidate.model !== 'string' || candidate.model.length > 120))
      || (candidate.temperature !== undefined && (typeof candidate.temperature !== 'number' || candidate.temperature < 0 || candidate.temperature > 2))
      || (candidate.max_tokens !== undefined && (typeof candidate.max_tokens !== 'number' || candidate.max_tokens < 1 || candidate.max_tokens > 4096))
      || (candidate.stream !== undefined && typeof candidate.stream !== 'boolean')
      || !Array.isArray(candidate.messages)
      || candidate.messages.length === 0
      || candidate.messages.length > 20
      || candidate.messages.some((message) => !message || (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'system')
        || typeof message.content !== 'string' || message.content.length > 4000)) {
      return json({ error: 'Invalid request.' }, 400)
    }
    body = candidate as RequestBody
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const apiKey = body.provider === 'groq' ? context.env.GROQ_API_KEY : context.env.OPENROUTER_API_KEY
  if (!apiKey) return json({ error: 'No server-side API key is configured for this provider.' }, 503)
  const endpoint = body.provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions'
  const model = body.model || (body.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'openai/gpt-4o-mini')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(body.provider === 'openrouter' ? { 'HTTP-Referer': new URL(context.request.url).origin, 'X-Title': 'AI 360' } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: body.temperature ?? 0.6,
        max_tokens: body.max_tokens ?? 350,
        messages: [
          { role: 'system', content: `${systemInstruction}\nFeature: ${body.feature}. ${body.mode ? `Study mode: ${body.mode}.` : ''}` },
          ...body.messages,
        ],
      }),
      signal: controller.signal,
    })
    if (!upstream.ok) {
      return json({
        error: upstream.status === 429
          ? 'Provider rate limit reached. Retry shortly.'
          : upstream.status === 401 || upstream.status === 403
            ? 'Cloudflare provider key was rejected. Check the configured secret.'
            : 'AI service unavailable.',
      }, upstream.status === 429 ? 429 : 502)
    }
    if (body.stream && upstream.body) {
      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-store',
        },
      })
    }
    const response: unknown = await upstream.json()
    if (!response || typeof response !== 'object' || !Array.isArray((response as UpstreamResponse).choices)) {
      return json({ error: 'AI provider returned an invalid response.' }, 502)
    }
    const content = (response as UpstreamResponse).choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) return json({ error: 'AI provider returned an empty response.' }, 502)
    return json({ text: content.trim() })
  } catch {
    return json({ error: controller.signal.aborted ? 'AI provider request timed out.' : 'Could not reach the AI provider.' }, controller.signal.aborted ? 504 : 502)
  } finally {
    clearTimeout(timeout)
  }
}
