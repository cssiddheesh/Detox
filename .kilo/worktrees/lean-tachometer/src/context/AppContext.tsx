import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storageService } from '../services/storage'
import { scoreHistoryFor } from '../utils/metrics'
import type { AppData, FocusSession, JournalEntry } from '../types'

interface AppContextValue {
  data: AppData
  storageWarning: boolean
  updateData: (updater: (current: AppData) => AppData) => void
  completeFocus: (session: FocusSession) => void
  completeChallenge: (id: string) => void
  saveJournal: (entry: JournalEntry) => void
  deleteJournal: (id: string) => void
  clearData: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => storageService.load())
  const [storageWarning, setStorageWarning] = useState(false)

  useEffect(() => {
    setStorageWarning(!storageService.save(data))
  }, [data])

  const value = useMemo<AppContextValue>(() => ({
    data,
    storageWarning,
    updateData: (updater) => setData((current) => updater(current)),
    completeFocus: (session) => setData((current) => {
      const next: AppData = {
        ...current,
        focusSessions: [session, ...current.focusSessions],
        xp: current.xp + (session.completed ? 20 : 5),
        badges: current.badges.includes('First Focus') ? current.badges : [...current.badges, 'First Focus'],
      }
      return { ...next, scoreHistory: scoreHistoryFor(next) }
    }),
    completeChallenge: (id) => setData((current) => {
      const challenge = current.challenges.find((item) => item.id === id)
      if (!challenge || challenge.completed) return current
      const next: AppData = {
        ...current,
        challenges: current.challenges.map((item) => item.id === id ? { ...item, completed: true } : item),
        xp: current.xp + challenge.xp,
        badges: current.badges.includes('Challenge Master') ? current.badges : [...current.badges, 'Challenge Master'],
      }
      return { ...next, scoreHistory: scoreHistoryFor(next) }
    }),
    saveJournal: (entry) => setData((current) => {
      const next: AppData = {
        ...current,
        journalEntries: [entry, ...current.journalEntries.filter((item) => item.id !== entry.id)],
        xp: current.journalEntries.some((item) => item.id === entry.id) ? current.xp : current.xp + 10,
      }
      return { ...next, scoreHistory: scoreHistoryFor(next) }
    }),
    deleteJournal: (id) => setData((current) => ({
      ...current,
      journalEntries: current.journalEntries.filter((item) => item.id !== id),
    })),
    clearData: () => {
      setData(storageService.clear())
      setStorageWarning(false)
    },
  }), [data, storageWarning])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppData(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppData must be used within AppProvider')
  return context
}
