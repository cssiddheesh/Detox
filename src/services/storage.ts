import { freshData, initialData } from '../data/initialData'
import type { AppData } from '../types'

const STORAGE_KEY = 'ai360-app-data-v1'
let memoryData: AppData = structuredClone(initialData)

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppData>
  return (candidate.provider === 'demo' || candidate.provider === 'groq' || candidate.provider === 'openrouter'
    || candidate.provider === 'openai-compatible' || candidate.provider === 'custom' || candidate.provider === 'local')
    && (candidate.theme === 'light' || candidate.theme === 'dark' || candidate.theme === 'system')
    && typeof candidate.exhibitionMode === 'boolean'
    && typeof candidate.notificationsEnabled === 'boolean'
    && typeof candidate.onboardingComplete === 'boolean'
    && typeof candidate.xp === 'number'
    && Number.isFinite(candidate.xp)
    && candidate.xp >= 0
    && Array.isArray(candidate.focusSessions)
    && candidate.focusSessions.every((session) => session && typeof session.id === 'string'
      && typeof session.task === 'string' && typeof session.durationMinutes === 'number'
      && Number.isFinite(session.durationMinutes) && typeof session.focusRating === 'number'
      && typeof session.completed === 'boolean' && typeof session.createdAt === 'string')
    && Array.isArray(candidate.challenges)
    && candidate.challenges.every((challenge) => challenge && typeof challenge.id === 'string'
      && typeof challenge.title === 'string' && typeof challenge.description === 'string'
      && typeof challenge.durationMinutes === 'number' && typeof challenge.xp === 'number'
      && typeof challenge.completed === 'boolean')
    && Array.isArray(candidate.journalEntries)
    && candidate.journalEntries.every((entry) => entry && typeof entry.id === 'string'
      && typeof entry.text === 'string' && typeof entry.happened === 'string'
      && typeof entry.trigger === 'string' && typeof entry.worked === 'string'
      && typeof entry.experiment === 'string' && typeof entry.createdAt === 'string')
    && Array.isArray(candidate.badges)
    && candidate.badges.every((badge) => typeof badge === 'string')
    && Array.isArray(candidate.independenceScores)
    && candidate.independenceScores.every((score) => typeof score === 'number' && Number.isFinite(score))
    && Array.isArray(candidate.scoreHistory)
    && candidate.scoreHistory.every((score) => typeof score === 'number' && Number.isFinite(score))
    && (candidate.aiSettings === undefined || (
      typeof candidate.aiSettings.providerName === 'string'
      && typeof candidate.aiSettings.baseUrl === 'string'
      && typeof candidate.aiSettings.model === 'string'
      && typeof candidate.aiSettings.temperature === 'number'
      && Number.isFinite(candidate.aiSettings.temperature)
      && candidate.aiSettings.temperature >= 0 && candidate.aiSettings.temperature <= 2
      && typeof candidate.aiSettings.maxTokens === 'number'
      && Number.isFinite(candidate.aiSettings.maxTokens)
      && candidate.aiSettings.maxTokens >= 1 && candidate.aiSettings.maxTokens <= 4096
    ))
    && (candidate.voiceSettings === undefined || (
      typeof candidate.voiceSettings.language === 'string'
      && typeof candidate.voiceSettings.voiceURI === 'string'
      && typeof candidate.voiceSettings.rate === 'number'
      && Number.isFinite(candidate.voiceSettings.rate)
      && candidate.voiceSettings.rate >= 0.5 && candidate.voiceSettings.rate <= 2
      && typeof candidate.voiceSettings.pitch === 'number'
      && Number.isFinite(candidate.voiceSettings.pitch)
      && candidate.voiceSettings.pitch >= 0 && candidate.voiceSettings.pitch <= 2
      && typeof candidate.voiceSettings.volume === 'number'
      && Number.isFinite(candidate.voiceSettings.volume)
      && candidate.voiceSettings.volume >= 0 && candidate.voiceSettings.volume <= 1
    ))
}

function normalizeAppData(data: AppData): AppData {
  return {
    ...data,
    aiSettings: data.aiSettings ?? structuredClone(initialData.aiSettings),
    voiceSettings: data.voiceSettings ?? structuredClone(initialData.voiceSettings),
  }
}

export const storageService = {
  load(): AppData {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (isAppData(parsed)) {
          memoryData = normalizeAppData(parsed)
          return memoryData
        }
        console.warn('AI 360 found invalid saved data; using the exhibition sample instead.')
      }
    } catch {
      console.warn('AI 360 could not read local progress; using the current session instead.')
    }
    return structuredClone(memoryData)
  },

  save(data: AppData): boolean {
    memoryData = data
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch {
      console.warn('AI 360 could not save progress to this browser.')
      return false
    }
  },

  clear(): AppData {
    memoryData = structuredClone(freshData)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      console.warn('AI 360 could not clear browser storage; the current session was reset.')
    }
    return structuredClone(memoryData)
  },
}
