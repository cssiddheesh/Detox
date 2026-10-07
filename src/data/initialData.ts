import type { AppData } from '../types'

const day = 24 * 60 * 60 * 1000

export const initialData: AppData = {
  provider: 'demo',
  theme: 'light',
  exhibitionMode: true,
  notificationsEnabled: false,
  onboardingComplete: true,
  xp: 260,
  focusSessions: [
    {
      id: 'sample-focus-1',
      task: 'Biology — cell structure',
      durationMinutes: 25,
      focusRating: 4,
      completed: true,
      createdAt: new Date(Date.now() - day).toISOString(),
    },
    {
      id: 'sample-focus-2',
      task: 'Maths revision',
      durationMinutes: 17,
      focusRating: 4,
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ],
  challenges: [
    { id: 'reset', title: '10-Minute Reset', description: 'Take a short break from unnecessary screen use.', durationMinutes: 10, xp: 15, completed: true },
    { id: 'think-first', title: 'Think First', description: 'Try one problem on your own before asking AI for a hint.', durationMinutes: 15, xp: 20, completed: true },
    { id: 'focus-block', title: 'Focus Block', description: 'Complete one focused study session with your phone out of reach.', durationMinutes: 25, xp: 25, completed: false },
    { id: 'offline-break', title: 'Offline Break', description: 'Spend a little time doing something away from a screen.', durationMinutes: 15, xp: 15, completed: false },
    { id: 'notification-pause', title: 'Notification Pause', description: 'Silence non-essential notifications for one study block.', durationMinutes: 25, xp: 15, completed: false },
  ],
  journalEntries: [],
  badges: ['First Focus', 'Voice Explorer'],
  independenceScores: [70, 73, 71, 78, 81],
  scoreHistory: [70, 72, 71, 74, 76, 78],
}

export const freshData: AppData = {
  provider: 'demo',
  theme: 'light',
  exhibitionMode: false,
  notificationsEnabled: false,
  onboardingComplete: true,
  xp: 0,
  focusSessions: [],
  challenges: [
    { id: 'reset', title: '10-Minute Reset', description: 'Take a short break from unnecessary screen use.', durationMinutes: 10, xp: 15, completed: false },
    { id: 'think-first', title: 'Think First', description: 'Try one problem on your own before asking AI for a hint.', durationMinutes: 15, xp: 20, completed: false },
    { id: 'focus-block', title: 'Focus Block', description: 'Complete one focused study session with your phone out of reach.', durationMinutes: 25, xp: 25, completed: false },
    { id: 'offline-break', title: 'Offline Break', description: 'Spend a little time doing something away from a screen.', durationMinutes: 15, xp: 15, completed: false },
    { id: 'notification-pause', title: 'Notification Pause', description: 'Silence non-essential notifications for one study block.', durationMinutes: 25, xp: 15, completed: false },
  ],
  journalEntries: [],
  badges: [],
  independenceScores: [],
  scoreHistory: [],
}
