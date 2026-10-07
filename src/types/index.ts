export type AIProviderName = 'demo' | 'groq' | 'openrouter' | 'openai-compatible' | 'custom' | 'local'
export type AIFeature = 'coach' | 'independence' | 'study' | 'journal' | 'voice' | 'fact-check'
export type ChatRole = 'user' | 'assistant'

export interface AISettings {
  providerName: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
}

export interface VoiceSettings {
  language: string
  voiceURI: string
  rate: number
  pitch: number
  volume: number
}

export interface AIMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface AIResponse {
  text: string
  provider: AIProviderName
  usedFallback: boolean
  fallbackReason?: string
}

export interface AIAnalysis {
  score: number
  category: 'Productive' | 'Moderate' | 'High dependence'
  happened: string
  betterApproach: string
  independentAction: string
}

export interface FocusSession {
  id: string
  task: string
  durationMinutes: number
  focusRating: number
  completed: boolean
  createdAt: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  durationMinutes: number
  xp: number
  completed: boolean
}

export interface JournalEntry {
  id: string
  text: string
  happened: string
  trigger: string
  worked: string
  experiment: string
  createdAt: string
}

export interface AppData {
  provider: AIProviderName
  aiSettings: AISettings
  voiceSettings: VoiceSettings
  theme: 'light' | 'dark' | 'system'
  exhibitionMode: boolean
  notificationsEnabled: boolean
  onboardingComplete: boolean
  xp: number
  focusSessions: FocusSession[]
  challenges: Challenge[]
  journalEntries: JournalEntry[]
  badges: string[]
  independenceScores: number[]
  scoreHistory: number[]
}
