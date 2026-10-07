import { freshData, initialData } from '../data/initialData'
import type { AppData } from '../types'

const STORAGE_KEY = 'ai360-app-data-v1'
let memoryData: AppData = structuredClone(initialData)

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppData>
  return (candidate.provider === 'demo' || candidate.provider === 'groq' || candidate.provider === 'openrouter')
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
}

export const storageService = {
  load(): AppData {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (isAppData(parsed)) {
          memoryData = parsed
          return parsed
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
