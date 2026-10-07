import type { AIAnalysis, AISettings, AIFeature, AIMessage, AIProviderName, AIResponse } from '../../types'

export interface AIOptions {
  feature: AIFeature
  mode?: string
}

export type AIStreamHandler = (chunk: string) => void

interface ProviderModel {
  id: string
  name?: string
}

let sessionApiKey = ''

export function setSessionApiKey(apiKey: string) {
  sessionApiKey = apiKey.trim()
}

function apiBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/i, '')
  if (!normalized) return ''
  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error('Enter a valid provider Base URL, including http:// or https://.')
  }
  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password) {
    throw new Error('Base URL must use HTTP or HTTPS and must not contain credentials.')
  }
  return normalized
}

function endpointFor(baseUrl: string, path: string): string {
  return `${apiBaseUrl(baseUrl)}/${path}`
}

function proxyUrl(): string {
  const configured = import.meta.env.VITE_AI_API_URL?.trim().replace(/\/+$/, '') ?? ''
  return configured.endsWith('/api/ai') ? configured : `${configured}/api/ai`
}

function readModelList(payload: unknown): ProviderModel[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !Array.isArray(payload.data)) return []
  return payload.data.flatMap((item): ProviderModel[] => {
    if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string') return []
    return [{ id: item.id, name: 'name' in item && typeof item.name === 'string' ? item.name : undefined }]
  })
}

async function requestWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 12000, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const abortRequest = () => controller.abort()
  signal?.addEventListener('abort', abortRequest, { once: true })
  if (signal?.aborted) controller.abort()
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abortRequest)
  }
}

function formatError(status: number, message: string): Error {
  if (status === 401 || status === 403) return new Error('The API key was rejected. Check the key in Settings.')
  if (status === 429) return new Error('The provider rate limit was reached. Wait a moment, then retry.')
  if (status >= 500) return new Error(`The provider is temporarily unavailable (HTTP ${status}). Try again shortly.`)
  return new Error(message || `The provider returned HTTP ${status}.`)
}

export interface AIProvider {
  readonly name: AIProviderName
  chat(messages: AIMessage[], options: AIOptions): Promise<string>
}

function latestUserText(messages: AIMessage[]): string {
  return messages.filter((message) => message.role === 'user').at(-1)?.content.trim() ?? ''
}

export class DemoProvider implements AIProvider {
  readonly name = 'demo' as const

  async chat(messages: AIMessage[], options: AIOptions): Promise<string> {
    await new Promise((resolve) => window.setTimeout(resolve, 550))
    const text = latestUserText(messages)
    const normalized = text.toLowerCase()

    if (options.feature === 'independence') {
      return normalized.includes('solve') || normalized.includes('entire') || normalized.includes('answer')
        ? 'It sounds like AI did most of the thinking this time. That can be useful for a quick result, but it gives you fewer chances to practise the method. For your next question, write down your first step, then ask AI for a hint rather than the finished answer.'
        : 'You are using AI as a support while keeping yourself involved—that is a productive balance. Keep checking explanations against your class notes and try one step independently before asking for more.'
    }

    if (options.feature === 'study') {
      const mode = options.mode ?? 'Explain'
      if (mode === 'Quiz') {
        const topic = text.match(/quiz question about (.+?)(?:\.|$)/i)?.[1] ?? text
        const questionNumber = Number(text.match(/question number (\d+)/i)?.[1] ?? 1)
        const questions = [
          `What is the main idea behind ${topic}? Explain it in one sentence.`,
          `Can you give one example of ${topic} and explain why it fits?`,
          `What is one important step or relationship to remember about ${topic}?`,
        ]
        return `Quick check ${questionNumber}: ${questions[(questionNumber - 1) % questions.length]} Think it through, then send your answer and I’ll offer a helpful nudge.`
      }
      if (mode === 'Hint') return `Start by identifying what the question is asking and what information you already have. What is one method or concept from class that might connect to “${text || 'your topic'}”?`
      if (mode === 'Check') {
        if (normalized.includes('student answer:')) {
          return 'Thanks for trying it yourself. Use your notes to check whether each important idea in your response is accurate and connected to the question. If you can explain why your key step works in your own words, you’re building understanding—not just collecting an answer.'
        }
        return `A good way to check your work is to compare each step with the original question and estimate whether the result makes sense. Share your attempt and I can help you inspect the reasoning.`
      }
      return `Here’s a simple way into “${text || 'your topic'}”: connect it to one idea you already know, then build one step at a time. What part feels least clear? I can offer a hint before a full explanation.`
    }

    if (options.feature === 'journal') {
      return 'I hear a pattern worth noticing, not something to judge yourself for. A possible experiment for tomorrow: choose one 20-minute block, put your phone just out of reach, and notice what changes.'
    }

    if (options.feature === 'fact-check') {
      return 'This claim needs more context, so treat it as uncertain rather than settled. Look for recent evidence from more than one reliable source, check what each source means by its key terms, and notice whether the claim is broader than the evidence.'
    }

    if (normalized.includes('homework') || normalized.includes('all my')) {
      return 'It makes sense to reach for a quick answer when schoolwork piles up. For the next problem, spend two minutes writing what you already know, then ask AI for one hint—not the full solution. Want to try a short focus block?'
    }
    if (normalized.includes('focus') || normalized.includes('phone') || normalized.includes('distract')) {
      return 'Try one 25-minute phone-free session. Put your phone out of immediate reach, choose one small task, and check it only after the timer ends. A manageable reset is more useful than aiming for perfect focus.'
    }
    if (normalized.includes('challenge') || normalized.includes('detox')) {
      return 'Try a 10-minute reset: step away from non-essential screens and do one offline thing you enjoy. Keep it small, and notice how you feel when you return.'
    }
    return 'Let’s make this practical. Start with one small step you can try today, and keep your own thinking in the loop. What have you already tried? I can offer a hint or help you make a simple plan.'
  }
}

