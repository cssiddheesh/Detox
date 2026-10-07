export type AIProviderName = 'demo' | 'groq' | 'openrouter'
export type AIFeature = 'coach' | 'independence' | 'study' | 'journal' | 'voice' | 'fact-check'
export type ChatRole = 'user' | 'assistant'

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
