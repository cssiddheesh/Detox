import type { AppData } from '../types'

export function getMetrics(data: AppData) {
  const completedFocus = data.focusSessions.filter((session) => session.completed)
  const todayKey = new Date().toDateString()
  const todayMinutes = completedFocus
    .filter((session) => new Date(session.createdAt).toDateString() === todayKey)
    .reduce((total, session) => total + session.durationMinutes, 0)
  const totalMinutes = completedFocus.reduce((total, session) => total + session.durationMinutes, 0)
  const completedChallenges = data.challenges.filter((challenge) => challenge.completed).length
  const focusScore = Math.min(100, 72 + completedFocus.length * 3)
  const balanceScore = Math.min(100, 74 + completedChallenges * 2)
  const independenceScore = data.independenceScores.at(-1) ?? 70
  const consistencyScore = Math.min(100, 70 + completedFocus.length * 2 + completedChallenges)
  const score = Math.round((focusScore + balanceScore + independenceScore + consistencyScore) / 4)
  const level = data.xp >= 700 ? 'AI 360 Champion'
    : data.xp >= 450 ? 'AI Wise User'
      : data.xp >= 250 ? 'Digital Balanced'
        : data.xp >= 100 ? 'Digital Explorer' : 'Digital Beginner'
  return {
    todayMinutes,
    totalMinutes,
    completedChallenges,
    score,
    focusScore,
    balanceScore,
    independenceScore,
    level,
    nextLevelXp: Math.ceil((data.xp + 1) / 150) * 150,
  }
}

export function scoreHistoryFor(data: AppData): number[] {
  return [...data.scoreHistory, getMetrics(data).score].slice(-14)
}
