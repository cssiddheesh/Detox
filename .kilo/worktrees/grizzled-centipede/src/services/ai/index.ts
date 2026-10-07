import type { AIAnalysis, AIFeature, AIMessage, AIProviderName, AIResponse } from '../../types'

export interface AIOptions {
  feature: AIFeature
  mode?: string
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

class APIProvider implements AIProvider {
  constructor(readonly name: 'groq' | 'openrouter') {}

  async chat(messages: AIMessage[], options: AIOptions): Promise<string> {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    try {
      const baseUrl = import.meta.env.VITE_AI_API_URL?.replace(/\/$/, '') ?? ''
      const response = await fetch(`${baseUrl}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.name, feature: options.feature, mode: options.mode, messages }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('AI service unavailable')
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('text' in result) || typeof result.text !== 'string') {
        throw new Error('Invalid AI response')
      }
      return result.text
    } finally {
      window.clearTimeout(timeout)
    }
  }
}

const demoProvider = new DemoProvider()
const providers: Record<AIProviderName, AIProvider> = {
  demo: demoProvider,
  groq: new APIProvider('groq'),
  openrouter: new APIProvider('openrouter'),
}

export const AIService = {
  async chat(messages: AIMessage[], options: AIOptions, selected: AIProviderName): Promise<AIResponse> {
    const provider = providers[selected]
    if (selected === 'demo') {
      return { text: await demoProvider.chat(messages, options), provider: 'demo', usedFallback: false }
    }
    try {
      return { text: await provider.chat(messages, options), provider: selected, usedFallback: false }
    } catch {
      return { text: await demoProvider.chat(messages, options), provider: 'demo', usedFallback: true }
    }
  },

  async analyzeIndependence(text: string, selected: AIProviderName): Promise<{ analysis: AIAnalysis; usedFallback: boolean }> {
    const message: AIMessage = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: new Date().toISOString() }
    const response = await this.chat([message], { feature: 'independence' }, selected)
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
    }
  },
}