const demoProvider = new DemoProvider()

async function complete(
  messages: AIMessage[],
  options: AIOptions,
  provider: Exclude<AIProviderName, 'demo'>,
  settings: AISettings,
  onChunk?: AIStreamHandler,
  signal?: AbortSignal,
): Promise<string> {
  const useCloudflareProxy = (provider === 'groq' || provider === 'openrouter') && !sessionApiKey
  const url = useCloudflareProxy ? proxyUrl() : endpointFor(settings.baseUrl, 'chat/completions')
  if (!useCloudflareProxy && !apiBaseUrl(settings.baseUrl)) {
    throw new Error('Set a provider Base URL in Settings before connecting.')
  }
  const requestMessages = [
    { role: 'system', content: `You are the AI 360 learning and digital wellness coach. Be concise, warm, practical, and encourage independent thinking.\nFeature: ${options.feature}. ${options.mode ? `Study mode: ${options.mode}.` : ''}` },
    ...messages.slice(-19).map(({ role, content }) => ({ role, content })),
  ]
  let response: Response
  try {
    response = await requestWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(!useCloudflareProxy && sessionApiKey ? { Authorization: `Bearer ${sessionApiKey}` } : {}),
      },
      body: JSON.stringify(useCloudflareProxy
        ? {
          provider: provider === 'openrouter' ? 'openrouter' : 'groq',
          feature: options.feature,
          mode: options.mode,
          model: settings.model,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
          messages: requestMessages,
        }
        : {
          model: settings.model,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
          messages: requestMessages,
        }),
    }, 12000, signal)
  } catch (error) {
    if (signal?.aborted) throw new Error('The request was cancelled.')
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The connection timed out. Check the endpoint and retry.')
    if (error instanceof TypeError) throw new Error('Could not reach this endpoint. Check the URL, local server, and CORS settings.')
    throw error
  }
  if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffered = ''
    let content = ''
    let timedOut = false
    const streamTimeout = window.setTimeout(() => {
      timedOut = true
      void reader.cancel()
    }, 12000)
    const cancelReader = () => { void reader.cancel() }
    signal?.addEventListener('abort', cancelReader, { once: true })
    const readLine = (line: string) => {
      if (!line.startsWith('data:')) return
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') return
      try {
        const event: unknown = JSON.parse(data)
        if (event && typeof event === 'object' && 'choices' in event && Array.isArray(event.choices)) {
          const chunk = event.choices[0]?.delta?.content
          if (typeof chunk === 'string') {
            content += chunk
            onChunk?.(chunk)
          }
        } else if (event && typeof event === 'object' && 'error' in event) {
          throw new Error('The AI provider reported an error while streaming.')
        }
      } catch {
        throw new Error('The provider sent an invalid streaming response.')
      }
    }
    try {
      while (true) {
        const { value, done } = await reader.read()
        buffered += decoder.decode(value, { stream: !done })
        const lines = buffered.split(/\r?\n/)
        buffered = lines.pop() ?? ''
        lines.forEach(readLine)
        if (done) {
          if (buffered) readLine(buffered)
          break
        }
      }
    } catch (error) {
      await reader.cancel()
      if (signal?.aborted) throw new Error('The request was cancelled.')
      throw error
    } finally {
      window.clearTimeout(streamTimeout)
      signal?.removeEventListener('abort', cancelReader)
    }
    if (signal?.aborted) throw new Error('The request was cancelled.')
    if (timedOut) throw new Error('The provider response timed out while streaming.')
    if (content.trim()) return content.trim()
    throw new Error('The provider returned an empty streaming response.')
  }
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
      ? result.error
      : ''
    throw formatError(response.status, message)
  }
  if (result && typeof result === 'object' && 'text' in result && typeof result.text === 'string') {
    return result.text.trim()
  }
  if (result && typeof result === 'object' && 'choices' in result && Array.isArray(result.choices)) {
    const content = result.choices[0]?.message?.content
    if (typeof content === 'string' && content.trim()) return content.trim()
  }
  throw new Error('The endpoint responded, but its chat response was not in a supported format.')
}

