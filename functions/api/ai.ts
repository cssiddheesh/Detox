interface Env {
  GROQ_API_KEY?: string
  OPENROUTER_API_KEY?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  provider: 'groq' | 'openrouter'
  feature: string
  mode?: string
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
      || !Array.isArray(candidate.messages)
      || candidate.messages.length === 0
      || candidate.messages.length > 20
      || candidate.messages.some((message) => !message || (message.role !== 'user' && message.role !== 'assistant')
        || typeof message.content !== 'string' || message.content.length > 4000)) {
      return json({ error: 'Invalid request.' }, 400)
    }
    body = candidate as RequestBody
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const apiKey = body.provider === 'groq' ? context.env.GROQ_API_KEY : context.env.OPENROUTER_API_KEY
  if (!apiKey) return json({ error: 'AI service unavailable.' }, 503)
  const endpoint = body.provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions'
  const model = body.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'openai/gpt-4o-mini'
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
        temperature: 0.6,
        max_tokens: 350,
        messages: [
          { role: 'system', content: `${systemInstruction}\nFeature: ${body.feature}. ${body.mode ? `Study mode: ${body.mode}.` : ''}` },
          ...body.messages,
        ],
      }),
      signal: controller.signal,
    })
    if (!upstream.ok) return json({ error: 'AI service unavailable.' }, 502)
    const response: unknown = await upstream.json()
    if (!response || typeof response !== 'object' || !Array.isArray((response as UpstreamResponse).choices)) {
      return json({ error: 'AI service unavailable.' }, 502)
    }
    const content = (response as UpstreamResponse).choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) return json({ error: 'AI service unavailable.' }, 502)
    return json({ text: content.trim() })
  } catch {
    return json({ error: 'AI service unavailable.' }, 502)
  } finally {
    clearTimeout(timeout)
  }
}