export const AIService = {
  async chat(
    messages: AIMessage[],
    options: AIOptions,
    selected: AIProviderName,
    settings: AISettings,
    onChunk?: AIStreamHandler,
    signal?: AbortSignal,
  ): Promise<AIResponse> {
    if (selected === 'demo') {
      const text = await demoProvider.chat(messages, options)
      onChunk?.(text)
      return { text, provider: 'demo', usedFallback: false }
    }
    try {
      return { text: await complete(messages, options, selected, settings, onChunk, signal), provider: selected, usedFallback: false }
    } catch (error) {
      if (signal?.aborted) throw error
      const fallbackReason = error instanceof Error ? error.message : 'The provider could not complete the request.'
      const text = await demoProvider.chat(messages, options)
      onChunk?.('')
      onChunk?.(text)
      return { text, provider: 'demo', usedFallback: true, fallbackReason }
    }
  },

  async testConnection(provider: AIProviderName, settings: AISettings): Promise<void> {
    if (provider === 'demo') return
    await complete(
      [{ id: crypto.randomUUID(), role: 'user', content: 'Reply with the single word "connected".', createdAt: new Date().toISOString() }],
      { feature: 'coach' },
      provider,
      settings,
    )
  },

  async discoverModels(provider: AIProviderName, settings: AISettings): Promise<ProviderModel[]> {
    if (provider === 'demo' || ((provider === 'groq' || provider === 'openrouter') && !sessionApiKey)) {
      throw new Error('Model discovery requires an API key or a direct provider endpoint.')
    }
    const headers = sessionApiKey ? { Authorization: `Bearer ${sessionApiKey}` } : undefined
    let response = await requestWithTimeout(endpointFor(settings.baseUrl, 'models'), { headers })
    if (!response.ok && provider === 'local') {
      const root = apiBaseUrl(settings.baseUrl).replace(/\/v1$/i, '')
      response = await requestWithTimeout(`${root}/api/tags`)
      if (response.ok) {
        const payload: unknown = await response.json()
        if (payload && typeof payload === 'object' && 'models' in payload && Array.isArray(payload.models)) {
          return payload.models.flatMap((item): ProviderModel[] => item && typeof item === 'object' && 'name' in item && typeof item.name === 'string'
            ? [{ id: item.name, name: item.name }]
            : [])
        }
      }
    }
    if (!response.ok) throw formatError(response.status, 'Could not load models from this endpoint.')
    return readModelList(await response.json())
  },

  async analyzeIndependence(text: string, selected: AIProviderName, settings: AISettings): Promise<{ analysis: AIAnalysis; usedFallback: boolean; fallbackReason?: string }> {
    const message: AIMessage = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: new Date().toISOString() }
    const response = await this.chat([message], { feature: 'independence' }, selected, settings)
    const highDependence = /solve my entire|do all|entire assignment|just copied|give me the answer/i.test(text)
    const moderate = /help|explain|hint|check|brainstorm/i.test(text)
    const score = highDependence ? 58 : moderate ? 82 : 70
    return {
      analysis: {
        score,
        category: score >= 80 ? 'Productive' : score >= 65 ? 'Moderate' : 'High dependence',
        happened: highDependence
          ? 'AI appears to have completed most of the task, leaving fewer opportunities to practise the reasoning.'
          : 'Your description suggests AI was part of the process. The key is keeping your own ideas and checks involved.',
        betterApproach: response.text,
        independentAction: 'For your next question, try one step yourself before asking AI for a hint.',
      },
      usedFallback: response.usedFallback,
      fallbackReason: response.fallbackReason,
    }
  },
}
